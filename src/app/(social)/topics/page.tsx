import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { listTopics } from '@/lib/server/social/topics';
import { TopicFollowButton } from '@/components/social/topic-follow-button';

export const metadata: Metadata = {
  title: 'Education Topics',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function TopicsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/topics' });
  const topics = await listTopics(viewer);
  const categories = [...new Set(topics.map((topic) => topic.category))];
  const following = topics.filter((topic) => topic.following);

  return (
    <div className="pb-6">
      <header className="border-b border-line bg-surface px-4 py-5 sm:px-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand">Explore</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">Education topics</h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-subtle">
          Follow the subjects you care about. Topics shape your For You feed, people suggestions and
          your public interests.
        </p>
        {following.length > 0 && (
          <p className="mt-2 text-xs text-subtle">
            Following{' '}
            <span className="font-medium text-ink">
              {following.map((topic) => `#${topic.name}`).join(', ')}
            </span>
          </p>
        )}
      </header>

      <div className="space-y-6 px-4 py-5 sm:px-5">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Compass className="h-4 w-4 text-brand" aria-hidden="true" />
              {category}
            </h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {topics
                .filter((topic) => topic.category === category)
                .map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-start justify-between gap-2 rounded-2xl border border-line bg-surface p-3.5"
                  >
                    <Link href={`/topics/${topic.slug}`} className="min-w-0">
                      <p className="text-sm font-semibold text-ink hover:underline">#{topic.name}</p>
                      <p className="mt-0.5 text-2xs text-subtle">
                        {topic.postCount} {topic.postCount === 1 ? 'post' : 'posts'} ·{' '}
                        {topic.followerCount} {topic.followerCount === 1 ? 'follower' : 'followers'}
                      </p>
                    </Link>
                    <TopicFollowButton
                      slug={topic.slug}
                      initialFollowing={topic.following}
                      initialCount={topic.followerCount}
                    />
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
