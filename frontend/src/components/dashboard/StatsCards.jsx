import React from 'react';
import {
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlinePhoneArrowUpRight,
  HiOutlinePhoneXMark,
} from 'react-icons/hi2';

const StatsCards = ({ stats }) => {
  const {
    totalCustomers = 0,
    pendingPayments = 0,
    successfulCalls = 0,
    failedCalls = 0,
    totalDueAmount = 0,
    callsToday = 0,
  } = stats || {};

  const cards = [
    {
      title: 'Total Borrowers',
      value: totalCustomers.toLocaleString(),
      subtitle: `${callsToday} call attempts today`,
      icon: HiOutlineUsers,
      color: 'indigo',
      glassClass: 'glass-card-indigo',
      textColor: 'text-indigo-400',
    },
    {
      title: 'Active Debt Balance',
      value: `$${totalDueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${pendingPayments} cases outstanding`,
      icon: HiOutlineCurrencyDollar,
      color: 'amber',
      glassClass: 'glass-card-amber',
      textColor: 'text-amber-400',
    },
    {
      title: 'Successful Calls',
      value: successfulCalls.toLocaleString(),
      subtitle: 'Completed or answered',
      icon: HiOutlinePhoneArrowUpRight,
      color: 'emerald',
      glassClass: 'glass-card-emerald',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Failed Calls',
      value: failedCalls.toLocaleString(),
      subtitle: 'Busy, unanswered, or error',
      icon: HiOutlinePhoneXMark,
      color: 'red',
      glassClass: 'glass-card-red',
      textColor: 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-40 transition-all duration-300 transform hover:scale-[1.02] border border-white/[0.06] hover:border-white/[0.12]`}
        >
          {/* Top Row */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                {card.title}
              </p>
              <h4 className="text-2xl font-bold text-brand-textPrimary mt-2 tracking-tight">
                {card.value}
              </h4>
            </div>
            <div className={`p-3 rounded-xl ${card.glassClass}`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] mt-2">
            <span className="text-xs text-brand-textSecondary font-medium">
              {card.subtitle}
            </span>
          </div>

          {/* Subtle Accent Glow Circle */}
          <div
            className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-xl ${
              card.color === 'indigo'
                ? 'bg-brand-primary'
                : card.color === 'amber'
                ? 'bg-amber-500'
                : card.color === 'emerald'
                ? 'bg-emerald-500'
                : 'bg-red-500'
            }`}
          />
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
