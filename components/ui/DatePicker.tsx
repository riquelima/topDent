
import React, { useState } from 'react';
import { Input } from './Input';
import { CalendarDaysIcon } from '../icons/HeroIcons';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  containerClassName?: string;
  description?: string;
  prefixIcon?: React.ReactNode;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
    label, 
    id, 
    error, 
    className, 
    containerClassName, 
    description, 
    prefixIcon,
    value,
    ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // The input type should be 'date' if it has a value or is focused.
  // Otherwise, it should be 'text' to allow for a custom placeholder.
  const inputType = isFocused || value ? 'date' : 'text';

  return (
    <Input
      type={inputType}
      onFocus={(e) => {
        setIsFocused(true);
        if (props.onFocus) props.onFocus(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        if (props.onBlur) props.onBlur(e);
      }}
      label={label}
      id={id}
      error={error}
      description={description}
      // Use provided icon, or default to CalendarDaysIcon. To remove icon, pass `prefixIcon={null}`.
      prefixIcon={prefixIcon !== undefined ? prefixIcon : <CalendarDaysIcon className="w-5 h-5 text-gray-400" />}
      // The placeholder will only be visible when the input type is 'text'.
      placeholder={inputType === 'text' ? 'dd/mm/AAAA' : ''}
      className={`${className} dark:[color-scheme:dark]`}
      containerClassName={containerClassName}
      value={value}
      {...props}
    />
  );
};