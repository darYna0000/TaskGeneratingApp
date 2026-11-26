import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-14 right-4 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 flex items-center space-x-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
      {type === 'info' && <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />}
      {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
      <span className="text-xs font-medium text-slate-100">{message}</span>
    </div>
  );
};
