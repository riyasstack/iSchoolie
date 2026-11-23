'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warn/10 text-warn">
        <AlertTriangle aria-hidden="true" className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-subtle">
        The page could not finish loading. Your saved data is unaffected.
      </p>
      {error.digest && <p className="mt-1 font-mono text-2xs text-subtle">Reference: {error.digest}</p>}
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.assign('/feed')}>
          Go to feed
        </Button>
      </div>
    </div>
  );
}
