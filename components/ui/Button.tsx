
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dashboardAction'; // Added 'dashboardAction' for specific use
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  colorClass?: string; // For dashboardAction variant
  hoverColorClass?: string; // For dashboardAction variant
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  colorClass, // Destructure for dashboardAction
  hoverColorClass, // Destructure for dashboardAction
  ...props
}) => {
  const baseStyles = "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0e0e0e] transition-all duration-150 ease-in-out transform hover:scale-[1.02] flex items-center justify-center shadow-md";

  let specificVariantStyles = "";
  switch (variant) {
    case 'primary':
      specificVariantStyles = "bg-[#00bcd4] hover:bg-[#00a5b8] text-black focus:ring-[#00bcd4]"; // Teal/Cyan with black text
      break;
    case 'secondary':
      specificVariantStyles = "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500";
      break;
    case 'danger':
      specificVariantStyles = "bg-[#f44336] hover:bg-[#d32f2f] text-white focus:ring-[#f44336]"; // Red
      break;
    case 'ghost':
      specificVariantStyles = "bg-transparent hover:bg-[#1f1f1f] text-[#b0b0b0] hover:text-white focus:ring-gray-500 border border-gray-600 hover:border-gray-500";
      break;
    case 'dashboardAction':
      specificVariantStyles = `${colorClass || 'bg-gray-700'} ${hoverColorClass || 'hover:bg-gray-600'} text-white focus:ring-gray-500`;
      break;
    default:
      specificVariantStyles = "bg-[#00bcd4] hover:bg-[#00a5b8] text-black focus:ring-[#00bcd4]";
  }

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${specificVariantStyles} ${sizeStyles[size]} ${widthStyles} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};