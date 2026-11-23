import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getProfileByHandle } from '@/lib/server/social/profiles';
import { listFollowing } from '@/lib/server/social/graph';
import { PeopleList } from '@/components/social/people-list';
import { SocialEmptyState } from '@/components/social/social-empty';
import { Avatar } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const viewer = await requireSocialViewer({ nextPath: `/u/${(await params).username}/following` });
  const { username } = await params;
  const data = await getProfileByHandle(viewer, username);
  if (!data) notFound();

  const result = await listFollowing(viewer, data.profile.handle, null, 20);

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-3 sm:px-5">
        <Link
          href={`/u/${data.profile.handle}`}
          className="inline-flex items-center gap-1 text-2xs font-semibold text-subtle hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to profile
        </Link>
        <div className="mt-2 flex items-center gap-2.5">
          <Avatar name={data.profile.displayName} src={data.profile.photoUrl} size="sm" />
          <div>
            <h1 className="text-lg font-semibold text-ink">Following</h1>
            <p className="text-xs text-subtle">
              @{data.profile.handle} follows {data.profile.followingCount}
            </p>
          </div>
        </div>
      </header>

      {result.restricted ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <Lock className="mx-auto h-5 w-5 text-subtle" aria-hidden="true" />
          <h2 className="mt-2 text-base font-semibold text-ink">This list is private</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-subtle">
            @{data.profile.handle} has chosen not to show who they follow.
          </p>
        </div>
      ) : (
        <PeopleList
          initialPage={result.page}
          endpoint={`/api/social/people/${data.profile.handle}/following`}
          compact
          empty={
            <SocialEmptyState
              title="Not following anyone yet"
              description={
                data.isSelf
                  ? 'Follow educators and peers to build a Following feed that is yours.'
                  : 'When this account follows people, they appear here.'
              }
              actions={
                data.isSelf
                  ? [{ href: '/connect/people', label: 'Discover people', variant: 'primary' }]
                  : []
              }
            />
          }
        />
      )}
    </div>
  );
}
