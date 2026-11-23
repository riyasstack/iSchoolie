'use client';

import * as React from 'react';
import { PostCard } from '@/components/social/post-card';
import { Spinner } from '@/components/ui/spinner';
import type { PostView } from '@/lib/social/types';

export function ThreadReplies({
  postId,
  initialReplies,
  hasMore,
}: {
  postId: string;
  initialReplies: PostView[];
  hasMore: boolean;
}) {
  const [replies, setReplies] = React.useState(initialReplies);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMoreState, setHasMoreState] = React.useState(hasMore);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (cursor) params.set('cursor', cursor);
      const response = await fetch(`/api/social/posts/${postId}/replies?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => null)) as
        | { items?: PostView[]; nextCursor?: string | null; error?: string }
        | null;
      if (!response.ok || !payload?.items) {
        throw new Error(payload?.error ?? 'Could not load more replies.');
      }
      setReplies((current) => {
        const seen = new Set(current.map((reply) => reply.id));
        return [...current, ...payload.items!.filter((reply) => !seen.has(reply.id))];
      });
      setCursor(payload.nextCursor ?? null);
      setHasMoreState(Boolean(payload.nextCursor));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load more replies.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {replies.map((reply) => (
        <div key={reply.id}>
          <PostCard post={reply} compact />
          {reply.children && reply.children.length > 0 && (
            <div className="ml-6 border-l border-line pl-2 sm:ml-10">
              {reply.children.map((child) => (
                <PostCard key={child.id} post={child} compact />
              ))}
            </div>
          )}
        </div>
      ))}
      {error && (
        <p role="alert" className="px-4 py-3 text-sm text-danger sm:px-5">
          {error}
        </p>
      )}
      {hasMoreState && (
        <div className="flex justify-center border-t border-line py-4">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-brand/40 hover:text-brand disabled:opacity-60"
          >
            {loading ? <Spinner className="h-4 w-4" /> : null}
            {loading ? 'Loading…' : 'Load more replies'}
          </button>
        </div>
      )}
    </div>
  );
}
