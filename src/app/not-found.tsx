import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { buttonClass } from '@/components/ui/button-styles';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 text-center">
      <Logo />
      <p className="mt-8 text-2xs font-semibold uppercase tracking-[0.18em] text-subtle">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">This page does not exist</h1>
      <p className="mt-2 max-w-md text-sm text-subtle">
        The link may be outdated. If you followed a link from iSchoolie, please report it to support
        so we can fix it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/feed" className={buttonClass('primary', 'sm')}>Go to my feed</Link>
        <a href="/login" className={buttonClass('outline', 'sm')}>Sign in</a>
        <Link href="/help" className={buttonClass('ghost', 'sm')}>Get help</Link>
      </div>
    </div>
  );
}
