'use client';

import * as React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, UserX } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { loadPrivateProfile } from '@/lib/services/users';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils/dates';

function PrivacyScreen() {
  const { user, profile } = useAuth();
  const privateProfile = useAsync(
    () => (user ? loadPrivateProfile(user.uid) : Promise.resolve(null)),
    [user?.uid],
    null,
  );

  return (
    <AppShell title="Privacy settings">
      <PageHeader
        eyebrow="Account"
        title="Privacy and consent"
        description="What iSchoolie stores, who can read it, and what you have agreed to."
        action={<Link href="/legal/privacy" className={buttonClass('ghost', 'sm')}>Privacy policy</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Consent record" />
          <CardBody className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-subtle">Terms version</span>
              <Badge tone="brand">{privateProfile.data?.consent.termsVersion ?? TERMS_VERSION}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-subtle">Privacy version</span>
              <Badge tone="brand">{privateProfile.data?.consent.privacyVersion ?? PRIVACY_VERSION}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-subtle">Accepted terms</span>
              <span className="text-ink">
                {privateProfile.data?.consent.acceptedTermsAt
                  ? formatDateTime(privateProfile.data.consent.acceptedTermsAt)
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-subtle">Guardian acknowledgement</span>
              <span className="text-ink">
                {privateProfile.data?.consent.guardianAcknowledgedAt
                  ? formatDateTime(privateProfile.data.consent.guardianAcknowledgedAt)
                  : 'Not required / not recorded'}
              </span>
            </div>
            <Alert variant="neutral" title="Versioned consent">
              When the policy changes, a new version is recorded the next time you accept it. Your
              acceptance history is never edited in place.
            </Alert>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="What other people can read" />
          <CardBody className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <p className="text-subtle">
                <span className="font-medium text-ink">Public profile:</span> name, handle, headline,
                country, role badges{profile?.safeguarding.privateProfile ? ' — currently restricted because safeguarding is active' : ''}.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-subtle">
                <span className="font-medium text-ink">Never public:</span> email, date of birth,
                school, grade, guardian email, private academic details.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-subtle">
                <span className="font-medium text-ink">Institution records:</span> visible to teachers
                of your class and administrators of that institution only.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Your controls" />
          <CardBody className="flex flex-wrap items-center gap-2">
            <Link href="/account/security" className={buttonClass('outline', 'sm')}>
              Change password or email
            </Link>
            <Link href="/dashboard/parent" className={buttonClass('outline', 'sm')}>
              Guardian relationships
            </Link>
            <Link href="/help" className={buttonClass('outline', 'sm')}>
              Request a data export
            </Link>
            <Link href="/account/security" className={buttonClass('danger', 'sm', 'ml-auto')}>
              <UserX aria-hidden="true" className="h-3.5 w-3.5" /> Delete account
            </Link>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

export default function PrivacyPage() {
  return (
    <RequireAuth>
      <PrivacyScreen />
    </RequireAuth>
  );
}
