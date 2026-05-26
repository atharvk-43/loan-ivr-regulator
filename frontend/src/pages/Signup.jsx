import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
} from 'react-icons/hi2';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await signup(name, email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      toast.error(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Glow Circles */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-brand-primary opacity-20 blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-brand-secondary opacity-10 blur-[100px] animate-pulse-slow" />

      {/* Signup Card */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative border border-white/[0.08] shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl items-center justify-center text-3xl shadow-lg shadow-brand-primary/20 mb-4">
            🏦
          </div>
          <h2 className="text-2xl font-extrabold text-brand-textPrimary tracking-tight">
            Register Agent Account
          </h2>
          <p className="text-xs text-brand-textSecondary mt-1.5">
            Create an administrator profile to begin automated dial campaigns
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-brand-textSecondary pl-1">
              Full Identity Name
            </label>
            <div className="relative flex items-center">
              <HiOutlineUser className="absolute left-4 w-5 h-5 text-brand-textSecondary pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="glass-input pl-11 pr-4 py-2.5 w-full text-sm"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
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
                className="glass-input pl-11 pr-4 py-2.5 w-full text-sm"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-brand-textSecondary pl-1">
              Password (Min. 6 chars)
            </label>
            <div className="relative flex items-center">
              <HiOutlineLockClosed className="absolute left-4 w-5 h-5 text-brand-textSecondary pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input pl-11 pr-4 py-2.5 w-full text-sm"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-brand-textSecondary pl-1">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <HiOutlineLockClosed className="absolute left-4 w-5 h-5 text-brand-textSecondary pointer-events-none" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input pl-11 pr-4 py-2.5 w-full text-sm"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-2.5 text-sm font-semibold tracking-wide mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating profile...' : 'Register Workspace Admin'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-5 border-t border-white/[0.06]">
          <p className="text-xs text-brand-textSecondary">
            Already have an active account?{' '}
            <Link
              to="/login"
              className="text-brand-primary font-bold hover:text-brand-secondary transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
