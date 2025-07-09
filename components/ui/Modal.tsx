import React from 'react';
import { Card } from './Card';
import { XMarkIcon } from '../icons/HeroIcons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 transition-opacity duration-300 ease-in-out"
      aria-modal="true"
      role="dialog"
      onClick={onClose} 
    >
      <Card
        className={`w-full ${sizeClasses[size]} bg-[#1f1f1f] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()} 
        title={
          <div className="flex justify-between items-center text-white">
            <span className="text-xl font-semibold">{title}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full"
              aria-label="Fechar modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        }
        titleClassName="bg-[#2a2a2a] border-b border-gray-700 py-4 px-6"
      >
        <div className="overflow-y-auto px-6 py-4 flex-grow">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-700 bg-[#2a2a2a] flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </Card>
    </div>
  );
};