import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        align === 'center' ? 'items-center text-center' : 'items-start',
        action && 'md:flex-row md:items-end md:justify-between md:gap-10',
        className,
      )}
    >
      <div className={cn('max-w-3xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p
            className={cn(
              'home-eyebrow',
              tone === 'light' ? 'text-white/55' : 'text-[#7b8497]',
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            'home-h2 mt-4',
            tone === 'light' ? 'text-white' : 'text-navy',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'home-lead mt-5 max-w-2xl',
              tone === 'light' ? 'text-white/65' : 'text-[#5f6b80]',
              align === 'center' && 'mx-auto',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
