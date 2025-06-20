
import React from 'react';
import { Input } from './Input'; // Assuming Input.tsx is in the same directory

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  containerClassName?: string;
  description?: string; // Added description prop
  prefixIcon?: React.ReactNode; // Added prefixIcon prop
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, id, error, className, containerClassName, description, prefixIcon, ...props }) => {
  return (
    <Input
      type="date"
      label={label}
      id={id}
      error={error}
      description={description} // Pass description to Input
      prefixIcon={prefixIcon} // Pass prefixIcon to Input
      // Add specific styling for date input appearance if needed, though Tailwind's default styling for inputs might be sufficient
      // For dark theme, ensure the calendar icon is visible. This is browser-dependent.
      // Tailwind custom styles for date picker icon color:
      // className={`... your-other-classes ... dark:[color-scheme:dark]`} might help in some browsers
      className={`${className} dark:[color-scheme:dark]`} // This helps make the calendar icon adapt to dark scheme
      containerClassName={containerClassName}
      {...props}
    />
  );
};