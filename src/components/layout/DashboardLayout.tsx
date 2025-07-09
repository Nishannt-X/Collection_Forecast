
import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

interface DashboardLayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const DashboardLayout = ({ currentPage, onPageChange, onLogout }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={onPageChange}
        onLogout={onLogout}
      />
      <div className="ml-64 flex-1 overflow-auto">
        <MainContent currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </div>
  );
};

export default DashboardLayout;
