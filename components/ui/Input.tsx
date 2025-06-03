import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  description?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  id, 
  error, 
  className = '', 
  containerClassName = '', 
  description, 
  prefixIcon,
  suffixIcon,
  ...props 
}) => {
  const baseInputStyles = "w-full py-3 bg-[#2b2b2b] text-white rounded-md placeholder-gray-500 transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none";
  const paddingStyles = `${prefixIcon ? "pl-10" : "px-4"} ${suffixIcon ? "pr-10" : "px-4"}`;
  const errorBorderStyles = error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-600 hover:border-gray-500"; // Adjusted border for non-error state

  return (
    <div className={`relative ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      <div className="relative flex items-center">
        {prefixIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {prefixIcon}
          </div>
        )}
        <input
          id={id}
          className={`${baseInputStyles} ${paddingStyles} ${errorBorderStyles} ${className}`}
          {...props}
        />
        {suffixIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {suffixIcon}
          </div>
        )}
      </div>
      {description && !error && <p className="mt-2 text-xs text-gray-400">{description}</p>}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};