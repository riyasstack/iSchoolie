'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Bookmark,
  Compass,
  Home,
  List,
  LogOut,
  Menu,
  PenSquare,
  Search,
  Settings,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/empty-state';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/utils/cn';
import type { SocialViewer } from '@/lib/social/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  badge?: number;
  match?: (pathname: string) => boolean;
}

export function SocialAppShell({
  viewer,
  rightRail,
  children,
}: {
  viewer: SocialViewer;
  rightRail?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '/feed';
  const [drawer, setDrawer] = React.useState(false);

  React.useEffect(() => setDrawer(false), [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/feed' && pathname.startsWith(`${href}/`));

  const primary: NavItem[] = [
    { href: '/feed', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    {
      href: '/connect/people',
      label: 'Connect People',
      icon: UserPlus,
      match: (path) => path.startsWith('/connect/people'),
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: viewer.unreadNotifications,
    },
    { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { href: '/lists', label: 'Lists', icon: List },
    { href: `/u/${viewer.handle}`, label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const navLink = (item: NavItem, compact = false) => {
    const active = item.match ? item.match(pathname) : isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-xl text-[0.95rem] transition',
          compact ? 'px-3 py-2.5' : 'px-3 py-2.5',
          active
            ? 'bg-brand/10 font-semibold text-brand'
            : 'font-medium text-subtle hover:bg-mutedSurface hover:text-ink',
        )}
      >
        <span className="relative">
          <Icon className="h-5 w-5" aria-hidden="true" />
          {item.badge ? (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.6rem] font-bold leading-none text-white">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          ) : null}
        </span>
        <span className="truncate">{item.label}</span>
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-4 py-5">
      <div className="px-2">
        <Logo href="/feed" size="sm" />
      </div>

      <nav aria-label="Social navigation" className="flex-1 space-y-0.5 overflow-y-auto pr-1">
        {primary.map((item) => navLink(item))}
      </nav>

      <Link href="/compose" className={buttonClass('primary', 'md', 'mx-1 mt-1 w-auto')}>
        <PenSquare className="h-4 w-4" aria-hidden="true" />
        Create post
      </Link>

      <div className="mt-1 rounded-xl border border-line bg-mutedSurface/60 p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={viewer.displayName} src={viewer.photoUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${viewer.handle}`}
              className="block truncate text-sm font-semibold text-ink hover:underline"
            >
              {viewer.displayName}
            </Link>
            <p className="truncate text-xs text-subtle">@{viewer.handle}</p>
          </div>
          <a
            href="/sign-out"
            className="rounded-lg p-1.5 text-subtle transition hover:bg-surface hover:text-danger"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );

  const mobile: NavItem[] = [
    { href: '/feed', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/connect/people', label: 'Connect', icon: UserPlus },
    { href: '/notifications', label: 'Alerts', icon: Bell, badge: viewer.unreadNotifications },
    { href: `/u/${viewer.handle}`, label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-dvh bg-[#f7f8fb] dark:bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lift"
      >
        Skip to content
      </a>

      <div className="mx-auto flex w-full max-w-[1320px]">
        <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col border-r border-line bg-surface px-3 lg:flex">
          {sidebar}
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-ink/40 backdrop-blur-md"
              onClick={() => setDrawer(false)}
            />
            <div className="relative h-full w-[290px] max-w-[86%] border-r border-line bg-surface/95 px-3 shadow-lift backdrop-blur-md">
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="absolute right-3 top-3 rounded-lg p-2 text-subtle hover:bg-mutedSurface"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              {sidebar}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 border-r border-line bg-[#fbfbfd] dark:bg-bg">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/80 px-3 backdrop-blur-md lg:hidden">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-ink hover:bg-mutedSurface"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <Logo href="/feed" size="sm" />
            <div className="flex items-center gap-1">
              <Link
                href="/search"
                aria-label="Search iSchoolie"
                className="rounded-lg p-2 text-ink hover:bg-mutedSurface"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link href={`/u/${viewer.handle}`} aria-label="Your profile" className="p-0.5">
                <Avatar name={viewer.displayName} src={viewer.photoUrl} size="sm" />
              </Link>
            </div>
          </header>

          <main id="main-content" className="mx-auto w-full max-w-[680px] pb-28 lg:pb-10">
            {children}
          </main>
        </div>

        {rightRail && (
          <aside className="sticky top-0 hidden h-dvh w-[332px] shrink-0 overflow-y-auto px-4 py-5 xl:block">
            {rightRail}
          </aside>
        )}
      </div>

      <Link
        href="/compose"
        aria-label="Create post"
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-fg shadow-lift transition hover:brightness-110 lg:hidden"
      >
        <PenSquare className="h-6 w-6" aria-hidden="true" />
      </Link>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/85 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {mobile.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-2.5 text-[0.65rem] font-medium',
                  active ? 'text-brand' : 'text-subtle',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.badge ? (
                  <span className="absolute right-[22%] top-1.5 h-2 w-2 rounded-full bg-danger" />
                ) : null}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
