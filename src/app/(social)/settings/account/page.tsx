import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ExternalLink, LogOut, ShieldCheck } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { SettingsShell } from '@/components/social/settings-shell';
import { formatDate } from '@/lib/utils/dates';

export const metadata: Metadata = {
  title: 'Account settings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const LINKS = [
  {
    href: '/account',
    title: 'iSchoolie account profile',
    copy: 'Application profile and private account details.',
  },
  {
    href: '/account/security',
    title: 'Security',
    copy: 'Sessions, sign-in methods and account protection.',
  },
  {
    href: '/account/providers',
    title: 'Linked providers',
    copy: 'Manage the identity providers connected through WorkOS.',
  },
  {
    href: '/account/privacy',
    title: 'Account privacy',
    copy: 'Application-level privacy and data controls.',
  },
];

export default async function AccountSettingsPage() {
  const viewer = await requireSocialViewer({ nextPath: '/settings/account' });

  return (
    <SettingsShell
      viewer={viewer}
      title="Account"
      description="WorkOS is the authentication authority. iSchoolie stores your social profile and activity in PostgreSQL."
    >
      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink">Local account</h2>
        <dl className="mt-2 grid gap-2.5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-subtle">Username</dt>
            <dd className="text-ink">@{viewer.user.handle}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-subtle">Email</dt>
            <dd className="break-anywhere text-ink">{viewer.user.email}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-subtle">Joined</dt>
            <dd className="text-ink">{formatDate(viewer.user.createdAt.toISOString())}</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wide text-subtle">Status</dt>
            <dd className="text-ink">{viewer.user.status}</dd>
          </div>
        </dl>
        <p className="mt-3 flex items-start gap-1.5 text-2xs leading-relaxed text-subtle">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
          Your email is never shown on your social profile and is not used for contact discovery.
        </p>
      </section>

      <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 bg-surface px-4 py-3.5 hover:bg-mutedSurface/50"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{item.title}</span>
              <span className="mt-0.5 block text-2xs text-subtle">{item.copy}</span>
            </span>
            {item.href.startsWith('/account') ? (
              <ChevronRight className="h-4 w-4 text-subtle" aria-hidden="true" />
            ) : (
              <ExternalLink className="h-4 w-4 text-subtle" aria-hidden="true" />
            )}
          </Link>
        ))}
      </div>

      <a
        href="/sign-out"
        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger hover:bg-danger/10"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sign out
      </a>
    </SettingsShell>
  );
}
