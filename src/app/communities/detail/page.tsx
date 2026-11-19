'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { Flag, MessageCircle, Send } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Textarea } from '@/components/ui/field';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useQueryParam } from '@/hooks/use-query-param';
import { useToast } from '@/components/ui/toast';
import {
  addComment,
  createPost,
  getCommunity,
  isCommunityMember,
  joinCommunity,
  listComments,
  listPosts,
  reportContent,
} from '@/lib/services/community';
import { relativeTime } from '@/lib/utils/dates';
import type { Comment, Community, Post } from '@/lib/models';

function CommunityDetail() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const communityId = useQueryParam('communityId');
  const [body, setBody] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openComments, setOpenComments] = React.useState<Record<string, boolean>>({});

  const community = useAsync<Community | null>(
    () => (communityId ? getCommunity(communityId) : Promise.resolve(null)),
    [communityId],
    null,
  );
  const posts = useAsync<Post[]>(
    () => (communityId ? listPosts(communityId) : Promise.resolve([])),
    [communityId],
    [],
  );
  const member = useAsync<boolean>(
    () => (communityId && user ? isCommunityMember(communityId, user.uid) : Promise.resolve(false)),
    [communityId, user?.uid],
    false,
  );

  if (!communityId) return <Alert variant="warning" title="Community not specified">Open a community from the list.</Alert>;
  if (community.status === 'loading') return <SkeletonCard rows={4} />;
  if (!community.data) {
    return (
      <Alert variant="danger" title="Community unavailable" role="alert">
        This community is institution-scoped and you are not an active member of that institution.
      </Alert>
    );
  }

  const data = community.data;

  async function join() {
    if (!user || !profile || busy) return;
    setBusy(true);
    try {
      await joinCommunity(data.id, { uid: user.uid, displayName: profile.displayName });
      member.reload();
      toast({ title: `Joined ${data.name}`, variant: 'success' });
    } catch {
      toast({ title: 'Could not join', variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!user || !profile || busy) return;
    if (body.trim().length < 2) {
      setError('Write something first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createPost(data.id, body.trim(), { uid: user.uid, displayName: profile.displayName });
      setBody('');
      posts.reload();
      community.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not publish the post.');
    } finally {
      setBusy(false);
    }
  }

  async function report(post: Post) {
    if (!user) return;
    try {
      await reportContent(user.uid, {
        targetType: 'post',
        targetPath: `communities/${data.id}/posts/${post.id}`,
        targetOwnerUid: post.authorUid,
        reason: 'other',
        details: 'Reported from the community feed',
      });
      toast({
        title: 'Report sent',
        description: 'The iSchoolie moderation team will review it.',
        variant: 'success',
      });
    } catch {
      toast({ title: 'Could not send the report', variant: 'danger' });
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title={data.name}
        description={data.description}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={data.visibility === 'public' ? 'neutral' : 'brand'}>{data.visibility}</Badge>
            {!member.data && <Button size="sm" loading={busy} onClick={() => void join()}>Join</Button>}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {member.data ? (
            <Card>
              <CardHeader title="Share with the community" />
              <CardBody className="space-y-3">
                {error && <Alert variant="danger" role="alert">{error}</Alert>}
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Ask a question, share a resource…"
                  aria-label="Post body"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xs text-subtle">{body.length}/2000</span>
                  <Button size="sm" loading={busy} onClick={() => void publish()} icon={<Send className="h-3.5 w-3.5" />}>
                    Post
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Alert variant="neutral" title="Join to post">
              Anyone signed in can read a public community. Posting requires membership.
            </Alert>
          )}

          {posts.status === 'loading' && <SkeletonCard rows={4} />}
          {posts.status === 'error' && <Alert variant="danger" role="alert">Could not load posts.</Alert>}
          {posts.status === 'success' && posts.data.length === 0 && (
            <EmptyState title="No posts yet" description="Start the conversation." />
          )}

          {posts.data.map((post) => (
            <Card key={post.id}>
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{post.authorName}</p>
                  <span className="text-2xs text-subtle">{relativeTime(post.createdAt as never)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink">{post.body}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-subtle hover:text-ink"
                    onClick={() => setOpenComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
                    aria-expanded={Boolean(openComments[post.id])}
                  >
                    <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" /> {post.commentCount} comments
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-subtle hover:text-danger"
                    onClick={() => void report(post)}
                  >
                    <Flag aria-hidden="true" className="h-3.5 w-3.5" /> Report
                  </button>
                </div>
                {openComments[post.id] && user && (
                  <CommentSection communityId={data.id} postId={post.id} onAdded={() => posts.reload()} />
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader title="Community rules" />
          <CardBody className="space-y-2 text-xs text-subtle">
            <p>Be respectful. Harassment and spam are removed.</p>
            <p>Do not share another learner&apos;s private information.</p>
            <p>Guardians and students can report any post. Reports go to the moderation queue.</p>
            <p>
              Institution-only communities are readable only by active members of that institution —
              enforced by Security Rules, not by hiding the link.
            </p>
            <Link href="/communities" className={buttonClass('outline', 'sm', 'mt-2 w-full')}>
              All communities
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function CommentSection({
  communityId,
  postId,
  onAdded,
}: {
  communityId: string;
  postId: string;
  onAdded: () => void;
}) {
  const { user, profile } = useAuth();
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const comments = useAsync<Comment[]>(
    () => listComments(communityId, postId),
    [communityId, postId],
    [],
  );

  async function submit() {
    if (!user || !profile || busy || text.trim().length === 0) return;
    setBusy(true);
    try {
      await addComment(communityId, postId, text.trim(), { uid: user.uid, displayName: profile.displayName });
      setText('');
      comments.reload();
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 border-t border-line pt-3">
      {comments.status === 'success' && comments.data.length === 0 && (
        <p className="text-xs text-subtle">No comments yet.</p>
      )}
      <ul className="space-y-2">
        {comments.data.map((comment) => (
          <li key={comment.id} className="rounded-lg bg-mutedSurface/60 p-2">
            <p className="text-xs font-semibold text-ink">{comment.authorName}</p>
            <p className="text-xs text-ink">{comment.body}</p>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={1000}
          placeholder="Add a comment"
          aria-label="Add a comment"
          className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
        <Button size="sm" loading={busy} onClick={() => void submit()}>Reply</Button>
      </div>
    </div>
  );
}

export default function CommunityDetailPage() {
  return (
    <RequireAuth>
      <AppShell title="Community">
        <Suspense fallback={<SkeletonCard rows={4} />}>
          <CommunityDetail />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}
