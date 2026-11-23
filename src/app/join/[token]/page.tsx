import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/empty-state';
import { buttonClass } from '@/components/ui/button-styles';
import { AcceptInvitation } from '@/components/social/accept-invitation';
import { getSocialViewer } from '@/lib/server/social/auth';
import { getInvitationByToken } from '@/lib/server/social/invitations';

export const metadata: Metadata = {
  title: 'Join iSchoolie',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  if (!invitation || invitation.status === 'revoked') notFound();

  const viewer = await getSocialViewer();
  const next = encodeURIComponent(`/join/${token}`);

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f8fb] dark:bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/feed" className={buttonClass('ghost', 'sm')}>
            {viewer ? 'Go to feed' : 'Sign in'}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-8 sm:px-6">
        <div className="w-full rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-3">
            <Avatar
              name={invitation.inviter.displayName}
              src={invitation.inviter.photoUrl}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand">
                Invitation
              </p>
              <p className="text-sm font-semibold text-ink">
                {invitation.inviter.displayName}{' '}
                <span className="font-normal text-subtle">@{invitation.inviter.handle}</span>
              </p>
              <p className="text-2xs text-subtle">invited you to iSchoolie</p>
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
            Learn. Teach. Connect. Grow.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-subtle">
            Join an education network built around subjects, educators and peers — not follower counts.
            {invitation.note ? ` “${invitation.note}”` : ''}
          </p>

          <div className="mt-5">
            {invitation.status === 'accepted' ? (
              <div className="rounded-xl border border-line bg-mutedSurface/50 p-3 text-sm text-ink">
                This invitation has already been accepted. You can still join iSchoolie with your own
                account.
                {viewer ? (
                  <Link href="/feed" className="mt-2 block font-semibold text-brand hover:underline">
                    Go to your feed →
                  </Link>
                ) : (
                  <Link href="/sign-up" className="mt-2 block font-semibold text-brand hover:underline">
                    Create your account →
                  </Link>
                )}
              </div>
            ) : viewer ? (
              <AcceptInvitation token={token} inviterHandle={invitation.inviter.handle} />
            ) : (
              <div className="space-y-2">
                <Link
                  href={`/sign-in?next=${next}`}
                  className={buttonClass('primary', 'md', 'w-full rounded-full')}
                >
                  Sign in to accept
                </Link>
                <Link
                  href={`/sign-up?next=${next}`}
                  className={buttonClass('outline', 'md', 'w-full rounded-full')}
                >
                  Create a new account
                </Link>
                <p className="pt-1 text-center text-2xs text-subtle">
                  Sign-in and registration are handled by WorkOS. iSchoolie never creates a guest
                  account.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-2 border-t border-line pt-4 text-2xs text-subtle sm:grid-cols-2">
            <p className="flex items-start gap-1.5">
              <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
              Education-first profiles, interests and topic feeds.
            </p>
            <p className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
              Student accounts are private and never shown to adults.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
