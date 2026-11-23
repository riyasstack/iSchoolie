import type { Metadata } from 'next';
import { RequireAuth } from '@/components/auth/require-auth';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { RoleSelection } from '@/components/onboarding/role-selection';

export const metadata: Metadata = {
  title: 'How will you use iSchoolie?',
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingShell
        step={2}
        title="Welcome to iSchoolie"
        description="How would you like to use iSchoolie? Pick a workspace to set up. You can add more roles later — one account covers everything."
        backHref="/feed"
      >
        <RoleSelection />
      </OnboardingShell>
    </RequireAuth>
  );
}
