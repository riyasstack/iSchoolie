import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getNotificationPreferences } from '@/lib/server/social/notifications';
import { SettingsShell } from '@/components/social/settings-shell';
import { NotificationPreferencesForm } from '@/components/social/notification-preferences-form';

export const metadata: Metadata = {
  title: 'Notification settings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/settings/notifications' });
  const preferences = await getNotificationPreferences(viewer);

  return (
    <SettingsShell
      viewer={viewer}
      title="Notification settings"
      description="These preferences are checked before a notification row is written, so muted activity cannot leak through counts."
    >
      <NotificationPreferencesForm initial={preferences} />
    </SettingsShell>
  );
}
