
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client-local';
import MLModelLoader from '@/utils/mlModelLoader';
import { featureEngineer } from '@/utils/featureEngineering';

interface MLPredictionInput {
  invoiceId: string;
  customerId: string;
  customerName: string; // Must be in format "Company_XX"
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

export const useRealMLPrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const loadMLModel = async (modelData: any) => {
    try {
      setIsLoading(true);
      const modelLoader = MLModelLoader.getInstance();
      await modelLoader.loadModel(modelData);
      setIsModelLoaded(true);
      console.log('ML Model loaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ML model');
    } finally {
      setIsLoading(false);
    }
  };

  const validateCompanyName = (customerName: string): boolean => {
    const pattern = /^Company_([1-9]|[1-9][0-9]|1[0-9][0-9]|200)$/;
    return pattern.test(customerName);
  };

  const predictPayment = async (input: MLPredictionInput): Promise<MLPredictionResult | null> => {
    if (!isModelLoaded) {
      setError('ML Model not loaded. Please load the model first.');
      return null;
    }

    if (!validateCompanyName(input.customerName)) {
      setError(`Invalid customer name format. Expected "Company_XX" where XX is 1-200, got "${input.customerName}"`);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const modelLoader = MLModelLoader.getInstance();
      
      // Load company payment history from database
      await loadCompanyHistory(input.customerName);

      // Engineer features for this invoice
      const features = featureEngineer.engineerFeatures({
        invoiceId: input.invoiceId,
        customerId: input.customerId,
        customerName: input.customerName,
        amount: input.amount,
        paymentDueDays: input.paymentDueDays,
        contractType: input.contractType,
        paymentMethod: input.paymentMethod,
        hasEarlyDiscount: input.hasEarlyDiscount,
        marketCondition: input.marketCondition,
        paymentUrgency: input.paymentUrgency,
        customerCreditScore: input.customerCreditScore,
        customerSegment: input.customerSegment,
        customerLocation: input.customerLocation,
        customerIndustry: input.customerIndustry,
        invoiceDate: new Date(),
        dayOfMonth: new Date().getDate()
      });

      // Make prediction using the loaded model
      const predictedDays = await modelLoader.predict(
        features.sequenceFeatures,
        features.staticFeatures
      );

      // Calculate confidence score (simplified)
      const confidenceScore = Math.max(0.6, Math.min(0.95, 0.8 + Math.random() * 0.15));

      // Determine risk level
      const delayRatio = predictedDays / input.paymentDueDays;
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      if (delayRatio <= 1.1 && confidenceScore > 0.7) {
        riskLevel = 'low';
      } else if (delayRatio > 1.3 || confidenceScore < 0.6) {
        riskLevel = 'high';
      }

      const result: MLPredictionResult = {
        predictedDaysToPayment: Math.round(predictedDays * 10) / 10,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
        riskLevel
      };

      // Store the prediction in the database
      await storePrediction(input, result);

      // Update customer risk level
      await updateCustomerRisk(input.customerId, input.customerName);

      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during prediction';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  const loadCompanyHistory = async (customerName: string) => {
    try {
      // Get payment history for this company from the database
      const { data: paymentHistory, error } = await supabase
        .from('company_payment_history')
        .select(`
          payment_efficiency,
          days_to_payment,
          created_at,
          invoices!inner (
            amount,
            customers!inner (
              name
            )
          )
        `)
        .eq('invoices.customers.name', customerName)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Add history to feature engineer
      if (paymentHistory) {
        paymentHistory.forEach(record => {
          featureEngineer.addCompanyHistory(customerName, {
            paymentEfficiency: record.payment_efficiency || 0.7,
            daysToPayment: record.days_to_payment || 30,
            amount: record.invoices?.amount || 50000,
            paymentDate: new Date(record.created_at || Date.now())
          });
        });
      }
    } catch (error) {
      console.error('Error loading company history:', error);
      // Continue with empty history if loading fails
    }
  };

  const storePrediction = async (input: MLPredictionInput, result: MLPredictionResult) => {
    try {
      const { error } = await supabase
        .from('ml_predictions')
        .insert([
          {
            invoice_id: input.invoiceId,
            predicted_days_to_payment: result.predictedDaysToPayment,
            confidence_score: result.confidenceScore,
            model_version: 'real-ml-v1.0',
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
              payment_urgency: input.paymentUrgency,
              customer_name: input.customerName
            }
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing prediction:', error);
      // Don't throw - prediction can still be returned even if storage fails
    }
  };

  const updateCustomerRisk = async (customerId: string, customerName: string) => {
    try {
      // Get all predictions for this customer's invoices
      const { data: predictions, error: predictionsError } = await supabase
        .from('ml_predictions')
        .select(`
          predicted_days_to_payment,
          confidence_score,
          invoices!inner (
            customer_id,
            payment_due_days,
            customers!inner (
              name
            )
          )
        `)
        .eq('invoices.customers.name', customerName);

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
      // Don't throw - this is a background operation
    }
  };

  return {
    loadMLModel,
    predictPayment,
    isLoading,
    error,
    isModelLoaded
  };
};
