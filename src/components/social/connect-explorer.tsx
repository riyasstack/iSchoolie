'use client';

import * as React from 'react';
import Link from 'next/link';
import { Filter, RefreshCw, Search, SlidersHorizontal, Sparkles, UserPlus, Users } from 'lucide-react';
import { PersonCard } from '@/components/social/person-card';
import { SocialEmptyState } from '@/components/social/social-empty';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';
import {
  DISCOVERY_TABS,
  EDUCATION_STAGES,
  type DiscoveryTab,
} from '@/lib/social/catalog';
import type { Page, PersonSummary } from '@/lib/social/types';

interface TopicOption {
  slug: string;
  name: string;
}

export function ConnectExplorer({
  initialPage,
  initialTab,
  topics,
}: {
  initialPage: Page<PersonSummary>;
  initialTab: DiscoveryTab;
  topics: TopicOption[];
}) {
  const [items, setItems] = React.useState<PersonSummary[]>(initialPage.items);
  const [cursor, setCursor] = React.useState<string | null>(initialPage.nextCursor);
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [tab, setTab] = React.useState<DiscoveryTab>(initialTab);
  const [subject, setSubject] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [verified, setVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const mounted = React.useRef(false);
  const requestRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const buildParams = React.useCallback(
    (nextCursor?: string | null) => {
      const params = new URLSearchParams();
      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      } else {
        params.set('tab', tab);
        if (subject) params.set('subject', subject);
        if (stage) params.set('stage', stage);
        if (region.trim()) params.set('region', region.trim());
        if (verified) params.set('verified', 'true');
      }
      if (nextCursor) params.set('cursor', nextCursor);
      params.set('limit', debouncedQuery ? '20' : '12');
      return params;
    },
    [debouncedQuery, tab, subject, stage, region, verified],
  );

  const fetchPage = React.useCallback(
    async (nextCursor?: string | null): Promise<Page<PersonSummary>> => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      const params = buildParams(nextCursor);
      const endpoint = debouncedQuery ? '/api/social/connect/search' : '/api/social/connect/recommendations';
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as
        | (Page<PersonSummary> & { error?: string })
        | null;
      if (!response.ok || !payload) throw new Error(payload?.error ?? 'Could not load people.');
      return payload;
    },
    [buildParams, debouncedQuery],
  );

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchPage(null);
      setItems(page.items);
      setCursor(page.nextCursor);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Could not load people.');
      setItems([]);
      setCursor(null);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    void reload();
  }, [reload]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await fetchPage(cursor);
      setItems((current) => {
        const seen = new Set(current.map((person) => person.id));
        return [...current, ...page.items.filter((person) => !seen.has(person.id))];
      });
      setCursor(page.nextCursor);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Could not load more people.');
    } finally {
      setLoadingMore(false);
    }
  }

  const clearFilters = () => {
    setSubject('');
    setStage('');
    setRegion('');
    setVerified(false);
    setTab('for-you');
  };

  const hasFilters = Boolean(subject || stage || region || verified);
  const empty = debouncedQuery ? (
    <SocialEmptyState
      icon={<Search className="h-5 w-5" />}
      title="No accounts found"
      description={`No eligible profiles match “${debouncedQuery}”. Try a display name, username or subject.`}
      actions={[
        { href: '/explore', label: 'Explore topics', variant: 'secondary' },
        { href: '/search?type=people', label: 'Advanced search', variant: 'outline' },
      ]}
    />
  ) : hasFilters ? (
    <SocialEmptyState
      icon={<Filter className="h-5 w-5" />}
      title="No accounts match those filters"
      description="Widen the subject, stage or region filters to see more eligible people."
      actions={[{ href: '/connect/people', label: 'Clear filters', variant: 'secondary' }]}
    />
  ) : (
    <SocialEmptyState
      icon={<Users className="h-5 w-5" />}
      title="Your network starts with your interests"
      description="Add a few learning interests and follow topics, then return here for educators and peers who share them."
      actions={[
        { href: '/topics', label: 'Explore topics', variant: 'primary' },
        { href: '/settings/profile', label: 'Update interests', variant: 'secondary' },
        { href: '/search?type=people', label: 'Search people', variant: 'outline' },
      ]}
    />
  );

  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-5 lg:top-0">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search educators, peers, researchers or usernames"
            aria-label="Search people"
            className="h-11 w-full rounded-full border border-line bg-mutedSurface/50 pl-9 pr-10 text-sm text-ink placeholder:text-subtle/80 focus:border-brand/40 focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-2xs font-medium text-subtle hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <div className="no-scrollbar -mx-1 flex flex-1 gap-1 overflow-x-auto px-1" role="tablist" aria-label="Discovery categories">
            {DISCOVERY_TABS.map((item) => {
              const active = tab === item.value && !debouncedQuery;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setQuery('');
                    setTab(item.value);
                  }}
                  className={cn(
                    'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition',
                    active
                      ? 'bg-ink text-white dark:bg-brand dark:text-brand-fg'
                      : 'text-subtle hover:bg-mutedSurface hover:text-ink',
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition',
              filtersOpen || hasFilters
                ? 'border-brand/40 bg-brand/5 text-brand'
                : 'border-line text-subtle hover:text-ink',
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filters
            {hasFilters && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[0.6rem] text-white">
                {[subject, stage, region, verified].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {(filtersOpen || hasFilters) && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-2xs font-semibold uppercase tracking-wide text-subtle">
              Subject
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs font-medium text-ink"
              >
                <option value="">All subjects</option>
                {topics.map((topic) => (
                  <option key={topic.slug} value={topic.slug}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-2xs font-semibold uppercase tracking-wide text-subtle">
              Education stage
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs font-medium text-ink"
              >
                <option value="">Any stage</option>
                {EDUCATION_STAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-2xs font-semibold uppercase tracking-wide text-subtle">
              Public region
              <input
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="e.g. Mumbai"
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs font-medium text-ink"
              />
            </label>
            <div className="flex items-end justify-between gap-2">
              <label className="flex items-center gap-2 pb-1 text-xs font-medium text-ink">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(event) => setVerified(event.target.checked)}
                  className="h-4 w-4 rounded border-line accent-[rgb(var(--brand))]"
                />
                Verified educators only
              </label>
              <button
                type="button"
                onClick={clearFilters}
                className="pb-1 text-2xs font-medium text-subtle underline-offset-2 hover:text-ink hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3 sm:px-5">
        <p className="text-xs text-subtle" aria-live="polite">
          {loading
            ? 'Finding eligible people…'
            : debouncedQuery
              ? `${items.length} result${items.length === 1 ? '' : 's'} for “${debouncedQuery}”`
              : `${items.length} suggestion${items.length === 1 ? '' : 's'} · permission-filtered`}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold text-subtle transition hover:bg-mutedSurface hover:text-ink disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 px-4 pb-5 sm:px-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-line bg-surface p-4" aria-hidden="true">
              <div className="flex gap-3">
                <div className="skeleton h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-4/5" />
                </div>
              </div>
            </div>
          ))}
          <span className="sr-only">Loading suggestions</span>
        </div>
      ) : error ? (
        <div className="px-4 pb-5 sm:px-5">
          <div className="rounded-xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger">
            <p role="alert">{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-2 text-xs font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 pb-5 sm:px-5">{empty}</div>
      ) : (
        <div className="space-y-3 px-4 pb-5 sm:px-5">
          {items.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              showReason
              onDismiss={(id) => setItems((current) => current.filter((item) => item.id !== id))}
            />
          ))}

          {cursor && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand disabled:opacity-60"
              >
                {loadingMore ? <Spinner className="h-4 w-4" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
                {loadingMore ? 'Loading…' : 'Explore more people'}
              </button>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 py-2 text-center text-2xs text-subtle">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Suggestions use your interests, topics and mutual connections. Student accounts are never
            shown to adults.
          </p>
        </div>
      )}

      <div className="border-t border-line bg-surface px-4 py-4 text-center sm:rounded-b-2xl sm:px-5">
        <p className="text-xs text-subtle">Know someone who belongs here?</p>
        <Link
          href="/connect/invite"
          className="mt-1 inline-block text-sm font-semibold text-brand hover:underline"
        >
          Invite people to iSchoolie
        </Link>
      </div>
    </div>
  );
}
