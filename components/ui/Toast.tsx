import React, { useEffect, useState } from 'react';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon, InformationCircleIcon } from '../icons/HeroIcons';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: (id: string) => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only set a timeout if the duration is greater than 0
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Call onClose after the fade-out animation would complete
        setTimeout(() => onClose(id), 300); // Adjust timing based on animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const baseStyle = "fixed bottom-5 right-5 md:bottom-10 md:right-10 p-4 rounded-lg shadow-xl text-white transition-all duration-300 ease-in-out transform";
  const typeStyles = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-amber-500",
    info: "bg-sky-600",
  };
  const visibilityStyles = isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10";

  if (!isVisible && duration > 0) { // Keep rendering during fade-out if auto-dismissing
      // To allow fade-out, we need to render it even when isVisible is false for a short period
      // The parent ToastProvider will remove it after onClose is called
  } else if (!isVisible && duration === 0) { // If not auto-dismissing, hide immediately on explicit close
      return null;
  }


  return (
    <div className={`${baseStyle} ${typeStyles[type]} ${visibilityStyles} z-[100]`}>
      <div className="flex items-center">
        {type === 'success' && <CheckIcon className="w-6 h-6 mr-3" />}
        {type === 'error' && (
            <svg className="w-6 h-6 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        )}
        {type === 'warning' && <ExclamationTriangleIcon className="w-6 h-6 mr-3" />}
        {type === 'info' && <InformationCircleIcon className="w-6 h-6 mr-3" />}
        <span className="flex-grow text-sm md:text-base">{message}</span>
        <button 
          onClick={() => { setIsVisible(false); setTimeout(() => onClose(id), 300);}} 
          className="ml-4 p-1 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors"
          aria-label="Fechar notificação"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
