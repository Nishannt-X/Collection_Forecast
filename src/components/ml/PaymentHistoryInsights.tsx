
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePaymentHistory, useCustomerPaymentStats } from '@/hooks/usePaymentHistory';
import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';

interface PaymentHistoryInsightsProps {
  customerId: string;
}

const PaymentHistoryInsights = ({ customerId }: PaymentHistoryInsightsProps) => {
  const { data: paymentHistory, isLoading } = usePaymentHistory(customerId);
  const { data: paymentStats } = useCustomerPaymentStats(customerId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentStats || paymentStats.paymentCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No payment history available</p>
            <p className="text-xs text-gray-400">Waiting for ML predictions based on future payments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 0.8) return { color: 'bg-green-100 text-green-800', text: 'Excellent' };
    if (efficiency >= 0.6) return { color: 'bg-yellow-100 text-yellow-800', text: 'Good' };
    return { color: 'bg-red-100 text-red-800', text: 'Needs Attention' };
  };

  const efficiencyBadge = getEfficiencyBadge(paymentStats.avgPaymentEfficiency);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Payment Behavior Insights</CardTitle>
        <Badge className={efficiencyBadge.color}>
          {efficiencyBadge.text}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm font-medium">Avg Efficiency</span>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(paymentStats.avgPaymentEfficiency * 100)}%
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-500" />
              <span className="text-sm font-medium">Avg Days</span>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(paymentStats.avgDaysToPayment)}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Based on {paymentStats.paymentCount} payment{paymentStats.paymentCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center text-xs text-gray-500">
              {paymentStats.avgPaymentEfficiency >= 0.8 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              )}
              ML Features Ready
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentHistoryInsights;
