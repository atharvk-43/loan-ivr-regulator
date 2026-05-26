import React, { useState, useEffect } from 'react';

const CustomerForm = ({ customer, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    loanId: '',
    dueAmount: '',
    dueDate: '',
    paymentStatus: 'pending',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        loanId: customer.loanId || '',
        dueAmount: customer.dueAmount || '',
        dueDate: customer.dueDate ? customer.dueDate.split('T')[0] : '',
        paymentStatus: customer.paymentStatus || 'pending',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        loanId: '',
        dueAmount: '',
        dueDate: '',
        paymentStatus: 'pending',
      });
    }
    setErrors({});
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    // E.164 phone validation pattern
    const phonePattern = /^\+?[1-9]\d{6,14}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phonePattern.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Invalid phone number format (e.g., +15551234567)';
    }

    if (!formData.loanId.trim()) newErrors.loanId = 'Loan ID is required';
    
    if (!formData.dueAmount) {
      newErrors.dueAmount = 'Due amount is required';
    } else if (isNaN(Number(formData.dueAmount)) || Number(formData.dueAmount) < 0) {
      newErrors.dueAmount = 'Due amount must be a positive number';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      dueAmount: Number(formData.dueAmount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Borrower Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-brand-textSecondary">Borrower Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. John Doe"
          className="glass-input text-sm"
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-[11px] text-red-400 font-medium">{errors.name}</p>}
      </div>

      {/* Phone Number */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-brand-textSecondary">Phone Number (E.164 format)</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. +15551234567"
          className="glass-input text-sm"
          disabled={isSubmitting}
        />
        {errors.phone && <p className="text-[11px] text-red-400 font-medium">{errors.phone}</p>}
      </div>

      {/* Loan ID & Due Amount side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-textSecondary">Loan ID</label>
          <input
            type="text"
            name="loanId"
            value={formData.loanId}
            onChange={handleChange}
            placeholder="e.g. LN-2026-0001"
            className="glass-input text-sm uppercase"
            disabled={isSubmitting}
          />
          {errors.loanId && <p className="text-[11px] text-red-400 font-medium">{errors.loanId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-textSecondary">EMI Due Amount</label>
          <input
            type="number"
            name="dueAmount"
            step="0.01"
            value={formData.dueAmount}
            onChange={handleChange}
            placeholder="e.g. 350.00"
            className="glass-input text-sm"
            disabled={isSubmitting}
          />
          {errors.dueAmount && <p className="text-[11px] text-red-400 font-medium">{errors.dueAmount}</p>}
        </div>
      </div>

      {/* Due Date & Payment Status side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-textSecondary">Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="glass-input text-sm"
            disabled={isSubmitting}
          />
          {errors.dueDate && <p className="text-[11px] text-red-400 font-medium">{errors.dueDate}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-textSecondary">Payment Status</label>
          <select
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleChange}
            className="glass-input text-sm appearance-none bg-[#0e0e26]"
            disabled={isSubmitting}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="promised">Promised</option>
            <option value="paid_pending_verification">Paid (Pending Verification)</option>
          </select>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08] mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-sm px-5 py-2.5"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : customer ? 'Update Borrower' : 'Create Borrower'}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
