'use client';

import * as React from 'react';

export interface AsyncState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T;
  error: string | null;
  reload: () => void;
  setData: React.Dispatch<React.SetStateAction<T>>;
}

/**
 * Standard loading / error / empty-state driver for page data.
 * Keeps every screen honest: no page renders "empty" while still loading.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList,
  initial: T,
): AsyncState<T> {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [data, setData] = React.useState<T>(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [nonce, setNonce] = React.useState(0);
  const loaderRef = React.useRef(loader);
  loaderRef.current = loader;

  React.useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    loaderRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Something went wrong.');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = React.useCallback(() => setNonce((value) => value + 1), []);

  return { status, data, error, reload, setData };
}
