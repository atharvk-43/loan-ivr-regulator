/**
 * @fileoverview Main React App Entry Routing.
 * Registers routing tables, mounts auth session wrappers, and includes
 * hot toaster alert banners.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Layouts & Page components
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CallHistory from './pages/CallHistory';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LoadingSpinner from './components/ui/LoadingSpinner';

/**
 * Protected Route Wrapper Component.
 * Blocks access for unauthenticated agents, pushing them to login.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center gap-3">
        <LoadingSpinner size="large" />
        <p className="text-xs text-brand-textSecondary animate-pulse">
          Decrypting secure user session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          {/* Custom Global Styling Notification toaster banner */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0c0c22',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f1f5f9',
                fontSize: '13px',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#0c0c22',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#0c0c22',
                },
              },
            }}
          />

          <Routes>
            {/* Public authentication paths */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected dashboard work routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="calls" element={<CallHistory />} />
            </Route>

            {/* General wild-card fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
