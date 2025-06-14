
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
  const baseInputStyles = "w-full py-3 bg-[#1f1f1f] text-white rounded-md placeholder-gray-500 transition-colors duration-150 ease-in-out focus:ring-2 focus:ring-[#00bcd4] focus:border-[#00bcd4] focus:outline-none";
  const paddingStyles = `${prefixIcon ? "pl-10" : "px-4"} ${suffixIcon ? "pr-10" : "px-4"}`;
  const errorBorderStyles = error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700 hover:border-gray-600";

  return (
    <div className={`relative ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[#b0b0b0] mb-1">{label}</label>} {/* Changed mb-2 to mb-1 */}
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
      {description && !error && <p className="mt-2 text-xs text-gray-500">{description}</p>}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};
