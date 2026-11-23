'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ToggleRow } from '@/components/social/settings-toggle';

export function PrivacyForm({
  initialPrivate,
  initialShowFollowers,
  initialShowFollowing,
  isMinor,
}: {
  initialPrivate: boolean;
  initialShowFollowers: boolean;
  initialShowFollowing: boolean;
  isMinor: boolean;
}) {
  const router = useRouter();
  const [isPrivate, setIsPrivate] = React.useState(initialPrivate);
  const [showFollowers, setShowFollowers] = React.useState(initialShowFollowers);
  const [showFollowing, setShowFollowing] = React.useState(initialShowFollowing);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch('/api/social/settings/privacy', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          privateProfile: isPrivate,
          showFollowers,
          showFollowing,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not save privacy settings.');
      }
      setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save privacy settings.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {saved && (
        <Alert variant="success" title="Privacy updated">
          Follow requests and visibility now follow these choices.
        </Alert>
      )}
      {error && (
        <Alert variant="danger" role="alert" title="Could not save">
          {error}
        </Alert>
      )}

      <section className="rounded-2xl border border-line bg-surface px-4 sm:px-5">
        <ToggleRow
          id="private-profile"
          label="Private account"
          description="New followers must send a request you approve. Your posts stay behind that approval."
          checked={isMinor ? true : isPrivate}
          onChange={setIsPrivate}
          disabled={isMinor}
          badge={isMinor ? 'Required for students' : undefined}
        />
        <ToggleRow
          id="show-followers"
          label="Show my followers list"
          description="Your follower count stays visible; the list of accounts does not."
          checked={showFollowers}
          onChange={setShowFollowers}
        />
        <ToggleRow
          id="show-following"
          label="Show who I follow"
          description="When off, only you can open your following list."
          checked={showFollowing}
          onChange={setShowFollowing}
        />
      </section>

      <div className="rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-subtle">
        <p className="font-semibold text-ink">What is never public</p>
        <p className="mt-1">
          Your date of birth, email, grade, institution student ID, academic records, grades,
          guardian relationships and exact location are never shown on your social profile. Following
          someone never grants access to institution records.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => void save()} loading={busy}>
          Save privacy settings
        </Button>
      </div>
    </div>
  );
}
