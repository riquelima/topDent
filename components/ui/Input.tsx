
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
  const baseInputStyles = "w-full py-3 bg-[var(--background-medium)] text-[var(--text-primary)] rounded-2xl placeholder-[var(--text-secondary)] transition-all duration-200 ease-in-out focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] focus:outline-none border";
  const paddingStyles = `${prefixIcon ? "pl-11" : "px-4"} ${suffixIcon ? "pr-11" : "px-4"}`;
  const errorBorderStyles = error ? "border-red-500/50 focus:ring-red-500 focus:border-red-500" : "border-[var(--border-color)] hover:border-[var(--text-secondary)]";

  return (
    <div className={`relative ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>}
      <div className="relative flex items-center">
        {prefixIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {prefixIcon}
          </div>
        )}
        <input
          id={id}
          className={`${baseInputStyles} ${paddingStyles} ${errorBorderStyles} ${className}`}
          {...props}
        />
        {suffixIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {suffixIcon}
          </div>
        )}
      </div>
      {description && !error && <p className="mt-2 text-xs text-gray-500">{description}</p>}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};