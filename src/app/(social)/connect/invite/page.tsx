import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Users } from 'lucide-react';
import { requireSocialViewer } from '@/lib/server/social/auth';
import { listInvitations } from '@/lib/server/social/invitations';
import { InviteForm } from '@/components/social/invite-form';

export const metadata: Metadata = {
  title: 'Invite People',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function InvitePage() {
  const viewer = await requireSocialViewer({ nextPath: '/connect/invite' });
  const invitations = await listInvitations(viewer);

  return (
    <div className="pb-6">
      <header className="border-b border-line bg-surface px-4 py-5 sm:px-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand">Connect</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
          Bring your learning network together
        </h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-subtle">
          Invite classmates, colleagues, educators or research collaborators. Invitations are always
          explicit, rate-limited and never imported from your address book.
        </p>
      </header>

      <div className="space-y-4 px-4 py-5 sm:px-5">
        <InviteForm initialInvitations={invitations} />

        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <ShieldCheck className="h-4 w-4 text-brand" aria-hidden="true" />
            How invitations work
          </h2>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-subtle">
            <li>• Each invitation is a single link tied to your account as the sender.</li>
            <li>• The recipient still needs their own WorkOS account; a link never grants access.</li>
            <li>• Email delivery is not configured, so iSchoolie prepares a mail-app hand-off instead.</li>
            <li>• You can revoke a link at any time. It then stops working immediately.</li>
            <li>• Invitations do not create follow relationships or expose either address book.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-mutedSurface/40 p-4 text-center">
          <Users className="mx-auto h-5 w-5 text-brand" aria-hidden="true" />
          <p className="mt-1 text-sm font-medium text-ink">Prefer to find people already here?</p>
          <Link
            href="/connect/people"
            className="mt-1 inline-block text-sm font-semibold text-brand hover:underline"
          >
            Discover People →
          </Link>
        </section>
      </div>
    </div>
  );
}
