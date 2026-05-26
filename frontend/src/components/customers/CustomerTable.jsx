import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import CallStatusBadge from '../calls/CallStatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  HiOutlinePhone,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2';

const CustomerTable = ({
  customers = [],
  onEdit,
  onDelete,
  onStartCall,
  callingStates = {},
}) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPaymentBadgeVariant = (status) => {
    const mapping = {
      paid: 'success',
      pending: 'warning',
      overdue: 'danger',
      promised: 'primary',
      paid_pending_verification: 'info',
    };
    return mapping[status] || 'default';
  };

  const formatPaymentStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="overflow-x-auto w-full">
      {customers.length === 0 ? (
        <div className="py-16 text-center text-brand-textSecondary text-sm">
          No borrowers found. Create one manually or upload a CSV.
        </div>
      ) : (
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-brand-textSecondary font-semibold uppercase tracking-wider">
              <th className="pb-4 pl-3">Borrower Details</th>
              <th className="pb-4">Loan ID</th>
              <th className="pb-4">Balance</th>
              <th className="pb-4">Due Date</th>
              <th className="pb-4">EMI Status</th>
              <th className="pb-4">IVR Call State</th>
              <th className="pb-4 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((cust) => {
              const isCalling = callingStates[cust._id];

              return (
                <tr
                  key={cust._id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 pl-3">
                    <div className="font-semibold text-brand-textPrimary text-sm">
                      {cust.name}
                    </div>
                    <div className="text-[11px] text-brand-textSecondary mt-0.5">
                      {cust.phone}
                    </div>
                  </td>
                  <td className="py-4 text-brand-textSecondary font-medium">
                    {cust.loanId}
                  </td>
                  <td className="py-4 font-bold text-brand-textPrimary">
                    {formatCurrency(cust.dueAmount)}
                  </td>
                  <td className="py-4 text-brand-textSecondary font-medium">
                    {formatDate(cust.dueDate)}
                  </td>
                  <td className="py-4">
                    <Badge variant={getPaymentBadgeVariant(cust.paymentStatus)}>
                      {formatPaymentStatus(cust.paymentStatus)}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <CallStatusBadge status={cust.callStatus} />
                  </td>
                  <td className="py-4 pr-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Trigger Call */}
                      <button
                        onClick={() => onStartCall(cust._id)}
                        disabled={isCalling || cust.paymentStatus === 'paid'}
                        className={`inline-flex items-center justify-center p-2 rounded-xl border transition-all ${
                          isCalling
                            ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                            : cust.paymentStatus === 'paid'
                            ? 'bg-white/[0.01] border-white/[0.04] text-white/20 cursor-not-allowed'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30'
                        }`}
                        title={isCalling ? 'Dialing...' : 'Place automated voice call'}
                      >
                        {isCalling ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <HiOutlinePhone className="w-4 h-4" />
                        )}
                      </button>

                      {/* View Profile details */}
                      <Link
                        to={`/customers/${cust._id}`}
                        className="inline-flex p-2 rounded-xl bg-white/[0.02] border border-white/[0.08] text-brand-textSecondary hover:text-brand-textPrimary hover:bg-white/[0.05] transition-all"
                        title="View Full Profile"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </Link>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(cust)}
                        className="inline-flex p-2 rounded-xl bg-white/[0.02] border border-white/[0.08] text-brand-textSecondary hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                        title="Edit Customer"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(cust._id)}
                        className="inline-flex p-2 rounded-xl bg-white/[0.02] border border-white/[0.08] text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                        title="Delete Record"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CustomerTable;
