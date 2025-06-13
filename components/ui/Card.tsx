
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode; 
  titleClassName?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, titleClassName = '', onClick, hoverEffect = false }) => {
  const baseStyles = "bg-[#1a1a1a] shadow-lg rounded-lg overflow-hidden border border-gray-700/50"; // Darker card with subtle border
  const hoverStyles = hoverEffect ? "transition-all duration-150 ease-in-out hover:shadow-xl hover:border-gray-600/70" : ""; // Subtle hover
  const clickableStyles = onClick ? "cursor-pointer" : "";

  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className={`px-6 py-4 border-b border-gray-700/50 ${titleClassName}`}>
          {typeof title === 'string' ? (
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          ) : (
            <div className="text-xl font-semibold text-white">{title}</div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};