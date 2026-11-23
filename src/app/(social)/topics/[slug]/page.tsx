import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Hash, Sparkles } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getFeed } from '@/lib/server/social/posts';
import { getRecommendations } from '@/lib/server/social/recommendations';
import { listTopics } from '@/lib/server/social/topics';
import { PostList } from '@/components/social/post-list';
import { PersonCard } from '@/components/social/person-card';
import { TopicFollowButton } from '@/components/social/topic-follow-button';
import { SocialEmptyState } from '@/components/social/social-empty';

export const dynamic = 'force-dynamic';

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await requireSocialViewer({ nextPath: `/topics/${slug}` });
  const topics = await listTopics(viewer);
  const topic = topics.find((item) => item.slug === slug);
  if (!topic) notFound();

  const [feed, people] = await Promise.all([
    getFeed(viewer, 'explore', { limit: 20, topicSlug: slug }),
    getRecommendations(viewer, { subject: slug }, null, 3),
  ]);

  return (
    <div className="pb-6">
      <header className="border-b border-line bg-gradient-to-br from-brand/10 via-surface to-surface px-4 py-5 sm:px-5">
        <Link
          href="/topics"
          className="inline-flex items-center gap-1 text-2xs font-semibold text-subtle hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All topics
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-ink">
              <Hash className="h-5 w-5 text-brand" aria-hidden="true" />
              {topic.name}
            </h1>
            <p className="mt-1 text-xs text-subtle">
              {topic.category} · {topic.postCount} posts · {topic.followerCount} followers
            </p>
          </div>
          <TopicFollowButton
            slug={topic.slug}
            initialFollowing={topic.following}
            initialCount={topic.followerCount}
            size="md"
          />
        </div>
      </header>

      {people.items.length > 0 && (
        <section className="border-b border-line px-4 py-4 sm:px-5">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
            People active in {topic.name}
          </h2>
          <div className="mt-2 space-y-2.5">
            {people.items.map((person) => (
              <PersonCard key={person.id} person={person} compact showReason />
            ))}
          </div>
        </section>
      )}

      <PostList
        initialPage={feed}
        endpoint={`/api/social/feeds/explore?topic=${encodeURIComponent(slug)}`}
        empty={
          <SocialEmptyState
            title={`No posts in ${topic.name} yet`}
            description="Be the first to share a question, resource or project update in this topic."
            actions={[
              { href: `/compose?topic=${encodeURIComponent(slug)}`, label: 'Post in this topic', variant: 'primary' },
              { href: '/connect/people', label: 'Find people in this subject', variant: 'secondary' },
            ]}
          />
        }
        storageKey={`topic-${slug}`}
      />
    </div>
  );
}
