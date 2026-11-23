import * as React from 'react';
import Link from 'next/link';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/utils/cn';

export function SocialEmptyState({
  icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: Array<{ href: string; label: string; variant?: 'primary' | 'secondary' | 'outline' }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          {icon}
        </span>
      )}
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-subtle">{description}</p>}
      {actions && actions.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={buttonClass(action.variant ?? 'secondary', 'sm')}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SocialPanel({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        'border-b border-line bg-surface sm:rounded-none',
        padded && 'px-4 py-4 sm:px-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[0.95rem] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}
      </div>
      {action}
    </div>
  );
}
