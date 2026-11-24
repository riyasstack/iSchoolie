'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, ImagePlus, Lock, Globe2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';
import { POST_MAX_LENGTH, POST_MAX_MEDIA } from '@/lib/social/catalog';
import type { PostView, SocialViewer } from '@/lib/social/types';

interface UploadedMedia {
  id: string;
  url: string;
  kind: 'image' | 'document';
}

const DRAFT_KEY = 'ischoolie:compose-draft';

export function PostComposer({
  viewer,
  topics,
  mode = 'create',
  replyToId,
  quoteOf,
  editPost,
  redirectTo,
  onPosted,
  compact = false,
  autoFocus = false,
}: {
  viewer: Pick<SocialViewer, 'displayName' | 'handle' | 'photoUrl' | 'isMinor'>;
  topics: Array<{ slug: string; name: string }>;
  mode?: 'create' | 'reply' | 'quote' | 'edit';
  replyToId?: string;
  quoteOf?: { id: string; author: string; body: string };
  editPost?: { id: string; body: string; audience: 'public' | 'followers' | 'private'; topicSlugs: string[] };
  redirectTo?: string;
  onPosted?: (post: PostView) => void;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState(editPost?.body ?? '');
  const [audience, setAudience] = React.useState<'public' | 'followers' | 'private'>(
    viewer.isMinor
      ? 'followers'
      : editPost?.audience ?? (mode === 'reply' || mode === 'quote' ? 'public' : 'public'),
  );
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>(
    editPost?.topicSlugs ?? [],
  );
  const [media, setMedia] = React.useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draftRestored, setDraftRestored] = React.useState(false);
  const [draftSaved, setDraftSaved] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const textRef = React.useRef<HTMLTextAreaElement>(null);
  const skipDraft = mode !== 'create' || Boolean(editPost);

  React.useEffect(() => {
    if (autoFocus) textRef.current?.focus();
  }, [autoFocus]);

  React.useEffect(() => {
    if (skipDraft || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        body?: string;
        audience?: string;
        topics?: string[];
      };
      if (parsed.body) {
        setBody(parsed.body);
        if (parsed.audience === 'followers' || parsed.audience === 'private') {
          setAudience(parsed.audience);
        }
        if (Array.isArray(parsed.topics)) {
          setSelectedTopics(parsed.topics.filter((slug) => topics.some((t) => t.slug === slug)).slice(0, 5));
        }
        setDraftRestored(true);
      }
    } catch {
      // A corrupt draft must not block composing.
    }
  }, [skipDraft, topics]);

  React.useEffect(() => {
    if (skipDraft || typeof window === 'undefined') return;
    if (!body.trim() && selectedTopics.length === 0) {
      window.localStorage.removeItem(DRAFT_KEY);
      return;
    }
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ body, audience, topics: selectedTopics }),
      );
      setDraftSaved(true);
      window.setTimeout(() => setDraftSaved(false), 1600);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [body, audience, selectedTopics, skipDraft]);

  function toggleTopic(slug: string) {
    setSelectedTopics((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : current.length >= 5
          ? current
          : [...current, slug],
    );
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = POST_MAX_MEDIA - media.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${POST_MAX_MEDIA} files.`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        const form = new FormData();
        form.set('file', file);
        form.set('alt', file.name);
        const response = await fetch('/api/social/media', { method: 'POST', body: form });
        const payload = (await response.json().catch(() => null)) as
          | { id?: string; url?: string; kind?: string; error?: string }
          | null;
        if (!response.ok || !payload?.id || !payload.url) {
          throw new Error(payload?.error ?? `Could not upload ${file.name}.`);
        }
        setMedia((current) => [
          ...current,
          {
            id: payload.id as string,
            url: payload.url as string,
            kind: payload.kind === 'document' ? 'document' : 'image',
          },
        ]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload that file.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!body.trim() && media.length === 0 && mode !== 'quote') {
      setError('Write something or attach media before publishing.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const isEdit = Boolean(editPost);
      const response = await fetch(
        isEdit ? `/api/social/posts/${editPost?.id}` : '/api/social/posts',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            body,
            audience,
            topicSlugs: selectedTopics,
            mediaIds: media.map((item) => item.id),
            replyToId: replyToId ?? null,
            quoteOfId: quoteOf?.id ?? null,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { post?: PostView; error?: string }
        | null;
      if (!response.ok || !payload?.post) {
        throw new Error(payload?.error ?? 'Could not publish this post.');
      }

      if (!skipDraft && typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_KEY);
      setBody('');
      setMedia([]);
      setSelectedTopics([]);
      setDraftRestored(false);

      if (onPosted) onPosted(payload.post);
      if (isEdit) router.push(`/post/${payload.post.id}`);
      else if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not publish this post.');
    } finally {
      setBusy(false);
    }
  }

  const overLimit = body.length > POST_MAX_LENGTH;
  const disabled = busy || uploading || overLimit || (!body.trim() && media.length === 0 && mode !== 'quote');
  const heading =
    mode === 'reply'
      ? 'Post your reply'
      : mode === 'quote'
        ? 'Add a comment'
        : mode === 'edit'
          ? 'Edit post'
          : 'Share something educational';

  return (
    <form
      onSubmit={publish}
      className={cn(
        'bg-surface',
        compact ? 'px-0 py-0' : 'border-b border-line bg-bg px-4 py-4 sm:px-5',
      )}
      aria-label={heading}
    >
      {draftRestored && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn">
          <span>Draft restored from this device.</span>
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              setBody('');
              setSelectedTopics([]);
              setDraftRestored(false);
              window.localStorage.removeItem(DRAFT_KEY);
            }}
          >
            Discard
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar name={viewer.displayName} src={viewer.photoUrl} size={compact ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1">
          <textarea
            ref={textRef}
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, POST_MAX_LENGTH + 50))}
            placeholder={
              mode === 'reply'
                ? 'Post your reply'
                : mode === 'quote'
                  ? 'Add a comment'
                  : "What's happening?"
            }
            aria-label={heading}
            rows={compact ? 2 : 3}
            className="w-full resize-none border-0 bg-transparent px-0 py-1 text-[1.02rem] leading-relaxed text-ink placeholder:text-subtle/70 focus:outline-none focus-visible:ring-0"
          />

          {quoteOf && (
            <div className="mb-2 rounded-xl border border-line bg-mutedSurface/40 p-3">
              <p className="text-xs font-semibold text-ink">{quoteOf.author}</p>
              <p className="mt-1 line-clamp-3 text-sm text-subtle">{quoteOf.body}</p>
            </div>
          )}

          {media.length > 0 && (
            <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {media.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-xl border border-line">
                  {item.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="Attachment preview" className="h-24 w-full object-cover" />
                  ) : (
                    <div className="flex h-24 items-center justify-center gap-1 bg-mutedSurface text-xs text-subtle">
                      <FileText className="h-4 w-4" aria-hidden="true" /> PDF
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setMedia((current) => current.filter((m) => m.id !== item.id))}
                    aria-label="Remove attachment"
                    className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-white"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <p role="status" className="mb-2 flex items-center gap-2 text-xs text-subtle">
              <Spinner className="h-3.5 w-3.5" /> Uploading attachment…
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => {
              const active = selectedTopics.includes(topic.slug);
              return (
                <button
                  key={topic.slug}
                  type="button"
                  onClick={() => toggleTopic(topic.slug)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-2xs font-medium transition',
                    active
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-line bg-surface text-subtle hover:border-brand/40 hover:text-ink',
                  )}
                >
                  {topic.name}
                </button>
              );
            })}
          </div>

          {mode === 'create' && viewer.isMinor && (
            <p className="mt-2 flex items-center gap-1.5 text-2xs text-subtle">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Student posts are visible to your approved followers only.
            </p>
          )}

          {error && (
            <Alert variant="danger" className="mt-3" role="alert">
              {error}
            </Alert>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <div className="flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                multiple
                className="sr-only"
                onChange={(event) => void upload(event.target.files)}
                aria-label="Attach media"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || media.length >= POST_MAX_MEDIA}
                className="rounded-lg p-2 text-subtle transition hover:bg-brand/10 hover:text-brand disabled:opacity-40"
                aria-label="Add image or document"
                title="Add image or document"
              >
                <ImagePlus className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
              <label htmlFor={`audience-${mode}`} className="sr-only">
                Who can see this
              </label>
              <select
                id={`audience-${mode}`}
                value={audience}
                onChange={(event) =>
                  setAudience(event.target.value as 'public' | 'followers' | 'private')
                }
                className="h-9 rounded-lg border border-line bg-surface px-2 text-xs font-medium text-ink"
                disabled={viewer.isMinor}
              >
                {!viewer.isMinor && <option value="public">Public</option>}
                <option value="followers">Followers</option>
                <option value="private">Only me</option>
              </select>
              {audience === 'public' ? (
                <Globe2 className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'text-xs tabular-nums',
                  overLimit ? 'font-semibold text-danger' : 'text-subtle',
                )}
                aria-live="polite"
              >
                {body.length}/{POST_MAX_LENGTH}
              </span>
              {mode === 'create' && draftSaved && (
                <span className="text-2xs text-success" role="status">
                  Draft saved
                </span>
              )}
              <Button type="submit" size="sm" loading={busy} disabled={disabled}>
                {mode === 'reply'
                  ? 'Reply'
                  : mode === 'quote'
                    ? 'Quote post'
                    : mode === 'edit'
                      ? 'Save changes'
                      : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {mode !== 'create' && (
        <div className="mt-2 text-right">
          <Link
            href={replyToId ? `/post/${replyToId}` : '/feed'}
            className="text-xs text-subtle hover:underline"
          >
            Cancel
          </Link>
        </div>
      )}
    </form>
  );
}
