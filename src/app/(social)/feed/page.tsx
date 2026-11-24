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
      <header className="sticky top-14 z-30 border-b border-line bg-surface/80 backdrop-blur-md lg:top-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Home</h1>
            <p className="text-2xs text-subtle">Learn. Teach. Connect. Grow.</p>
          </div>
          <Link
            href="/connect/people"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-2xs font-semibold text-ink hover:border-brand/40 hover:text-brand"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            Discover people
          </Link>
        </div>
        <nav className="flex" aria-label="Feed timeline">
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
                  'relative flex-1 py-2.5 text-center text-sm font-semibold transition hover:bg-mutedSurface/60',
                  active ? 'text-ink' : 'text-subtle',
                )}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-8 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="border-b border-line bg-surface px-4 py-3 sm:px-5">
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
