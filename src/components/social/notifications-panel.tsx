'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Heart, MessageCircle, Repeat2, UserPlus, Quote, ShieldCheck, Mail } from 'lucide-react';
import { Avatar } from '@/components/ui/empty-state';
import { SocialEmptyState } from '@/components/social/social-empty';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';
import type { NotificationView, Page } from '@/lib/social/types';

function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function iconFor(type: string) {
  switch (type) {
    case 'follow':
    case 'follow_request':
    case 'follow_accepted':
      return <UserPlus className="h-4 w-4" aria-hidden="true" />;
    case 'reaction':
      return <Heart className="h-4 w-4" aria-hidden="true" />;
    case 'reply':
      return <MessageCircle className="h-4 w-4" aria-hidden="true" />;
    case 'repost':
      return <Repeat2 className="h-4 w-4" aria-hidden="true" />;
    case 'quote':
      return <Quote className="h-4 w-4" aria-hidden="true" />;
    case 'mention':
      return <Mail className="h-4 w-4" aria-hidden="true" />;
    case 'moderation':
      return <ShieldCheck className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Bell className="h-4 w-4" aria-hidden="true" />;
  }
}

const TONE: Record<string, string> = {
  reaction: 'bg-rose-500/10 text-rose-600',
  reply: 'bg-brand/10 text-brand',
  mention: 'bg-brand/10 text-brand',
  repost: 'bg-emerald-500/10 text-emerald-600',
  quote: 'bg-emerald-500/10 text-emerald-600',
  follow: 'bg-amber-500/10 text-amber-600',
  follow_request: 'bg-amber-500/10 text-amber-600',
  follow_accepted: 'bg-amber-500/10 text-amber-600',
  moderation: 'bg-ink/5 text-ink',
};

export function NotificationsPanel({
  initialPage,
  mentionsOnly = false,
}: {
  initialPage: Page<NotificationView>;
  mentionsOnly?: boolean;
}) {
  const [items, setItems] = React.useState(initialPage.items);
  const [cursor, setCursor] = React.useState(initialPage.nextCursor);
  const [loading, setLoading] = React.useState(false);
  const [marking, setMarking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const unread = items.filter((item) => !item.read).length;

  async function markAll() {
    setMarking(true);
    setError(null);
    try {
      const response = await fetch('/api/social/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!response.ok) throw new Error('Could not mark notifications read.');
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not mark notifications read.');
    } finally {
      setMarking(false);
    }
  }

  function markOne(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    void fetch('/api/social/notifications', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => undefined);
  }

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ cursor });
      if (mentionsOnly) params.set('mentions', 'true');
      const response = await fetch(`/api/social/notifications?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => null)) as
        | (Page<NotificationView> & { error?: string })
        | null;
      if (!response.ok || !payload) throw new Error(payload?.error ?? 'Could not load notifications.');
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...payload.items.filter((item) => !seen.has(item.id))];
      });
      setCursor(payload.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className={cn(
              'text-sm font-semibold',
              !mentionsOnly ? 'text-ink' : 'text-subtle hover:text-ink',
            )}
          >
            All
          </Link>
          <Link
            href="/notifications/mentions"
            className={cn(
              'text-sm font-semibold',
              mentionsOnly ? 'text-ink' : 'text-subtle hover:text-ink',
            )}
          >
            Mentions
          </Link>
          {unread > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-2xs font-semibold text-white">
              {unread} new
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void markAll()}
          disabled={marking || unread === 0}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold text-subtle hover:bg-mutedSurface hover:text-ink disabled:opacity-40"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Mark all read
        </button>
      </div>

      {error && (
        <p role="alert" className="px-5 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <SocialEmptyState
          icon={<Bell className="h-5 w-5" />}
          title={mentionsOnly ? 'No mentions yet' : 'No notifications yet'}
          description={
            mentionsOnly
              ? 'When someone mentions you in an eligible post, it appears here.'
              : 'Follows, replies, reactions and mentions from your education network will appear here.'
          }
          actions={[
            { href: '/connect/people', label: 'Discover people', variant: 'secondary' },
            { href: '/feed', label: 'Back to feed', variant: 'outline' },
          ]}
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const content = (
              <>
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    TONE[item.type] ?? 'bg-mutedSurface text-subtle',
                  )}
                >
                  {iconFor(item.type)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className={cn('text-sm', item.read ? 'text-ink' : 'font-semibold text-ink')}>
                      {item.title}
                    </span>
                    <span className="shrink-0 text-2xs text-subtle">{relativeTime(item.createdAt)}</span>
                  </span>
                  {item.body && (
                    <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-subtle">
                      {item.body}
                    </span>
                  )}
                </span>
                {!item.read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />
                )}
              </>
            );

            return (
              <li key={item.id} className={cn('transition', !item.read && 'bg-brand/[0.03]')}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => markOne(item.id)}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-mutedSurface/60 sm:px-5"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {cursor && (
        <div className="flex justify-center border-t border-line py-4">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-brand/40 hover:text-brand disabled:opacity-60"
          >
            {loading ? <Spinner className="h-4 w-4" /> : null}
            {loading ? 'Loading…' : 'Load older notifications'}
          </button>
        </div>
      )}

      <p className="border-t border-line px-5 py-3 text-center text-2xs text-subtle">
        Notifications follow your{' '}
        <Link href="/settings/notifications" className="font-medium text-brand hover:underline">
          notification preferences
        </Link>
        .
      </p>
    </div>
  );
}
