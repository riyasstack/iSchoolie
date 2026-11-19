import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { buttonClass } from '@/components/ui/button-styles';
import { initials } from '@/lib/utils/dates';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-subtle">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={buttonClass('secondary', 'sm', 'mt-4')}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className={buttonClass('secondary', 'sm', 'mt-4')}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn('rounded-full border border-line object-cover', sizes[size])}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand',
        sizes[size],
      )}
    >
      {initials(name)}
    </span>
  );
}

export function StatusDot({ tone }: { tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const tones = {
    success: 'bg-success',
    warning: 'bg-warn',
    danger: 'bg-danger',
    neutral: 'bg-subtle',
  } as const;
  return <span aria-hidden="true" className={cn('inline-block h-2 w-2 rounded-full', tones[tone])} />;
}
