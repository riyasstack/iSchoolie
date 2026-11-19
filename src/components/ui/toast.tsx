'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ToastInput {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = React.createContext<{ toast: (input: ToastInput) => void } | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const toast = React.useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current.slice(-3), { ...input, id }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 5500);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
            aria-live="polite"
            aria-atomic="false"
          >
            {items.map((item) => (
              <div
                key={item.id}
                role="status"
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border p-3.5 shadow-lift',
                  item.variant === 'danger'
                    ? 'border-danger/30 bg-surface'
                    : item.variant === 'success'
                      ? 'border-success/30 bg-surface'
                      : item.variant === 'warning'
                        ? 'border-warn/30 bg-surface'
                        : 'border-line bg-surface',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-xs text-subtle">{item.description}</p>}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  className="rounded-md p-1 text-subtle transition hover:bg-mutedSurface hover:text-ink"
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
