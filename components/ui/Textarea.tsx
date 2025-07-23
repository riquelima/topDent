
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
  const baseStyles = "w-full px-4 py-3 bg-[var(--background-medium)] border text-[var(--text-primary)] rounded-2xl focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] focus:outline-none placeholder-[var(--text-secondary)] transition-all duration-200";
  const errorStyles = error ? "border-red-500/50 focus:ring-red-500 focus:border-red-500" : "border-[var(--border-color)] hover:border-[var(--text-secondary)]";
  
  return (
    <div className={`${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>}
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