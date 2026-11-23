'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Copy, Link2, Sparkles, UserPlus } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PersonCard } from '@/components/social/person-card';
import { SocialEmptyState } from '@/components/social/social-empty';
import { Spinner } from '@/components/ui/spinner';
import type { Page, PersonSummary } from '@/lib/social/types';

export function OnboardingConnectStep({
  initialPage,
  displayName,
}: {
  initialPage: Page<PersonSummary>;
  displayName: string;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialPage.items);
  const [cursor, setCursor] = React.useState(initialPage.nextCursor);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = React.useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/social/connect/recommendations?tab=for-you&limit=12&cursor=${encodeURIComponent(cursor)}`,
        { cache: 'no-store' },
      );
      const payload = (await response.json().catch(() => null)) as
        | (Page<PersonSummary> & { error?: string })
        | null;
      if (!response.ok || !payload) throw new Error(payload?.error ?? 'Could not load more people.');
      setItems((current) => {
        const seen = new Set(current.map((person) => person.id));
        return [...current, ...payload.items.filter((person) => !seen.has(person.id))];
      });
      setCursor(payload.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load more people.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function createInvite() {
    setInviteBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/social/invitations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = (await response.json().catch(() => null)) as
        | { invitation?: { token: string }; error?: string }
        | null;
      if (!response.ok || !payload?.invitation) {
        throw new Error(payload?.error ?? 'Could not create an invitation link.');
      }
      setInviteUrl(`${window.location.origin}/join/${payload.invitation.token}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create an invitation link.');
    } finally {
      setInviteBusy(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link. Select it and copy manually.');
    }
  }

  async function finish(skipped = false) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const stepResponse = await fetch('/api/social/onboarding', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ step: 6, values: { inviteSkipped: skipped } }),
      });
      if (!stepResponse.ok) {
        const payload = (await stepResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not save your progress.');
      }
      const response = await fetch('/api/social/onboarding', { method: 'POST' });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not finish onboarding.');
      }
      router.push('/feed');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not finish onboarding.');
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="rounded-t-3xl border border-line bg-surface p-5 sm:p-7">
        <div className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.14em] text-brand">
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Discover people
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Find people worth following, {displayName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-subtle">
          Start with educators and education-focused accounts relevant to your interests. Following is
          optional — you can search and follow more people at any time.
        </p>

        {error && (
          <Alert variant="danger" role="alert" className="mt-4" title="Something went wrong">
            {error}
          </Alert>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/8 px-3 py-1 text-2xs font-medium text-brand">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {items.length} permission-filtered suggestion{items.length === 1 ? '' : 's'}
          </span>
          <Link
            href="/onboarding/social?step=4"
            className="text-2xs font-semibold text-subtle underline-offset-2 hover:text-ink hover:underline"
          >
            Update interests
          </Link>
        </div>
      </div>

      <div className="border-x border-line bg-mutedSurface/30 p-3 sm:p-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface">
            <SocialEmptyState
              icon={<UserPlus className="h-5 w-5" />}
              title="No suggestions yet"
              description="Your network starts with your interests. You can explore topics and search for people after setup."
              actions={[]}
            />
            <p className="border-t border-line px-4 py-3 text-center text-xs text-subtle">
              Nothing is auto-followed. Continue whenever you are ready.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                showReason
                onDismiss={(id) => setItems((current) => current.filter((item) => item.id !== id))}
              />
            ))}
            {cursor && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink hover:border-brand/40 hover:text-brand disabled:opacity-60"
                >
                  {loadingMore ? <Spinner className="h-4 w-4" /> : null}
                  {loadingMore ? 'Loading…' : 'Show more people'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-b-3xl border border-line bg-surface p-5 sm:p-6">
        <div className="rounded-2xl border border-line bg-mutedSurface/40 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Link2 className="h-4 w-4 text-brand" aria-hidden="true" />
            Invite a classmate or colleague
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-subtle">
            Optional. Invitations create a shareable link; nobody is added automatically and no contacts
            are imported.
          </p>
          {inviteUrl ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl}
                aria-label="Invitation link"
                onFocus={(event) => event.target.select()}
                className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-xs text-ink"
              />
              <Button size="sm" variant="secondary" onClick={() => void copyInvite()}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              loading={inviteBusy}
              onClick={() => void createInvite()}
            >
              Create invitation link
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-col-reverse items-stretch justify-between gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => void finish(true)}
            disabled={busy}
            className="rounded-full px-3 py-2 text-sm font-semibold text-subtle transition hover:bg-mutedSurface hover:text-ink disabled:opacity-40"
          >
            Skip for now
          </button>
          <Button onClick={() => void finish(false)} loading={busy}>
            Continue to iSchoolie
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-2 text-center text-2xs text-subtle sm:text-right">
          You are never required to follow anyone to continue.
        </p>
      </div>
    </div>
  );
}
