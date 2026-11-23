import type { Metadata } from 'next';
import { AuthUnavailable } from '@/components/auth/auth-unavailable';
import { getWorkosUser } from '@/lib/server/session';
import { isWorkosConfigured } from '@/lib/server/workos-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify your email',
  description: 'Confirm your email address to unlock your iSchoolie workspaces.',
};

export default async function VerifyEmailPage() {
  if (!isWorkosConfigured()) {
    return <AuthUnavailable title="Sign-in is not configured yet" />;
  }

  const user = await getWorkosUser();

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12">
        <div className="w-full max-w-[440px] rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h1 className="text-xl font-semibold text-ink">Sign in to continue</h1>
          <a href="/sign-in" className="mt-3 inline-block text-sm font-semibold text-brand">
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[440px] rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Verify your email</h1>
        <p className="mt-2 text-sm text-subtle">
          Open the verification link WorkOS sent to{' '}
          <span className="font-medium text-ink">{user.email}</span>. It brings you back here with a
          verified session.
        </p>
        <p className="mt-3 text-2xs text-subtle">
          No email? Sign in again and choose “Resend verification”.
        </p>
        <a
          href="/sign-in"
          className="mt-4 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
}