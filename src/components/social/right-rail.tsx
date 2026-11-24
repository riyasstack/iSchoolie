import Link from 'next/link';
import { Search, Sparkles, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/empty-state';
import { FollowButton } from '@/components/social/follow-button';
import { TopicFollowButton } from '@/components/social/topic-follow-button';
import type { PersonSummary, TopicSummary } from '@/lib/social/types';

export function RightRail({
  suggestions,
  topics,
}: {
  suggestions: PersonSummary[];
  topics: TopicSummary[];
}) {
  const visibleTopics = topics
    .filter((topic) => topic.following || topic.postCount > 0)
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, 5);
  const discoveryTopics = visibleTopics.length > 0 ? visibleTopics : topics.slice(0, 5);

  return (
    <div className="space-y-4">
      <form action="/search" method="get" className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          placeholder="Search iSchoolie"
          aria-label="Search iSchoolie"
          className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-subtle/80 focus:border-brand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
      </form>

      <section className="rounded-2xl bg-mutedSurface p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <UserPlus className="h-4 w-4 text-brand" aria-hidden="true" />
            Who to follow
          </h2>
          <Link href="/connect/people" className="text-2xs font-semibold text-brand hover:underline">
            See all
          </Link>
        </div>
        {suggestions.length === 0 ? (
          <p className="mt-2 text-xs leading-relaxed text-subtle">
            <Link href="/topics" className="font-medium text-brand hover:underline">
              Follow a few topics
            </Link>{' '}
            to unlock relevant people suggestions.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {suggestions.map((person) => (
              <li key={person.id} className="flex items-center gap-2.5">
                <Link href={`/u/${person.handle}`} className="shrink-0">
                  <Avatar name={person.displayName} src={person.photoUrl} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/u/${person.handle}`}
                    className="block truncate text-xs font-semibold text-ink hover:underline"
                  >
                    {person.displayName}
                  </Link>
                  <p className="truncate text-2xs text-subtle">
                    @{person.handle} · {person.roleLabel}
                  </p>
                </div>
                <FollowButton
                  targetId={person.id}
                  initialState={person.followState}
                  canFollow={person.canFollow}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-mutedSurface p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
            Education topics
          </h2>
          <Link href="/topics" className="text-2xs font-semibold text-brand hover:underline">
            Browse
          </Link>
        </div>
        <ul className="mt-2">
          {discoveryTopics.map((topic) => (
            <li key={topic.id} className="flex items-center justify-between gap-2 py-1.5">
              <Link href={`/topics/${topic.slug}`} className="min-w-0">
                <p className="truncate text-xs font-medium text-ink hover:underline">#{topic.name}</p>
                <p className="text-2xs text-subtle">{topic.followerCount} followers</p>
              </Link>
              <TopicFollowButton
                slug={topic.slug}
                initialFollowing={topic.following}
                initialCount={topic.followerCount}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-mutedSurface p-4">
        <h2 className="text-sm font-semibold text-ink">Build your education network</h2>
        <p className="mt-1 text-xs leading-relaxed text-subtle">
          Follow educators and researchers in the subjects you are learning. Your Following feed
          only shows accounts you chose.
        </p>
        <Link
          href="/connect/people"
          className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
        >
          Discover people →
        </Link>
      </section>

      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-2xs text-subtle">
        <Link href="/legal/terms" className="hover:underline">
          Terms
        </Link>
        <Link href="/legal/privacy" className="hover:underline">
          Privacy
        </Link>
        <Link href="/help" className="hover:underline">
          Help
        </Link>
        <span>© {new Date().getFullYear()} iSchoolie</span>
      </div>
    </div>
  );
}
