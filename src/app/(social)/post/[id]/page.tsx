import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { requireSocialViewer, toSocialViewer } from '@/lib/server/social/auth';
import { getPostDetail } from '@/lib/server/social/posts';
import { listTopics } from '@/lib/server/social/topics';
import { PostCard } from '@/components/social/post-card';
import { PostComposer } from '@/components/social/post-composer';
import { ThreadReplies } from '@/components/social/thread-replies';
import { SocialEmptyState } from '@/components/social/social-empty';

export const dynamic = 'force-dynamic';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireSocialViewer({ nextPath: `/post/${id}` });
  const detail = await getPostDetail(viewer, id);
  if (!detail) notFound();

  const topics = await listTopics(viewer);

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="sticky top-14 z-30 flex items-center gap-3 border-b border-line bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-5 lg:top-0">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="rounded-full p-1.5 text-subtle hover:bg-mutedSurface hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-ink">Post</h1>
          <p className="text-2xs text-subtle">Conversation</p>
        </div>
      </header>

      {detail.ancestors.length > 0 && (
        <div className="border-b border-line bg-mutedSurface/20">
          {detail.ancestors.map((ancestor) => (
            <PostCard key={ancestor.id} post={ancestor} compact />
          ))}
        </div>
      )}

      <PostCard post={detail.post} detail />

      {detail.post.viewer.canReply && (
        <div id="reply" className="scroll-mt-20 border-y border-line bg-surface px-4 py-3 sm:px-5">
          <PostComposer
            viewer={toSocialViewer(viewer)}
            topics={topics.map((topic) => ({ slug: topic.slug, name: topic.name }))}
            mode="reply"
            replyToId={detail.post.id}
            compact
            autoFocus={false}
          />
        </div>
      )}

      <section>
        <h2 className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-ink sm:px-5">
          <MessageCircle className="h-4 w-4 text-subtle" aria-hidden="true" />
          {detail.post.counts.replies}{' '}
          {detail.post.counts.replies === 1 ? 'reply' : 'replies'}
        </h2>
        {detail.replies.length === 0 ? (
          <SocialEmptyState
            title="No replies yet"
            description="Ask a follow-up question or add useful context to this conversation."
          />
        ) : (
          <ThreadReplies
            postId={detail.post.id}
            initialReplies={detail.replies}
            hasMore={detail.hasMoreReplies}
          />
        )}
      </section>
    </div>
  );
}
