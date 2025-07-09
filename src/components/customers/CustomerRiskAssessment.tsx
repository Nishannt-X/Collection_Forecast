
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';

const CustomerRiskAssessment = () => {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: paymentHistory, isLoading: paymentHistoryLoading } = usePaymentHistory();

  const isLoading = customersLoading || invoicesLoading || paymentHistoryLoading;

  // Calculate real risk distribution from customer data
  const riskData = React.useMemo(() => {
    if (!customers) return [];
    
    const riskCounts = {
      'Low Risk': 0,
      'Medium Risk': 0,
      'High Risk': 0
    };
    
    customers.forEach(customer => {
      const riskLevel = customer.risk_level || 'medium';
      if (riskLevel === 'low') {
        riskCounts['Low Risk']++;
      } else if (riskLevel === 'high') {
        riskCounts['High Risk']++;
      } else {
        riskCounts['Medium Risk']++;
      }
    });
    
    const total = customers.length;
    
    return [
      { 
        name: 'Low Risk', 
        value: total > 0 ? Math.round((riskCounts['Low Risk'] / total) * 100) : 0, 
        color: '#10b981',
        count: riskCounts['Low Risk']
      },
      { 
        name: 'Medium Risk', 
        value: total > 0 ? Math.round((riskCounts['Medium Risk'] / total) * 100) : 0, 
        color: '#f59e0b',
        count: riskCounts['Medium Risk']
      },
      { 
        name: 'High Risk', 
        value: total > 0 ? Math.round((riskCounts['High Risk'] / total) * 100) : 0, 
        color: '#ef4444',
        count: riskCounts['High Risk']
      }
    ];
  }, [customers]);

  // Calculate at-risk customers from real data
  const atRiskCustomers = React.useMemo(() => {
    if (!customers || !invoices || !paymentHistory) return [];
    
    return customers
      .map(customer => {
        // Get customer's invoices
        const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);
        const customerPayments = paymentHistory.filter(payment => payment.customer_id === customer.id);
        
        // Calculate risk metrics
        const totalInvoices = customerInvoices.length;
        const paidInvoices = customerInvoices.filter(inv => inv.status === 'paid').length;
        const overdueInvoices = customerInvoices.filter(inv => {
          if (inv.status === 'paid') return false;
          const dueDate = new Date(inv.due_date);
          const today = new Date();
          return today > dueDate;
        });
        
        const outstandingAmount = customerInvoices
          .filter(inv => inv.status !== 'paid')
          .reduce((sum, inv) => sum + Number(inv.amount), 0);
        
        // Calculate average payment efficiency
        const avgEfficiency = customerPayments.length > 0 
          ? customerPayments.reduce((sum, payment) => sum + (Number(payment.payment_efficiency) || 0), 0) / customerPayments.length
          : 0.5;
        
        // Calculate days late for overdue invoices
        const maxDaysLate = overdueInvoices.length > 0
          ? Math.max(...overdueInvoices.map(inv => {
              const dueDate = new Date(inv.due_date);
              const today = new Date();
              return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            }))
          : 0;
        
        // Calculate risk score (0-1000, higher is better)
        let riskScore = 500; // Base score
        riskScore += avgEfficiency * 300; // Efficiency contribution
        riskScore -= maxDaysLate * 2; // Penalty for being late
        riskScore += (customer.credit_score || 700) / 10; // Credit score contribution
        riskScore = Math.max(0, Math.min(1000, riskScore));
        
        // Determine status
        let status = 'Good';
        let trend = 'up';
        
        if (riskScore < 300) {
          status = 'Poor';
          trend = 'down';
        } else if (riskScore < 600) {
          status = 'Risk';
          trend = 'down';
        } else {
          status = 'Great';
          trend = 'up';
        }
        
        return {
          name: customer.name,
          score: Math.round(riskScore),
          status,
          trend,
          amount: `$${outstandingAmount.toLocaleString()}`,
          daysLate: maxDaysLate,
          totalInvoices,
          paidInvoices,
          efficiency: avgEfficiency
        };
      })
      .filter(customer => customer.status === 'Poor' || customer.status === 'Risk' || customer.daysLate > 30)
      .sort((a, b) => {
        // Sort by risk level first (Poor > Risk > others), then by days late
        if (a.status === 'Poor' && b.status !== 'Poor') return -1;
        if (b.status === 'Poor' && a.status !== 'Poor') return 1;
        if (a.status === 'Risk' && b.status === 'Great') return -1;
        if (b.status === 'Risk' && a.status === 'Great') return 1;
        return b.daysLate - a.daysLate;
      })
      .slice(0, 10); // Top 10 at-risk customers
  }, [customers, invoices, paymentHistory]);

  const getScoreColor = (status: string) => {
    switch (status) {
      case 'Great': return 'bg-green-100 text-green-800';
      case 'Risk': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Risk Overview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}% (${riskData.find(d => d.name === name)?.count || 0} customers)`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            {riskData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600">{item.value}%</span>
                  <div className="text-xs text-gray-500">({item.count} customers)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* At Risk Customers */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">At Risk Customers</h2>
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {atRiskCustomers.length} Customers Need Attention
          </Badge>
        </div>
        
        {atRiskCustomers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-600 mb-2">
              <TrendingUp className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No High Risk Customers</h3>
            <p className="text-gray-600">All customers are performing well with their payments!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {atRiskCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{customer.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Score: {customer.score}</span>
                      <span>•</span>
                      <span>Efficiency: {Math.round(customer.efficiency * 100)}%</span>
                      <span>•</span>
                      <span>{customer.paidInvoices}/{customer.totalInvoices} paid</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge className={getScoreColor(customer.status)}>
                    {customer.status}
                  </Badge>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{customer.amount}</p>
                    {customer.daysLate > 0 && (
                      <p className="text-sm text-red-600">{customer.daysLate} days late</p>
                    )}
                  </div>
                  <div className="flex items-center">
                    {customer.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerRiskAssessment;
