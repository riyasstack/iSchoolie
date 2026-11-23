'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, Search, Sparkles, X } from 'lucide-react';
import { PersonCard } from '@/components/social/person-card';
import { PostCard } from '@/components/social/post-card';
import { SocialEmptyState } from '@/components/social/social-empty';
import { TopicFollowButton } from '@/components/social/topic-follow-button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';
import type { PersonSummary, PostView, TopicSummary } from '@/lib/social/types';

type SearchType = 'top' | 'latest' | 'people' | 'media' | 'topics';

interface Results {
  people: PersonSummary[];
  posts: PostView[];
  topics: TopicSummary[];
}

const TABS: Array<{ value: SearchType; label: string }> = [
  { value: 'top', label: 'Top' },
  { value: 'latest', label: 'Latest' },
  { value: 'people', label: 'People' },
  { value: 'media', label: 'Media' },
  { value: 'topics', label: 'Topics' },
];

const RECENT_KEY = 'ischoolie:recent-searches';

export function SearchClient({
  initialResults,
  initialQuery,
  initialType,
  trendingTopics,
}: {
  initialResults: Results;
  initialQuery: string;
  initialType: SearchType;
  trendingTopics: TopicSummary[];
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [type, setType] = React.useState<SearchType>(initialType);
  const [results, setResults] = React.useState<Results>(initialResults);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recent, setRecent] = React.useState<string[]>([]);
  const first = React.useRef(true);
  const requestRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecent(parsed.filter((item): item is string => typeof item === 'string').slice(0, 6));
        }
      }
    } catch {
      // A disabled localStorage is not an error for search.
    }
  }, []);

  const search = React.useCallback(async (term: string, nextType: SearchType) => {
    requestRef.current?.abort();
    if (!term.trim()) {
      setResults({ people: [], posts: [], topics: [] });
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: term.trim(), type: nextType });
      const response = await fetch(`/api/social/search?${params.toString()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as
        | (Results & { error?: string })
        | null;
      if (!response.ok || !payload) throw new Error(payload?.error ?? 'Search is unavailable.');
      setResults({ people: payload.people, posts: payload.posts, topics: payload.topics });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Search is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void search(query, type);
      window.history.replaceState(
        null,
        '',
        `/search?${new URLSearchParams({
          ...(query.trim() ? { q: query.trim() } : {}),
          type,
        }).toString()}`,
      );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, type, search]);

  function remember(term: string) {
    const value = term.trim();
    if (!value) return;
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 6);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage limits; search still works.
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    remember(query);
    void search(query, type);
  }

  const hasResults =
    results.people.length > 0 || results.posts.length > 0 || results.topics.length > 0;
  const showPeople = type === 'people' || type === 'top';
  const showPosts = type !== 'people' && type !== 'topics';
  const showTopics = type === 'topics' || type === 'top';

  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-5 lg:top-0">
        <form onSubmit={submit} className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people, posts, topics or #hashtags"
            aria-label="Search iSchoolie"
            className="h-11 w-full rounded-full border border-line bg-mutedSurface/50 pl-9 pr-10 text-sm text-ink placeholder:text-subtle/80 focus:border-brand/40 focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-subtle hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </form>
        <div className="no-scrollbar mt-2 flex gap-1 overflow-x-auto" role="tablist" aria-label="Search filters">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={type === tab.value}
              onClick={() => setType(tab.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition',
                type === tab.value
                  ? 'bg-ink text-white dark:bg-brand dark:text-brand-fg'
                  : 'text-subtle hover:bg-mutedSurface hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!query.trim() ? (
        <div className="px-4 py-5 sm:px-5">
          {recent.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Recent searches</h2>
                <button
                  type="button"
                  onClick={() => {
                    setRecent([]);
                    try {
                      window.localStorage.removeItem(RECENT_KEY);
                    } catch {
                      // Ignore storage failures.
                    }
                  }}
                  className="text-2xs font-medium text-subtle hover:text-ink"
                >
                  Clear
                </button>
              </div>
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
                {recent.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        remember(term);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink hover:bg-mutedSurface/60"
                    >
                      <Clock className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Explore education topics</h2>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {trendingTopics.slice(0, 8).map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface p-3"
                >
                  <Link href={`/topics/${topic.slug}`} className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink hover:underline">
                      #{topic.name}
                    </p>
                    <p className="text-2xs text-subtle">
                      {topic.postCount} posts · {topic.followerCount} followers
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

          <div className="mt-6 rounded-2xl border border-line bg-mutedSurface/40 p-4 text-center">
            <p className="text-sm font-medium text-ink">Looking for someone specific?</p>
            <Link
              href="/connect/people"
              className="mt-1 inline-block text-sm font-semibold text-brand hover:underline"
            >
              Browse Discover People
            </Link>
          </div>
        </div>
      ) : loading && !hasResults ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
          <span className="sr-only">Searching</span>
        </div>
      ) : error ? (
        <div className="px-4 py-6 sm:px-5">
          <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger">
            {error}
          </p>
        </div>
      ) : !hasResults ? (
        <div className="px-4 py-5 sm:px-5">
          <SocialEmptyState
            icon={<Search className="h-5 w-5" />}
            title={`No results for “${query.trim()}”`}
            description="Try a different spelling, a subject, a username, or explore the topic directory."
            actions={[
              { href: '/topics', label: 'Browse topics', variant: 'secondary' },
              { href: '/connect/people', label: 'Discover people', variant: 'primary' },
            ]}
          />
        </div>
      ) : (
        <div className="space-y-5 px-4 py-4 sm:px-5">
          {showPeople && results.people.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">People</h2>
                {type === 'top' && (
                  <button
                    type="button"
                    onClick={() => setType('people')}
                    className="text-2xs font-semibold text-brand hover:underline"
                  >
                    See all
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {results.people.map((person) => (
                  <PersonCard key={person.id} person={person} compact />
                ))}
              </div>
            </section>
          )}

          {showTopics && results.topics.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Topics</h2>
                {type === 'top' && (
                  <button
                    type="button"
                    onClick={() => setType('topics')}
                    className="text-2xs font-semibold text-brand hover:underline"
                  >
                    See all
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {results.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface p-3"
                  >
                    <Link href={`/topics/${topic.slug}`} className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink hover:underline">
                        #{topic.name}
                      </p>
                      <p className="text-2xs text-subtle">{topic.postCount} posts</p>
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
          )}

          {showPosts && results.posts.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-ink">
                {type === 'media' ? 'Media posts' : type === 'latest' ? 'Latest posts' : 'Posts'}
              </h2>
              <div className="space-y-3">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
