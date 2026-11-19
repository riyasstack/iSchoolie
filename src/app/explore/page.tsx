import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, MessagesSquare, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { buttonClass } from '@/components/ui/button-styles';

export const metadata: Metadata = {
  title: 'Explore',
  description:
    'Browse published courses and communities on iSchoolie, and see how educators and institutions join.',
};

const SURFACES = [
  {
    href: '/courses',
    icon: <BookOpen aria-hidden="true" className="h-5 w-5" />,
    title: 'Courses',
    copy: 'Published courses from verified educators. Enrolment is instant and free.',
  },
  {
    href: '/communities',
    icon: <MessagesSquare aria-hidden="true" className="h-5 w-5" />,
    title: 'Communities',
    copy: 'Subject and school communities where members of iSchoolie share work and questions.',
  },
  {
    href: '/help',
    icon: <ShieldCheck aria-hidden="true" className="h-5 w-5" />,
    title: 'Help and support',
    copy: 'Roles, guardian links, verification and institution applications — answered plainly.',
  },
];

export default function ExplorePage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonClass('ghost', 'sm')}>Sign in</Link>
            <Link href="/signup" className={buttonClass('primary', 'sm')}>Create account</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand">Explore</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
          Find your place on iSchoolie
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-subtle">
          Everything public on the network, in one place. You can read course and community pages
          without an account; enrolling, posting and messaging need a verified iSchoolie identity.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {SURFACES.map((surface) => (
            <Link
              key={surface.href}
              href={surface.href}
              className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-brand/30 hover:shadow-lift"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                {surface.icon}
              </span>
              <h2 className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
                {surface.title}
                <ArrowRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-subtle transition group-hover:translate-x-0.5 group-hover:text-brand"
                />
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-subtle">{surface.copy}</p>
            </Link>
          ))}
        </section>

        <section id="educators" className="mt-12 scroll-mt-20">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <GraduationCap aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">For educators</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-subtle">
                Create your teaching profile immediately. Publishing courses and appearing as a
                verified educator both require review by the iSchoolie team — you cannot grant
                yourself either, and the database rules enforce that, not the interface.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/signup" className={buttonClass('primary', 'sm')}>
                  Create an educator account
                </Link>
                <Link href="/help" className={buttonClass('outline', 'sm')}>
                  How verification works
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="institutions" className="mt-10 scroll-mt-20 border-t border-line pt-10">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">For institutions</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-subtle">
                Apply once, then track the review from your own status page. Institution tools unlock
                only after the application is approved and an owner is provisioned; until then the
                rest of the account works normally.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/signup" className={buttonClass('primary', 'sm')}>
                  Request institutional access
                </Link>
                <Link href="/help" className={buttonClass('outline', 'sm')}>
                  What reviewers need
                </Link>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-12 text-xs text-subtle">
          <Link href="/" className="underline-offset-2 hover:underline">Back to the homepage</Link>
        </p>
      </main>
    </div>
  );
}
