import type { Metadata } from 'next';
import { RequireAuth } from '@/components/auth/require-auth';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { InstitutionApplicationForm } from '@/components/institution/application-form';

export const metadata: Metadata = {
  title: 'Institution application',
  robots: { index: false, follow: false },
};

export default function InstitutionOnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingShell
        step={3}
        title="Request institutional access"
        description="Institution access is controlled exclusively by the iSchoolie team. Submitting this form does not unlock any institution tools."
      >
        <InstitutionApplicationForm />
      </OnboardingShell>
    </RequireAuth>
  );
}
