import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getDiscoverability } from '@/lib/server/social/profiles';
import { SettingsShell } from '@/components/social/settings-shell';
import { PrivacyForm } from '@/components/social/privacy-form';

export const metadata: Metadata = {
  title: 'Privacy',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PrivacySettingsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/settings/privacy' });
  const settings = await getDiscoverability(viewer);

  return (
    <SettingsShell
      viewer={viewer}
      title="Privacy"
      description="Private accounts still receive follow requests. Following you never unlocks institution records."
    >
      <div className="space-y-4">
        <PrivacyForm
          initialPrivate={viewer.user.privateProfile}
          initialShowFollowers={settings.showFollowers}
          initialShowFollowing={settings.showFollowing}
          isMinor={viewer.user.isMinor}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/settings/privacy/discoverability"
            className="rounded-xl border border-line bg-surface p-3 text-sm font-semibold text-brand hover:bg-mutedSurface/50"
          >
            Discoverability controls →
          </Link>
          <Link
            href="/settings/blocked"
            className="rounded-xl border border-line bg-surface p-3 text-sm font-semibold text-brand hover:bg-mutedSurface/50"
          >
            Blocked and muted accounts →
          </Link>
        </div>
      </div>
    </SettingsShell>
  );
}
