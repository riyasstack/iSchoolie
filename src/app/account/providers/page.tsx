'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Link2, Unlink } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { linkProvider, unlinkProvider, type ProviderId } from '@/lib/auth/operations';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { providerFlags } from '@/lib/config';
import { PROVIDER_LABEL } from '@/lib/constants';

const OPTIONS: { id: ProviderId; enabled: boolean }[] = [
  { id: 'google.com', enabled: true },
  { id: 'github.com', enabled: true },
  { id: 'apple.com', enabled: providerFlags.apple },
  { id: 'linkedin.com', enabled: providerFlags.linkedin },
];

function ProvidersScreen() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const linked = user?.providerData ?? [];
  const linkedIds = linked.map((info) => info.providerId);
  const usableCount = linked.filter((info) => info.providerId !== 'firebase').length;

  async function link(providerId: ProviderId) {
    const current = getFirebaseAuth().currentUser;
    if (!current || busyId) return;
    setBusyId(providerId);
    const result = await linkProvider(current, providerId);
    setBusyId(null);
    if (result.ok) {
      await refresh({ forceToken: true });
      toast({ title: `${PROVIDER_LABEL[providerId]} linked`, variant: 'success' });
    } else {
      toast({
        title: 'Could not link provider',
        description: result.error.message,
        variant: 'danger',
      });
    }
  }

  async function unlink(providerId: string) {
    const current = getFirebaseAuth().currentUser;
    if (!current || busyId) return;
    setBusyId(providerId);
    const result = await unlinkProvider(current, providerId);
    setBusyId(null);
    if (result.ok) {
      await refresh({ forceToken: true });
      toast({ title: 'Provider removed', variant: 'success' });
    } else {
      toast({ title: 'Could not unlink', description: result.error.message, variant: 'danger' });
    }
  }

  return (
    <AppShell title="Linked providers">
      <PageHeader
        eyebrow="Account"
        title="Linked sign-in methods"
        description="One person, one account. Linking keeps the same iSchoolie identity, profile, courses and relationships."
        action={<Link href="/account/security" className={buttonClass('ghost', 'sm')}>Security</Link>}
      />

      <Alert variant="neutral" title="How linking works" className="mb-6">
        Linking a provider to an email that already has an iSchoolie account triggers Firebase’s
        “account exists with different credential” flow: you are asked to sign in with the original
        method, then the provider is attached to that account. iSchoolie never merges accounts based
        on matching display names or unverified email claims.
      </Alert>

      <Card>
        <CardHeader title="Sign-in methods" description={`${usableCount} method${usableCount === 1 ? '' : 's'} can sign in to this account.`} />
        <CardBody className="space-y-2">
          {OPTIONS.filter((option) => option.enabled || linkedIds.includes(option.id)).map((option) => {
            const isLinked = linkedIds.includes(option.id);
            const isOnlyMethod = isLinked && usableCount <= 1;
            return (
              <div
                key={option.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3"
              >
                <div className="flex items-center gap-2">
                  {isLinked ? (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" />
                  ) : (
                    <Link2 aria-hidden="true" className="h-4 w-4 text-subtle" />
                  )}
                  <span className="text-sm font-medium text-ink">{PROVIDER_LABEL[option.id]}</span>
                  {isLinked && <Badge tone="success">Linked</Badge>}
                </div>
                {isLinked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isOnlyMethod}
                    loading={busyId === option.id}
                    onClick={() => void unlink(option.id)}
                    title={isOnlyMethod ? 'You cannot remove your only sign-in method' : undefined}
                    icon={<Unlink className="h-3.5 w-3.5" />}
                  >
                    {isOnlyMethod ? 'Only method' : 'Unlink'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    loading={busyId === option.id}
                    onClick={() => void link(option.id)}
                  >
                    Link
                  </Button>
                )}
              </div>
            );
          })}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-mutedSurface/60 p-3">
            <div>
              <p className="text-sm font-medium text-ink">Email &amp; password</p>
              <p className="text-xs text-subtle">
                {linkedIds.includes('password')
                  ? 'Enabled — manage it in Security settings.'
                  : 'Not enabled. You can add it from Security settings once you set a password.'}
              </p>
            </div>
            <Link href="/account/security" className={buttonClass('ghost', 'sm')}>Manage</Link>
          </div>

          {(!providerFlags.apple || !providerFlags.linkedin) && (
            <p className="pt-2 text-2xs text-subtle">
              Apple and LinkedIn are shown only when configured by the operator. Both require
              external credentials (an Apple Developer account; a LinkedIn developer app). Until
              those exist the options stay hidden rather than failing at the last step.
            </p>
          )}
        </CardBody>
      </Card>
    </AppShell>
  );
}

export default function ProvidersPage() {
  return (
    <RequireAuth>
      <ProvidersScreen />
    </RequireAuth>
  );
}
