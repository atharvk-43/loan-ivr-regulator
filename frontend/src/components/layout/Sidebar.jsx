import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineSquare2Stack,
  HiOutlineUsers,
  HiOutlinePhone,
  HiOutlineArrowLeftOnRectangle,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: HiOutlineSquare2Stack },
    { name: 'Customers', path: '/customers', icon: HiOutlineUsers },
    { name: 'Call History', path: '/calls', icon: HiOutlinePhone },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out border-r border-white/[0.08] bg-brand-bg flex flex-col justify-between ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand logo container */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-2xl">🏦</span>
            {!sidebarCollapsed && (
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary tracking-tight text-lg uppercase">
                IVR Regulator
              </span>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-brand-textSecondary hover:text-brand-textPrimary hover:bg-white/[0.05] transition-colors"
          >
            {sidebarCollapsed ? (
              <HiChevronRight className="w-5 h-5" />
            ) : (
              <HiChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-primary text-white font-medium shadow-md shadow-brand-primary/20'
                    : 'text-brand-textSecondary hover:text-brand-textPrimary hover:bg-white/[0.03]'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium tracking-wide animate-fadeIn">
                  {item.name}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User profile & logout section */}
      <div className="p-3 border-t border-white/[0.08] space-y-2">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02]">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white text-sm shadow-inner uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-brand-textPrimary truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-brand-textSecondary truncate capitalize">
                {user.role} Agent
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all duration-200 w-full text-left`}
        >
          <HiOutlineArrowLeftOnRectangle className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && (
            <span className="text-sm font-medium tracking-wide">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
