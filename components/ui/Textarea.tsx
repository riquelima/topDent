
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
  const baseStyles = "w-full px-4 py-2.5 bg-[#1f1f1f] border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-[#00bcd4] focus:border-[#00bcd4] focus:outline-none placeholder-gray-500 transition-colors duration-150";
  const errorStyles = error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700 hover:border-gray-600";
  
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[#b0b0b0] mb-1">{label}</label>}
      <textarea
        id={id}
        className={`${baseStyles} ${errorStyles} ${className}`}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};