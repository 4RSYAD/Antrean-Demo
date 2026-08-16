import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { ToastNotification } from '../types.ts';

interface ToastProps {
  toast: ToastNotification | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-500 text-slate-950 border-emerald-400';
      case 'warning':
        return 'bg-amber-400 text-slate-950 border-amber-300';
      case 'error':
        return 'bg-rose-500 text-white border-rose-400';
      default:
        return 'bg-slate-900 text-white border-slate-700';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-950" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />;
      case 'error':
        return <XCircle className="w-4 h-4 shrink-0 text-white" />;
      default:
        return <Info className="w-4 h-4 shrink-0 text-emerald-400" />;
    }
  };

  return (
    <div
      id="app-toast"
      className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center space-x-2.5 transition-all transform ease-out duration-300 no-print ${getStyle()}`}
    >
      {getIcon()}
      <span className="leading-snug">{toast.msg}</span>
    </div>
  );
};
