
import React from 'react';

// Props specific to our Button component
interface ButtonOwnProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dashboardAction';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  colorClass?: string;
  hoverColorClass?: string;
  className?: string;
}

// Polymorphic component props
type ButtonProps<C extends React.ElementType> = ButtonOwnProps &
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonOwnProps> & {
    as?: C;
  };

export const Button = <C extends React.ElementType = 'button'>({
  as,
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  colorClass,
  hoverColorClass,
  ...props
}: ButtonProps<C>) => {
  const Component = as || 'button';
  
  const baseStyles = "font-semibold rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";

  let specificVariantStyles = "";
  switch (variant) {
    case 'primary':
      specificVariantStyles = "bg-[var(--accent-cyan)] text-black focus:ring-[var(--accent-cyan)]/30 shadow-[0_4px_14px_0_rgba(34,211,238,0.3)] hover:shadow-[0_6px_20px_0_rgba(34,211,238,0.4)]";
      break;
    case 'secondary':
      specificVariantStyles = "bg-[var(--background-light)] hover:bg-[#2a2a2a] text-[var(--text-primary)] focus:ring-[var(--border-color)] border border-[var(--border-color)]";
      break;
    case 'danger':
      specificVariantStyles = "bg-[var(--accent-red)] text-white focus:ring-[var(--accent-red)]/30 shadow-[0_4px_14px_0_rgba(248,113,113,0.3)] hover:shadow-[0_6px_20px_0_rgba(248,113,113,0.4)]";
      break;
    case 'ghost':
      specificVariantStyles = "bg-transparent hover:bg-[var(--background-light)] text-[var(--text-secondary)] hover:text-white focus:ring-[var(--border-color)] border border-[var(--border-color)]";
      break;
    case 'dashboardAction':
      specificVariantStyles = `${colorClass || 'bg-gray-700'} ${hoverColorClass || 'hover:bg-gray-600'} text-white focus:ring-gray-500`;
      break;
    default:
      specificVariantStyles = "bg-[var(--accent-cyan)] text-black focus:ring-[var(--accent-cyan)]/30";
  }

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3 text-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <Component
      className={`${baseStyles} ${specificVariantStyles} ${sizeStyles[size]} ${widthStyles} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </Component>
  );
};