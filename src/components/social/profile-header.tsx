import Link from 'next/link';
import { BadgeCheck, CalendarDays, Globe2, Lock, MapPin, Link2 } from 'lucide-react';
import { Avatar } from '@/components/ui/empty-state';
import { ProfileActions } from '@/components/social/profile-actions';
import { formatDate } from '@/lib/utils/dates';
import type { PersonProfile } from '@/lib/social/types';

export function ProfileHeader({
  profile,
  isSelf,
  isBlocked,
  isMuted,
}: {
  profile: PersonProfile;
  isSelf: boolean;
  isBlocked: boolean;
  isMuted: boolean;
}) {
  const followerHref = `/u/${profile.handle}/followers`;
  const followingHref = `/u/${profile.handle}/following`;

  return (
    <header className="bg-surface">
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-plum via-[#3b3f7a] to-brand sm:h-44">
        {profile.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
      </div>

      <div className="px-4 pb-4 sm:px-5">
        <div className="-mt-12 flex items-end justify-between gap-3">
          <div className="rounded-full border-4 border-surface bg-surface">
            <Avatar name={profile.displayName} src={profile.photoUrl} size="lg" />
          </div>
          <div className="mb-1">
            <ProfileActions
              targetId={profile.id}
              handle={profile.handle}
              displayName={profile.displayName}
              followState={profile.followState}
              canFollow={profile.canFollow}
              isSelf={isSelf}
              isBlocked={isBlocked}
              isMuted={isMuted}
            />
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{profile.displayName}</h1>
            {profile.teacherVerified && (
              <BadgeCheck className="h-5 w-5 text-brand" aria-label="Verified educator" />
            )}
            {profile.isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-mutedSurface px-2 py-0.5 text-2xs font-semibold text-subtle">
                <Lock className="h-3 w-3" aria-hidden="true" /> Private
              </span>
            )}
          </div>
          <p className="text-sm text-subtle">@{profile.handle}</p>
          <p className="mt-1 text-xs font-medium text-brand">
            {profile.roleLabel}
            {profile.stageLabel ? ` · ${profile.stageLabel}` : ''}
          </p>
        </div>

        {profile.headline && (
          <p className="mt-2 text-sm font-medium text-ink">{profile.headline}</p>
        )}

        {profile.bio ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{profile.bio}</p>
        ) : (
          !profile.canViewContent && (
            <p className="mt-2 flex items-center gap-1.5 rounded-xl border border-line bg-mutedSurface/50 px-3 py-2 text-xs text-subtle">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              This account is private. Follow to see their posts and network.
            </p>
          )
        )}

        {profile.interests.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 6).map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-brand/8 px-2.5 py-0.5 text-2xs font-medium text-brand"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
          {profile.region && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {profile.region}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="inline-flex max-w-[220px] items-center gap-1 truncate font-medium text-brand hover:underline"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Joined {formatDate(profile.joinedAt)}
          </span>
          {profile.isPrivate && (
            <span className="inline-flex items-center gap-1">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              Discoverable profile
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-subtle">
            <strong className="font-semibold tabular-nums text-ink">{profile.followingCount}</strong>{' '}
            Following
          </span>
          {profile.showFollowers || isSelf ? (
            <Link href={followerHref} className="text-subtle hover:underline">
              <strong className="font-semibold tabular-nums text-ink">
                {profile.followerCount}
              </strong>{' '}
              Followers
            </Link>
          ) : (
            <span className="text-subtle">
              <strong className="font-semibold tabular-nums text-ink">
                {profile.followerCount}
              </strong>{' '}
              Followers
            </span>
          )}
          {profile.showFollowing || isSelf ? (
            <Link
              href={followingHref}
              className="text-xs font-medium text-brand hover:underline"
            >
              View following
            </Link>
          ) : null}
        </div>

        {profile.mutualCount > 0 && (
          <p className="mt-2 text-xs text-subtle">
            Followed by{' '}
            <span className="font-medium text-ink">{profile.mutualNames.join(', ')}</span>
            {profile.mutualCount > profile.mutualNames.length
              ? ` and ${profile.mutualCount - profile.mutualNames.length} more`
              : ''}
          </p>
        )}
      </div>
    </header>
  );
}
