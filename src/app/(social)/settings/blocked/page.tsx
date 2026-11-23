import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { listBlocked } from '@/lib/server/social/graph';
import { SettingsShell } from '@/components/social/settings-shell';
import { AccountManager } from '@/components/social/account-manager';

export const metadata: Metadata = {
  title: 'Blocked accounts',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BlockedAccountsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/settings/blocked' });
  const people = await listBlocked(viewer);

  return (
    <SettingsShell
      viewer={viewer}
      title="Blocked accounts"
      description="Blocking is mutual: it removes follow relationships in both directions and hides each account from the other in feeds, search and recommendations."
    >
      <AccountManager kind="blocked" initial={people} />
    </SettingsShell>
  );
}
