'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const Field = React.forwardRef<
  HTMLDivElement,
  {
    label: string;
    htmlFor: string;
    hint?: string;
    error?: string;
    required?: boolean;
    optional?: boolean;
    children: React.ReactNode;
    className?: string;
  }
>(function Field({ label, htmlFor, hint, error, required, optional, children, className }, ref) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div ref={ref} className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
        {optional && <span className="text-2xs text-subtle">Optional</span>}
      </div>
      {/* Children receive aria-describedby through cloneElement-free wiring:
          inputs in this design system accept id/aria props from the caller. */}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
            'aria-invalid': error ? true : undefined,
          })
        : children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-danger">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink placeholder:text-subtle/70',
        'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
        'disabled:cursor-not-allowed disabled:bg-mutedSurface disabled:text-subtle',
        'aria-[invalid=true]:border-danger',
        invalid ? 'border-danger' : 'border-line hover:border-brand/40',
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[110px] w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle/70',
        'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
        invalid ? 'border-danger' : 'border-line hover:border-brand/40',
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-11 w-full appearance-none rounded-xl border bg-surface px-3.5 pr-9 text-sm text-ink',
        'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27%23606e85%27%3E%3Cpath%20d%3D%27M5.5%207.5%2010%2012l4.5-4.5%27%20stroke%3D%27%23606e85%27%20stroke-width%3D%271.5%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E")] bg-[length:18px] bg-[right_12px_center] bg-no-repeat',
        'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
        invalid ? 'border-danger' : 'border-line hover:border-brand/40',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Checkbox({
  id,
  label,
  description,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: React.ReactNode;
  description?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded border-line text-brand accent-[rgb(var(--brand))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-invalid={error ? true : undefined}
          aria-describedby={description ? `${id}-description` : undefined}
          {...props}
        />
        <div className="min-w-0">
          <label htmlFor={id} className="block text-sm text-ink">
            {label}
          </label>
          {description && (
            <p id={`${id}-description`} className="mt-0.5 text-xs text-subtle">
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="pl-7.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordInput({
  id,
  invalid,
  autoComplete,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        invalid={invalid}
        autoComplete={autoComplete}
        className="pr-12"
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-subtle transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
            <path d="M6.7 6.9C4.6 8.3 3 10.4 2.2 12c1.2 2.4 4.6 6 9.8 6 1.7 0 3.2-.4 4.5-1.1M9.9 5.3A9.6 9.6 0 0112 5c5.2 0 8.6 3.6 9.8 7a13 13 0 01-2.3 3.6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M2.2 12S5.6 5 12 5s9.8 7 9.8 7-3.4 7-9.8 7-9.8-7-9.8-7z" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
        )}
      </button>
    </div>
  );
}
