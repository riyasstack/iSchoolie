import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { listFollowRequests } from '@/lib/server/social/graph';
import { FollowRequestsPanel } from '@/components/social/follow-requests-panel';

export const metadata: Metadata = {
  title: 'Follow requests',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function FollowRequestsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/follow-requests' });
  const requests = await listFollowRequests(viewer);

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Follow requests</h1>
        <p className="text-xs text-subtle">
          Private accounts approve each new follower. Accepting a request does not grant access to
          institution records.
        </p>
      </header>
      <FollowRequestsPanel
        initialIncoming={requests.filter((request) => request.direction === 'incoming')}
        initialOutgoing={requests.filter((request) => request.direction === 'outgoing')}
      />
    </div>
  );
}
