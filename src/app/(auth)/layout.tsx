import Link from 'next/link';
import { GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/providers/theme-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only; on mobile the wordmark moves above the form. */}
      <aside className="relative hidden overflow-hidden brand-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="400" height="800" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative">
          <Logo href="/" size="md" tone="inverse" />
          <h2 className="mt-16 max-w-sm text-display-sm font-semibold">
            One account for every role you hold.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
            Students, educators, guardians and institutions — connected through verified roles,
            not separate logins.
          </p>
        </div>

        <div className="relative space-y-3">
          {[
            { icon: <GraduationCap aria-hidden="true" className="h-4 w-4" />, text: 'Learning spaces for Class 8 to postgraduate study' },
            { icon: <Users aria-hidden="true" className="h-4 w-4" />, text: 'Guardian access only through verified relationships' },
            { icon: <ShieldCheck aria-hidden="true" className="h-4 w-4" />, text: 'Institution tools unlocked after iSchoolie verification' },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <span className="mt-0.5 text-white/90">{item.icon}</span>
              <p className="text-sm text-white/90">{item.text}</p>
            </div>
          ))}
          <p className="pt-2 text-2xs uppercase tracking-[0.18em] text-white/60">
            Learn · Teach · Connect · Grow
          </p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:px-10">
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/help" className="text-xs text-subtle underline-offset-2 hover:underline">
              Need help?
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <main className="flex flex-1 items-start justify-center px-4 pb-14 pt-2 sm:px-8 lg:items-center lg:pt-0">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
        <footer className="px-5 pb-6 text-center text-2xs text-subtle lg:px-10">
          <Link href="/legal/terms" className="hover:text-ink">Terms</Link>
          <span className="px-1.5">·</span>
          <Link href="/legal/privacy" className="hover:text-ink">Privacy</Link>
          <span className="px-1.5">·</span>
          <Link href="/help" className="hover:text-ink">Support</Link>
        </footer>
      </div>
    </div>
  );
}
