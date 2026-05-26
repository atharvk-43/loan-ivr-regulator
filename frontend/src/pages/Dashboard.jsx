/**
 * @fileoverview Main administrative dashboard page.
 * Fetches and displays global recovery statistics, outbound dialing charts,
 * and recent borrower interactions.
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatsCards from '../components/dashboard/StatsCards';
import CallChart from '../components/dashboard/CallChart';
import RecentCalls from '../components/dashboard/RecentCalls';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiArrowPath } from 'react-icons/hi2';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Execute calls in parallel to speed up load time
      const [statsRes, chartRes, historyRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/chart-data?days=7'),
        api.get('/calls/history?page=1&limit=5'),
      ]);

      setStats(statsRes.data.stats);
      setChartData(chartRes.data.data);
      setRecentCalls(historyRes.data.logs);
    } catch (error) {
      console.error('Failed to retrieve dashboard metrics:', error);
      toast.error('Could not refresh dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto refresh dashboard every 30 seconds for live updates
    const timer = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col justify-center items-center gap-3">
        <LoadingSpinner size="large" />
        <p className="text-xs text-brand-textSecondary animate-pulse">
          Loading analytics intelligence system...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-textPrimary tracking-tight">
            System Overview Dashboard
          </h2>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            Monitor automated outgoing loan collections and live customer responses
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 self-start py-2.5 px-4 text-xs font-semibold"
        >
          <HiArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Synchronizing...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Analytics Cards */}
      <StatsCards stats={stats} />

      {/* Main Grid: Chart and Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Call performance charts */}
        <div className="xl:col-span-2">
          <CallChart data={chartData} />
        </div>

        {/* Compact Recent call activity log */}
        <div className="xl:col-span-1">
          <RecentCalls calls={recentCalls} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
