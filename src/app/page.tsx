import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/providers/theme-provider';
import { buttonClass } from '@/components/ui/button-styles';

const ROLES = [
  {
    icon: <GraduationCap aria-hidden="true" className="h-5 w-5" />,
    title: 'Students',
    copy: 'Follow classes, submit work and build an academic record that travels with you from Class 8 to university.',
  },
  {
    icon: <BookOpen aria-hidden="true" className="h-5 w-5" />,
    title: 'Educators',
    copy: 'Publish courses, run classes and grade with a professional profile your institution can verify.',
  },
  {
    icon: <Users aria-hidden="true" className="h-5 w-5" />,
    title: 'Guardians',
    copy: 'See only the results you have been authorised to see, through a verified link — never a shared password.',
  },
  {
    icon: <Building2 aria-hidden="true" className="h-5 w-5" />,
    title: 'Institutions',
    copy: 'Apply once, get verified by the iSchoolie team, then manage your own classes and staff.',
  },
];

const FEATURES = [
  {
    icon: <ShieldCheck aria-hidden="true" className="h-4.5 w-4.5" />,
    title: 'One account, many roles',
    copy: 'A single Firebase identity across student, teacher, guardian and institution workspaces. No duplicate logins.',
  },
  {
    icon: <Building2 aria-hidden="true" className="h-4.5 w-4.5" />,
    title: 'Institution approval by people',
    copy: 'Institution dashboards are unlocked only after the iSchoolie team verifies the organisation. Nobody approves themselves.',
  },
  {
    icon: <CheckCircle2 aria-hidden="true" className="h-4.5 w-4.5" />,
    title: 'Rules, not guesswork',
    copy: 'Every read and write is checked server-side by Firestore Security Rules. Route guards are convenience only.',
  },
  {
    icon: <MessagesSquare aria-hidden="true" className="h-4.5 w-4.5" />,
    title: 'Safeguarding first',
    copy: 'Minors get private-by-default profiles, restricted discoverability and verified guardian relationships.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-4 text-[13px] text-subtle lg:flex">
            <Link href="/explore" className="transition hover:text-ink">Explore</Link>
            <Link href="/courses" className="transition hover:text-ink">Courses</Link>
            <Link href="/communities" className="transition hover:text-ink">Community</Link>
            <Link href="/explore#educators" className="transition hover:text-ink">For Educators</Link>
            <Link href="/explore#institutions" className="transition hover:text-ink">For Institutions</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={buttonClass('ghost', 'sm')}>Sign in</Link>
            <Link href="/signup" className={buttonClass('primary', 'sm')}>Create account</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-2xs font-semibold uppercase tracking-[0.14em] text-brand">
                  <Sparkles aria-hidden="true" className="h-3 w-3" />
                  Education networking platform
                </span>
                <h1 className="mt-5 text-display-md font-semibold text-ink sm:text-display-lg">
                  Learn. Teach.
                  <br />
                  <span className="text-gradient">Connect. Grow.</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-subtle sm:text-lg">
                  iSchoolie brings students, educators, guardians and institutions into one trusted
                  network — with one account, verified roles and permissions that are enforced in
                  the database, not in the interface.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href="/signup" className={buttonClass('primary', 'lg')}>
                    Create your iSchoolie account
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <Link href="/login" className={buttonClass('outline', 'lg')}>
                    I already have an account
                  </Link>
                </div>
                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-5">
                  {[
                    { term: 'One', detail: 'global identity' },
                    { term: '5', detail: 'role workspaces' },
                    { term: '0', detail: 'self-approved institutions' },
                  ].map((stat) => (
                    <div key={stat.term}>
                      <dt className="text-xl font-semibold text-ink">{stat.term}</dt>
                      <dd className="text-xs text-subtle">{stat.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-brand/5 blur-2xl" aria-hidden="true" />
                <div className="relative rounded-3xl border border-line bg-surface p-4 shadow-lift sm:p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-subtle">My workspaces</p>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-2xs font-semibold text-success">
                      Verified
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {[
                      { name: 'Personal iSchoolie', meta: 'Profile · network', tone: 'bg-brand/10 text-brand' },
                      { name: 'Student Learning', meta: 'Class 10 · Science', tone: 'bg-accent/15 text-warn' },
                      { name: 'Teacher Studio', meta: 'Physics · verified educator', tone: 'bg-success/10 text-success' },
                      { name: 'Greenfield Public School', meta: 'Institution administrator', tone: 'bg-mutedSurface text-subtle' },
                    ].map((item) => (
                      <li key={item.name} className="flex items-center gap-3 rounded-xl border border-line bg-bg/60 p-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${item.tone}`}>
                          {item.name.charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                          <span className="block truncate text-xs text-subtle">{item.meta}</span>
                        </span>
                        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-subtle" />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 rounded-lg bg-mutedSurface/70 px-3 py-2 text-2xs text-subtle">
                    Switching workspaces never grants permissions. Every query is authorised on the
                    server for the specific institution and role.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="border-t border-line bg-surface/60">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-semibold text-ink">Built for every part of the school day</h2>
            <p className="mt-2 max-w-2xl text-sm text-subtle">
              One person can be a student, a tutor and a guardian. iSchoolie keeps those roles
              separate in access, together in identity.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((role) => (
                <div key={role.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    {role.icon}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-ink">{role.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-subtle">{role.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Trust is the product</h2>
              <p className="mt-2 text-sm leading-relaxed text-subtle">
                iSchoolie is designed for the realities of schools and colleges: shared devices,
                minors in the network, and institutions that must prove who they are before they
                can see student records.
              </p>
              <ol className="mt-6 space-y-4">
                {[
                  'Create one iSchoolie account with email, Google or GitHub.',
                  'Verify your email, then choose how you use iSchoolie.',
                  'Complete only the profile your role needs.',
                  'Institutions apply and wait for iSchoolie verification.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-2xs font-bold text-brand-fg">
                      {index + 1}
                    </span>
                    <p className="text-sm text-ink">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-line bg-surface p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mutedSurface text-brand">
                    {feature.icon}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-1 text-sm text-subtle">{feature.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl brand-gradient px-6 py-10 text-white sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl font-semibold">Start with one account.</h2>
                <p className="mt-2 text-sm text-white/80">
                  Your student profile, teaching studio and guardian view all live under the same
                  verified identity.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup" className={buttonClass('secondary', 'lg')}>
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo size="sm" />
            <p className="mt-2 text-xs text-subtle">{new Date().getFullYear()} iSchoolie. All rights reserved.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-subtle">
            <Link href="/legal/terms" className="hover:text-ink">Terms and Conditions</Link>
            <Link href="/legal/privacy" className="hover:text-ink">Privacy Policy</Link>
            <Link href="/help" className="hover:text-ink">Help and Support</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
