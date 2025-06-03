
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  description?: string; // Added description prop
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', containerClassName = '', description, ...props }) => {
  const baseStyles = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-md focus:ring-teal-500 focus:border-teal-500 focus:outline-none placeholder-gray-500 transition-colors duration-200";
  const errorStyles = error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700";

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <input
        id={id}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
      {error && <p className={`mt-1 text-xs text-red-400 ${description ? 'mt-0.5' : 'mt-1'}`}>{error}</p>}
    </div>
  );
};