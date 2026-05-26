import React from 'react';
import { Link } from 'react-router-dom';
import CallStatusBadge from '../calls/CallStatusBadge';
import { HiOutlineUser, HiOutlinePhone, HiOutlineEye } from 'react-icons/hi2';

const RecentCalls = ({ calls = [] }) => {
  const formatDuration = (sec) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] flex-1">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-brand-textPrimary tracking-tight">
            Recent Activities
          </h3>
          <p className="text-xs text-brand-textSecondary">
            Latest outbound automated IVR calls
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        {calls.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-brand-textSecondary text-sm gap-2">
            <HiOutlinePhone className="w-8 h-8 text-white/10 animate-bounce" />
            No calls placed yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-brand-textSecondary font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Borrower</th>
                <th className="pb-3">Loan ID</th>
                <th className="pb-3">Outcome</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 pr-2 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr
                  key={call._id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 pl-2 font-medium text-brand-textPrimary">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-white/[0.03] flex items-center justify-center">
                        <HiOutlineUser className="w-3.5 h-3.5 text-brand-textSecondary" />
                      </div>
                      <span className="truncate max-w-[120px]">
                        {call.customer?.name || 'Unknown Borrower'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-brand-textSecondary">
                    {call.customer?.loanId || 'N/A'}
                  </td>
                  <td className="py-3">
                    <CallStatusBadge status={call.status} />
                  </td>
                  <td className="py-3 text-brand-textSecondary">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="py-3 text-brand-textSecondary">
                    {formatDate(call.createdAt)}
                  </td>
                  <td className="py-3 pr-2 text-right">
                    {call.customer?._id ? (
                      <Link
                        to={`/customers/${call.customer._id}`}
                        className="inline-flex p-1.5 rounded-lg text-brand-textSecondary hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                        title="View Profile"
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
        )}
      </div>
    </div>
  );
};

export default RecentCalls;
