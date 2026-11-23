import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getOnboardingSnapshot } from '@/lib/server/social/onboarding';
import { ensureTopics, listTopics } from '@/lib/server/social/topics';
import { OnboardingSocialWizard } from '@/components/social/onboarding-social-wizard';

export const metadata: Metadata = {
  title: 'Set up your iSchoolie profile',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SocialOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const viewer = await requireSocialViewer({ allowIncomplete: true, nextPath: '/onboarding/social' });
  const snapshot = await getOnboardingSnapshot(viewer);
  if (snapshot.completed) redirect('/feed');

  const params = await searchParams;
  const requested = Number(params.step);
  const hasRequestedStep = Number.isInteger(requested) && requested >= 1 && requested <= 5;
  if (!hasRequestedStep && (snapshot.step > 5 || snapshot.connectDone)) {
    redirect('/onboarding/connect');
  }

  await ensureTopics();
  const topics = await listTopics(viewer);

  return (
    <div className="min-h-dvh bg-[#f7f8fb] dark:bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo href="/feed" size="sm" />
          <p className="text-2xs font-medium text-subtle">New member setup</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <p className="mb-3 text-center text-xs text-subtle">
          Already have a profile?{' '}
          <Link href="/feed" className="font-semibold text-brand hover:underline">
            Go to the feed
          </Link>{' '}
          — setup resumes where you left off.
        </p>
        <OnboardingSocialWizard
          initial={snapshot}
          topics={topics.map((topic) => ({
            slug: topic.slug,
            name: topic.name,
            category: topic.category,
          }))}
          startStep={hasRequestedStep ? requested : undefined}
        />
        <p className="mt-4 text-center text-2xs leading-relaxed text-subtle">
          Your progress is saved after every step. You can complete setup, then change these choices in
          settings at any time.
        </p>
      </main>
    </div>
  );
}
