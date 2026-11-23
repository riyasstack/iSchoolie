import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Lock } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getProfileByHandle, getProfileMeta } from '@/lib/server/social/profiles';
import { getPostsByAuthor } from '@/lib/server/social/posts';
import { ProfileHeader } from '@/components/social/profile-header';
import { ProfileTabs } from '@/components/social/profile-tabs';
import { PostList } from '@/components/social/post-list';
import { SocialEmptyState } from '@/components/social/social-empty';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}`,
    robots: { index: false, follow: false },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const viewer = await requireSocialViewer({ nextPath: `/u/${(await params).username}` });
  const { username } = await params;
  const data = await getProfileByHandle(viewer, username);
  if (!data) notFound();

  const [meta, feed] = await Promise.all([
    getProfileMeta(viewer, data.targetId),
    data.canViewContent
      ? getPostsByAuthor(viewer, data.targetId, 'posts', null, 20)
      : Promise.resolve({ items: [], nextCursor: null }),
  ]);

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <ProfileHeader
        profile={data.profile}
        isSelf={data.isSelf}
        isBlocked={meta.isBlocked}
        isMuted={meta.isMuted}
      />
      <ProfileTabs handle={data.profile.handle} />

      {data.canViewContent ? (
        feed.items.length === 0 ? (
          <div className="px-4 py-5 sm:px-5">
            <SocialEmptyState
              title={data.isSelf ? 'You have not posted yet' : 'No posts yet'}
              description={
                data.isSelf
                  ? 'Share a question, an achievement or something you are learning.'
                  : 'When this account publishes an eligible post, it appears here.'
              }
              actions={
                data.isSelf
                  ? [{ href: '/compose', label: 'Create your first post', variant: 'primary' }]
                  : []
              }
            />
          </div>
        ) : (
          <PostList
            initialPage={feed}
            endpoint={`/api/social/profiles/${data.profile.handle}/posts?tab=posts`}
            empty={
              <SocialEmptyState
                title="No posts yet"
                description="This account has not published an eligible post."
              />
            }
            storageKey={`profile-${data.profile.handle}-posts`}
          />
        )
      ) : (
        <div className="px-4 py-10 text-center sm:px-5">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-mutedSurface text-subtle">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-semibold text-ink">This account is private</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-subtle">
            Follow this account to see their posts, replies and media. Their followers list stays
            hidden until they approve your request.
          </p>
        </div>
      )}
    </div>
  );
}
