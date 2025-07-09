import React from 'react';
import MetricsDashboard from '../dashboard/MetricsDashboard';
import InvoiceDashboard from '../invoices/InvoiceDashboard';
import CustomerDashboard from '../customers/CustomerDashboard';
import AlertsDashboard from '../alerts/AlertsDashboard';
import CashFlowPerformance from '../dashboard/CashFlowPerformance';
import ConsultancyMetrics from '../dashboard/ConsultancyMetrics';
import ConsultancyRiskFactors from '../dashboard/ConsultancyRiskFactors';
import ReportsDashboard from '../reports/ReportsDashboard';
import ForecastDashboard from '../forecast/ForecastDashboard';
import SettingsDashboard from '../settings/SettingsDashboard';
import ProfilePage from '../profile/ProfilePage';

interface MainContentProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const MainContent = ({ currentPage, onPageChange }: MainContentProps) => {
  const renderPageContent = () => {
    switch(currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">HCLTech Payment Dashboard</h1>
              <p className="text-gray-600">Overview of your consultancy payment predictions and financial metrics</p>
            </div>
            <MetricsDashboard />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ConsultancyRiskFactors />
            </div>
            <CashFlowPerformance />
          </div>
        );
      case 'invoices':
        return <InvoiceDashboard />;
      case 'customers':
        return <CustomerDashboard />;
      case 'predictions':
        return <ForecastDashboard />;
      case 'alerts':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Alerts</h1>
              <p className="text-gray-600">Monitor payment risks and urgent actions</p>
            </div>
            <AlertsDashboard />
          </div>
        );
      case 'reports':
        return <ReportsDashboard />;
      case 'settings':
        return <SettingsDashboard />;
      case 'profile':
        return <ProfilePage onBack={() => onPageChange('dashboard')} />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="p-8">
        {renderPageContent()}
      </div>
    </div>
  );
};

export default MainContent;
