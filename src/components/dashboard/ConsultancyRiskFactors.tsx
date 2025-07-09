
import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Users } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';

interface RiskFactor {
  factor_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  count: number;
  affected_customers: string[];
}

const ConsultancyRiskFactors = () => {
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: customers, isLoading: customersLoading } = useCustomers();

  const isLoading = invoicesLoading || customersLoading;

  // Calculate risk factors from real data
  const riskFactors = React.useMemo((): RiskFactor[] => {
    if (!invoices || !customers) return [];

    const factors: RiskFactor[] = [];
    const today = new Date();

    // Project Delays (overdue invoices)
    const overdueInvoices = invoices.filter(inv => 
      new Date(inv.due_date) < today && inv.status !== 'paid'
    );
    
    if (overdueInvoices.length > 0) {
      const affectedCustomers = [...new Set(
        overdueInvoices.map(inv => inv.customers?.name).filter(Boolean)
      )] as string[];
      
      factors.push({
        factor_type: 'Project Delays',
        severity: overdueInvoices.length > 5 ? 'high' : overdueInvoices.length > 2 ? 'medium' : 'low',
        description: `${overdueInvoices.length} overdue invoices indicating potential project delays`,
        count: overdueInvoices.length,
        affected_customers: affectedCustomers
      });
    }

    // Contract Renewals (customers with only milestone contracts)
    const milestoneCustomers = customers.filter(customer => 
      customer.contract_type === 'milestone'
    );
    
    if (milestoneCustomers.length > 0) {
      factors.push({
        factor_type: 'Contract Renewals',
        severity: 'medium',
        description: `${milestoneCustomers.length} milestone-based clients may need contract renewals`,
        count: milestoneCustomers.length,
        affected_customers: milestoneCustomers.map(c => c.name)
      });
    }

    // Milestone Approvals (sent milestone invoices)
    const pendingMilestones = invoices.filter(inv => 
      inv.status === 'sent' && inv.customers?.contract_type === 'milestone'
    );
    
    if (pendingMilestones.length > 0) {
      const affectedCustomers = [...new Set(
        pendingMilestones.map(inv => inv.customers?.name).filter(Boolean)
      )] as string[];
      
      factors.push({
        factor_type: 'Milestone Approvals',
        severity: pendingMilestones.length > 3 ? 'high' : 'medium',
        description: `${pendingMilestones.length} milestone invoices awaiting client approval`,
        count: pendingMilestones.length,
        affected_customers: affectedCustomers
      });
    }

    // Client Engagement (customers with high outstanding amounts)
    const highRiskCustomers = customers.filter(customer => {
      const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);
      const outstandingAmount = customerInvoices
        .filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      
      return outstandingAmount > 10000; // High outstanding amount threshold
    });

    if (highRiskCustomers.length > 0) {
      factors.push({
        factor_type: 'Client Engagement',
        severity: highRiskCustomers.length > 2 ? 'high' : 'medium',
        description: `${highRiskCustomers.length} clients with high outstanding amounts requiring attention`,
        count: highRiskCustomers.length,
        affected_customers: highRiskCustomers.map(c => c.name)
      });
    }

    return factors;
  }, [invoices, customers]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Consultancy Risk Factors</h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-gray-50 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-800 border-green-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getFactorIcon = (factorType: string) => {
    switch (factorType) {
      case 'Project Delays': return Clock;
      case 'Contract Renewals': return Users;
      case 'Milestone Approvals': return CheckCircle;
      case 'Client Engagement': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Consultancy Risk Factors</h3>
      
      {riskFactors.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No significant risk factors detected</p>
          <p className="text-sm text-gray-500 mt-2">All projects appear to be on track</p>
        </div>
      ) : (
        <div className="space-y-4">
          {riskFactors.map((factor, index) => {
            const IconComponent = getFactorIcon(factor.factor_type);
            return (
              <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(factor.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{factor.factor_type}</div>
                      <div className="text-sm opacity-75 mt-1">{factor.description}</div>
                      <div className="text-xs mt-2">
                        <span className="font-medium">Affected clients: </span>
                        {factor.affected_customers.length > 0 
                          ? factor.affected_customers.join(', ')
                          : 'None specified'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{factor.count}</span>
                    <span className="text-xs uppercase tracking-wide">{factor.severity}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConsultancyRiskFactors;
