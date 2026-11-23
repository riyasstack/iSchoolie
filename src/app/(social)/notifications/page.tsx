import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { listNotifications } from '@/lib/server/social/notifications';
import { NotificationsPanel } from '@/components/social/notifications-panel';

export const metadata: Metadata = {
  title: 'Notifications',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/notifications' });
  const page = await listNotifications(viewer, { limit: 20 });

  return (
    <div className="bg-surface sm:my-4 sm:rounded-2xl sm:border sm:border-line">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Notifications</h1>
        <p className="text-xs text-subtle">
          Follows, replies, reactions and mentions from your education network.
        </p>
      </header>
      <NotificationsPanel initialPage={page} />
    </div>
  );
}
