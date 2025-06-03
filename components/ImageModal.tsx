import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close modal on backdrop click
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 p-2 rounded-lg shadow-xl max-w-3xl max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside the image container
      >
        <img 
          src={imageUrl} 
          alt="Visualização do anexo" 
          className="object-contain max-w-full max-h-[85vh] rounded" 
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-700 text-white rounded-full p-1.5 hover:bg-gray-600 transition-colors"
          aria-label="Fechar modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
