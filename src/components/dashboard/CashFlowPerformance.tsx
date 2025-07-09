
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCalculatedMetrics } from '@/hooks/useCalculatedMetrics';
import { useInvoices } from '@/hooks/useInvoices';

const CashFlowPerformance = () => {
  const [timePeriod, setTimePeriod] = useState('monthly');
  const { data: metrics, isLoading } = useCalculatedMetrics();
  const { data: invoices } = useInvoices();

  // Generate cash flow data from real invoices based on time period
  const cashFlowData = React.useMemo(() => {
    if (!invoices) return [];

    const data: Record<string, any> = {};
    const currentDate = new Date();

    if (timePeriod === 'monthly') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        data[monthName] = {
          period: monthName,
          collected: 0,
          forecast: 0,
          paid: 0,
          payableForecast: 0
        };
      }
    } else if (timePeriod === 'weekly') {
      // Last 6 weeks
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - (i * 7));
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        const weekKey = `W${Math.ceil((weekStart.getDate()) / 7)}-${weekStart.toLocaleDateString('en-US', { month: 'short' })}`;
        data[weekKey] = {
          period: weekKey,
          collected: 0,
          forecast: 0,
          paid: 0,
          payableForecast: 0
        };
      }
    } else if (timePeriod === 'daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        data[dayKey] = {
          period: dayKey,
          collected: 0,
          forecast: 0,
          paid: 0,
          payableForecast: 0
        };
      }
    }

    // Process invoices based on time period
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      let periodKey = '';

      if (timePeriod === 'monthly') {
        periodKey = invoiceDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else if (timePeriod === 'weekly') {
        const weekStart = new Date(invoiceDate);
        weekStart.setDate(invoiceDate.getDate() - invoiceDate.getDay());
        periodKey = `W${Math.ceil((weekStart.getDate()) / 7)}-${weekStart.toLocaleDateString('en-US', { month: 'short' })}`;
      } else if (timePeriod === 'daily') {
        periodKey = invoiceDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      }
      
      if (data[periodKey]) {
        const amount = (Number(invoice.amount) || 0) / 1000; // Convert to thousands for better visibility
        
        if (invoice.status === 'paid') {
          data[periodKey].collected += amount;
          data[periodKey].paid += amount;
        } else {
          data[periodKey].forecast += amount;
        }
      }
    });

    return Object.values(data);
  }, [invoices, timePeriod]);

  // Calculate aging data from invoices
  const receivablesAging = React.useMemo(() => {
    if (!invoices) return [];

    const today = new Date();
    const aging = {
      'Current': 0,
      '1-30 Days': 0,
      '31-60 Days': 0,
      '61-90 Days': 0,
      '91-120 Days': 0,
      '121+ Days': 0
    };

    invoices.filter(inv => inv.status !== 'paid').forEach(invoice => {
      const dueDate = new Date(invoice.due_date);
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = (Number(invoice.amount) || 0) / 1000000; // Convert to millions

      if (daysDiff <= 0) {
        aging['Current'] += amount;
      } else if (daysDiff <= 30) {
        aging['1-30 Days'] += amount;
      } else if (daysDiff <= 60) {
        aging['31-60 Days'] += amount;
      } else if (daysDiff <= 90) {
        aging['61-90 Days'] += amount;
      } else if (daysDiff <= 120) {
        aging['91-120 Days'] += amount;
      } else {
        aging['121+ Days'] += amount;
      }
    });

    const total = Object.values(aging).reduce((sum, val) => sum + val, 0);
    const colors = ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#991b1b'];

    return Object.entries(aging).map(([category, amount], index) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: colors[index]
    }));
  }, [invoices]);

  const formatTooltipValue = (value: number) => {
    return `$${value.toFixed(1)}K`;
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatTooltipValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalReceivables = receivablesAging.reduce((sum, item) => sum + item.amount, 0);
  const netCashFlow = (metrics?.paidAmount || 0) - (metrics?.outstandingAmount || 0);

  return (
    <div className="space-y-6">
      {/* Cash Flow Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Cash Flow Performance Center</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{new Date().toLocaleDateString('en-US', { month: 'long' })}</span>
            <span className="font-semibold">
              ${(netCashFlow / 1000000).toFixed(1)}MM Net Cash Flow (MTD)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">Outstanding Receivables</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${((metrics?.outstandingAmount || 0) / 1000000).toFixed(1)}MM
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              ${((metrics?.paidAmount || 0) / 1000000).toFixed(1)}MM
            </div>
            <p className="text-sm text-gray-600">Collected Amount</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{(metrics?.collectionRate || 0).toFixed(1)}%</div>
            <p className="text-sm text-gray-600">Collection Rate</p>
          </div>
        </div>
      </div>

      {/* Main Cash Flow Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Cash Flow Trend</h3>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${value}K`} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="collected" fill="#3b82f6" name="Collected" />
              <Bar dataKey="paid" fill="#10b981" name="Payments Out" />
              <Bar dataKey="forecast" fill="#64748b" name="AR Forecast" />
              <Bar dataKey="payableForecast" fill="#f59e0b" name="Payables Forecast" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Receivables Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Receivables Aging</h3>
            <button className="text-blue-600 text-sm hover:underline flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Speed Collection
            </button>
          </div>
          
          <div className="flex items-baseline space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Total Outstanding</span>
            </div>
            <span className="text-xl font-bold">${totalReceivables.toFixed(1)}MM</span>
          </div>

          <div className="space-y-2">
            {receivablesAging.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-700">{item.category} {item.percentage}%</span>
                </div>
                <span className="font-medium">${item.amount}MM</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payables */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payables Analysis</h3>
            <button className="text-orange-600 text-sm hover:underline flex items-center">
              <TrendingDown className="w-4 h-4 mr-1" />
              Optimize Payments
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="text-2xl font-bold text-gray-900">Coming Soon</div>
            <p className="text-gray-600 mt-2">Payables analysis will be available soon</p>
            <div className="mt-4 text-sm text-gray-500">
              Features will include:
              <ul className="mt-2 space-y-1">
                <li>• Optimal payment timing</li>
                <li>• Vendor payment predictions</li>
                <li>• Cash flow optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowPerformance;
