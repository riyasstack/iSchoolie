'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ToggleRow } from '@/components/social/settings-toggle';
import type { DiscoverabilitySettings } from '@/lib/social/types';

export function DiscoverabilityForm({
  initial,
  isMinor,
}: {
  initial: DiscoverabilitySettings;
  isMinor: boolean;
}) {
  const router = useRouter();
  const [settings, setSettings] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  function set<K extends keyof DiscoverabilitySettings>(key: K, value: DiscoverabilitySettings[K]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
      ...(key === 'discoverable' && value === false ? { recommendable: false } : {}),
    }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch('/api/social/settings/discoverability', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json().catch(() => null)) as
        | { settings?: DiscoverabilitySettings; error?: string }
        | null;
      if (!response.ok || !payload?.settings) {
        throw new Error(payload?.error ?? 'Could not save discoverability settings.');
      }
      setSettings(payload.settings);
      setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save discoverability settings.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {saved && (
        <Alert variant="success" title="Discoverability updated">
          Search, recommendations and profile visibility now follow these choices.
        </Alert>
      )}
      {error && (
        <Alert variant="danger" role="alert" title="Could not save">
          {error}
        </Alert>
      )}

      <section className="rounded-2xl border border-line bg-surface px-4 sm:px-5">
        <ToggleRow
          id="discoverable"
          label="Allow eligible people to discover my public profile"
          description="When off, your profile is removed from search, topic directories and public profile links."
          checked={settings.discoverable}
          onChange={(value) => set('discoverable', value)}
        />
        <ToggleRow
          id="recommendable"
          label="Allow my profile to appear in account recommendations"
          description="Turning this off keeps you out of Discover People while you can still follow others."
          checked={settings.recommendable}
          onChange={(value) => set('recommendable', value)}
          disabled={!settings.discoverable}
        />
        <ToggleRow
          id="search-indexing"
          label="Allow search engines to index my public profile"
          description="Applies only to your public profile. Private posts and follower lists are never indexed."
          checked={settings.allowSearchIndexing}
          onChange={(value) => set('allowSearchIndexing', value)}
          disabled={!settings.discoverable}
        />
      </section>

      <section className="rounded-2xl border border-line bg-surface px-4 sm:px-5">
        <ToggleRow
          id="show-education"
          label="Show my approved education information publicly"
          description="Your stage (student, educator, professional) and interests. Never your date of birth, grade or institution records."
          checked={settings.showEducation}
          onChange={(value) => set('showEducation', value)}
        />
        <ToggleRow
          id="show-followers"
          label="Show my followers"
          description="When off, other people see a follower count but not the list."
          checked={settings.showFollowers}
          onChange={(value) => set('showFollowers', value)}
        />
        <ToggleRow
          id="show-following"
          label="Show who I follow"
          description="When off, your following list is visible only to you."
          checked={settings.showFollowing}
          onChange={(value) => set('showFollowing', value)}
        />
      </section>

      <section className="rounded-2xl border border-line bg-surface px-4 sm:px-5">
        <ToggleRow
          id="discover-email"
          label="Allow discovery by verified email"
          description="Not enabled. Email matching requires a separately approved contact-discovery policy."
          checked={false}
          onChange={() => undefined}
          disabled
          badge="Unavailable"
        />
        <ToggleRow
          id="discover-phone"
          label="Allow discovery by verified phone number"
          description="Not enabled. iSchoolie does not collect phone numbers for social discovery."
          checked={false}
          onChange={() => undefined}
          disabled
          badge="Unavailable"
        />
      </section>

      {isMinor && (
        <Alert variant="info" title="Student account protections">
          Student profiles are never shown to adult accounts, cannot be followed by adults, and their
          posts are visible only to approved followers. These protections cannot be disabled.
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={() => void save()} loading={busy}>
          Save discoverability
        </Button>
      </div>
    </div>
  );
}
