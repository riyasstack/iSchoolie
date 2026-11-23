import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { searchContent } from '@/lib/server/social/search';
import { listTopics } from '@/lib/server/social/topics';
import { SearchClient } from '@/components/social/search-client';

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TYPES = ['top', 'latest', 'people', 'media', 'topics'] as const;
type SearchType = (typeof TYPES)[number];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const viewer = await requireSocialViewer({ nextPath: '/search' });
  const params = await searchParams;
  const queryValue = typeof params.q === 'string' ? params.q.slice(0, 80) : '';
  const type: SearchType = TYPES.includes(params.type as SearchType)
    ? (params.type as SearchType)
    : 'top';

  const [results, topics] = await Promise.all([
    queryValue ? searchContent(viewer, queryValue, type) : Promise.resolve({ people: [], posts: [], topics: [] }),
    listTopics(viewer),
  ]);

  return (
    <div className="overflow-hidden bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <SearchClient
        initialResults={results}
        initialQuery={queryValue}
        initialType={type}
        trendingTopics={[...topics].sort((a, b) => b.followerCount - a.followerCount).slice(0, 8)}
      />
    </div>
  );
}
