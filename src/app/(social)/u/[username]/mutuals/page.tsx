import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getProfileByHandle } from '@/lib/server/social/profiles';
import { listMutuals } from '@/lib/server/social/graph';
import { PeopleList } from '@/components/social/people-list';
import { SocialEmptyState } from '@/components/social/social-empty';

export const dynamic = 'force-dynamic';

export default async function MutualsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const viewer = await requireSocialViewer({ nextPath: `/u/${(await params).username}/mutuals` });
  const { username } = await params;
  const data = await getProfileByHandle(viewer, username);
  if (!data) notFound();

  const result = await listMutuals(viewer, data.profile.handle, 40);

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-3 sm:px-5">
        <Link
          href={`/u/${data.profile.handle}`}
          className="inline-flex items-center gap-1 text-2xs font-semibold text-subtle hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to profile
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink">Mutual connections</h1>
        <p className="text-xs text-subtle">
          Accounts you and @{data.profile.handle} both follow, where disclosure is permitted.
        </p>
      </header>

      {result.restricted ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <Users className="mx-auto h-5 w-5 text-subtle" aria-hidden="true" />
          <h2 className="mt-2 text-base font-semibold text-ink">Mutual connections are private</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-subtle">
            Mutual connections are shown only when both accounts allow their network to be seen and
            safeguarding rules permit disclosure.
          </p>
        </div>
      ) : result.page.items.length === 0 ? (
        <div className="px-4 py-5 sm:px-5">
          <SocialEmptyState
            title="No mutual connections yet"
            description="You do not yet follow anyone in common with this account."
            actions={[{ href: '/connect/people', label: 'Discover people', variant: 'secondary' }]}
          />
        </div>
      ) : (
        <PeopleList
          initialPage={result.page}
          endpoint={`/api/social/people/${data.profile.handle}/mutuals`}
          compact
          empty={null}
        />
      )}
    </div>
  );
}
