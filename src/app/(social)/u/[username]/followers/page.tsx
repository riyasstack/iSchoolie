import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getProfileByHandle } from '@/lib/server/social/profiles';
import { listFollowers } from '@/lib/server/social/graph';
import { PeopleList } from '@/components/social/people-list';
import { SocialEmptyState } from '@/components/social/social-empty';
import { Avatar } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const viewer = await requireSocialViewer({ nextPath: `/u/${(await params).username}/followers` });
  const { username } = await params;
  const data = await getProfileByHandle(viewer, username);
  if (!data) notFound();

  const result = await listFollowers(viewer, data.profile.handle, null, 20);

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
            <h1 className="text-lg font-semibold text-ink">Followers</h1>
            <p className="text-xs text-subtle">
              @{data.profile.handle} · {data.profile.followerCount}{' '}
              {data.profile.followerCount === 1 ? 'follower' : 'followers'}
            </p>
          </div>
        </div>
      </header>

      {result.restricted ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <Lock className="mx-auto h-5 w-5 text-subtle" aria-hidden="true" />
          <h2 className="mt-2 text-base font-semibold text-ink">This list is private</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-subtle">
            @{data.profile.handle} has chosen not to show their followers, or this account is private.
          </p>
        </div>
      ) : (
        <PeopleList
          initialPage={result.page}
          endpoint={`/api/social/people/${data.profile.handle}/followers`}
          compact
          empty={
            <SocialEmptyState
              title="No followers yet"
              description="When people follow this account, they appear here."
              actions={
                data.isSelf
                  ? [{ href: '/connect/people', label: 'Find people to follow', variant: 'secondary' }]
                  : []
              }
            />
          }
        />
      )}
    </div>
  );
}
