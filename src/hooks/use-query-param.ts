'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Static-export friendly route parameters.
 *
 * `output: 'export'` cannot prerender `/classes/[id]`, so entity ids travel in
 * the query string. This hook is the single place that reads them.
 */
export function useQueryParam(name: string): string {
  const params = useSearchParams();
  return params.get(name) ?? '';
}
