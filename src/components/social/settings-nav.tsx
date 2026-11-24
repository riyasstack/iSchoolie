'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const ITEMS = [
  { href: '/settings', label: 'Overview' },
  { href: '/settings/profile', label: 'Edit profile' },
  { href: '/settings/privacy', label: 'Privacy' },
  { href: '/settings/privacy/discoverability', label: 'Discoverability' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/blocked', label: 'Blocked accounts' },
  { href: '/settings/muted', label: 'Muted accounts' },
  { href: '/settings/account', label: 'Account' },
];

export function SettingsNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname() ?? '/settings';
  const items = isAdmin
    ? [...ITEMS, { href: '/moderation', label: 'Moderation queue' }]
    : ITEMS;

  return (
    <nav
      aria-label="Settings sections"
      className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line bg-surface/80 px-3 py-2 backdrop-blur-md sm:px-4 lg:sticky lg:top-0 lg:z-20"
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition',
              active ? 'bg-ink text-white dark:bg-brand' : 'text-subtle hover:bg-mutedSurface hover:text-ink',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
