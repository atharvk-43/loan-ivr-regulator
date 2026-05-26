/**
 * @fileoverview CallHistory page.
 * Manages the global log of all placed calls, filters by outcome status,
 * and handles paginated search lists.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CallStatusBadge from '../components/calls/CallStatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlinePhone,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiArrowPath,
} from 'react-icons/hi2';

const CallHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtering & Pagination states
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCallLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await api.get('/calls/history', {
        params: {
          page,
          limit: 12,
          status,
        },
      });

      setLogs(response.data.logs);
      setTotalPages(response.data.pages);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Failed to load call logs:', error);
      toast.error('Could not retrieve call history records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCallLogs();
  }, [status]);

  useEffect(() => {
    fetchCallLogs();
  }, [page]);

  const formatDuration = (sec) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (val) => {
    if (val === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-textPrimary tracking-tight">
            IVR Call History Records
          </h2>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            Audit history logs of all automated dial runs and borrower call durations
          </p>
        </div>

        <button
          onClick={() => fetchCallLogs(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 self-start py-2.5 px-4 text-xs font-semibold"
        >
          <HiArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Sync History'}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/[0.06]">
        <span className="text-xs font-semibold text-brand-textSecondary">
          Active Database Count: <span className="text-brand-textPrimary font-bold">{totalCount} calls logged</span>
        </span>

        {/* Outcome Status Dropdown */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="glass-input text-xs appearance-none py-2 px-4 pr-8 bg-[#0b0b23] border-white/[0.08] max-w-xs self-start"
        >
          <option value="">All Dial Outcomes</option>
          <option value="initiated">Initiated</option>
          <option value="ringing">Ringing</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="no-answer">No Answer</option>
          <option value="busy">Busy</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl">
        {loading ? (
          <div className="py-24 flex flex-col justify-center items-center gap-3">
            <LoadingSpinner size="large" />
            <p className="text-xs text-brand-textSecondary">Loading historical logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-brand-textSecondary text-sm flex flex-col items-center justify-center gap-3">
            <HiOutlinePhone className="w-10 h-10 text-white/5" />
            No call records found matching this status filter.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-brand-textSecondary font-semibold uppercase tracking-wider">
                    <th className="pb-4 pl-3">Borrower</th>
                    <th className="pb-4">Loan ID</th>
                    <th className="pb-4">Due Balance</th>
                    <th className="pb-4">Call Outcome</th>
                    <th className="pb-4">Duration</th>
                    <th className="pb-4">Timestamp Date</th>
                    <th className="pb-4 pr-3 text-right">View Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 pl-3">
                        <div className="font-semibold text-brand-textPrimary text-sm">
                          {log.customer?.name || 'Deleted Borrower'}
                        </div>
                        <div className="text-[11px] text-brand-textSecondary mt-0.5">
                          {log.customer?.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 text-brand-textSecondary font-medium">
                        {log.customer?.loanId || 'N/A'}
                      </td>
                      <td className="py-4 text-brand-textPrimary font-bold">
                        {log.customer ? formatCurrency(log.customer.dueAmount) : '-'}
                      </td>
                      <td className="py-4">
                        <CallStatusBadge status={log.status} />
                      </td>
                      <td className="py-4 text-brand-textSecondary font-medium">
                        {formatDuration(log.duration)}
                      </td>
                      <td className="py-4 text-brand-textSecondary font-medium">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-4 pr-3 text-right">
                        {log.customer?._id ? (
                          <Link
                            to={`/customers/${log.customer._id}`}
                            className="inline-flex p-2 rounded-xl bg-white/[0.02] border border-white/[0.08] text-brand-textSecondary hover:text-brand-textPrimary hover:bg-white/[0.05] transition-all"
                            title="View Full Profile"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-4 mt-6">
                <span className="text-xs text-brand-textSecondary">
                  Showing {(page - 1) * 12 + 1} to{' '}
                  {Math.min(page * 12, totalCount)} of {totalCount} records
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-white/[0.08] text-brand-textSecondary hover:text-brand-textPrimary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.03] transition-colors"
                  >
                    <HiOutlineChevronLeft className="w-4.5 h-4.5" />
                  </button>
                  <span className="text-xs font-bold text-brand-textPrimary px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-white/[0.08] text-brand-textSecondary hover:text-brand-textPrimary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.03] transition-colors"
                  >
                    <HiOutlineChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CallHistory;
