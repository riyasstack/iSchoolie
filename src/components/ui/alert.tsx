import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const STYLES: Record<AlertVariant, { wrap: string; icon: React.ReactNode }> = {
  info: {
    wrap: 'border-brand/25 bg-brand/5 text-ink',
    icon: <Info aria-hidden="true" className="h-4.5 w-4.5 text-brand" />,
  },
  success: {
    wrap: 'border-success/30 bg-success/5 text-ink',
    icon: <CheckCircle2 aria-hidden="true" className="h-4.5 w-4.5 text-success" />,
  },
  warning: {
    wrap: 'border-warn/30 bg-warn/5 text-ink',
    icon: <AlertTriangle aria-hidden="true" className="h-4.5 w-4.5 text-warn" />,
  },
  danger: {
    wrap: 'border-danger/30 bg-danger/5 text-ink',
    icon: <XCircle aria-hidden="true" className="h-4.5 w-4.5 text-danger" />,
  },
  neutral: {
    wrap: 'border-line bg-mutedSurface text-ink',
    icon: <ShieldAlert aria-hidden="true" className="h-4.5 w-4.5 text-subtle" />,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  role = 'status',
  action,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  role?: 'status' | 'alert';
  action?: React.ReactNode;
}) {
  const style = STYLES[variant];
  return (
    <div
      role={role}
      className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-sm', style.wrap, className)}
    >
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-sm text-subtle')}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-mutedSurface text-subtle border-line',
    brand: 'bg-brand/10 text-brand border-brand/20',
    success: 'bg-success/10 text-success border-success/25',
    warning: 'bg-warn/10 text-warn border-warn/25',
    danger: 'bg-danger/10 text-danger border-danger/25',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
