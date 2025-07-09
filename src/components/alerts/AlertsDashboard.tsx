
import React, { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Clock, DollarSign, TrendingDown, Bell, ChevronRight } from 'lucide-react';

const AlertsDashboard = () => {
  const [selectedAlertType, setSelectedAlertType] = useState<string>('active');

  const criticalAlerts = [
    {
      id: 1,
      type: 'overdue',
      category: 'critical',
      title: 'Overdue Invoices',
      description: '5 invoices are overdue by more than 30 days',
      amount: '$45,230',
      urgency: 'high',
      time: '2 hours ago',
      details: [
        { customer: 'Acme Corp', invoice: 'INV-001', days: 45, amount: '$12,500' },
        { customer: 'TechFlow Inc', invoice: 'INV-003', days: 38, amount: '$8,750' },
        { customer: 'Global Systems', invoice: 'INV-007', days: 42, amount: '$15,200' },
        { customer: 'DataSync Ltd', invoice: 'INV-012', days: 35, amount: '$5,480' },
        { customer: 'CloudTech', invoice: 'INV-015', days: 39, amount: '$3,300' }
      ]
    },
    {
      id: 2,
      type: 'risk',
      category: 'critical',
      title: 'High Risk Customer',
      description: 'Amgen Inc. has missed 3 consecutive payments',
      amount: '$25,432',
      urgency: 'high',
      time: '4 hours ago',
      details: [
        { customer: 'Amgen Inc', issue: 'Missed Payment #1', date: '2024-05-15', amount: '$8,500' },
        { customer: 'Amgen Inc', issue: 'Missed Payment #2', date: '2024-05-30', amount: '$9,200' },
        { customer: 'Amgen Inc', issue: 'Missed Payment #3', date: '2024-06-10', amount: '$7,732' }
      ]
    },
    {
      id: 3,
      type: 'cashflow',
      category: 'critical',
      title: 'Cash Flow Warning',
      description: 'Projected cash flow shortfall next month',
      amount: '-$12,500',
      urgency: 'medium',
      time: '1 day ago',
      details: [
        { period: 'Week 1', projected: '$45,000', actual: '$38,500', variance: '-$6,500' },
        { period: 'Week 2', projected: '$52,000', actual: '$48,200', variance: '-$3,800' },
        { period: 'Week 3', projected: '$38,000', actual: '$35,800', variance: '-$2,200' }
      ]
    }
  ];

  const overdueAlerts = [
    {
      id: 4,
      type: 'overdue',
      category: 'overdue',
      title: 'Invoice INV-023 overdue',
      description: 'Beta Corp invoice overdue by 15 days',
      amount: '$3,200',
      urgency: 'medium',
      time: '3 hours ago'
    },
    {
      id: 5,
      type: 'overdue',
      category: 'overdue',
      title: 'Invoice INV-025 overdue',
      description: 'Gamma Ltd invoice overdue by 8 days',
      amount: '$5,400',
      urgency: 'low',
      time: '1 day ago'
    },
    {
      id: 6,
      type: 'overdue',
      category: 'overdue',
      title: 'Invoice INV-027 overdue',
      description: 'Delta Inc invoice overdue by 22 days',
      amount: '$7,800',
      urgency: 'medium',
      time: '2 days ago'
    }
  ];

  const atRiskAlerts = [
    {
      id: 7,
      type: 'risk',
      category: 'atrisk',
      title: 'High Risk Customer A',
      description: 'Payment delays detected',
      amount: '$45,000',
      urgency: 'medium',
      time: '5 hours ago'
    },
    {
      id: 8,
      type: 'risk',
      category: 'atrisk',
      title: 'High Risk Customer B',
      description: 'Credit limit exceeded',
      amount: '$32,500',
      urgency: 'high',
      time: '1 day ago'
    },
    {
      id: 9,
      type: 'risk',
      category: 'atrisk',
      title: 'High Risk Customer C',
      description: 'Dispute pending',
      amount: '$28,750',
      urgency: 'medium',
      time: '3 days ago'
    }
  ];

  const allAlerts = [...criticalAlerts, ...overdueAlerts, ...atRiskAlerts];

  const alertSummaryData = [
    {
      id: 'critical',
      title: 'Critical Alerts',
      count: 3,
      color: 'red',
      icon: AlertTriangle,
      alerts: criticalAlerts
    },
    {
      id: 'overdue',
      title: 'Overdue Items',
      count: 12,
      color: 'yellow',
      icon: Clock,
      alerts: overdueAlerts
    },
    {
      id: 'atrisk',
      title: 'Amount at Risk',
      count: '$151,602',
      color: 'blue',
      icon: DollarSign,
      alerts: atRiskAlerts
    },
    {
      id: 'active',
      title: 'Active Alerts',
      count: 8,
      color: 'gray',
      icon: Bell,
      alerts: allAlerts
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue': return <Clock className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'cashflow': return <TrendingDown className="w-4 h-4" />;
      case 'collection': return <DollarSign className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-50 border-red-200 text-red-600';
      case 'yellow': return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'gray': return 'bg-gray-50 border-gray-200 text-gray-600';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getTextColorClasses = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-900';
      case 'yellow': return 'text-yellow-900';
      case 'blue': return 'text-blue-900';
      case 'gray': return 'text-gray-900';
      default: return 'text-gray-900';
    }
  };

  const getFilteredAlerts = () => {
    const selectedCategory = alertSummaryData.find(category => category.id === selectedAlertType);
    return selectedCategory ? selectedCategory.alerts : allAlerts;
  };

  const getSectionTitle = () => {
    const selectedCategory = alertSummaryData.find(category => category.id === selectedAlertType);
    return selectedCategory ? selectedCategory.title : 'Active Alerts';
  };

  const renderAlertDetails = (alertData: any) => {
    if (!alertData || !alertData.alerts) return null;

    return (
      <div className="space-y-4">
        {alertData.alerts.map((alert: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{alert.title || alert.customer}</h4>
            
            {alert.details && (
              <div className="space-y-2">
                {alert.details.map((detail: any, detailIndex: number) => (
                  <div key={detailIndex} className="text-sm text-gray-600 flex justify-between">
                    <span>{detail.customer || detail.issue || detail.period || 'Detail'}</span>
                    <span className="font-medium">{detail.amount || detail.variance || detail.days + ' days'}</span>
                  </div>
                ))}
              </div>
            )}
            
            {alert.amount && !alert.details && (
              <p className="text-sm text-gray-600">Amount: <span className="font-medium">{alert.amount}</span></p>
            )}
            
            {alert.days && (
              <p className="text-sm text-gray-600">Days overdue: <span className="font-medium">{alert.days}</span></p>
            )}
            
            {alert.risk && (
              <p className="text-sm text-gray-600">Risk: <span className="font-medium">{alert.risk}</span></p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {alertSummaryData.map((summary) => {
          const IconComponent = summary.icon;
          const colorClasses = getColorClasses(summary.color);
          const textColorClasses = getTextColorClasses(summary.color);
          const isSelected = selectedAlertType === summary.id;
          
          return (
            <div key={summary.id}>
              <div 
                className={`${colorClasses} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedAlertType(summary.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IconComponent className={`w-5 h-5 ${summary.color === 'red' ? 'text-red-600' : summary.color === 'yellow' ? 'text-yellow-600' : summary.color === 'blue' ? 'text-blue-600' : 'text-gray-600'} mr-2`} />
                    <div>
                      <p className={`text-2xl font-bold ${textColorClasses}`}>{summary.count}</p>
                      <p className={`text-sm ${summary.color === 'red' ? 'text-red-700' : summary.color === 'yellow' ? 'text-yellow-700' : summary.color === 'blue' ? 'text-blue-700' : 'text-gray-700'}`}>{summary.title}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtered Alerts */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{getSectionTitle()}</h2>
        
        <div className="space-y-4">
          {getFilteredAlerts().map((alert) => (
            <Alert key={alert.id} variant={alert.urgency === 'high' ? 'destructive' : 'default'}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <AlertTitle className="text-sm font-medium">{alert.title}</AlertTitle>
                    <AlertDescription className="text-sm text-gray-600 mt-1">
                      {alert.description}
                    </AlertDescription>
                    <p className="text-xs text-gray-500 mt-2">{alert.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getUrgencyColor(alert.urgency)}>
                    {alert.urgency.toUpperCase()}
                  </Badge>
                  <span className="font-semibold text-gray-900">{alert.amount}</span>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </div>

      {/* Alert Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Contact High-Risk Customers</h3>
            <p className="text-sm text-gray-600 mb-3">3 customers require immediate attention</p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700">
              Start Collection Process
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Review Cash Flow Forecast</h3>
            <p className="text-sm text-gray-600 mb-3">Potential shortfall detected next month</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
              View Forecast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsDashboard;
