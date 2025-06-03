import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { XMarkIcon } from '../icons/HeroIcons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancelar",
  confirmButtonVariant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[999] p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose} // Close on backdrop click
    >
      <Card 
        className="w-full max-w-md bg-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside card
        title={
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-white">{title}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full"
              aria-label="Fechar modal"
              disabled={isLoading}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        }
        titleClassName="border-b border-gray-700"
      >
        <div className="py-4 text-gray-300 text-sm md:text-base">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="flex justify-end space-x-3 pt-5 border-t border-gray-700">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={isLoading}
            aria-label={cancelButtonText}
          >
            {cancelButtonText}
          </Button>
          <Button 
            variant={confirmButtonVariant} 
            onClick={() => {
              if (!isLoading) {
                onConfirm();
              }
            }}
            disabled={isLoading}
            aria-label={confirmButtonText}
          >
            {isLoading ? `${confirmButtonText}...` : confirmButtonText}
          </Button>
        </div>
      </Card>
    </div>
  );
};
