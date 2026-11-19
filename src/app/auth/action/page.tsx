import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthActionScreen, AuthLoading } from '@/components/auth/auth-screens';

export const metadata: Metadata = {
  title: 'Completing your request',
  robots: { index: false, follow: false },
};

export default function AuthActionPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[440px] rounded-2xl border border-line bg-surface p-6 shadow-card">
        <Suspense fallback={<AuthLoading />}>
          <AuthActionScreen />
        </Suspense>
      </div>
    </div>
  );
}
