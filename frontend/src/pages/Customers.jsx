/**
 * @fileoverview Customers list page.
 * Manages the borrower database directory, handles manual insertions,
 * triggers bulk CSV uploads, and handles outbound call requests.
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CustomerTable from '../components/customers/CustomerTable';
import CustomerForm from '../components/customers/CustomerForm';
import CsvUpload from '../components/customers/CsvUpload';
import SearchBar from '../components/ui/SearchBar';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import {
  HiPlus,
  HiOutlineArrowUpTray,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';

const Customers = () => {
  const { startSimulatedCall } = useApp();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Searching states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [callStatus, setCallStatus] = useState('');
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // for editing
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracking which call is currently being dialed
  const [callingStates, setCallingStates] = useState({});

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers', {
        params: {
          page,
          limit: 10,
          search,
          status,
          callStatus,
        },
      });

      setCustomers(response.data.customers);
      setTotalPages(response.data.pages);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Failed to retrieve borrower lists:', error);
      toast.error('Could not load customer profiles.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on inputs
  useEffect(() => {
    setPage(1);
    fetchCustomers();
  }, [search, status, callStatus]);

  // Trigger on page adjustments
  useEffect(() => {
    fetchCustomers();
  }, [page]);

  /**
   * Triggers an automated outbound Voice Call Simulator
   */
  const handleStartCall = (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    if (!customer) return;

    startSimulatedCall(customer, () => {
      fetchCustomers();
    });
  };

  /**
   * Handles creation or update submits
   */
  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedCustomer) {
        // Edit Customer profile
        await api.put(`/customers/${selectedCustomer._id}`, data);
        toast.success('Borrower details updated successfully!');
      } else {
        // Create manual customer profile
        await api.post('/customers', data);
        toast.success('New borrower profile created!');
      }
      setIsFormOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Customer form submit failed:', error);
      toast.error(error.response?.data?.message || 'Operation failed. Verify unique fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Trigger Delete confirmation
   */
  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this borrower and all their call records? This action is irreversible.')) {
      return;
    }

    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer profile removed.');
      fetchCustomers();
    } catch (error) {
      console.error('Customer deletion failed:', error);
      toast.error('Failed to delete borrower details.');
    }
  };

  /**
   * Trigger CSV Upload
   */
  const handleImportCsv = async (file) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { summary } = response.data;
      toast.success(
        `CSV Import completed! Successfully imported ${summary.imported} borrowers.`
      );
      
      setIsUploadOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('CSV import failed:', error);
      toast.error(error.response?.data?.message || 'Failed to parse and import CSV file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-textPrimary tracking-tight">
            Borrower Directory
          </h2>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            Add borrowers, dial out, and view real-time account balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsFormOpen(true);
            }}
            className="btn-primary text-xs font-semibold flex items-center gap-1.5 py-2.5 px-4"
          >
            <HiPlus className="w-4 h-4" />
            Add Borrower
          </button>
          
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn-secondary text-xs font-semibold flex items-center gap-1.5 py-2.5 px-4"
          >
            <HiOutlineArrowUpTray className="w-4 h-4 text-brand-primary" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Searching / Filters Section */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 justify-between border border-white/[0.06]">
        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by borrower name, phone, or loan ID..."
          className="flex-1 max-w-md w-full"
        />

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Payment status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="glass-input text-xs appearance-none py-2 px-4 pr-8 bg-[#0b0b23] border-white/[0.08]"
          >
            <option value="">All EMI Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="promised">Promised</option>
            <option value="paid_pending_verification">Paid Pending Verification</option>
          </select>

          {/* Call status filter */}
          <select
            value={callStatus}
            onChange={(e) => setCallStatus(e.target.value)}
            className="glass-input text-xs appearance-none py-2 px-4 pr-8 bg-[#0b0b23] border-white/[0.08]"
          >
            <option value="">All Call States</option>
            <option value="none">No Attempts</option>
            <option value="initiated">Initiating</option>
            <option value="ringing">Ringing</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="no-answer">No Answer</option>
            <option value="busy">Busy</option>
          </select>
        </div>
      </div>

      {/* Main List Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl">
        {loading ? (
          <div className="py-24 flex flex-col justify-center items-center gap-3">
            <LoadingSpinner size="large" />
            <p className="text-xs text-brand-textSecondary">Fetching collection database...</p>
          </div>
        ) : (
          <>
            <CustomerTable
              customers={customers}
              onEdit={(cust) => {
                setSelectedCustomer(cust);
                setIsFormOpen(true);
              }}
              onDelete={handleDeleteCustomer}
              onStartCall={handleStartCall}
              callingStates={callingStates}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-4 mt-6">
                <span className="text-xs text-brand-textSecondary">
                  Showing {(page - 1) * 10 + 1} to{' '}
                  {Math.min(page * 10, totalCount)} of {totalCount} borrowers
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-white/[0.08] text-brand-textSecondary hover:text-brand-textPrimary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.03] transition-colors"
                  >
                    <HiOutlineChevronLeft className="w-4.5 h-4.5" />
                  </button>
                  <span className="text-xs font-bold text-brand-textPrimary px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-white/[0.08] text-brand-textSecondary hover:text-brand-textPrimary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.03] transition-colors"
                  >
                    <HiOutlineChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCustomer(null);
        }}
        title={selectedCustomer ? 'Edit Borrower Details' : 'Create Manual Borrower Profile'}
      >
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedCustomer(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* CSV IMPORT MODAL */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Bulk Import Borrowers from CSV"
      >
        <CsvUpload
          onImport={handleImportCsv}
          onCancel={() => setIsUploadOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default Customers;
