import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { HiOutlineSun, HiOutlineMoon, HiOutlineBell } from 'react-icons/hi2';

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useApp();

  // Map pathnames to beautiful titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview';
    if (path === '/customers') return 'Customers';
    if (path.startsWith('/customers/')) return 'Borrower Profile';
    if (path === '/calls') return 'Call Logs';
    return 'IVR Regulator';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 bg-brand-bg/40 backdrop-blur-md sticky top-0 z-20">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-brand-textPrimary tracking-tight">
          {getPageTitle()}
        </h1>
        <p className="text-xs text-brand-textSecondary">{formattedDate}</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-brand-textSecondary hover:text-brand-textPrimary hover:bg-white/[0.05] transition-all"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <HiOutlineSun className="w-5 h-5" />
          ) : (
            <HiOutlineMoon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-xl text-brand-textSecondary hover:text-brand-textPrimary hover:bg-white/[0.05] transition-all relative">
          <HiOutlineBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
        </button>

        {/* Vertical divider */}
        <span className="h-6 w-px bg-white/[0.08]" />

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white text-xs uppercase shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-brand-textPrimary truncate max-w-[100px]">
                {user.name}
              </p>
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-1.5 py-0.5 rounded-full border border-brand-primary/15">
                Admin
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
