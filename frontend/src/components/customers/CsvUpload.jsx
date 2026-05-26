import React, { useState, useRef } from 'react';
import { HiOutlineCloudArrowUp, HiOutlineDocumentText, HiXMark } from 'react-icons/hi2';

const CsvUpload = ({ onImport, onCancel, isSubmitting }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV (.csv) file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to import.');
      return;
    }
    onImport(file);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? 'border-brand-primary bg-brand-primary/5 shadow-inner'
              : 'border-white/[0.08] hover:border-brand-primary/50 hover:bg-white/[0.01]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleChange}
            accept=".csv"
            className="hidden"
            disabled={isSubmitting}
          />
          <div className="p-4 rounded-full bg-white/[0.03] text-brand-primary mb-4 transition-transform duration-300 hover:scale-110">
            <HiOutlineCloudArrowUp className="w-10 h-10 animate-bounce" />
          </div>
          <p className="text-sm font-semibold text-brand-textPrimary text-center">
            Drag and drop your borrower CSV file here
          </p>
          <p className="text-xs text-brand-textSecondary mt-1 text-center">
            or click to browse local files (max. 5MB)
          </p>
        </div>
      ) : (
        /* Selected File Card */
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <HiOutlineDocumentText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-textPrimary truncate max-w-[240px]">
                {file.name}
              </p>
              <p className="text-xs text-brand-textSecondary mt-0.5">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveFile}
            className="p-1.5 rounded-lg text-brand-textSecondary hover:text-red-400 hover:bg-red-500/5 transition-colors"
            title="Remove file"
            disabled={isSubmitting}
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* CSV template guidelines */}
      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
        <h4 className="text-xs font-semibold text-brand-textPrimary uppercase tracking-wider mb-2">
          Required CSV Headers Format:
        </h4>
        <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono mt-3">
          <div className="bg-white/[0.03] p-1.5 rounded text-brand-textPrimary border border-white/[0.06]">name</div>
          <div className="bg-white/[0.03] p-1.5 rounded text-brand-textPrimary border border-white/[0.06]">phone</div>
          <div className="bg-white/[0.03] p-1.5 rounded text-brand-textPrimary border border-white/[0.06]">loanId</div>
          <div className="bg-white/[0.03] p-1.5 rounded text-brand-textPrimary border border-white/[0.06]">dueAmount</div>
          <div className="bg-white/[0.03] p-1.5 rounded text-brand-textPrimary border border-white/[0.06]">dueDate</div>
        </div>
      </div>

      {error && <p className="text-xs text-red-400 font-medium text-center">{error}</p>}

      {/* Form Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-sm px-5 py-2.5"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          onClick={handleUploadSubmit}
          className="btn-primary text-sm px-6 py-2.5"
          disabled={!file || isSubmitting}
        >
          {isSubmitting ? 'Importing...' : 'Upload & Import'}
        </button>
      </div>
    </div>
  );
};

export default CsvUpload;
