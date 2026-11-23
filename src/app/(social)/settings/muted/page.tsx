import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { listMuted } from '@/lib/server/social/graph';
import { SettingsShell } from '@/components/social/settings-shell';
import { AccountManager } from '@/components/social/account-manager';

export const metadata: Metadata = {
  title: 'Muted accounts',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function MutedAccountsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/settings/muted' });
  const people = await listMuted(viewer);

  return (
    <SettingsShell
      viewer={viewer}
      title="Muted accounts"
      description="Muting hides an account from your feeds without telling them or changing your follow relationship."
    >
      <AccountManager kind="muted" initial={people} />
    </SettingsShell>
  );
}
