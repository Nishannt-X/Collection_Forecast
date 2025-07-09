import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { useCalculatedMetrics } from '@/hooks/useCalculatedMetrics';
import { useInvoices } from '@/hooks/useInvoices';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface MonthlyData {
  month: string;
  collected: number;
  outstanding: number;
}

interface AgingData {
  name: string;
  value: number;
  percentage: number;
}

interface CustomerPerformance {
  customer: string;
  invoices: number;
  paid: number;
  outstanding: number;
  performance: number;
}

interface PaymentBehaviorData {
  range: string;
  count: number;
  percentage: number;
}

const ReportsDashboard = () => {
  const { data: calculatedMetrics, isLoading: metricsLoading } = useCalculatedMetrics();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: paymentHistory, isLoading: paymentHistoryLoading } = usePaymentHistory();

  // Get payments data with proper relationships
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-with-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoices (
            id,
            amount,
            created_at,
            due_date,
            customer_id,
            customers (
              name
            )
          )
        `)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const isLoading = metricsLoading || invoicesLoading || paymentHistoryLoading || paymentsLoading;

  // Generate monthly collection data from actual invoices and payments
  const monthlyCollectionData = React.useMemo((): MonthlyData[] => {
    if (!invoices || !paymentsData) return [];
    
    const monthlyData: Record<string, MonthlyData> = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Initialize last 6 months including current month
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
      const monthKey = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
      monthlyData[monthKey] = { month: monthName, collected: 0, outstanding: 0 };
    }
    
    // Process payments for collected amounts
    paymentsData.forEach(payment => {
      if (payment.invoices) {
        const paymentDate = new Date(payment.payment_date);
        const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].collected += Number(payment.amount) || 0;
        }
      }
    });
    
    // Process invoices for outstanding amounts
    invoices.forEach(invoice => {
      if (invoice.status !== 'paid') {
        const invoiceDate = new Date(invoice.created_at);
        const monthKey = `${invoiceDate.getFullYear()}-${invoiceDate.getMonth()}`;
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].outstanding += Number(invoice.amount) || 0;
        }
      }
    });
    
    return Object.values(monthlyData);
  }, [invoices, paymentsData]);

  // Calculate aging data based on REAL unpaid invoices and their actual due dates
  const agingData = React.useMemo((): AgingData[] => {
    if (!invoices) return [];
    
    const today = new Date();
    const aging = {
      '0-30 days': 0,
      '31-60 days': 0,
      '61-90 days': 0,
      '90+ days': 0
    };
    
    // Only include unpaid invoices and calculate days past due properly
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
    console.log('Unpaid invoices for aging:', unpaidInvoices.length);
    
    unpaidInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.due_date);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(invoice.amount) || 0;
      
      console.log(`Invoice ${invoice.invoice_number}: Due ${invoice.due_date}, Days past due: ${daysPastDue}, Amount: ${amount}`);
      
      if (daysPastDue <= 0) {
        // Not yet due - current invoices
        aging['0-30 days'] += amount;
      } else if (daysPastDue <= 30) {
        // 1-30 days overdue
        aging['0-30 days'] += amount;
      } else if (daysPastDue <= 60) {
        // 31-60 days overdue
        aging['31-60 days'] += amount;
      } else if (daysPastDue <= 90) {
        // 61-90 days overdue
        aging['61-90 days'] += amount;
      } else {
        // 90+ days overdue
        aging['90+ days'] += amount;
      }
    });
    
    const total = Object.values(aging).reduce((sum, val) => sum + val, 0);
    console.log('Aging totals:', aging, 'Total:', total);
    
    return Object.entries(aging).map(([name, value]) => ({
      name,
      value: Math.round(value),
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }));
  }, [invoices]);

  // Payment behavior analysis based on REAL payment data
  const paymentBehaviorData = React.useMemo((): PaymentBehaviorData[] => {
    if (!paymentsData || !invoices) return [];
    
    const behaviorCounts = {
      '0-15 days': 0,
      '16-30 days': 0,
      '31-45 days': 0,
      '46+ days': 0
    };
    
    console.log('Processing payment behavior data...');
    
    // Calculate actual payment delays from real payments
    paymentsData.forEach(payment => {
      if (payment.invoices) {
        const invoiceDate = new Date(payment.invoices.created_at);
        const paymentDate = new Date(payment.payment_date);
        const daysToPayment = Math.floor((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`Payment: Invoice created ${payment.invoices.created_at}, Paid ${payment.payment_date}, Days: ${daysToPayment}`);
        
        if (daysToPayment <= 15) {
          behaviorCounts['0-15 days']++;
        } else if (daysToPayment <= 30) {
          behaviorCounts['16-30 days']++;
        } else if (daysToPayment <= 45) {
          behaviorCounts['31-45 days']++;
        } else {
          behaviorCounts['46+ days']++;
        }
      }
    });
    
    // Also include current unpaid invoices based on their age from creation
    const unpaidInvoices = invoices?.filter(inv => inv.status !== 'paid') || [];
    const today = new Date();
    
    unpaidInvoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      const daysFromCreation = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Unpaid invoice: Created ${invoice.created_at}, Days old: ${daysFromCreation}`);
      
      if (daysFromCreation <= 15) {
        behaviorCounts['0-15 days']++;
      } else if (daysFromCreation <= 30) {
        behaviorCounts['16-30 days']++;
      } else if (daysFromCreation <= 45) {
        behaviorCounts['31-45 days']++;
      } else {
        behaviorCounts['46+ days']++;
      }
    });
    
    const total = Object.values(behaviorCounts).reduce((sum, val) => sum + val, 0);
    console.log('Payment behavior counts:', behaviorCounts, 'Total:', total);
    
    return Object.entries(behaviorCounts).map(([range, count]) => ({
      range,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [paymentsData, invoices]);

  // Generate customer performance data from actual invoices and payments
  const customerPerformanceData = React.useMemo((): CustomerPerformance[] => {
    if (!invoices || !paymentsData) return [];
    
    const customerStats: Record<string, CustomerPerformance> = {};
    
    // Process invoices
    invoices.forEach(invoice => {
      const customerName = invoice.customers?.name || 'Unknown Customer';
      if (!customerStats[customerName]) {
        customerStats[customerName] = {
          customer: customerName,
          invoices: 0,
          paid: 0,
          outstanding: 0,
          performance: 0
        };
      }
      
      customerStats[customerName].invoices++;
      const amount = Number(invoice.amount) || 0;
      
      if (invoice.status === 'paid') {
        customerStats[customerName].paid++;
      } else {
        customerStats[customerName].outstanding += amount;
      }
    });
    
    // Calculate performance percentage and sort by performance
    const customerList = Object.values(customerStats).map((stats: CustomerPerformance) => {
      stats.performance = stats.invoices > 0 ? Math.round((stats.paid / stats.invoices) * 100) : 0;
      return stats;
    });
    
    return customerList
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 10);
  }, [invoices, paymentsData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Report Type,Generated On,Total Invoices,Total Amount,Paid Amount,Outstanding Amount\n"
      + `Financial Report,${new Date().toLocaleDateString()},${calculatedMetrics?.totalCount || 0},${calculatedMetrics?.totalInvoiceAmount || 0},${calculatedMetrics?.paidAmount || 0},${calculatedMetrics?.outstandingAmount || 0}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive financial reporting based on real invoice and payment data</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <Tabs defaultValue="collections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collections">Collections Report</TabsTrigger>
          <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
          <TabsTrigger value="customer">Customer Performance</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow Report</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Total Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${(calculatedMetrics?.paidAmount || 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">From {calculatedMetrics?.paidCount || 0} paid invoices</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Outstanding Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ${(calculatedMetrics?.outstandingAmount || 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">From {calculatedMetrics?.sentCount || 0} pending invoices</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(calculatedMetrics?.collectionRate || 0).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500">Current collection efficiency</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Collections vs Outstanding</CardTitle>
              <p className="text-sm text-gray-600">
                Based on actual payment and invoice data from the last 6 months
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Bar dataKey="collected" fill="#10B981" name="Collected" />
                  <Bar dataKey="outstanding" fill="#F59E0B" name="Outstanding" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Aging Analysis - Distribution</CardTitle>
                <p className="text-sm text-gray-600">
                  Based on actual days past due for unpaid invoices (${agingData.reduce((sum, item) => sum + item.value, 0).toLocaleString()} total)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={agingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {agingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aging Breakdown</CardTitle>
                <p className="text-sm text-gray-600">
                  Outstanding amounts by aging category from actual data
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agingData.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.value.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                {agingData.reduce((sum, item) => sum + item.value, 0) === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>No outstanding invoices found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Behavior Distribution</CardTitle>
              <p className="text-sm text-gray-600">
                Based on actual payment timing from database ({paymentBehaviorData.reduce((sum, item) => sum + item.count, 0)} total payments/invoices)
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentBehaviorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Count' : name]} />
                  <Bar dataKey="count" fill="#3B82F6" name="Count" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {paymentBehaviorData.map((item, index) => (
                  <div key={item.range} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.range}</span>
                    <div className="text-right">
                      <div className="font-semibold">{item.count}</div>
                      <div className="text-sm text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Payment Performance</CardTitle>
              <p className="text-sm text-gray-600">
                Based on actual payment history and invoice data
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Customer</th>
                      <th className="text-left py-3 px-4">Invoices</th>
                      <th className="text-left py-3 px-4">Paid</th>
                      <th className="text-left py-3 px-4">Outstanding</th>
                      <th className="text-left py-3 px-4">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPerformanceData.map((customer) => (
                      <tr key={customer.customer} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{customer.customer}</td>
                        <td className="py-3 px-4">{customer.invoices}</td>
                        <td className="py-3 px-4">{customer.paid}</td>
                        <td className="py-3 px-4">${customer.outstanding.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${customer.performance}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{customer.performance}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Expected Inflow (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${(calculatedMetrics?.outstandingAmount || 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">From outstanding invoices</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">ML Prediction Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Waiting for ML</div>
                <p className="text-sm text-gray-500">ML integration pending</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-blue-600">
                  ${(calculatedMetrics?.outstandingAmount || 0).toLocaleString()}
                </div>
                <p className="text-gray-600 mt-2">Total outstanding amount to be collected</p>
                <div className="mt-4 text-sm text-gray-500">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-yellow-800">Waiting for ML Integration</p>
                    <p className="text-yellow-700 mt-1">ML predictions will provide timing estimates for collections</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsDashboard;
