'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function AcceptInvitation({ token, inviterHandle }: { token: string; inviterHandle: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [accepted, setAccepted] = React.useState(false);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/social/invitations/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { result?: string; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Could not accept this invitation.');
      if (payload?.result === 'own') {
        setError('This is your own invitation link.');
        return;
      }
      setAccepted(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not accept this invitation.');
    } finally {
      setBusy(false);
    }
  }

  if (accepted) {
    return (
      <div className="space-y-3">
        <Alert variant="success" title="Invitation accepted">
          Welcome to iSchoolie. Your account is connected to @{inviterHandle}&apos;s invitation.
        </Alert>
        <Button onClick={() => router.push('/feed')}>Go to your feed</Button>
        <Button variant="outline" onClick={() => router.push(`/u/${inviterHandle}`)}>
          View @{inviterHandle}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="danger" role="alert" title="Invitation problem">
          {error}
        </Alert>
      )}
      <Button onClick={() => void accept()} loading={busy}>
        Accept invitation
      </Button>
      <p className="text-2xs leading-relaxed text-subtle">
        Accepting records that you joined from this invitation. It does not follow anyone automatically.
      </p>
    </div>
  );
}
