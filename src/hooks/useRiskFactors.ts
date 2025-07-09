
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRiskFactors = () => {
  return useQuery({
    queryKey: ['risk-factors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risk_factors')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
};
