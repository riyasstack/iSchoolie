'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Clock, UserCheck, X } from 'lucide-react';
import { Avatar } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { SocialEmptyState } from '@/components/social/social-empty';
import { cn } from '@/lib/utils/cn';
import type { FollowRequestView } from '@/lib/social/types';

export function FollowRequestsPanel({
  initialIncoming,
  initialOutgoing,
}: {
  initialIncoming: FollowRequestView[];
  initialOutgoing: FollowRequestView[];
}) {
  const router = useRouter();
  const [incoming, setIncoming] = React.useState(initialIncoming);
  const [outgoing, setOutgoing] = React.useState(initialOutgoing);
  const [tab, setTab] = React.useState<'incoming' | 'outgoing'>('incoming');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function act(id: string, action: 'accept' | 'decline' | 'cancel') {
    setBusy(id);
    setError(null);
    try {
      const response = await fetch('/api/social/follow-requests', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not update this request.');
      }
      if (action === 'accept') {
        setIncoming((current) => current.filter((item) => item.id !== id));
      } else if (action === 'decline') {
        setIncoming((current) => current.filter((item) => item.id !== id));
      } else {
        setOutgoing((current) => current.filter((item) => item.id !== id));
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this request.');
    } finally {
      setBusy(null);
    }
  }

  const list = tab === 'incoming' ? incoming : outgoing;

  return (
    <div>
      <div className="flex gap-1 border-b border-line px-4 py-3 sm:px-5" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'incoming'}
          onClick={() => setTab('incoming')}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            tab === 'incoming' ? 'bg-ink text-white dark:bg-brand' : 'text-subtle hover:bg-mutedSurface',
          )}
        >
          Incoming {incoming.length > 0 && `· ${incoming.length}`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'outgoing'}
          onClick={() => setTab('outgoing')}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            tab === 'outgoing' ? 'bg-ink text-white dark:bg-brand' : 'text-subtle hover:bg-mutedSurface',
          )}
        >
          Sent {outgoing.length > 0 && `· ${outgoing.length}`}
        </button>
      </div>

      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-xl border border-danger/25 bg-danger/5 p-3 text-sm text-danger sm:mx-5">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <SocialEmptyState
          icon={tab === 'incoming' ? <UserCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          title={tab === 'incoming' ? 'No pending requests' : 'No sent requests'}
          description={
            tab === 'incoming'
              ? 'When someone asks to follow your private account, their request appears here.'
              : 'Requests you send to private accounts appear here until they respond.'
          }
          actions={[{ href: '/connect/people', label: 'Discover people', variant: 'secondary' }]}
        />
      ) : (
        <ul className="divide-y divide-line">
          {list.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
              <Link href={`/u/${request.person.handle}`} className="shrink-0">
                <Avatar name={request.person.displayName} src={request.person.photoUrl} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/u/${request.person.handle}`}
                  className="truncate text-sm font-semibold text-ink hover:underline"
                >
                  {request.person.displayName}
                </Link>
                <p className="truncate text-xs text-subtle">
                  @{request.person.handle} · {request.person.roleLabel}
                </p>
                <p className="mt-0.5 text-2xs text-subtle">
                  {new Date(request.createdAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              {tab === 'incoming' ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={busy === request.id}
                    onClick={() => void act(request.id, 'accept')}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busy === request.id}
                    onClick={() => void act(request.id, 'decline')}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" /> Decline
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  loading={busy === request.id}
                  onClick={() => void act(request.id, 'cancel')}
                >
                  Cancel request
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
