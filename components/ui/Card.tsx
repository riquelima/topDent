
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode; // Changed from string to React.ReactNode
  titleClassName?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, titleClassName = '', onClick, hoverEffect = false }) => {
  const baseStyles = "bg-gray-800 shadow-xl rounded-lg overflow-hidden";
  const hoverStyles = hoverEffect ? "transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.02] hover:bg-gray-700" : "";
  const clickableStyles = onClick ? "cursor-pointer" : "";

  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className={`px-6 py-4 border-b border-gray-700 ${titleClassName}`}>
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
