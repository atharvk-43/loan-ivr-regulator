import React from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';

const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <HiMagnifyingGlass className="absolute left-4 w-5 h-5 text-brand-textSecondary pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass-input pl-11 pr-4 py-2.5 w-full text-sm"
      />
    </div>
  );
};

export default SearchBar;
