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

export default async function ProfileRepliesPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const viewer = await requireSocialViewer({ nextPath: `/u/${(await params).username}/replies` });
  const { username } = await params;
  const data = await getProfileByHandle(viewer, username);
  if (!data) notFound();

  const [meta, feed] = await Promise.all([
    getProfileMeta(viewer, data.targetId),
    data.canViewContent
      ? getPostsByAuthor(viewer, data.targetId, 'replies', null, 20)
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
        <PostList
          initialPage={feed}
          endpoint={`/api/social/profiles/${data.profile.handle}/posts?tab=replies`}
          empty={
            <SocialEmptyState
              title="No replies yet"
              description="Replies from this account appear here."
            />
          }
          storageKey={`profile-${data.profile.handle}-replies`}
        />
      ) : (
        <div className="px-4 py-10 text-center text-sm text-subtle sm:px-5">
          <Lock className="mx-auto h-5 w-5" aria-hidden="true" />
          <p className="mt-2">Follow this private account to see their replies.</p>
        </div>
      )}
    </div>
  );
}
