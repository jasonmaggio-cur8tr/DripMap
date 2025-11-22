
import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };

  const colors = {
    success: 'bg-coffee-900 text-volt-400 border-volt-400',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-white text-coffee-900 border-coffee-200'
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-l-4 min-w-[300px] animate-in slide-in-from-right-full duration-300 ${colors[type]}`}>
      <i className={`fas ${icons[type]} text-lg`}></i>
      <p className="font-medium text-sm">{message}</p>
      <button onClick={() => onClose(id)} className="ml-auto opacity-50 hover:opacity-100 transition-opacity">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Toast;
