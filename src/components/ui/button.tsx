'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Spinner } from '@/components/ui/spinner';
import {
  buttonClass,
  type ButtonSize as Size,
  type ButtonVariant as Variant,
} from '@/components/ui/button-styles';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    fullWidth,
    icon,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={buttonClass(variant, size, cn(fullWidth && 'w-full', className))}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="h-4 w-4" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
});
