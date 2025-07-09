
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-local';

export const useCalculatedMetrics = () => {
  return useQuery({
    queryKey: ['calculated-metrics'],
    queryFn: async () => {
      // Get all invoices with customer data
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            customer_number,
            credit_score,
            location,
            industry,
            segment,
            contract_type
          )
        `);

      if (error) throw error;

      // Calculate comprehensive metrics from invoices
      const totalInvoices = invoices?.length || 0;
      const totalAmount = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      
      // Status-based calculations
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid') || [];
      const sentInvoices = invoices?.filter(inv => inv.status === 'sent') || [];
      const overdueInvoices = invoices?.filter(inv => inv.status === 'overdue') || [];
      
      const paidCount = paidInvoices.length;
      const sentCount = sentInvoices.length;
      const overdueCount = overdueInvoices.length;
      
      const paidAmount = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const outstandingAmount = sentInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      
      // Collection metrics
      const collectionRate = totalInvoices > 0 ? (paidCount / totalInvoices) * 100 : 0;
      
      // Contract type breakdown - Check both invoice and customer contract types
      const contractTypes = ['Time-based', 'Milestone', 'Fixed', 'Standard'];
      const contractTypeBreakdown = contractTypes.map(type => {
        const typeInvoices = invoices?.filter(inv => 
          inv.contract_type === type || 
          inv.customers?.contract_type === type
        ) || [];
        
        const amount = typeInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const count = typeInvoices.length;
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        
        return {
          type,
          amount,
          count,
          percentage
        };
      });

      // Handle invoices without contract type
      const mixedInvoices = invoices?.filter(inv => 
        !inv.contract_type && !inv.customers?.contract_type
      ) || [];
      
      const mixedAmount = mixedInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const mixedCount = mixedInvoices.length;
      const mixedPercentage = totalAmount > 0 ? (mixedAmount / totalAmount) * 100 : 0;

      if (mixedCount > 0) {
        contractTypeBreakdown.push({
          type: 'Mixed/Other',
          amount: mixedAmount,
          count: mixedCount,
          percentage: mixedPercentage
        });
      }

      // Individual contract type metrics for backward compatibility
      const timeBasedInvoices = invoices?.filter(inv => 
        inv.contract_type === 'Time-based' || 
        inv.customers?.contract_type === 'Time-based'
      ) || [];
      
      const milestoneInvoices = invoices?.filter(inv => 
        inv.contract_type === 'Milestone' || 
        inv.customers?.contract_type === 'Milestone'
      ) || [];
      
      const fixedInvoices = invoices?.filter(inv => 
        inv.contract_type === 'Fixed' || 
        inv.customers?.contract_type === 'Fixed'
      ) || [];
      
      const timeBasedAmount = timeBasedInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const milestoneAmount = milestoneInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const fixedAmount = fixedInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      
      const timeBasedCount = timeBasedInvoices.length;
      const milestoneCount = milestoneInvoices.length;
      const fixedCount = fixedInvoices.length;
      
      const timeBasedPercentage = totalAmount > 0 ? (timeBasedAmount / totalAmount) * 100 : 0;
      const milestonePercentage = totalAmount > 0 ? (milestoneAmount / totalAmount) * 100 : 0;
      const fixedPercentage = totalAmount > 0 ? (fixedAmount / totalAmount) * 100 : 0;

      // Try to get ML forecast for additional metrics
      let mlMetrics = null;
      if (invoices && invoices.length > 0) {
        try {
          const response = await fetch('http://localhost:5173/forecast', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              invoices: invoices.slice(0, 50).map(invoice => ({
                invoiceId: invoice.id,
                customerName: invoice.customers?.name || `Company_${invoice.customers?.customer_number || '1'}`,
                amount: Number(invoice.amount) || 0,
                paymentDueDays: invoice.payment_due_days || 30,
                customerCreditScore: Number(invoice.customers?.credit_score) || 700,
                customerSegment: invoice.customers?.segment || 'Average',
                customerLocation: invoice.customers?.location || 'Mumbai',
                customerIndustry: invoice.customers?.industry || 'IT',
                contractType: invoice.customers?.contract_type || invoice.contract_type || 'Standard',
                paymentMethod: invoice.payment_method || 'Bank Transfer',
                hasEarlyDiscount: Boolean(invoice.has_early_discount),
                marketCondition: Number(invoice.market_condition) || 1.0,
                paymentUrgency: Number(invoice.payment_urgency) || 0.5,
                customerId: invoice.customer_id,
                invoiceDate: invoice.created_at,
                dayOfMonth: new Date(invoice.created_at).getDate(),
                monthOfYear: new Date(invoice.created_at).getMonth() + 1
              }))
            }),
          });

          const forecastData = await response.json();
          
          if (forecastData.success) {
            mlMetrics = calculateMetricsFromForecast(forecastData.forecast);
          }
        } catch (error) {
          console.error('ML Metrics API error:', error);
        }
      }
      
      return {
        // Core metrics
        totalInvoices,
        totalAmount,
        totalInvoiceAmount: totalAmount,
        totalCount: totalInvoices,
        
        // Status-based metrics
        paidInvoices: paidCount,
        paidCount,
        paidAmount,
        sentInvoices: sentCount,
        sentCount,
        outstandingAmount,
        overdueInvoices: overdueCount,
        overdueCount,
        overdueAmount,
        
        // Collection metrics
        collectionRate,
        
        // Contract type metrics (individual)
        timeBasedAmount,
        milestoneAmount,
        fixedAmount,
        mixedAmount,
        timeBasedCount,
        milestoneCount,
        fixedCount,
        mixedCount,
        timeBasedPercentage,
        milestonePercentage,
        fixedPercentage,
        mixedPercentage,
        
        // Contract type breakdown (structured)
        contractTypeBreakdown,
        
        // ML-enhanced metrics
        averagePaymentTime: mlMetrics?.averagePredictedDays || 35,
        riskDistribution: mlMetrics?.riskDistribution || { low: 0, medium: 0, high: 0 },
        predictedCashFlow: mlMetrics?.totalAmount || totalAmount,
        ...mlMetrics
      };
    }
  });
};

const calculateMetricsFromForecast = (forecast: any) => {
  return {
    averagePredictedDays: forecast.averagePredictedDays,
    riskDistribution: forecast.riskDistribution,
    totalAmount: forecast.totalAmount,
    totalInvoices: forecast.totalInvoices,
    predictedCashFlow: forecast.totalAmount,
    highRiskAmount: forecast.individualForecasts
      .filter((f: any) => f.riskLevel === 'high')
      .reduce((sum: number, f: any) => sum + f.amount, 0)
  };
};
