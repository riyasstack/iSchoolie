'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserX, VolumeX } from 'lucide-react';
import { Avatar } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { SocialEmptyState } from '@/components/social/social-empty';
import type { PersonSummary } from '@/lib/social/types';

export function AccountManager({
  kind,
  initial,
}: {
  kind: 'blocked' | 'muted';
  initial: PersonSummary[];
}) {
  const router = useRouter();
  const [people, setPeople] = React.useState(initial);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function remove(person: PersonSummary) {
    setBusy(person.id);
    setError(null);
    try {
      const response = await fetch(`/api/social/${kind === 'blocked' ? 'blocks' : 'mutes'}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId: person.id }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not update this account.');
      }
      setPeople((current) => current.filter((item) => item.id !== person.id));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this account.');
    } finally {
      setBusy(null);
    }
  }

  if (people.length === 0) {
    return (
      <SocialEmptyState
        icon={kind === 'blocked' ? <UserX className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        title={kind === 'blocked' ? 'No blocked accounts' : 'No muted accounts'}
        description={
          kind === 'blocked'
            ? 'Blocking removes follow relationships in both directions and hides each account from the other.'
            : 'Muting hides an account from your feeds without changing your follow relationship.'
        }
        actions={[{ href: '/connect/people', label: 'Discover people', variant: 'secondary' }]}
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      )}
      {people.map((person) => (
        <article
          key={person.id}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5"
        >
          <Avatar name={person.displayName} src={person.photoUrl} size="md" />
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${person.handle}`}
              className="truncate text-sm font-semibold text-ink hover:underline"
            >
              {person.displayName}
            </Link>
            <p className="truncate text-xs text-subtle">
              @{person.handle} · {person.roleLabel}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            loading={busy === person.id}
            onClick={() => void remove(person)}
          >
            {kind === 'blocked' ? 'Unblock' : 'Unmute'}
          </Button>
        </article>
      ))}
    </div>
  );
}
