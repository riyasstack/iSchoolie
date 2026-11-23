import { requireSocialViewer } from '@/lib/server/social/auth';
import { listNotifications } from '@/lib/server/social/notifications';
import { NotificationsPanel } from '@/components/social/notifications-panel';

export const dynamic = 'force-dynamic';

export default async function MentionsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/notifications/mentions' });
  const page = await listNotifications(viewer, { limit: 20, mentionsOnly: true });

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Mentions</h1>
        <p className="text-xs text-subtle">Eligible posts that mention @{viewer.user.handle}.</p>
      </header>
      <NotificationsPanel initialPage={page} mentionsOnly />
    </div>
  );
}
