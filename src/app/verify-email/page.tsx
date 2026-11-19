import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLoading, VerifyEmailScreen } from '@/components/auth/auth-screens';

export const metadata: Metadata = {
  title: 'Verify your email',
  description: 'Confirm your email address to unlock your iSchoolie workspaces.',
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[440px] rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <Suspense fallback={<AuthLoading />}>
          <VerifyEmailScreen />
        </Suspense>
      </div>
    </div>
  );
}
