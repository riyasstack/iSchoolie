import type { Metadata } from 'next';
import { RequireAuth } from '@/components/auth/require-auth';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { ParentForm } from '@/components/onboarding/parent-form';

export const metadata: Metadata = {
  title: 'Guardian setup',
  robots: { index: false, follow: false },
};

export default function ParentOnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingShell
        step={3}
        title="Guardian profile"
        description="Create your own account, then request a verified link to your child."
      >
        <ParentForm />
      </OnboardingShell>
    </RequireAuth>
  );
}
