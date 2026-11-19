'use client';

import * as React from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { Alert } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { platformAdmin, status } = useAuth();

  if (status === 'signed-in' && !platformAdmin) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Alert variant="danger" title="Platform administration is restricted" role="alert">
          This area is available only to iSchoolie team members provisioned with the platform
          administrator claim. The claim is set by the privileged admin CLI — it cannot be granted
          from the browser, and hiding the route is not what protects it: Security Rules refuse the
          underlying reads and writes.
        </Alert>
        <Link href="/dashboard" className={buttonClass('secondary', 'sm', 'mt-4')}>
          Back to my dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell title="iSchoolie platform administration">
        <AdminGuard>{children}</AdminGuard>
      </AppShell>
    </RequireAuth>
  );
}
