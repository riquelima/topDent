
import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
  placeholder?: string; 
  value?: string | number; // Ensure value is part of props for controlled component
}

export const Select: React.FC<SelectProps> = ({
  label,
  id,
  error,
  options,
  className = '',
  containerClassName = '',
  placeholder,
  value, 
  ...otherSelectProps
}) => {
  const baseStyles = "w-full px-4 py-2.5 bg-[#1f1f1f] border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-[#00bcd4] focus:border-[#00bcd4] focus:outline-none placeholder-gray-500 appearance-none transition-colors duration-150";
  const errorStyles = error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700 hover:border-gray-600";
  const placeholderColorStyle = !value && placeholder ? "text-gray-500" : "text-white";


  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[#b0b0b0] mb-1">{label}</label>}
      <div className="relative">
        <select
          id={id}
          className={`${baseStyles} ${errorStyles} ${placeholderColorStyle} ${className}`}
          value={value || ""} 
          {...otherSelectProps}
        >
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-[#1f1f1f] text-white">{option.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};