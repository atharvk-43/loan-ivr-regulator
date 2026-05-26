import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CallSimulator from '../calls/CallSimulator';
import { useApp } from '../../context/AppContext';

const DashboardLayout = () => {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Top Header */}
        <Header />

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global In-Browser Call Simulator Dialer */}
      <CallSimulator />
    </div>
  );
};

export default DashboardLayout;
