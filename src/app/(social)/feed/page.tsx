import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Sparkles, UserPlus } from 'lucide-react';
import { requireSocialViewer, toSocialViewer } from '@/lib/server/social/auth';
import { getFeed } from '@/lib/server/social/posts';
import { listTopics } from '@/lib/server/social/topics';
import { PostComposer } from '@/components/social/post-composer';
import { PostList } from '@/components/social/post-list';
import { SocialEmptyState } from '@/components/social/social-empty';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function EmptyFeed({ kind }: { kind: 'for-you' | 'following' }) {
  return (
    <SocialEmptyState
      icon={kind === 'following' ? <UserPlus className="h-5 w-5" /> : <Compass className="h-5 w-5" />}
      title={kind === 'following' ? 'Your Following feed is quiet' : 'Find educators and topics to build your feed'}
      description={
        kind === 'following'
          ? 'Follow educators, researchers and peers to see their eligible posts here.'
          : 'Choose a few interests and follow education topics. Your For You feed fills with relevant posts from permitted accounts.'
      }
      actions={[
        { href: '/connect/people', label: 'Discover people', variant: 'primary' },
        { href: '/topics', label: 'Explore topics', variant: 'secondary' },
        { href: '/explore', label: 'Browse public posts', variant: 'outline' },
      ]}
    />
  );
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const viewer = await requireSocialViewer({ nextPath: '/feed' });
  const params = await searchParams;
  const kind = params.tab === 'following' ? 'following' : 'for-you';
  const [feed, topics] = await Promise.all([
    getFeed(viewer, kind, { limit: 20 }),
    listTopics(viewer),
  ]);
  const socialViewer = toSocialViewer(viewer);

  return (
    <div>
      <header className="sticky top-14 z-30 border-b border-line bg-bg/80 backdrop-blur-md lg:top-0">
        <div className="px-4 py-3 sm:px-5">
          <h1 className="text-xl font-bold tracking-tight text-ink">Home</h1>
        </div>
        <nav className="flex border-b border-line" aria-label="Feed timeline">
          {[
            { value: 'for-you', label: 'For You' },
            { value: 'following', label: 'Following' },
          ].map((tab) => {
            const active = kind === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === 'following' ? '/feed?tab=following' : '/feed'}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex-1 py-4 text-center text-[15px] font-medium transition hover:bg-mutedSurface/40',
                  active ? 'font-bold text-ink' : 'text-subtle',
                )}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 mx-auto h-1 w-14 rounded-full bg-brand" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="border-b border-line bg-bg px-4 py-3 sm:px-5">
        <PostComposer
          viewer={socialViewer}
          topics={topics.map((topic) => ({ slug: topic.slug, name: topic.name }))}
          compact
        />
      </div>

      {feed.items.length === 0 ? (
        <div className="px-4 py-5 sm:px-5">
          <EmptyFeed kind={kind} />
        </div>
      ) : (
        <PostList
          initialPage={feed}
          kind={kind}
          empty={<EmptyFeed kind={kind} />}
          storageKey={`feed-${kind}`}
        />
      )}
    </div>
  );
}
