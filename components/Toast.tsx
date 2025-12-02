import React, { useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 animate-fade-in-down">
      <div className={`flex items-center px-6 py-3.5 rounded-full shadow-2xl border backdrop-blur-md ${
          type === 'success' 
            ? 'bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-900 border-gray-800 dark:border-gray-100' 
            : 'bg-rose-500/95 text-white border-rose-600'
      }`}>
        {type === 'success' ? <Check size={18} className="mr-2.5 stroke-[3]" /> : <AlertCircle size={18} className="mr-2.5" />}
        <span className="font-bold text-sm tracking-wide">{message}</span>
      </div>
    </div>
  );
};