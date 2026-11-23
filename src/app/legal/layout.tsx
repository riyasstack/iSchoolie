import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/providers/theme-provider';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <a href="/login" className="text-xs text-subtle underline-offset-2 hover:underline">
              Sign in
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="prose-iSchoolie space-y-5 text-sm leading-relaxed text-subtle [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
          {children}
        </article>
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-2xs text-subtle">
        <Link href="/legal/terms" className="hover:text-ink">Terms</Link>
        <span className="px-1.5">·</span>
        <Link href="/legal/privacy" className="hover:text-ink">Privacy</Link>
        <span className="px-1.5">·</span>
        <Link href="/help" className="hover:text-ink">Support</Link>
      </footer>
    </div>
  );
}
