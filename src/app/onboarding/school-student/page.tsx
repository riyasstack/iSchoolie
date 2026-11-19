import type { Metadata } from 'next';
import { RequireAuth } from '@/components/auth/require-auth';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { SchoolStudentForm } from '@/components/onboarding/school-student-form';

export const metadata: Metadata = {
  title: 'School student setup',
  robots: { index: false, follow: false },
};

export default function SchoolStudentOnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingShell
        step={3}
        title="School student profile"
        description="We only ask for what the student workspace needs. Learners below Class 8 cannot create independent public-network accounts."
      >
        <SchoolStudentForm />
      </OnboardingShell>
    </RequireAuth>
  );
}
