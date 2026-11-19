'use client';

import * as React from 'react';
import { BellRing, Copy } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  disablePush,
  enablePush,
  pushAvailability,
  storedPushToken,
  watchForegroundPush,
  type PushAvailability,
} from '@/lib/firebase/push';

/**
 * Push opt-in for the current browser.
 *
 * Deliberately explicit: nothing is requested until the member presses the
 * button, because a permission prompt on page load gets denied and the
 * decision is then hard to reverse in the browser UI.
 */
export function PushSettingsCard() {
  const { toast } = useToast();
  const [availability, setAvailability] = React.useState<PushAvailability | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    void pushAvailability().then(setAvailability);
  }, []);

  // A token is only usable while permission is still granted; the browser can
  // revoke it at any time without telling the app.
  React.useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') setToken(storedPushToken());
  }, []);

  React.useEffect(() => {
    if (!token) return;
    return watchForegroundPush((title, body) => {
      toast({ title, description: body || undefined });
    });
  }, [token, toast]);

  async function enable() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const result = await enablePush();
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setToken(result.token);
    toast({ title: 'Notifications enabled', variant: 'success' });
  }

  async function disable() {
    if (busy) return;
    setBusy(true);
    await disablePush();
    setBusy(false);
    setToken(null);
    setMessage(null);
    toast({ title: 'Notifications turned off for this device' });
  }

  async function copyToken(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage('Could not copy automatically. Select the token and copy it manually.');
    }
  }

  return (
    <Card>
      <CardHeader
        title="Push notifications"
        description="Only for this browser and device. You can turn it off at any time."
      />
      <CardBody className="space-y-3 text-sm">
        {availability === null && <div className="skeleton h-4 w-2/3" />}

        {availability === 'insecure' && (
          <Alert variant="warning" title="A secure origin is required">
            Browsers only allow push on HTTPS origins (or localhost). Deploy the site, or open it
            through localhost, to register this device.
          </Alert>
        )}

        {availability === 'unconfigured' && (
          <Alert variant="neutral" title="Not available in this build">
            Push notifications need a real Firebase project and a Web Push certificate key
            (NEXT_PUBLIC_FCM_VAPID_KEY). The local emulator suite has no FCM service, so this stays
            off until the app is pointed at a real project.
          </Alert>
        )}

        {availability === 'unsupported' && (
          <Alert variant="warning" title="This browser cannot receive push">
            On iPhone and iPad, add iSchoolie to the Home Screen first; Safari only allows web
            push for installed apps. Otherwise try Chrome, Edge or Firefox.
          </Alert>
        )}

        {availability === 'ready' && token && (
          <>
            <p className="flex items-center gap-2 text-ink">
              <BellRing aria-hidden="true" className="h-4 w-4 text-success" />
              This device is registered.
            </p>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-subtle">
                Device token
              </p>
              <code className="mt-1 block break-all rounded-md border border-line bg-surface px-2 py-1.5 text-2xs text-subtle">
                {token}
              </code>
              <p className="mt-1.5 text-2xs text-subtle">
                Paste this into Firebase Console → Messaging → “Send test message” to check
                delivery. It identifies this browser, not you.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void copyToken(token)}>
                <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy token'}
              </Button>
              <Button size="sm" variant="ghost" loading={busy} onClick={() => void disable()}>
                Turn off on this device
              </Button>
            </div>
          </>
        )}

        {availability === 'ready' && !token && (
          <>
            <p className="text-subtle">
              Get a notification when someone replies, when an educator verification is decided
              and when a course you joined starts. Your browser will ask for permission first.
            </p>
            <Button size="sm" loading={busy} loadingText="Registering…" onClick={() => void enable()}>
              Enable notifications
            </Button>
          </>
        )}

        {message && (
          <Alert variant="danger" role="alert">
            {message}
          </Alert>
        )}
      </CardBody>
    </Card>
  );
}
