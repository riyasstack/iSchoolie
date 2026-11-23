'use client';

import * as React from 'react';
import { PersonCard } from '@/components/social/person-card';
import { Spinner } from '@/components/ui/spinner';
import type { Page, PersonSummary } from '@/lib/social/types';

export function PeopleList({
  initialPage,
  endpoint,
  empty,
  compact = false,
}: {
  initialPage: Page<PersonSummary>;
  endpoint: string;
  empty: React.ReactNode;
  compact?: boolean;
}) {
  const [items, setItems] = React.useState(initialPage.items);
  const [cursor, setCursor] = React.useState(initialPage.nextCursor);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await fetch(`${endpoint}${separator}cursor=${encodeURIComponent(cursor)}`, {
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => null)) as
        | (Page<PersonSummary> & { restricted?: boolean; error?: string })
        | null;
      if (!response.ok || !payload) throw new Error(payload?.error ?? 'Could not load more people.');
      if (payload.restricted) throw new Error('This list is not available.');
      setItems((current) => {
        const seen = new Set(current.map((person) => person.id));
        return [...current, ...payload.items.filter((person) => !seen.has(person.id))];
      });
      setCursor(payload.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load more people.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) return <>{empty}</>;

  return (
    <div>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        {items.map((person) => (
          <PersonCard key={person.id} person={person} compact={compact} />
        ))}
      </div>
      {error && (
        <p role="alert" className="px-5 pb-3 text-sm text-danger">
          {error}
        </p>
      )}
      {cursor && (
        <div className="flex justify-center border-t border-line bg-surface py-4">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand disabled:opacity-60"
          >
            {loading ? <Spinner className="h-4 w-4" /> : null}
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
