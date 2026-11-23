import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Compass, Users } from 'lucide-react';
import { PublicExplore } from '@/components/marketing/public-explore';
import { SocialFrame } from '@/components/social/social-frame';
import { PostList } from '@/components/social/post-list';
import { SocialEmptyState } from '@/components/social/social-empty';
import { getSocialViewer } from '@/lib/server/social/auth';
import { getFeed } from '@/lib/server/social/posts';
import { listTopics } from '@/lib/server/social/topics';

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover public education discussions, topics and people on iSchoolie.',
};

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const viewer = await getSocialViewer();
  if (!viewer) return <PublicExplore />;
  if (viewer.user.status !== 'active') redirect('/access-denied?reason=suspended');
  if (!viewer.onboardingCompleted) redirect('/onboarding/social');
  const [feed, topics] = await Promise.all([
    getFeed(viewer, 'explore', { limit: 20 }),
    listTopics(viewer),
  ]);

  return (
    <SocialFrame viewer={viewer}>
      <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
        <header className="border-b border-line px-4 py-4 sm:px-5">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <Compass className="h-5 w-5 text-brand" aria-hidden="true" />
            Explore
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-subtle">
            Public education discussions beyond your network. Every post is filtered for visibility and
            safeguarding before it appears.
          </p>
          <div className="mt-3 flex gap-1" role="tablist" aria-label="Explore categories">
            <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white dark:bg-brand">
              Posts
            </span>
            <Link
              href="/connect/people"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-subtle hover:bg-mutedSurface hover:text-ink"
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> People
            </Link>
            <Link
              href="/topics"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-subtle hover:bg-mutedSurface hover:text-ink"
            >
              Topics
            </Link>
          </div>
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
            {[...topics]
              .sort((a, b) => b.postCount - a.postCount)
              .slice(0, 8)
              .map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.slug}`}
                  className="whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-2xs font-medium text-subtle hover:border-brand/40 hover:text-brand"
                >
                  #{topic.name}
                </Link>
              ))}
          </div>
        </header>

        <PostList
          initialPage={feed}
          kind="explore"
          empty={
            <SocialEmptyState
              icon={<Compass className="h-5 w-5" />}
              title="No public discussions yet"
              description="Follow topics and invite your education network. Public posts from eligible accounts appear here."
              actions={[
                { href: '/connect/people', label: 'Discover people', variant: 'primary' },
                { href: '/topics', label: 'Explore topics', variant: 'secondary' },
              ]}
            />
          }
          storageKey="explore"
        />
      </div>
    </SocialFrame>
  );
}
