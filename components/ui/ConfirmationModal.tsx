
import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { XMarkIcon, ExclamationTriangleIcon } from '../icons/HeroIcons';

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
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md shadow-2xl animate-fadeInUp opacity-0"
        onClick={(e) => e.stopPropagation()}
        bodyClassName="p-0"
      >
        <div className="p-6 flex items-start space-x-4">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${confirmButtonVariant === 'danger' ? 'bg-red-900/50' : 'bg-cyan-900/50'} sm:mx-0 sm:h-10 sm:w-10`}>
                <ExclamationTriangleIcon className={`h-6 w-6 ${confirmButtonVariant === 'danger' ? 'text-red-400' : 'text-cyan-400'}`} aria-hidden="true" />
            </div>
            <div className="mt-0 text-left flex-1">
                <h3 className="text-xl font-semibold leading-6 text-white" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2 text-gray-300 text-sm md:text-base">
                  {typeof message === 'string' ? <p>{message}</p> : message}
                </div>
            </div>
        </div>
        <div className="bg-[var(--background-light)] px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 rounded-b-2xl">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={isLoading}
            aria-label={cancelButtonText}
          >
            {cancelButtonText}
          </Button>
          <Button 
            variant={confirmButtonVariant} 
            onClick={() => { if (!isLoading) onConfirm(); }}
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