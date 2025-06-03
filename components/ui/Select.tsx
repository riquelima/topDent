import React from 'react';

// Define what a single option should look like
interface SelectOption {
  value: string | number;
  label: string;
}

// Update SelectProps:
// 1. Omit 'placeholder' from React.SelectHTMLAttributes as we handle it customly.
// 2. Add 'placeholder?: string' for our custom placeholder logic.
// 3. Explicitly define 'options' prop.
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
  placeholder?: string; // Custom placeholder text
}

export const Select: React.FC<SelectProps> = ({
  label,
  id,
  error,
  options,
  className = '',
  containerClassName = '',
  placeholder, // Destructure custom placeholder
  value, // Destructure value to control it
  ...otherSelectProps // Collect rest of the native select attributes
}) => {
  const baseStyles = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-md focus:ring-teal-500 focus:border-teal-500 focus:outline-none placeholder-gray-500 appearance-none transition-colors duration-200";
  const errorStyles = error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700";

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        <select
          id={id}
          className={`${baseStyles} ${errorStyles} ${className}`}
          value={value || ""} // Control the select's value; empty string for placeholder
          {...otherSelectProps} // Spread remaining valid HTMLSelectAttributes
        >
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
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
