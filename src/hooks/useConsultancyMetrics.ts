
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useConsultancyMetrics = () => {
  return useQuery({
    queryKey: ['consultancy-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultancy_metrics')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
};
