'use client';

import * as React from 'react';
import { PostCard } from '@/components/social/post-card';
import { Spinner } from '@/components/ui/spinner';
import type { FeedItem, Page } from '@/lib/social/types';

export function PostList({
  initialPage,
  kind,
  topic,
  endpoint,
  empty,
  storageKey,
}: {
  initialPage: Page<FeedItem>;
  kind?: 'following' | 'for-you' | 'explore';
  topic?: string;
  endpoint?: string;
  empty: React.ReactNode;
  storageKey?: string;
}) {
  const [items, setItems] = React.useState<FeedItem[]>(initialPage.items);
  const [cursor, setCursor] = React.useState<string | null>(initialPage.nextCursor);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems(initialPage.items);
    setCursor(initialPage.nextCursor);
  }, [initialPage]);

  React.useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    const key = `ischoolie:scroll:${storageKey}`;
    const saved = window.sessionStorage.getItem(key);
    if (saved) {
      window.requestAnimationFrame(() => window.scrollTo({ top: Number(saved), behavior: 'auto' }));
    }
    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        window.sessionStorage.setItem(key, String(window.scrollY));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [storageKey]);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ cursor });
      if (topic) params.set('topic', topic);
      const base = endpoint ?? `/api/social/feeds/${kind ?? 'for-you'}`;
      const separator = base.includes('?') ? '&' : '?';
      const response = await fetch(`${base}${separator}${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => null)) as
        | (Page<FeedItem> & { error?: string })
        | null;
      if (!response.ok || !payload) throw new Error(payload?.error ?? 'Could not load more posts.');
      setItems((current) => {
        const seen = new Set(current.map((item) => item.key));
        return [...current, ...payload.items.filter((item) => !seen.has(item.key))];
      });
      setCursor(payload.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load more posts.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div>
      {items.map((item) => (
        <PostCard
          key={item.key}
          post={item.post}
          repostedBy={item.repostedBy}
        />
      ))}

      {error && (
        <p role="alert" className="border-b border-line bg-danger/5 px-5 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {cursor && (
        <div className="flex justify-center border-b border-line bg-surface py-4">
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
