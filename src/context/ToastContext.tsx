import React, { useState, type ReactNode } from 'react';
import type { Toast } from '../types/types';


export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    
  };

  const removeToast = (id: string) => {
    
  };

  return (
   <>

   </>
  );
};

export const useToast = () => {
  
};