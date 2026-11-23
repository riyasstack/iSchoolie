'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { SkeletonCard } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Logo } from '@/components/brand/logo';

function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-16" aria-busy="true" aria-live="polite">
      <p className="text-sm font-medium text-subtle">{label}</p>
      <SkeletonCard rows={4} />
      <SkeletonCard rows={2} />
    </div>
  );
}

/**
 * Client route guard.
 *
 * This is a usability layer only. Every protected query is enforced again by
 * Firestore Security Rules, so calling a URL directly without permission
 * yields an empty result or a permission error — never private data.
 */
export function RequireAuth({
  children,
  allowUnverified = false,
}: {
  children: React.ReactNode;
  allowUnverified?: boolean;
}) {
  const { status, user, profile, error, refresh, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === 'signed-out') {
      const next = encodeURIComponent(pathname || '/feed');
      // Full navigation: `/login` is a 307 to WorkOS, so the client router
      // cannot follow it on an RSC fetch.
      window.location.assign(`/login?next=${next}`);
      return;
    }
    if (status === 'signed-in' && user && !user.emailVerified && !allowUnverified) {
      router.replace('/verify-email');
      return;
    }
    if (status === 'signed-in' && !profile) {
      router.replace('/onboarding');
    }
  }, [status, user, profile, router, pathname, allowUnverified]);

  if (status === 'unconfigured') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Logo />
        <Alert variant="warning" title="Sign-in is not configured" className="mt-6">
          Add the WorkOS keys to <code className="font-mono text-xs">.env.local</code> and restart
          the dev server. See docs/MIGRATION-firebase-to-workos.md → “WorkOS setup”.
        </Alert>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Logo />
        <Alert variant="danger" title="We could not load your profile" className="mt-6" role="alert">
          {error ?? 'Unexpected error.'} If this keeps happening, contact iSchoolie support.
        </Alert>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void refresh({ forceToken: true })}>Try again</Button>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
          <Link href="/help" className={buttonClass('ghost')}>
            Get help
          </Link>
        </div>
      </div>
    );
  }

  if (status !== 'signed-in' || !user) {
    return <FullPageLoader label="Restoring your session…" />;
  }

  if (!user.emailVerified && !allowUnverified) {
    return <FullPageLoader label="Checking your email verification…" />;
  }

  if (!profile) {
    return <FullPageLoader label="Preparing your workspace…" />;
  }

  return <>{children}</>;
}
