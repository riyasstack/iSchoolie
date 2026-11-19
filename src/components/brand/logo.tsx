import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function Logo({
  size = 'md',
  showWordmark = true,
  href = '/',
  className,
  tone = 'default',
}: {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  href?: string | null;
  className?: string;
  tone?: 'default' | 'inverse';
}) {
  const markSize = { sm: 'h-8 w-8 text-sm', md: 'h-9 w-9 text-base', lg: 'h-11 w-11 text-lg' }[size];
  const wordSize = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' }[size];

  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'relative flex items-center justify-center rounded-xl font-bold text-white brand-gradient shadow-sm',
          markSize,
        )}
      >
        <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none" aria-hidden="true">
          <path d="M3 8.2 12 4l9 4.2-9 4.2-9-4.2Z" fill="currentColor" opacity="0.95" />
          <path d="M6.4 11.2v4.1c0 1.5 2.5 2.7 5.6 2.7s5.6-1.2 5.6-2.7v-4.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M21 8.6v5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      {showWordmark && (
        <span className={cn('font-semibold tracking-tight', wordSize, tone === 'inverse' ? 'text-white' : 'text-ink')}>
          iSchoolie
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      {content}
    </Link>
  );
}
