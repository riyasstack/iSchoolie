'use client';

import * as React from 'react';
import Link from 'next/link';
import { BadgeCheck, Lock, Sparkles, X } from 'lucide-react';
import { Avatar } from '@/components/ui/empty-state';
import { FollowButton } from '@/components/social/follow-button';
import { cn } from '@/lib/utils/cn';
import type { FollowState, PersonSummary } from '@/lib/social/types';

const ROLE_TONE: Record<string, string> = {
  Educator: 'bg-brand/10 text-brand',
  Student: 'bg-success/10 text-success',
  'Education professional': 'bg-plum/10 text-plum dark:bg-brand/10 dark:text-brand',
  'Parent or guardian': 'bg-warn/10 text-warn',
  Learner: 'bg-mutedSurface text-subtle',
};

export function PersonCard({
  person,
  onDismiss,
  showReason = false,
  compact = false,
}: {
  person: PersonSummary;
  onDismiss?: (id: string) => void;
  showReason?: boolean;
  compact?: boolean;
}) {
  const [dismissing, setDismissing] = React.useState(false);
  const [feedback, setFeedback] = React.useState(false);
  const [state, setState] = React.useState<FollowState>(person.followState);
  const [error, setError] = React.useState<string | null>(null);

  async function dismiss(signal: 'dismiss' | 'not_relevant') {
    setDismissing(true);
    setError(null);
    try {
      const endpoint = signal === 'dismiss' ? '/api/social/connect/dismiss' : '/api/social/connect/feedback';
      const payload =
        signal === 'dismiss'
          ? { targetUserId: person.id }
          : { targetUserId: person.id, signal: 'not_relevant' };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Could not update suggestions.');
      }
      onDismiss?.(person.id);
    } catch (cause) {
      setDismissing(false);
      setError(cause instanceof Error ? cause.message : 'Could not update suggestions.');
    }
  }

  return (
    <article
      className={cn(
        'relative rounded-2xl border border-line bg-surface shadow-card transition hover:border-brand/25',
        compact ? 'p-3.5' : 'p-4',
      )}
    >
      <div className="flex items-start gap-3">
        <Link
          href={`/u/${person.handle}`}
          className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={`${person.displayName}'s profile`}
        >
          <Avatar name={person.displayName} src={person.photoUrl} size={compact ? 'md' : 'lg'} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <Link
              href={`/u/${person.handle}`}
              className="truncate text-[0.95rem] font-semibold text-ink hover:underline"
            >
              {person.displayName}
            </Link>
            {person.teacherVerified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-brand"
                aria-label="Verified educator"
              />
            )}
            {person.isPrivate && (
              <Lock className="h-3.5 w-3.5 shrink-0 text-subtle" aria-label="Private account" />
            )}
            <span className="truncate text-xs text-subtle">@{person.handle}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-2xs font-semibold',
                ROLE_TONE[person.roleLabel] ?? ROLE_TONE.Learner,
              )}
            >
              {person.roleLabel}
            </span>
            {person.stageLabel && (
              <span className="text-2xs text-subtle">{person.stageLabel}</span>
            )}
            {person.region && <span className="text-2xs text-subtle">· {person.region}</span>}
          </div>

          {person.bio && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-subtle">{person.bio}</p>
          )}

          {person.interests.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {person.interests.slice(0, compact ? 2 : 3).map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-mutedSurface px-2 py-0.5 text-2xs font-medium text-subtle"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {showReason && person.reason && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-brand">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{person.reason}</span>
            </p>
          )}

          {person.mutualCount > 0 && (
            <p className="mt-1 text-2xs text-subtle">
              Followed by {person.mutualNames.slice(0, 2).join(', ')}
              {person.mutualCount > person.mutualNames.slice(0, 2).length
                ? ` and ${person.mutualCount - person.mutualNames.slice(0, 2).length} more`
                : ''}
            </p>
          )}

          {error && (
            <p role="alert" className="mt-1.5 text-2xs font-medium text-danger">
              {error}
            </p>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={() => {
              setFeedback(true);
              void dismiss('dismiss');
            }}
            disabled={dismissing}
            aria-label={`Dismiss suggestion for ${person.displayName}`}
            className="rounded-full p-1 text-subtle transition hover:bg-mutedSurface hover:text-ink disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <Link
          href={`/u/${person.handle}`}
          className="text-xs font-semibold text-brand hover:underline"
        >
          View profile
        </Link>
        <div className="flex items-center gap-2">
          {showReason && (
            <button
              type="button"
              disabled={dismissing}
              onClick={() => {
                setFeedback(true);
                void dismiss('not_relevant');
              }}
              className="text-2xs font-medium text-subtle underline-offset-2 hover:text-ink hover:underline"
            >
              {feedback ? 'Updating…' : 'Not relevant'}
            </button>
          )}
          <FollowButton
            targetId={person.id}
            initialState={state}
            canFollow={person.canFollow}
            onChange={setState}
          />
        </div>
      </div>
    </article>
  );
}
