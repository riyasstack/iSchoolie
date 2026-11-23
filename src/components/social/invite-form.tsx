'use client';

import * as React from 'react';
import { Check, Copy, Link2, Mail, Share2, Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import type { InvitationView } from '@/lib/social/types';

export function InviteForm({
  initialInvitations,
  compact = false,
}: {
  initialInvitations: InvitationView[];
  compact?: boolean;
}) {
  const [email, setEmail] = React.useState('');
  const [invitations, setInvitations] = React.useState(initialInvitations);
  const [latest, setLatest] = React.useState<InvitationView | null>(
    initialInvitations.find((invitation) => invitation.status === 'created') ?? null,
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [origin, setOrigin] = React.useState('');

  React.useEffect(() => setOrigin(window.location.origin), []);

  const linkFor = (token: string) => `${origin}/join/${token}`;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const response = await fetch('/api/social/invitations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || null }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { invitation?: InvitationView; error?: string }
        | null;
      if (!response.ok || !payload?.invitation) {
        throw new Error(payload?.error ?? 'Could not create the invitation.');
      }
      setInvitations((current) => [payload.invitation as InvitationView, ...current]);
      setLatest(payload.invitation);
      setEmail('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the invitation.');
    } finally {
      setBusy(false);
    }
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(linkFor(token));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link. Select it and copy manually.');
    }
  }

  async function share(token: string) {
    const url = linkFor(token);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on iSchoolie',
          text: 'Learn. Teach. Connect. Grow.',
          url,
        });
      } else {
        await copy(token);
      }
    } catch {
      // The user dismissed the native share sheet; no error is needed.
    }
  }

  async function revoke(id: string) {
    if (!window.confirm('Revoke this invitation link? It will stop working.')) return;
    try {
      const response = await fetch(`/api/social/invitations/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not revoke the invitation.');
      setInvitations((current) =>
        current.map((invitation) =>
          invitation.id === id ? { ...invitation, status: 'revoked' } : invitation,
        ),
      );
      if (latest?.id === id) setLatest(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke the invitation.');
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" role="alert" title="Invitation problem">
          {error}
        </Alert>
      )}

      <form onSubmit={create} className="space-y-3">
        <Field
          label="Email address"
          htmlFor="invite-email"
          optional
          hint="Optional. Email delivery is not configured, so iSchoolie prepares a message for your own mail app instead of sending silently."
        >
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="colleague@example.edu"
            autoComplete="email"
          />
        </Field>
        <Button type="submit" loading={busy}>
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {email.trim() ? 'Create invitation for this address' : 'Create invitation link'}
        </Button>
      </form>

      {latest && (
        <div className="rounded-2xl border border-brand/25 bg-brand/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Your invitation link
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={linkFor(latest.token)}
              onFocus={(event) => event.target.select()}
              aria-label="Invitation link"
              className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-xs text-ink"
            />
            <Button size="sm" variant="secondary" onClick={() => void copy(latest.token)}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void share(latest.token)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" /> Share
            </button>
            {latest.email && (
              <a
                href={`mailto:${encodeURIComponent(latest.email)}?subject=${encodeURIComponent(
                  'Join me on iSchoolie',
                )}&body=${encodeURIComponent(
                  `I'm building my education network on iSchoolie.\n\nJoin here: ${linkFor(latest.token)}`,
                )}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Open mail app
              </a>
            )}
            <span className="text-2xs text-subtle">
              Anyone with the link can request access; they still need their own account.
            </span>
          </div>
        </div>
      )}

      {!compact && invitations.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Your invitations</h2>
            <p className="text-xs text-subtle">No address book is imported. Only these rows exist.</p>
          </div>
          <ul className="divide-y divide-line">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {invitation.email ?? 'Shareable link'}
                  </p>
                  <p className="text-2xs text-subtle">
                    {invitation.status} ·{' '}
                    {new Date(invitation.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {invitation.status === 'created' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void copy(invitation.token)}
                      className="rounded-lg p-1.5 text-subtle hover:bg-mutedSurface hover:text-ink"
                      aria-label="Copy invitation link"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void revoke(invitation.id)}
                      className="rounded-lg p-1.5 text-subtle hover:bg-danger/5 hover:text-danger"
                      aria-label="Revoke invitation"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
