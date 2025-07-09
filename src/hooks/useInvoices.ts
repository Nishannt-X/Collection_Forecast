
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-local';

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            customer_number,
            contract_type,
            credit_score,
            location,
            industry,
            segment
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // For each invoice without prediction, generate ML prediction
      const invoicesWithPredictions = await Promise.all(
        data.map(async (invoice) => {
          if (!invoice.predicted_payment_date) {
            try {
              const prediction = await generateMLPrediction(invoice);
              if (prediction) {
                // Update the invoice with prediction in database
                await updateInvoiceWithPrediction(invoice.id, prediction);
                return {
                  ...invoice,
                  predicted_payment_date: prediction.predictedPaymentDate,
                  risk_level: prediction.riskLevel
                };
              }
            } catch (error) {
              console.error('Failed to generate prediction for invoice:', invoice.id, error);
            }
          }
          return invoice;
        })
      );
      
      return invoicesWithPredictions;
    }
  });
};

const generateMLPrediction = async (invoice: any) => {
  try {
    // Ensure we have all required fields with proper defaults
    const invoiceDate = new Date(invoice.created_at);
    const dueDate = new Date(invoice.due_date);
    const paymentDueDays = Math.ceil((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const mlPayload = {
      amount: Number(invoice.amount) || 0,
      paymentDueDays: paymentDueDays || invoice.payment_due_days || 30,
      customerName: invoice.customers?.name || `Company_${invoice.customers?.customer_number || '1'}`,
      customerCreditScore: Number(invoice.customers?.credit_score) || 700,
      customerSegment: invoice.customers?.segment || 'Average',
      customerLocation: invoice.customers?.location || 'Mumbai',
      customerIndustry: invoice.customers?.industry || 'IT',
      contractType: invoice.customers?.contract_type || invoice.contract_type || 'Standard',
      paymentMethod: invoice.payment_method || 'Bank Transfer',
      hasEarlyDiscount: Boolean(invoice.has_early_discount),
      marketCondition: Number(invoice.market_condition) || 1.0,
      paymentUrgency: Number(invoice.payment_urgency) || 0.5,
      invoiceId: invoice.id,
      customerId: invoice.customer_id,
      // Add invoice creation date context
      invoiceDate: invoiceDate.toISOString(),
      dayOfMonth: invoiceDate.getDate(),
      monthOfYear: invoiceDate.getMonth() + 1,
      // Add more context for ML model
      currency: invoice.currency || 'INR',
      status: invoice.status || 'sent'
    };

    console.log('ML Prediction Payload:', mlPayload);

    const response = await fetch('http://localhost:5173/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mlPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      // Calculate predicted date from invoice date, not current date
      const predictedDate = new Date(invoiceDate);
      predictedDate.setDate(predictedDate.getDate() + data.prediction.predictedDaysToPayment);
      
      return {
        predictedPaymentDate: predictedDate.toISOString().split('T')[0],
        riskLevel: data.prediction.riskLevel,
        confidenceScore: data.prediction.confidenceScore,
        predictedDays: data.prediction.predictedDaysToPayment
      };
    }
    return null;
  } catch (error) {
    console.error('ML Prediction API error:', error);
    return null;
  }
};

const updateInvoiceWithPrediction = async (invoiceId: string, prediction: any) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        predicted_payment_date: prediction.predictedPaymentDate,
        risk_level: prediction.riskLevel
      })
      .eq('id', invoiceId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Failed to update invoice with prediction:', error);
  }
};
