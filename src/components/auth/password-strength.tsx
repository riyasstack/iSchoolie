'use client';

import * as React from 'react';
import { assessPassword } from '@/lib/utils/password';
import { cn } from '@/lib/utils/cn';

const COLORS = ['bg-danger', 'bg-danger', 'bg-warn', 'bg-brand', 'bg-success'];

export function PasswordStrength({ value }: { value: string }) {
  const assessment = React.useMemo(() => assessPassword(value), [value]);
  if (!value) return null;

  return (
    <div className="mt-1.5 space-y-1.5" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index < Math.max(1, assessment.score) ? COLORS[assessment.score] : 'bg-line',
              )}
            />
          ))}
        </div>
        <span className="w-14 text-right text-2xs font-medium text-subtle">{assessment.label}</span>
      </div>
      {assessment.suggestions.length > 0 && (
        <ul className="space-y-0.5 text-2xs text-subtle">
          {assessment.suggestions.slice(0, 2).map((suggestion) => (
            <li key={suggestion}>• {suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
