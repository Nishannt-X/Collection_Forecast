
import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { useCalculatedMetrics } from '@/hooks/useCalculatedMetrics';
import { useInvoices } from '@/hooks/useInvoices';

interface MetricCardProps {
  title: string;
  amount: string;
  subtitle: string;
  percentage: string;
  color: string;
  icon: React.ReactNode;
  contractType?: string;
}

const MetricCard = ({ title, amount, subtitle, percentage, color, icon, contractType }: MetricCardProps) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{amount}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium text-gray-600">{percentage}</span>
        {contractType && (
          <div className="text-xs text-gray-500 mt-1">{contractType}</div>
        )}
      </div>
    </div>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
);

const MetricsDashboard = () => {
  const { data: metrics, isLoading, error } = useCalculatedMetrics();
  const { data: invoices } = useInvoices();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading metrics: {error.message}</p>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  // Calculate overdue amount using frontend logic
  const calculateOverdueAmount = () => {
    if (!invoices) return 0;
    
    const currentDate = new Date();
    return invoices
      .filter(invoice => {
        const dueDate = new Date(invoice.due_date);
        const isOverdue = invoice.status === 'overdue' || (invoice.status === 'sent' && dueDate < currentDate);
        return isOverdue && invoice.status !== 'paid' && invoice.status !== 'cancelled';
      })
      .reduce((total, invoice) => total + Number(invoice.amount), 0);
  };

  // Calculate overdue count using frontend logic
  const calculateOverdueCount = () => {
    if (!invoices) return 0;
    
    const currentDate = new Date();
    return invoices
      .filter(invoice => {
        const dueDate = new Date(invoice.due_date);
        const isOverdue = invoice.status === 'overdue' || (invoice.status === 'sent' && dueDate < currentDate);
        return isOverdue && invoice.status !== 'paid' && invoice.status !== 'cancelled';
      }).length;
  };

  const overdueAmount = calculateOverdueAmount();
  const overdueCount = calculateOverdueCount();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Overdue Invoices"
          amount={formatAmount(overdueAmount)}
          subtitle={`From ${overdueCount} overdue invoices`}
          percentage={metrics?.totalCount ? `${((overdueCount / metrics.totalCount) * 100).toFixed(1)}%` : '0%'}
          color="bg-red-100 text-red-600"
          icon={<AlertTriangle className="w-5 h-5" />}
          contractType="Mixed"
        />
        
        <MetricCard
          title="Outstanding Amount"
          amount={formatAmount(metrics?.outstandingAmount || 0)}
          subtitle={`From ${metrics?.sentCount || 0} sent invoices`}
          percentage={metrics?.totalAmount ? `${((metrics.outstandingAmount / metrics.totalAmount) * 100).toFixed(1)}%` : '0%'}
          color="bg-yellow-100 text-yellow-600"
          icon={<DollarSign className="w-5 h-5" />}
          contractType="Mixed"
        />
        
        <MetricCard
          title="Total Invoice Value"
          amount={formatAmount(metrics?.totalAmount || 0)}
          subtitle={`Total value of all ${metrics?.totalInvoices || 0} invoices`}
          percentage={`${metrics?.totalInvoices || 0} invoices`}
          color="bg-blue-100 text-blue-600"
          icon={<Target className="w-5 h-5" />}
          contractType="All Types"
        />
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Collected Amount"
          amount={formatAmount(metrics?.paidAmount || 0)}
          subtitle={`From ${metrics?.paidCount || 0} paid invoices`}
          percentage={`${metrics?.paidCount || 0} paid`}
          color="bg-green-100 text-green-600"
          icon={<CheckCircle className="w-5 h-5" />}
          contractType="Confirmed"
        />
        
        <MetricCard
          title="Collection Rate"
          amount={`${(metrics?.collectionRate || 0).toFixed(1)}%`}
          subtitle="Percentage of invoices successfully collected"
          percentage={`${metrics?.paidCount || 0}/${metrics?.totalInvoices || 0}`}
          color="bg-indigo-100 text-indigo-600"
          icon={<TrendingUp className="w-5 h-5" />}
          contractType="Performance"
        />

        <MetricCard
          title="Average Payment Time"
          amount={`${metrics?.averagePaymentTime || 0} days`}
          subtitle="ML-predicted average payment timeline"
          percentage="ML Enhanced"
          color="bg-purple-100 text-purple-600"
          icon={<Clock className="w-5 h-5" />}
          contractType="ML Prediction"
        />
      </div>
    </div>
  );
};

export default MetricsDashboard;
