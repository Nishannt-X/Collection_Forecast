
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentHistory = (customerId?: string) => {
  return useQuery({
    queryKey: ['payment-history', customerId],
    queryFn: async () => {
      let query = supabase
        .from('company_payment_history')
        .select(`
          *,
          customers (
            name,
            customer_number,
            industry,
            location
          ),
          invoices (
            invoice_number,
            amount,
            due_date
          )
        `)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCustomerPaymentStats = (customerId: string) => {
  return useQuery({
    queryKey: ['customer-payment-stats', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_payment_history')
        .select('payment_efficiency, payment_velocity, days_to_payment')
        .eq('customer_id', customerId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          avgPaymentEfficiency: null,
          avgPaymentVelocity: null,
          avgDaysToPayment: null,
          paymentCount: 0
        };
      }

      const avgPaymentEfficiency = data.reduce((sum, item) => sum + (Number(item.payment_efficiency) || 0), 0) / data.length;
      const avgPaymentVelocity = data.reduce((sum, item) => sum + (Number(item.payment_velocity) || 0), 0) / data.length;
      const avgDaysToPayment = data.reduce((sum, item) => sum + (Number(item.days_to_payment) || 0), 0) / data.length;
      
      return {
        avgPaymentEfficiency: avgPaymentEfficiency,
        avgPaymentVelocity: avgPaymentVelocity,
        avgDaysToPayment: avgDaysToPayment,
        paymentCount: data.length
      };
    },
    enabled: !!customerId
  });
};
