
import React from 'react';
import { ChevronUpDownIcon } from '../icons/HeroIcons';

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
  value?: string | number;
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
  const baseStyles = "w-full pl-4 pr-10 py-3 bg-[var(--background-medium)] border text-[var(--text-primary)] rounded-2xl focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] focus:outline-none placeholder-[var(--text-secondary)] appearance-none transition-all duration-200";
  const errorStyles = error ? "border-red-500/50 focus:ring-red-500 focus:border-red-500" : "border-[var(--border-color)] hover:border-[var(--text-secondary)]";
  const placeholderColorStyle = !value && placeholder ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]";

  return (
    <div className={`${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>}
      <div className="relative">
        <select
          id={id}
          className={`${baseStyles} ${errorStyles} ${placeholderColorStyle} ${className}`}
          value={value || ""} 
          {...otherSelectProps}
        >
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-[var(--background-light)] text-[var(--text-primary)]">{option.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
          <ChevronUpDownIcon className="w-5 h-5" />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};