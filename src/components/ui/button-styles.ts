import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-fg shadow-sm hover:brightness-110 active:brightness-95 disabled:bg-brand/50',
  secondary: 'bg-mutedSurface text-ink border border-line hover:bg-surface hover:shadow-sm',
  outline: 'border border-line bg-transparent text-ink hover:bg-mutedSurface',
  ghost: 'bg-transparent text-ink hover:bg-mutedSurface',
  danger: 'bg-danger text-white shadow-sm hover:brightness-110',
  link: 'bg-transparent text-brand underline-offset-4 hover:underline p-0 h-auto',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-5 text-[0.95rem] rounded-xl gap-2',
};

/**
 * Pure class builder. It lives outside `button.tsx` because that module is a
 * client boundary: calling a function exported from a `'use client'` module
 * during server prerender throws.
 */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    'inline-flex select-none items-center justify-center font-medium transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    variant === 'link' ? '' : SIZES[size],
    className,
  );
}
