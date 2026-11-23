'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Clock, Lock, Plus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { FollowState } from '@/lib/social/types';

export function FollowButton({
  targetId,
  initialState,
  canFollow,
  size = 'sm',
  className,
  onChange,
}: {
  targetId: string;
  initialState: FollowState;
  canFollow: boolean;
  size?: 'sm' | 'md';
  className?: string;
  onChange?: (state: FollowState) => void;
}) {
  const router = useRouter();
  const [state, setState] = React.useState<FollowState>(initialState);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hover, setHover] = React.useState(false);

  React.useEffect(() => setState(initialState), [initialState]);

  const apply = (next: FollowState) => {
    setState(next);
    onChange?.(next);
  };

  async function mutate(nextFollow: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const previous = state;
    apply(nextFollow ? (canFollow ? 'following' : 'pending') : 'not_following');

    try {
      const response = await fetch('/api/social/follows', {
        method: nextFollow ? 'POST' : 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { state?: FollowState; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Could not update this connection.');
      if (payload?.state) apply(payload.state);
      router.refresh();
    } catch (cause) {
      apply(previous);
      setError(cause instanceof Error ? cause.message : 'Could not update this connection.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'self') return null;

  if (state === 'requested_by') {
    return (
      <Link
        href="/follow-requests"
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full border border-brand/40 bg-brand/5 px-3.5 text-xs font-semibold text-brand transition hover:bg-brand/10',
          size === 'md' ? 'h-10' : 'h-8',
          className,
        )}
      >
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        Respond
      </Link>
    );
  }

  if (state === 'blocked' || state === 'unavailable') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-mutedSurface px-3.5 text-xs font-medium text-subtle',
          size === 'md' ? 'h-10' : 'h-8',
          className,
        )}
        title={state === 'blocked' ? 'This connection is not permitted.' : 'Unavailable'}
      >
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        Restricted
      </span>
    );
  }

  if (!canFollow && state === 'not_following') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-line bg-mutedSurface px-3.5 text-xs font-medium text-subtle',
          size === 'md' ? 'h-10' : 'h-8',
          className,
        )}
      >
        Unavailable
      </span>
    );
  }

  const following = state === 'following';
  const pending = state === 'pending';

  return (
    <span className={cn('inline-flex flex-col items-end gap-1', className)}>
      <Button
        type="button"
        size={size}
        variant={following || pending ? 'outline' : 'primary'}
        loading={busy}
        aria-label={
          following
            ? `Unfollow @${targetId}`
            : pending
              ? 'Cancel follow request'
              : 'Follow this account'
        }
        aria-pressed={following || pending}
        className={cn(
          'min-w-[92px] rounded-full',
          following && hover && 'border-danger/40 bg-danger/5 text-danger',
        )}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={() => void mutate(!(following || pending))}
      >
        {following ? (
          hover ? (
            'Unfollow'
          ) : (
            <>
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" /> Following
            </>
          )
        ) : pending ? (
          <>
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Requested
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Follow
          </>
        )}
      </Button>
      {error && (
        <span role="alert" className="max-w-[160px] text-right text-2xs font-medium text-danger">
          {error}
        </span>
      )}
      {!error && state === 'following' && (
        <Check className="sr-only" aria-hidden="true" />
      )}
    </span>
  );
}
