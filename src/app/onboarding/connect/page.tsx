import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getOnboardingSnapshot } from '@/lib/server/social/onboarding';
import { getRecommendations } from '@/lib/server/social/recommendations';
import { OnboardingConnectStep } from '@/components/social/onboarding-connect-step';

export const metadata: Metadata = {
  title: 'Discover people',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function OnboardingConnectPage() {
  const viewer = await requireSocialViewer({
    allowIncomplete: true,
    nextPath: '/onboarding/connect',
  });
  const snapshot = await getOnboardingSnapshot(viewer);
  if (snapshot.completed) redirect('/feed');
  if (!snapshot.completedSteps.includes('privacy')) redirect('/onboarding/social');
  if (!snapshot.completedSteps.includes('connect')) {
    // The step is saved from this screen, but a direct visit should not skip it.
    // Rendering is still safe: finishing calls PATCH step 6 before completing.
  }

  const page = await getRecommendations(viewer, { tab: 'for-you' }, null, 12);

  return (
    <div className="min-h-dvh bg-[#f7f8fb] dark:bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo href="/feed" size="sm" />
          <p className="text-2xs font-medium text-subtle">Step 6 of 6 · Discover people</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <OnboardingConnectStep initialPage={page} displayName={viewer.user.displayName} />
        <p className="mt-4 text-center text-2xs leading-relaxed text-subtle">
          Recommendations use only your interests and permitted public signals. Student accounts are
          never suggested to adults, and no account is followed automatically.
        </p>
      </main>
    </div>
  );
}
