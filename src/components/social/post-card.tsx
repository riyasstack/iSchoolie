'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Bookmark,
  Globe2,
  Heart,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Quote,
  Repeat2,
  Share2,
  Trash2,
  UserX,
  VolumeX,
  Flag,
} from 'lucide-react';
import { Avatar } from '@/components/ui/empty-state';
import { RichText } from '@/components/social/rich-text';
import { PostMedia } from '@/components/social/post-media';
import { ReportDialog } from '@/components/social/report-dialog';
import { cn } from '@/lib/utils/cn';
import { relativeTime } from '@/lib/utils/dates';
import type { PostView } from '@/lib/social/types';

function formatCount(value: number): string {
  if (value <= 0) return '';
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

function QuoteCard({ quote }: { quote: PostView }) {
  return (
    <div className="mt-3 rounded-2xl border border-line bg-mutedSurface/30 p-3">
      <div className="flex items-center gap-2">
        <Avatar name={quote.author.displayName} src={quote.author.photoUrl} size="sm" />
        <Link
          href={`/u/${quote.author.handle}`}
          className="truncate text-sm font-semibold text-ink hover:underline"
        >
          {quote.author.displayName}
        </Link>
        {quote.author.teacherVerified && (
          <BadgeCheck
            className="h-4 w-4 shrink-0 text-brand"
            aria-label="Verified educator"
          />
        )}
        <span className="truncate text-xs text-subtle">@{quote.author.handle}</span>
        <span className="text-xs text-subtle">· {relativeTime(quote.createdAt)}</span>
      </div>
      {quote.body && (
        <RichText
          text={quote.body}
          className="mt-2 line-clamp-4 text-sm leading-relaxed text-ink"
        />
      )}
      <PostMedia media={quote.media} />
      <Link
        href={`/post/${quote.id}`}
        className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
      >
        View post
      </Link>
    </div>
  );
}

export function PostCard({
  post,
  repostedBy,
  compact = false,
  detail = false,
  onDeleted,
}: {
  post: PostView;
  repostedBy?: PostView['author'] | null;
  compact?: boolean;
  detail?: boolean;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(post.viewer.liked);
  const [reposted, setReposted] = React.useState(post.viewer.reposted);
  const [bookmarked, setBookmarked] = React.useState(post.viewer.bookmarked);
  const [counts, setCounts] = React.useState(post.counts);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [menu, setMenu] = React.useState(false);
  const [reporting, setReporting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLiked(post.viewer.liked);
    setReposted(post.viewer.reposted);
    setBookmarked(post.viewer.bookmarked);
    setCounts(post.counts);
  }, [
    post.id,
    post.viewer.liked,
    post.viewer.reposted,
    post.viewer.bookmarked,
    post.counts.likes,
    post.counts.replies,
    post.counts.reposts,
  ]);

  React.useEffect(() => {
    if (!menu) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  async function toggleReaction() {
    if (busy) return;
    const next = !liked;
    const previous = counts.likes;
    setLiked(next);
    setCounts((value) => ({ ...value, likes: Math.max(0, value.likes + (next ? 1 : -1)) }));
    setBusy('reaction');
    setError(null);
    try {
      const response = await fetch(`/api/social/posts/${post.id}/reactions`, {
        method: next ? 'POST' : 'DELETE',
      });
      const payload = (await response.json().catch(() => null)) as
        | { liked?: boolean; count?: number; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Could not save your reaction.');
      if (payload?.count !== undefined) {
        setCounts((value) => ({ ...value, likes: payload.count ?? value.likes }));
      }
      router.refresh();
    } catch (cause) {
      setLiked(!next);
      setCounts((value) => ({ ...value, likes: previous }));
      setError(cause instanceof Error ? cause.message : 'Could not save your reaction.');
    } finally {
      setBusy(null);
    }
  }

  async function toggleRepost() {
    if (busy) return;
    const next = !reposted;
    const previous = counts.reposts;
    setReposted(next);
    setCounts((value) => ({ ...value, reposts: Math.max(0, value.reposts + (next ? 1 : -1)) }));
    setBusy('repost');
    setError(null);
    try {
      const response = await fetch(`/api/social/posts/${post.id}/reposts`, {
        method: next ? 'POST' : 'DELETE',
      });
      const payload = (await response.json().catch(() => null)) as
        | { reposted?: boolean; count?: number; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Could not repost this.');
      if (payload?.count !== undefined) {
        setCounts((value) => ({ ...value, reposts: payload.count ?? value.reposts }));
      }
      router.refresh();
    } catch (cause) {
      setReposted(!next);
      setCounts((value) => ({ ...value, reposts: previous }));
      setError(cause instanceof Error ? cause.message : 'Could not repost this.');
    } finally {
      setBusy(null);
    }
  }

  async function toggleBookmark() {
    if (busy) return;
    const next = !bookmarked;
    setBookmarked(next);
    setBusy('bookmark');
    setError(null);
    try {
      const response = await fetch(`/api/social/posts/${post.id}/bookmark`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not update your bookmarks.');
      }
      router.refresh();
    } catch (cause) {
      setBookmarked(!next);
      setError(cause instanceof Error ? cause.message : 'Could not update your bookmarks.');
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${post.author.displayName} on iSchoolie`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setError('Could not open the share sheet. Copy the address bar instead.');
    }
  }

  async function remove() {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setBusy('delete');
    setError(null);
    try {
      const response = await fetch(`/api/social/posts/${post.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not delete the post.');
      }
      setMenu(false);
      if (onDeleted) onDeleted();
      else router.refresh();
      if (detail) router.push('/feed');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the post.');
    } finally {
      setBusy(null);
    }
  }

  async function blockOrMute(kind: 'blocks' | 'mutes') {
    const verb = kind === 'blocks' ? 'Block' : 'Mute';
    if (!window.confirm(`${verb} @${post.author.handle}?`)) return;
    setBusy(kind);
    try {
      const response = await fetch(`/api/social/${kind}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId: post.author.id }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Could not ${verb.toLowerCase()} this account.`);
      }
      setMenu(false);
      if (kind === 'blocks') router.push('/feed');
      else router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this account.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <article
      className={cn(
        'bg-surface transition-colors',
        detail ? 'px-4 py-4 sm:px-6' : 'px-4 py-3.5 sm:px-5',
        !detail && 'border-b border-line',
      )}
    >
      {repostedBy && (
        <div className="mb-2 flex items-center gap-1.5 pl-11 text-xs font-medium text-subtle">
          <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href={`/u/${repostedBy.handle}`} className="hover:underline">
            {repostedBy.displayName}
          </Link>{' '}
          reposted
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/u/${post.author.handle}`}
          className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={`${post.author.displayName}'s profile`}
        >
          <Avatar
            name={post.author.displayName}
            src={post.author.photoUrl}
            size={compact ? 'sm' : 'md'}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <Link
                  href={`/u/${post.author.handle}`}
                  className="truncate text-sm font-semibold text-ink hover:underline"
                >
                  {post.author.displayName}
                </Link>
                {post.author.teacherVerified && (
                  <BadgeCheck
                    className="h-4 w-4 shrink-0 text-brand"
                    aria-label="Verified educator"
                  />
                )}
                <span className="truncate text-xs text-subtle">@{post.author.handle}</span>
                <span className="text-xs text-subtle" aria-hidden="true">
                  ·
                </span>
                <Link
                  href={`/post/${post.id}`}
                  className="text-xs text-subtle hover:underline"
                  title={new Date(post.createdAt).toLocaleString()}
                >
                  {relativeTime(post.createdAt)}
                </Link>
                {post.editedAt && <span className="text-2xs text-subtle">edited</span>}
                <span className="text-subtle" title={post.audience === 'public' ? 'Public' : 'Followers'}>
                  {post.audience === 'public' ? (
                    <Globe2 className="h-3.5 w-3.5" aria-label="Public post" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" aria-label="Followers-only post" />
                  )}
                </span>
              </div>
            </div>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                aria-label="Post options"
                aria-haspopup="menu"
                aria-expanded={menu}
                onClick={() => setMenu((value) => !value)}
                className="rounded-full p-1.5 text-subtle transition hover:bg-mutedSurface hover:text-ink"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
              {menu && (
                <div
                  role="menu"
                  className="absolute right-0 top-8 z-30 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lift"
                >
                  {post.viewer.canEdit && (
                    <Link
                      href={`/compose?edit=${post.id}`}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-mutedSurface"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Edit post
                    </Link>
                  )}
                  <Link
                    href={`/compose?quote=${post.id}`}
                    role="menuitem"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-mutedSurface"
                  >
                    <Quote className="h-4 w-4" aria-hidden="true" /> Quote post
                  </Link>
                  {post.viewer.canDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void remove()}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger/5"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete post
                    </button>
                  )}
                  {!post.viewer.canDelete && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void blockOrMute('mutes')}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-mutedSurface"
                      >
                        <VolumeX className="h-4 w-4" aria-hidden="true" /> Mute account
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void blockOrMute('blocks')}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-mutedSurface"
                      >
                        <UserX className="h-4 w-4" aria-hidden="true" /> Block account
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      setReporting(true);
                    }}
                    className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-sm text-ink hover:bg-mutedSurface"
                  >
                    <Flag className="h-4 w-4" aria-hidden="true" /> Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {post.body && (
            <RichText
              text={post.body}
              className={cn(
                'mt-1 text-[0.95rem] leading-relaxed text-ink',
                detail ? 'text-base' : '',
              )}
            />
          )}

          {post.topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.slug}`}
                  className="rounded-full bg-brand/8 px-2.5 py-1 text-2xs font-semibold text-brand transition hover:bg-brand/15"
                >
                  {topic.name}
                </Link>
              ))}
            </div>
          )}

          <PostMedia media={post.media} />
          {post.quote && <QuoteCard quote={post.quote} />}

          {error && (
            <p role="alert" className="mt-2 text-xs font-medium text-danger">
              {error}
            </p>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-1">
            <div className="-ml-1.5 flex items-center gap-0.5">
              <Link
                href={`/post/${post.id}#reply`}
                className="group inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs text-subtle transition hover:bg-brand/10 hover:text-brand"
                aria-label={`Reply${counts.replies ? `, ${counts.replies} replies` : ''}`}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span className="tabular-nums">{formatCount(counts.replies)}</span>
              </Link>

              <button
                type="button"
                onClick={() => void toggleRepost()}
                disabled={busy !== null}
                aria-pressed={reposted}
                aria-label={reposted ? 'Undo repost' : 'Repost'}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs transition hover:bg-success/10 hover:text-success',
                  reposted ? 'text-success' : 'text-subtle',
                )}
              >
                <Repeat2 className="h-4 w-4" aria-hidden="true" />
                <span className="tabular-nums">{formatCount(counts.reposts)}</span>
              </button>

              <button
                type="button"
                onClick={() => void toggleReaction()}
                disabled={busy !== null}
                aria-pressed={liked}
                aria-label={liked ? 'Remove like' : 'Like post'}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs transition hover:bg-danger/10 hover:text-danger',
                  liked ? 'text-danger' : 'text-subtle',
                )}
              >
                <Heart className={cn('h-4 w-4', liked && 'fill-current')} aria-hidden="true" />
                <span className="tabular-nums">{formatCount(counts.likes)}</span>
              </button>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => void toggleBookmark()}
                disabled={busy !== null}
                aria-pressed={bookmarked}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
                className={cn(
                  'rounded-full p-2 transition hover:bg-brand/10 hover:text-brand',
                  bookmarked ? 'text-brand' : 'text-subtle',
                )}
              >
                <Bookmark
                  className={cn('h-4 w-4', bookmarked && 'fill-current')}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={() => void share()}
                aria-label="Share post"
                className="rounded-full p-2 text-subtle transition hover:bg-brand/10 hover:text-brand"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </button>
              {copied && (
                <span role="status" className="text-2xs font-medium text-success">
                  Link copied
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {reporting && (
        <ReportDialog
          targetType={post.replyToId ? 'reply' : 'post'}
          targetId={post.id}
          targetLabel={`${post.author.displayName}: ${post.body.slice(0, 120)}`}
          onClose={() => setReporting(false)}
        />
      )}
    </article>
  );
}
