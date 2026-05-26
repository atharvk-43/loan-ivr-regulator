/**
 * @fileoverview CustomerDetail (Agent View) page.
 * Compiles specific borrower parameters, embeds HTML5 audio players for call recordings,
 * displays OpenAI summary cards, and hosts the visual transcript scroll.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import TranscriptViewer from '../components/calls/TranscriptViewer';
import CallStatusBadge from '../components/calls/CallStatusBadge';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import {
  HiOutlinePhone,
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';

const CustomerDetail = () => {
  const { startSimulatedCall } = useApp();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialing, setIsDialing] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data.customer);
      setCallLogs(response.data.callLogs);
    } catch (error) {
      console.error('Failed to retrieve borrower profile:', error);
      toast.error('Could not retrieve details for this customer.');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProfile().finally(() => setLoading(false));
  }, [id]);

  /**
   * Dial Outbound Call Simulator
   */
  const handleDial = () => {
    startSimulatedCall(customer, () => {
      fetchProfile();
    });
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col justify-center items-center gap-3">
        <LoadingSpinner size="large" />
        <p className="text-xs text-brand-textSecondary">Opening borrower profile ledger...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-sm text-brand-textSecondary">Borrower profile not found.</p>
        <Link to="/customers" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // OpenAI sentiment styling
  const getSentimentVariant = (sent) => {
    const raw = sent ? sent.toLowerCase() : 'unknown';
    if (raw.includes('positive') || raw.includes('cooperative')) return 'success';
    if (raw.includes('hostile')) return 'danger';
    if (raw.includes('negative')) return 'danger';
    if (raw.includes('neutral')) return 'default';
    return 'default';
  };

  // Repayment Likelihood styling
  const getLikelihoodVariant = (lh) => {
    const raw = lh ? lh.toLowerCase() : 'unknown';
    if (raw.includes('high')) return 'success';
    if (raw.includes('medium')) return 'warning';
    if (raw.includes('low')) return 'danger';
    return 'default';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Borrower Directory
        </Link>

        {/* Live dialer trigger */}
        <button
          onClick={handleDial}
          disabled={isDialing || customer.paymentStatus === 'paid'}
          className="btn-primary text-xs font-semibold flex items-center gap-2 py-2.5 px-5"
        >
          {isDialing ? (
            <LoadingSpinner size="small" />
          ) : (
            <HiOutlinePhone className="w-4.5 h-4.5" />
          )}
          {isDialing ? 'Dialing borrower...' : 'Initiate Outbound Call'}
        </button>
      </div>

      {/* Main Grid: Profile parameters and AI summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Borrower info ledger */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl relative overflow-hidden">
            {/* Header branding */}
            <div className="flex items-center gap-3 pb-6 border-b border-white/[0.06] mb-6">
              <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-center text-xl text-brand-primary">
                <HiOutlineUser className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-textPrimary tracking-tight">
                  Borrower Details
                </h3>
                <span className="text-[10px] bg-white/[0.05] border border-white/[0.08] text-brand-textSecondary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {customer.loanId}
                </span>
              </div>
            </div>

            {/* Profile info fields */}
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <span className="text-brand-textSecondary">Full Name</span>
                <span className="font-bold text-brand-textPrimary text-sm">{customer.name}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <span className="text-brand-textSecondary">Phone Number</span>
                <span className="font-bold text-brand-textPrimary">{customer.phone}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <span className="text-brand-textSecondary">EMI Due Amount</span>
                <span className="font-bold text-brand-primary text-sm">
                  {formatCurrency(customer.dueAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <span className="text-brand-textSecondary">Due Date</span>
                <span className="font-medium text-brand-textPrimary">
                  {formatDate(customer.dueDate)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <span className="text-brand-textSecondary">Payment Status</span>
                <Badge variant={customer.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  {customer.paymentStatus.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <span className="text-brand-textSecondary">Call Attempts</span>
                <span className="font-bold text-brand-textPrimary">{customer.callAttempts}</span>
              </div>

              {customer.lastCallDate && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-brand-textSecondary">Last Call Attempt</span>
                  <span className="font-medium text-brand-textPrimary">
                    {new Date(customer.lastCallDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Promise date & Call Recording player card */}
          {customer.paymentStatus === 'promised' && (
            <div className="glass-panel p-5 rounded-2xl border border-brand-primary/20 shadow-md relative bg-gradient-to-br from-brand-primary/5 to-transparent">
              <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider flex items-center gap-2 mb-3">
                <HiOutlineCalendarDays className="w-5 h-5 text-brand-primary" />
                Payment Promised Date
              </h4>
              <p className="text-sm font-extrabold text-brand-textPrimary">
                {formatDate(customer.promisedPaymentDate)}
              </p>
              <p className="text-[11px] text-brand-textSecondary mt-1 leading-relaxed">
                Borrower committed to EMI settlement on this date during the automated call.
              </p>
            </div>
          )}

          {/* Call recording widget player */}
          {customer.callRecordingUrl && (
            <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-md space-y-3">
              <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider flex items-center gap-2">
                <HiOutlineClock className="w-5 h-5 text-brand-primary animate-pulse" />
                Call Recording Playback
              </h4>
              <audio
                src={customer.callRecordingUrl}
                controls
                className="w-full h-8 outline-none rounded-lg bg-white/[0.02] border border-white/[0.06]"
              />
              <p className="text-[10px] text-brand-textSecondary text-center leading-relaxed">
                Compliance recording for loan verification
              </p>
            </div>
          )}
        </div>

        {/* AI summary and full conversation transcript */}
        <div className="lg:col-span-2 space-y-8">
          {/* OpenAI Summary Panel */}
          {customer.aiSummary && customer.aiSummary.summary ? (
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06] mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-extrabold">
                  🤖
                </div>
                <h3 className="text-base font-bold text-brand-textPrimary tracking-tight">
                  OpenAI Call Synthesis
                </h3>
              </div>

              {/* Escalation Warnings */}
              {customer.aiSummary.escalationRecommended && (
                <div className="mb-5 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 flex items-start gap-3 animate-pulse">
                  <HiOutlineExclamationTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-extrabold uppercase tracking-wide">
                      Escalation Flag Triggered
                    </h5>
                    <p className="text-[11px] leading-relaxed mt-0.5">
                      This borrower has refused EMI payment, exhibited hostile behaviors, or explicitly requested agent callbacks. Immediate recovery agent follow-up recommended.
                    </p>
                  </div>
                </div>
              )}

              {/* Synthesis summary text */}
              <p className="text-xs text-brand-textPrimary leading-relaxed font-medium mb-6">
                "{customer.aiSummary.summary}"
              </p>

              {/* Analytical Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/[0.04] pt-5">
                <div>
                  <p className="text-[10px] font-semibold text-brand-textSecondary uppercase tracking-wider mb-1">
                    Call Sentiment
                  </p>
                  <Badge variant={getSentimentVariant(customer.aiSummary.sentiment)}>
                    {customer.aiSummary.sentiment}
                  </Badge>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-brand-textSecondary uppercase tracking-wider mb-1">
                    Repayment Likelihood
                  </p>
                  <Badge variant={getLikelihoodVariant(customer.aiSummary.repaymentLikelihood)}>
                    {customer.aiSummary.repaymentLikelihood}
                  </Badge>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-brand-textSecondary uppercase tracking-wider mb-1">
                    Agent Callback
                  </p>
                  <Badge variant={customer.callbackRequested ? 'primary' : 'default'}>
                    {customer.callbackRequested ? 'Yes (Requested)' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            /* AI summary empty state */
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl flex items-center gap-3">
              <HiOutlineShieldCheck className="w-6 h-6 text-brand-textSecondary" />
              <div>
                <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">
                  AI Summary Unavailable
                </h4>
                <p className="text-[11px] text-brand-textSecondary mt-0.5">
                  AI analysis is generated after a successful IVR voice call completed.
                </p>
              </div>
            </div>
          )}

          {/* Visual Transcript bubbles */}
          <TranscriptViewer transcript={customer.transcript} />

          {/* Historical Attempt logs timeline */}
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl">
            <h3 className="text-sm font-bold text-brand-textPrimary tracking-tight flex items-center gap-2 mb-6">
              <HiOutlineChatBubbleBottomCenterText className="w-5 h-5 text-brand-primary" />
              Call Attempt Records Timeline
            </h3>

            {callLogs.length === 0 ? (
              <p className="text-xs text-brand-textSecondary">No attempt logs found for this customer.</p>
            ) : (
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {callLogs.map((log, idx) => (
                  <div
                    key={log._id}
                    className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]"
                  >
                    <div>
                      <span className="font-semibold text-brand-textPrimary">
                        Attempt #{callLogs.length - idx}
                      </span>
                      <p className="text-[10px] text-brand-textSecondary mt-0.5">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {log.duration > 0 && (
                        <span className="text-[10px] text-brand-textSecondary">
                          Duration: {log.duration}s
                        </span>
                      )}
                      <CallStatusBadge status={log.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
