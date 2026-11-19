import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLoading, SignupScreen } from '@/components/auth/auth-screens';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create one iSchoolie account for studying, teaching, guardianship and institution access.',
};

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <SignupScreen />
    </Suspense>
  );
}
