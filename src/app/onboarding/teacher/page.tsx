import type { Metadata } from 'next';
import { RequireAuth } from '@/components/auth/require-auth';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { TeacherForm } from '@/components/onboarding/teacher-form';

export const metadata: Metadata = {
  title: 'Educator setup',
  robots: { index: false, follow: false },
};

export default function TeacherOnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingShell
        step={3}
        title="Educator profile"
        description="Create your teaching profile. Verified status and course publishing are reviewed separately."
      >
        <TeacherForm />
      </OnboardingShell>
    </RequireAuth>
  );
}
