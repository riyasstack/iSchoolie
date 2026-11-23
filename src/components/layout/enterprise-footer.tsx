import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { FOOTER_GROUPS } from '@/lib/public-navigation';

export function EnterpriseFooter() {
  return (
    <footer className="bg-[#0b1322] text-white">
      <div className="home-shell pb-10 pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2.15fr]">
          <div className="max-w-sm">
            <Logo size="md" tone="inverse" />
            <p className="mt-5 text-sm font-medium tracking-[0.01em] text-white/90">
              Learn. Teach. Connect. Grow.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              iSchoolie is an education networking platform that brings learners, educators,
              guardians and institutions into one connected ecosystem built around knowledge,
              collaboration and growth.
            </p>
            <a
              href="/signup"
              className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-white"
            >
              Join the network
              <ArrowUpRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-[0.86rem] leading-snug text-white/65 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} iSchoolie. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/legal/privacy" className="transition hover:text-white/75">
              Privacy
            </Link>
            <Link href="/legal/terms" className="transition hover:text-white/75">
              Terms
            </Link>
            <Link href="/help" className="transition hover:text-white/75">
              Help
            </Link>
            <a href="mailto:support@ischoolie.app" className="transition hover:text-white/75">
              support@ischoolie.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
