import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bell,
  ChevronRight,
  Eye,
  Flag,
  Lock,
  ShieldCheck,
  UserRound,
  UserX,
  VolumeX,
} from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { getProfileByHandle } from '@/lib/server/social/profiles';
import { getViewerInterestTopics } from '@/lib/server/social/topics';
import { SettingsShell } from '@/components/social/settings-shell';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/settings' });
  const [profile, interests] = await Promise.all([
    getProfileByHandle(viewer, viewer.user.handle),
    getViewerInterestTopics(viewer),
  ]);

  const links = [
    {
      href: '/settings/profile',
      icon: UserRound,
      title: 'Edit profile',
      copy: 'Display name, bio, headline, links, skills and learning interests.',
    },
    {
      href: '/settings/privacy',
      icon: Lock,
      title: 'Privacy',
      copy: 'Private account, follower visibility and network disclosure.',
    },
    {
      href: '/settings/privacy/discoverability',
      icon: Eye,
      title: 'Discoverability',
      copy: 'Search and recommendation visibility, and what education information is public.',
    },
    {
      href: '/settings/notifications',
      icon: Bell,
      title: 'Notification preferences',
      copy: 'Choose which social activity creates a notification.',
    },
    {
      href: '/settings/blocked',
      icon: UserX,
      title: 'Blocked accounts',
      copy: 'Review and unblock accounts.',
    },
    {
      href: '/settings/muted',
      icon: VolumeX,
      title: 'Muted accounts',
      copy: 'Review and unmute accounts hidden from your feeds.',
    },
    {
      href: '/settings/account',
      icon: ShieldCheck,
      title: 'Account',
      copy: 'Local iSchoolie account, security and sign-out links.',
    },
  ];

  return (
    <SettingsShell
      viewer={viewer}
      title="Settings"
      description="Control how your social profile appears, who can discover you, and what activity reaches you."
    >
      <section className="mb-4 rounded-2xl border border-line bg-mutedSurface/40 p-4">
        <p className="text-sm font-semibold text-ink">{profile?.profile.displayName ?? viewer.user.displayName}</p>
        <p className="text-xs text-subtle">@{viewer.user.handle}</p>
        <p className="mt-1 text-xs text-subtle">
          {profile?.profile.roleLabel}
          {profile?.profile.stageLabel ? ` · ${profile.profile.stageLabel}` : ''}
          {viewer.user.isMinor ? ' · Student protections on' : ''}
        </p>
        {interests.length > 0 && (
          <p className="mt-2 text-2xs text-subtle">
            Interests:{' '}
            <span className="font-medium text-ink">
              {interests.map((topic) => topic.name).join(', ')}
            </span>
          </p>
        )}
      </section>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 bg-surface px-4 py-3.5 transition hover:bg-mutedSurface/50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/8 text-brand">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{item.title}</span>
                <span className="mt-0.5 block text-2xs leading-relaxed text-subtle">{item.copy}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
            </Link>
          );
        })}
        {viewer.user.platformAdmin && (
          <Link
            href="/moderation"
            className="flex items-center gap-3 bg-surface px-4 py-3.5 transition hover:bg-mutedSurface/50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-danger/8 text-danger">
              <Flag className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">Moderation queue</span>
              <span className="mt-0.5 block text-2xs text-subtle">
                Review reports and record moderation decisions.
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
          </Link>
        )}
      </div>

      <p className="mt-4 text-center text-2xs text-subtle">
        WorkOS remains the sign-in authority; this page changes social settings only.
      </p>
    </SettingsShell>
  );
}
