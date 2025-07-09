
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCustomerRiskUpdater = () => {
  return useQuery({
    queryKey: ['customer-risk-updater'],
    queryFn: async () => {
      console.log('Starting customer risk level updates...');
      
      // Get all customers with their invoices
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          risk_level,
          invoices (
            id,
            status,
            risk_level,
            amount,
            due_date,
            created_at
          )
        `);
      
      if (customerError) throw customerError;
      
      const updates = [];
      
      for (const customer of customers || []) {
        if (!customer.invoices || customer.invoices.length === 0) continue;
        
        // Calculate risk score based on invoice performance
        let riskScore = 0;
        let totalInvoices = customer.invoices.length;
        
        customer.invoices.forEach((invoice: any) => {
          const invoiceRisk = invoice.risk_level || 'medium';
          const today = new Date();
          const dueDate = new Date(invoice.due_date);
          const isOverdue = invoice.status !== 'paid' && today > dueDate;
          
          // Score based on invoice risk level
          if (invoiceRisk === 'low') {
            riskScore += 1; // Good performance
          } else if (invoiceRisk === 'medium') {
            riskScore += 0; // Neutral
          } else if (invoiceRisk === 'high') {
            riskScore -= 2; // Poor performance
          }
          
          // Additional penalty for overdue invoices
          if (isOverdue) {
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysOverdue > 30) {
              riskScore -= 3; // Severe penalty for 30+ days overdue
            } else if (daysOverdue > 7) {
              riskScore -= 1; // Moderate penalty for 7+ days overdue
            }
          }
        });
        
        // Calculate average risk score
        const avgRiskScore = riskScore / totalInvoices;
        
        // Determine new risk level
        let newRiskLevel = 'medium';
        if (avgRiskScore > 0.5) {
          newRiskLevel = 'low';
        } else if (avgRiskScore < -0.5) {
          newRiskLevel = 'high';
        }
        
        // Only update if risk level has changed
        if (newRiskLevel !== customer.risk_level) {
          console.log(`Updating ${customer.name} from ${customer.risk_level} to ${newRiskLevel} (score: ${avgRiskScore.toFixed(2)})`);
          
          updates.push({
            id: customer.id,
            risk_level: newRiskLevel
          });
        }
      }
      
      // Batch update all customers
      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from('customers')
            .update({ risk_level: update.risk_level })
            .eq('id', update.id);
          
          if (error) {
            console.error('Error updating customer risk level:', error);
          }
        }
        
        console.log(`Updated risk levels for ${updates.length} customers`);
      } else {
        console.log('No customer risk level updates needed');
      }
      
      return { updatedCustomers: updates.length };
    },
    refetchInterval: 5 * 60 * 1000, // Run every 5 minutes
    refetchOnWindowFocus: false
  });
};
