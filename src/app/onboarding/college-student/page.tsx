import type { Metadata } from 'next';
import { RequireAuth } from '@/components/auth/require-auth';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { CollegeStudentForm } from '@/components/onboarding/college-student-form';

export const metadata: Metadata = {
  title: 'College student setup',
  robots: { index: false, follow: false },
};

export default function CollegeStudentOnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingShell
        step={3}
        title="College / university profile"
        description="Higher-education students get the same account with access to courses and institution classes."
      >
        <CollegeStudentForm />
      </OnboardingShell>
    </RequireAuth>
  );
}
