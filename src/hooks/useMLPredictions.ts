
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-local';

export const useMLPredictions = (invoiceId?: string) => {
  return useQuery({
    queryKey: ['ml-predictions', invoiceId],
    queryFn: async () => {
      let query = supabase
        .from('ml_predictions')
        .select(`
          *,
          invoices (
            invoice_number,
            amount,
            due_date,
            customers (
              name,
              customer_number
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: true
  });
};

export const useLatestMLPredictions = (limit: number = 10) => {
  return useQuery({
    queryKey: ['latest-ml-predictions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ml_predictions')
        .select(`
          *,
          invoices (
            invoice_number,
            amount,
            due_date,
            status,
            customers (
              name,
              customer_number
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    }
  });
};

export const useGenerateMLForecast = () => {
  const generateForecast = async (invoices: any[]) => {
    try {
      const response = await fetch('http://localhost:5173/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoices: invoices.map(invoice => ({
            invoiceId: invoice.id,
            customerName: `Company_${invoice.customers?.customer_number || '1'}`,
            amount: invoice.amount,
            paymentDueDays: invoice.payment_due_days || 30,
            customerCreditScore: invoice.customers?.credit_score || 700,
            customerSegment: invoice.customers?.segment || 'Average',
            customerLocation: invoice.customers?.location || 'Mumbai',
            customerIndustry: invoice.customers?.industry || 'IT',
            contractType: invoice.contract_type || 'Standard',
            paymentMethod: invoice.payment_method || 'Bank Transfer',
            hasEarlyDiscount: invoice.has_early_discount || false,
            marketCondition: invoice.market_condition || 1.0,
            paymentUrgency: invoice.payment_urgency || 0.5,
            customerId: invoice.customer_id
          }))
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.forecast;
      }
      throw new Error(data.message || 'Failed to generate forecast');
    } catch (error) {
      console.error('ML Forecast API error:', error);
      throw error;
    }
  };

  return { generateForecast };
};
