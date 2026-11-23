import type { Metadata } from 'next';
import { AuthUnavailable } from '@/components/auth/auth-unavailable';
import { isWorkosConfigured } from '@/lib/server/workos-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign-in problem',
  robots: { index: false, follow: false },
};

export default async function AuthErrorPage() {
  if (!isWorkosConfigured()) {
    return <AuthUnavailable title="Sign-in is not configured yet" />;
  }
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[480px] rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-xl font-semibold text-ink">We could not sign you in</h1>
        <p className="mt-2 text-sm text-subtle">
          The sign-in link may have expired or been used already, or the sign-in service could not
          be reached. Start again — nothing was changed on your account.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          Try signing in again
        </a>
      </div>
    </div>
  );
}