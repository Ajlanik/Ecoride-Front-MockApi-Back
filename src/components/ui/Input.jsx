import React from 'react';

const Input = ({ label, type = "text", error, className = "", ...props }) => {
  return (
    <div className="form-control w-full">
      {label && (
        <label className="label pt-0 pb-2 justify-start"> 
          <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">
            {label}
          </span>
        </label>
      )}
      <input
        type={type}
        className={`input input-bordered w-full px-4 h-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${error ? 'input-error' : 'border-gray-300'} ${className}`}
        {...props}
      />
      {error && <span className="text-error text-xs mt-1 text-left">{error}</span>}
    </div>
  );
};

export default Input;