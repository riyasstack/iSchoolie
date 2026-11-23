import type { Metadata } from 'next';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getDiscoverability } from '@/lib/server/social/profiles';
import { SettingsShell } from '@/components/social/settings-shell';
import { DiscoverabilityForm } from '@/components/social/discoverability-form';

export const metadata: Metadata = {
  title: 'Discoverability',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DiscoverabilitySettingsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/settings/privacy/discoverability' });
  const settings = await getDiscoverability(viewer);

  return (
    <SettingsShell
      viewer={viewer}
      title="Discoverability"
      description="These choices are enforced in search and recommendation queries, before any result is returned."
    >
      <DiscoverabilityForm initial={settings} isMinor={viewer.user.isMinor} />
    </SettingsShell>
  );
}
