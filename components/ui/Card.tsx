
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode; 
  titleClassName?: string;
  bodyClassName?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, titleClassName = '', bodyClassName = '', onClick, hoverEffect = false }) => {
  const baseStyles = "bg-[var(--background-medium)] shadow-lg rounded-2xl overflow-hidden border border-[var(--border-color)]";
  const hoverStyles = hoverEffect ? "transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-[var(--text-secondary)] hover:-translate-y-1" : "";
  const clickableStyles = onClick ? "cursor-pointer" : "";

  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className={`px-6 py-4 border-b border-[var(--border-color)] ${titleClassName}`}>
          {typeof title === 'string' ? (
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          ) : (
            <div className="text-xl font-semibold text-white">{title}</div>
          )}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};