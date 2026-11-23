'use client';

import { cn } from '@/lib/utils/cn';

export function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  badge,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3.5 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={id} className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
          {label}
          {badge && (
            <span className="rounded-full bg-mutedSurface px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-subtle">
              {badge}
            </span>
          )}
        </label>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-subtle">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition',
          checked ? 'border-brand bg-brand' : 'border-line bg-mutedSurface',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
