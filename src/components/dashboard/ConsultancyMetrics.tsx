
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useConsultancyMetrics } from '@/hooks/useConsultancyMetrics';

const ConsultancyMetrics = () => {
  const { 
    data: metrics, 
    isLoading, 
    error 
  } = useConsultancyMetrics();

  // Process metrics data to calculate the required values
  const processedMetrics = React.useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        totalOutstanding: 0,
        avgPaymentDelay: 0,
        paymentEfficiency: 0,
        criticalInvoices: 0,
        totalRevenue: 0,
        onTimePayments: 0
      };
    }

    // Calculate metrics from the consultancy_metrics table data
    const totalOutstanding = metrics.reduce((sum, metric) => {
      if (metric.metric_type === 'outstanding') {
        return sum + Number(metric.amount);
      }
      return sum;
    }, 0);

    const totalRevenue = metrics.reduce((sum, metric) => {
      if (metric.metric_type === 'revenue') {
        return sum + Number(metric.amount);
      }
      return sum;
    }, 0);

    // Get other metrics by type
    const paymentDelayMetric = metrics.find(m => m.metric_type === 'payment_delay');
    const efficiencyMetric = metrics.find(m => m.metric_type === 'efficiency');
    const criticalMetric = metrics.find(m => m.metric_type === 'critical_invoices');
    const onTimeMetric = metrics.find(m => m.metric_type === 'on_time_payments');

    return {
      totalOutstanding,
      avgPaymentDelay: paymentDelayMetric ? Number(paymentDelayMetric.amount) : 0,
      paymentEfficiency: efficiencyMetric ? Number(efficiencyMetric.percentage) / 100 : 0,
      criticalInvoices: criticalMetric ? Number(criticalMetric.amount) : 0,
      totalRevenue,
      onTimePayments: onTimeMetric ? Number(onTimeMetric.percentage) : 0
    };
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Error loading consultancy metrics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metricCards = [
    {
      title: "Total Outstanding",
      value: `₹${(processedMetrics.totalOutstanding / 1000000).toFixed(1)}M`,
      change: "-5.2%",
      trend: "down",
      icon: DollarSign,
      color: "text-blue-600"
    },
    {
      title: "Avg Payment Delay",
      value: `${processedMetrics.avgPaymentDelay.toFixed(1)} days`,
      change: "+2.1%",
      trend: "up",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Payment Efficiency",
      value: `${(processedMetrics.paymentEfficiency * 100).toFixed(1)}%`,
      change: "+3.5%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Critical Invoices",
      value: processedMetrics.criticalInvoices.toString(),
      change: "-12.3%",
      trend: "down",
      icon: AlertTriangle,
      color: "text-red-600"
    },
    {
      title: "Total Revenue",
      value: `₹${(processedMetrics.totalRevenue / 1000000).toFixed(1)}M`,
      change: "+8.7%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "On-Time Payments",
      value: `${processedMetrics.onTimePayments.toFixed(0)}%`,
      change: "+4.2%",
      trend: "up",
      icon: CheckCircle,
      color: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon;
        const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
        const trendColor = metric.trend === 'up' ? 'text-green-600' : 'text-red-600';
        
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <div className="flex items-center space-x-1">
                <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                <span className={`text-xs font-medium ${trendColor}`}>
                  {metric.change}
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ConsultancyMetrics;
