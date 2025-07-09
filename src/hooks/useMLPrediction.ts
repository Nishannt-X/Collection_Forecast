
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client-local';
import { useFlaskMLPrediction } from './useFlaskMLPrediction';

interface MLPredictionInput {
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentDueDays: number;
  contractType: string;
  paymentMethod: string;
  hasEarlyDiscount: boolean;
  marketCondition: number;
  paymentUrgency: number;
  customerCreditScore: number;
  customerSegment: string;
  customerLocation: string;
  customerIndustry: string;
}

interface MLPredictionResult {
  predictedDaysToPayment: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export const useMLPrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { predictPayment: flaskPredict, isModelLoaded: isFlaskModelLoaded } = useFlaskMLPrediction();

  const predictPayment = async (input: MLPredictionInput): Promise<MLPredictionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get customer name for ML prediction
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('name')
        .eq('id', input.customerId)
        .single();

      if (customerError) throw customerError;

      let prediction: MLPredictionResult | null = null;

      // Use Flask ML model if loaded, otherwise fall back to mock
      if (isFlaskModelLoaded && customer?.name) {
        prediction = await flaskPredict({
          ...input,
          customerName: customer.name
        });
      }

      // Fall back to mock prediction if Flask ML fails or isn't loaded
      if (!prediction) {
        prediction = generateMockPrediction(input);
      }

      // Store the prediction in the database
      if (prediction) {
        const modelVersion = isFlaskModelLoaded ? 'flask-ml-v1.0' : 'mock-v1.0';
        
        const { error: insertError } = await supabase
          .from('ml_predictions')
          .insert([
            {
              invoice_id: input.invoiceId,
              predicted_days_to_payment: prediction.predictedDaysToPayment,
              confidence_score: prediction.confidenceScore,
              model_version: modelVersion,
              static_features: {
                amount: input.amount,
                payment_due_days: input.paymentDueDays,
                contract_type: input.contractType,
                payment_method: input.paymentMethod,
                has_early_discount: input.hasEarlyDiscount,
                customer_credit_score: input.customerCreditScore,
                customer_segment: input.customerSegment,
                customer_location: input.customerLocation,
                customer_industry: input.customerIndustry
              },
              sequence_features: {
                market_condition: input.marketCondition,
                payment_urgency: input.paymentUrgency
              }
            }
          ]);

        if (insertError) throw insertError;
      }

      setIsLoading(false);
      return prediction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
      return null;
    }
  };

  const generateMockPrediction = (input: MLPredictionInput): MLPredictionResult => {
    // Simple mock logic based on input features
    let baseDays = input.paymentDueDays;
    
    // Adjust based on customer segment
    if (input.customerSegment === 'Reliable') {
      baseDays *= 0.9;
    } else if (input.customerSegment === 'At-risk') {
      baseDays *= 1.3;
    }
    
    // Adjust based on credit score
    if (input.customerCreditScore > 750) {
      baseDays *= 0.95;
    } else if (input.customerCreditScore < 600) {
      baseDays *= 1.2;
    }
    
    // Adjust based on payment method
    if (input.paymentMethod === 'UPI' || input.paymentMethod === 'Credit Card') {
      baseDays *= 0.9;
    } else if (input.paymentMethod === 'Cheque') {
      baseDays *= 1.1;
    }
    
    // Early discount effect
    if (input.hasEarlyDiscount) {
      baseDays *= 0.85;
    }
    
    // Market condition effect
    baseDays *= input.marketCondition;
    
    // Payment urgency effect
    baseDays *= (1 + (1 - input.paymentUrgency) * 0.2);
    
    const predictedDays = Math.round(baseDays);
    const confidenceScore = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
    
    // Determine risk level
    const delayRatio = predictedDays / input.paymentDueDays;
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (delayRatio <= 1.1) {
      riskLevel = 'low';
    } else if (delayRatio > 1.3) {
      riskLevel = 'high';
    }
    
    return {
      predictedDaysToPayment: predictedDays,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      riskLevel
    };
  };

  const updateCustomerRisk = async (customerId: string) => {
    try {
      // Get all predictions for this customer's invoices
      const { data: predictions, error: predictionsError } = await supabase
        .from('ml_predictions')
        .select(`
          predicted_days_to_payment,
          confidence_score,
          invoices!inner (
            customer_id,
            payment_due_days
          )
        `)
        .eq('invoices.customer_id', customerId);

      if (predictionsError) throw predictionsError;

      if (predictions && predictions.length > 0) {
        // Calculate aggregate risk based on payment predictions
        const avgDelayRatio = predictions.reduce((sum, pred) => {
          const delayRatio = pred.predicted_days_to_payment / pred.invoices.payment_due_days;
          return sum + delayRatio;
        }, 0) / predictions.length;

        const avgConfidence = predictions.reduce((sum, pred) => sum + pred.confidence_score, 0) / predictions.length;

        // Determine risk level based on delay ratio and confidence
        let riskLevel: 'low' | 'medium' | 'high' = 'medium';
        if (avgDelayRatio <= 1.1 && avgConfidence > 0.7) {
          riskLevel = 'low';
        } else if (avgDelayRatio > 1.3 || avgConfidence < 0.5) {
          riskLevel = 'high';
        }

        // Update customer risk level
        const { error: updateError } = await supabase
          .from('customers')
          .update({ risk_level: riskLevel })
          .eq('id', customerId);

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Error updating customer risk:', err);
    }
  };

  return {
    predictPayment,
    updateCustomerRisk,
    isLoading,
    error,
    isMLModelLoaded: isFlaskModelLoaded
  };
};
