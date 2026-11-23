import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      {/* Compact Top-Center Toast Notifications */}
      <div className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-1.5 pointer-events-none w-auto max-w-[92vw] sm:max-w-md px-3">
        {toasts.map((toast) => {
          let bg = 'bg-slate-900/95 text-slate-100 border-slate-700/60 shadow-md shadow-slate-950/20';
          let icon = <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-emerald-950/95 text-emerald-100 border-emerald-600/60 shadow-md shadow-emerald-950/30';
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-950/95 text-rose-100 border-rose-600/60 shadow-md shadow-rose-950/30';
            icon = <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-950/95 text-amber-100 border-amber-600/60 shadow-md shadow-amber-950/30';
            icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full sm:rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 text-xs font-semibold ${bg}`}
            >
              {icon}
              <div className="leading-tight truncate sm:whitespace-normal max-w-xs">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity p-0.5 ml-1 rounded-full hover:bg-white/10 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
