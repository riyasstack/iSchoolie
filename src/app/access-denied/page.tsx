'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardBody } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button-styles';
import { useQueryParam } from '@/hooks/use-query-param';
import { accessDeniedMessage } from '@/lib/auth/permissions';

const TITLES: Record<string, string> = {
  suspended: 'Account suspended',
  'institution-not-approved': 'Institution access not approved',
  'institution-suspended': 'Institution suspended',
  'not-a-member': 'No membership for this institution',
  'role-revoked': 'Workspace revoked',
};

function AccessDeniedScreen() {
  const reason = useQueryParam('reason');
  const title = (reason && TITLES[reason]) ?? 'Access denied';

  return (
    <RequireAuth allowUnverified>
      <AppShell title="Access denied">
        <div className="mx-auto max-w-xl py-8">
          <Card>
            <CardBody className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                <ShieldAlert aria-hidden="true" className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-semibold text-ink">{title}</h1>
              <p className="mt-2 text-sm text-subtle">{accessDeniedMessage(reason)}</p>
              <p className="mt-3 text-xs text-subtle">
                This page intentionally shows nothing about the resource you tried to open. Firestore
                Security Rules deny the underlying read as well, so no protected data is disclosed.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link href="/dashboard" className={buttonClass('primary', 'sm')}>
                  Back to my dashboard
                </Link>
                <Link href="/help" className={buttonClass('outline', 'sm')}>
                  Contact support
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={null}>
      <AccessDeniedScreen />
    </Suspense>
  );
}
