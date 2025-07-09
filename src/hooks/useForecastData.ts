
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-local';

export const useForecastData = () => {
  return useQuery({
    queryKey: ['forecast-data'],
    queryFn: async () => {
      // First get pending invoices for ML forecast
      const { data: pendingInvoices, error: invoicesError } = await supabase
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
        `)
        .eq('status', 'sent'); // Only pending invoices

      if (invoicesError) throw invoicesError;

      // Get historical forecast data from database
      const { data: historicalForecast, error: dbError } = await supabase
        .from('forecast_data')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (dbError) throw dbError;

      // Generate real forecast data from actual invoices
      const actualForecastData = await generateForecastFromInvoices();

      // Generate ML forecast for pending invoices
      let currentMonthForecast = null;
      if (pendingInvoices && pendingInvoices.length > 0) {
        try {
          const response = await fetch('http://localhost:5173/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              invoices: pendingInvoices.map(invoice => ({
                invoiceId: invoice.id,
                customerName: invoice.customers?.name || `Company_${invoice.customers?.customer_number || '1'}`,
                amount: Number(invoice.amount) || 0,
                paymentDueDays: invoice.payment_due_days || 30,
                customerCreditScore: Number(invoice.customers?.credit_score) || 700,
                customerSegment: invoice.customers?.segment || 'Average',
                customerLocation: invoice.customers?.location || 'Mumbai',
                customerIndustry: invoice.customers?.industry || 'IT',
                contractType: invoice.customers?.contract_type || 'Standard',
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
            currentMonthForecast = {
              id: 'current',
              month: new Date().toLocaleString('default', { month: 'short' }),
              forecast_amount: forecastData.forecast?.totalAmount || 0,
              collected_amount: 0, // Not yet collected
              accuracy_percentage: 0, // TBD
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
        } catch (error) {
          console.error('ML Forecast API error:', error);
        }
      }

      // Combine current forecast with historical and actual data
      const combinedData = [];
      if (currentMonthForecast) {
        combinedData.push(currentMonthForecast);
      }
      if (historicalForecast && historicalForecast.length > 0) {
        combinedData.push(...historicalForecast);
      }
      if (actualForecastData && actualForecastData.length > 0) {
        combinedData.push(...actualForecastData);
      }

      // Remove duplicates and ensure we have data
      const uniqueData = combinedData.filter((item, index, self) => 
        index === self.findIndex(t => t.month === item.month)
      );

      return uniqueData.length > 0 ? uniqueData : await generateForecastFromInvoices();
    }
  });
};

const generateForecastFromInvoices = async () => {
  try {
    // Get all invoices to create real forecast data
    const { data: allInvoices, error } = await supabase
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
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!allInvoices || allInvoices.length === 0) {
      return [];
    }

    // Group invoices by month
    const monthlyData: Record<string, any> = {};
    
    allInvoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      const monthKey = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = invoiceDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          id: monthKey,
          month: monthName,
          forecast_amount: 0,
          collected_amount: 0,
          accuracy_percentage: null,
          created_at: invoice.created_at,
          updated_at: new Date().toISOString()
        };
      }

      const amount = Number(invoice.amount) || 0;
      
      if (invoice.status === 'paid') {
        monthlyData[monthKey].collected_amount += amount;
        monthlyData[monthKey].forecast_amount += amount; // Historical forecast = actual
      } else {
        monthlyData[monthKey].forecast_amount += amount;
      }
    });

    // Calculate accuracy for historical months
    Object.values(monthlyData).forEach((data: any) => {
      if (data.collected_amount > 0 && data.forecast_amount > 0) {
        data.accuracy_percentage = Math.min(100, (data.collected_amount / data.forecast_amount) * 100);
      }
    });

    return Object.values(monthlyData).sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } catch (error) {
    console.error('Error generating forecast from invoices:', error);
    return [];
  }
};
