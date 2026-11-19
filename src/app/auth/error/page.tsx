import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthErrorScreen, AuthLoading } from '@/components/auth/auth-screens';

export const metadata: Metadata = {
  title: 'Authentication error',
  robots: { index: false, follow: false },
};

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[480px] rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <Suspense fallback={<AuthLoading />}>
          <AuthErrorScreen />
        </Suspense>
      </div>
    </div>
  );
}
