/**
 * @fileoverview Application UI Context.
 * Manages side drawer toggles, theme adjustments, and global notifications.
 */

import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default is dark mode

  // Call simulator state
  const [isCallSimulatorOpen, setIsCallSimulatorOpen] = useState(false);
  const [activeSimulatorCustomer, setActiveSimulatorCustomer] = useState(null);
  const [refreshCallbacks, setRefreshCallbacks] = useState([]);

  // Toggle Dark Mode Classes
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const startSimulatedCall = (customer, onFinishCallback) => {
    setActiveSimulatorCustomer(customer);
    setIsCallSimulatorOpen(true);
    if (onFinishCallback) {
      setRefreshCallbacks(prev => [...prev, onFinishCallback]);
    }
  };

  const triggerCallFinished = () => {
    refreshCallbacks.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in call simulator refresh callback:', err);
      }
    });
    setRefreshCallbacks([]);
  };

  return (
    <AppContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        isDarkMode,
        toggleTheme,
        isCallSimulatorOpen,
        setIsCallSimulatorOpen,
        activeSimulatorCustomer,
        setActiveSimulatorCustomer,
        startSimulatedCall,
        triggerCallFinished
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be consumed within an AppProvider');
  }
  return context;
};
