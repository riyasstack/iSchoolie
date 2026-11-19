'use client';

import { cn } from '@/lib/utils/cn';

export function ChipGroup({
  legend,
  options,
  selected,
  onToggle,
  max,
  error,
  hint,
  id,
}: {
  legend: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  max?: number;
  error?: string;
  hint?: string;
  id: string;
}) {
  return (
    <fieldset className="space-y-2" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="text-sm font-medium text-ink">
        {legend}
        <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-subtle">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          const atLimit = max !== undefined && !active && selected.length >= max;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              disabled={atLimit}
              onClick={() => onToggle(option)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                active
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-line bg-surface text-subtle hover:border-brand/40 hover:text-ink',
                atLimit && 'cursor-not-allowed opacity-50',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
