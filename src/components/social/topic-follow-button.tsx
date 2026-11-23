'use client';

import * as React from 'react';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function TopicFollowButton({
  slug,
  initialFollowing,
  initialCount,
  size = 'sm',
}: {
  slug: string;
  initialFollowing: boolean;
  initialCount: number;
  size?: 'sm' | 'md';
}) {
  const [following, setFollowing] = React.useState(initialFollowing);
  const [count, setCount] = React.useState(initialCount);
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    setCount((value) => Math.max(0, value + (next ? 1 : -1)));
    try {
      const response = await fetch(`/api/social/topics/${encodeURIComponent(slug)}/follow`, {
        method: next ? 'POST' : 'DELETE',
      });
      const payload = (await response.json().catch(() => null)) as
        | { following?: boolean; followerCount?: number; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Could not update this topic.');
      if (typeof payload?.following === 'boolean') setFollowing(payload.following);
      if (typeof payload?.followerCount === 'number') setCount(payload.followerCount);
    } catch {
      setFollowing(!next);
      setCount((value) => Math.max(0, value + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={following}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold transition disabled:opacity-60',
        size === 'sm' ? 'h-8 px-3 text-2xs' : 'h-9 px-4 text-xs',
        following
          ? 'border-line bg-surface text-ink hover:border-danger/40 hover:text-danger'
          : 'border-brand bg-brand text-white hover:bg-brand/90',
      )}
    >
      {following ? (
        <Check className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Plus className="h-3 w-3" aria-hidden="true" />
      )}
      {following ? 'Following' : 'Follow'}
      <span className="ml-0.5 tabular-nums opacity-70">{count}</span>
    </button>
  );
}
