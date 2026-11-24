'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export function ProfileTabs({ handle }: { handle: string }) {
  const pathname = usePathname() ?? '';
  const base = `/u/${handle}`;
  const tabs = [
    { href: base, label: 'Posts', exact: true },
    { href: `${base}/replies`, label: 'Replies', exact: false },
    { href: `${base}/media`, label: 'Media', exact: false },
  ];

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-14 z-30 flex border-b border-line bg-surface/80 backdrop-blur-md lg:top-0"
    >
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex-1 py-3 text-center text-sm font-semibold transition hover:bg-mutedSurface/60',
              active ? 'text-ink' : 'text-subtle',
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden="true" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
