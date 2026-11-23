'use client';

import * as React from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ToggleRow } from '@/components/social/settings-toggle';

interface Preferences {
  follows: boolean;
  reactions: boolean;
  replies: boolean;
  mentions: boolean;
  reposts: boolean;
  quotes: boolean;
  moderation: boolean;
}

const LABELS: Array<{ key: keyof Preferences; label: string; description: string }> = [
  { key: 'follows', label: 'New followers and requests', description: 'Follows, follow requests and accepted requests.' },
  { key: 'reactions', label: 'Reactions', description: 'When someone likes your post.' },
  { key: 'replies', label: 'Replies', description: 'When someone replies to your post.' },
  { key: 'mentions', label: 'Mentions', description: 'When someone includes @yourhandle in a post.' },
  { key: 'reposts', label: 'Reposts', description: 'When someone reposts your post.' },
  { key: 'quotes', label: 'Quote posts', description: 'When someone quotes your post with a comment.' },
  { key: 'moderation', label: 'Moderation', description: 'Decisions that affect your content or account.' },
];

export function NotificationPreferencesForm({ initial }: { initial: Preferences }) {
  const [preferences, setPreferences] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch('/api/social/settings/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not save notification preferences.');
      }
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save notification preferences.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {saved && <Alert variant="success" title="Notification preferences saved" />}
      {error && (
        <Alert variant="danger" role="alert" title="Could not save">
          {error}
        </Alert>
      )}
      <section className="rounded-2xl border border-line bg-surface px-4 sm:px-5">
        {LABELS.map((item) => (
          <ToggleRow
            key={item.key}
            id={`notify-${item.key}`}
            label={item.label}
            description={item.description}
            checked={preferences[item.key]}
            onChange={(value) => {
              setPreferences((current) => ({ ...current, [item.key]: value }));
              setSaved(false);
            }}
          />
        ))}
      </section>
      <Alert variant="info" title="Moderation notices cannot be muted">
        Account and content decisions always produce a record. The preference above only controls the
        notification; the audit trail remains.
      </Alert>
      <div className="flex justify-end">
        <Button onClick={() => void save()} loading={busy}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}
