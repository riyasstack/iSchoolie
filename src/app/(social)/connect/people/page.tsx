import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getRecommendations, type RecommendationTab } from '@/lib/server/social/recommendations';
import { listTopics } from '@/lib/server/social/topics';
import { ConnectExplorer } from '@/components/social/connect-explorer';
import type { EducationStageValue } from '@/lib/social/catalog';

export const metadata: Metadata = {
  title: 'Discover People',
  description: 'Build meaningful connections across the education ecosystem.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TABS: RecommendationTab[] = [
  'for-you',
  'educators',
  'peers',
  'researchers',
  'professionals',
  'connections',
];

const STAGES: EducationStageValue[] = [
  'school_student',
  'college_student',
  'teacher',
  'education_professional',
  'parent',
  'lifelong_learner',
];

export default async function ConnectPeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireSocialViewer({ nextPath: '/connect/people' });
  const params = await searchParams;
  const rawTab = typeof params.tab === 'string' ? params.tab : 'for-you';
  const tab = TABS.includes(rawTab as RecommendationTab) ? (rawTab as RecommendationTab) : 'for-you';
  const stage =
    typeof params.stage === 'string' && STAGES.includes(params.stage as EducationStageValue)
      ? (params.stage as EducationStageValue)
      : null;

  const [page, topics] = await Promise.all([
    getRecommendations(viewer, {
      tab,
      subject: typeof params.subject === 'string' ? params.subject : null,
      stage,
      region: typeof params.region === 'string' ? params.region : null,
      verifiedOnly: params.verified === 'true',
    }),
    listTopics(viewer),
  ]);

  return (
    <div className="overflow-hidden bg-surface sm:rounded-2xl sm:border sm:border-line sm:my-4">
      <header className="border-b border-line bg-surface px-4 py-5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand">
              Build your education network
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">Discover People</h1>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-subtle">
              Build meaningful connections across the education ecosystem. Discover educators, peers
              and education professionals who share your interests.
            </p>
          </div>
        </div>
      </header>

      <ConnectExplorer
        initialPage={page}
        initialTab={tab}
        topics={topics.map((topic) => ({ slug: topic.slug, name: topic.name }))}
      />
    </div>
  );
}
