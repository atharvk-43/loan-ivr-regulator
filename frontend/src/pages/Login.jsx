import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Notice session expiration
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast.error('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Logged in successfully!');
      navigate('/');
    } else {
      toast.error(result.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden flex items-center justify-center p-4">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-brand-primary opacity-20 blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-brand-secondary opacity-10 blur-[100px] animate-pulse-slow" />

      {/* Login Card */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative border border-white/[0.08] shadow-2xl animate-scaleIn">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl items-center justify-center text-3xl shadow-lg shadow-brand-primary/20 mb-4">
            🏦
          </div>
          <h2 className="text-2xl font-extrabold text-brand-textPrimary tracking-tight">
            Welcome to IVR Regulator
          </h2>
          <p className="text-xs text-brand-textSecondary mt-1.5">
            AI-powered Loan Reminder & Collection Platform
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-textSecondary pl-1">
              Work Email Address
            </label>
            <div className="relative flex items-center">
              <HiOutlineEnvelope className="absolute left-4 w-5 h-5 text-brand-textSecondary pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@company.com"
                className="glass-input pl-11 pr-4 py-3 w-full text-sm"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-brand-textSecondary">
                Account Password
              </label>
            </div>
            <div className="relative flex items-center">
              <HiOutlineLockClosed className="absolute left-4 w-5 h-5 text-brand-textSecondary pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input pl-11 pr-4 py-3 w-full text-sm"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-3 text-sm font-semibold tracking-wide mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In To Workspace'}
          </button>
        </form>

        {/* Footnote redirection */}
        <div className="text-center mt-6 pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-brand-textSecondary">
            New administrator?{' '}
            <Link
              to="/signup"
              className="text-brand-primary font-bold hover:text-brand-secondary transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
