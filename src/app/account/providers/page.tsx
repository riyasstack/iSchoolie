'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Link2 } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { listIdentities, type LinkedIdentity } from '@/lib/services/users';
import { useAsync } from '@/hooks/use-async';

const PROVIDER_NAMES: Record<string, string> = {
  GoogleOAuth: 'Google',
  GitHubOAuth: 'GitHub',
  AppleOAuth: 'Apple',
  MicrosoftOAuth: 'Microsoft',
  SalesforceOAuth: 'Salesforce',
};

function providerLabel(identity: LinkedIdentity): string {
  return PROVIDER_NAMES[identity.provider] ?? identity.provider;
}

function ProvidersScreen() {
  const { user } = useAuth();
  const identities = useAsync<LinkedIdentity[]>(
    () => listIdentities(),
    [],
    [],
  );

  const linkedProviders = identities.data ?? [];

  return (
    <AppShell title="Linked providers">
      <PageHeader
        eyebrow="Account"
        title="Linked sign-in methods"
        description="One person, one account. Linking keeps the same iSchoolie identity, profile, courses and relationships."
        action={<Link href="/account/security" className={buttonClass('ghost', 'sm')}>Security</Link>}
      />

      <Alert variant="neutral" title="How linking works" className="mb-6">
        WorkOS links sign-in methods automatically when they share the same verified email address.
        Sign in with a provider using this account&apos;s email and it will be attached here. iSchoolie
        never merges accounts based on matching display names or unverified email claims.
      </Alert>

      <Card>
        <CardHeader
          title="Sign-in methods"
          description={`${linkedProviders.length} method${linkedProviders.length === 1 ? '' : 's'} can sign in to this account.`}
        />
        <CardBody className="space-y-2">
          {identities.status === 'loading' && (
            <p className="text-sm text-subtle">Loading linked methods…</p>
          )}
          {linkedProviders.length === 0 && identities.status !== 'loading' && (
            <p className="text-sm text-subtle">No linked methods reported yet.</p>
          )}
          {linkedProviders.map((identity) => (
            <div
              key={identity.idpId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-ink">{providerLabel(identity)}</span>
                <Badge tone="success">Linked</Badge>
              </div>
            </div>
          ))}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-mutedSurface/60 p-3">
            <div>
              <p className="text-sm font-medium text-ink">Email &amp; password</p>
              <p className="text-xs text-subtle">
                {user?.email ?? 'Managed by WorkOS. Passwords are changed in Security settings.'}
              </p>
            </div>
            <Link href="/account/security" className={buttonClass('ghost', 'sm')}>Manage</Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href="/login" className={buttonClass('outline', 'sm')}>
              <Link2 aria-hidden="true" className="h-3.5 w-3.5" /> Add another sign-in method
            </Link>
          </div>

          <p className="pt-2 text-2xs text-subtle">
            To remove a linked method, contact iSchoolie support. Unlinking is not available in-app to
            prevent locking yourself out of your account.
          </p>
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