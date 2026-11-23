'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Building2,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/providers/theme-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  hidden?: boolean;
}

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { profile, workspaces, platformAdmin, roles, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const primary: NavItem[] = [
    { href: '/feed', label: 'Feed', icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      href: '/dashboard/student',
      label: 'Learning',
      icon: <GraduationCap className="h-4 w-4" />,
      hidden: !roles.includes('student_school') && !roles.includes('student_college'),
    },
    {
      href: '/dashboard/teacher',
      label: 'Teaching',
      icon: <BookOpen className="h-4 w-4" />,
      hidden: !roles.includes('teacher'),
    },
    {
      href: '/dashboard/parent',
      label: 'Guardian',
      icon: <Users className="h-4 w-4" />,
      hidden: !roles.includes('parent'),
    },
    {
      href: '/dashboard/institution',
      label: 'Institution',
      icon: <Building2 className="h-4 w-4" />,
      hidden: !workspaces.some((workspace) => workspace.kind === 'institution'),
    },
    { href: '/workspaces', label: 'Workspaces', icon: <ChevronDown className="h-4 w-4" /> },
    { href: '/courses', label: 'Courses', icon: <BookOpen className="h-4 w-4" /> },
    { href: '/communities', label: 'Communities', icon: <MessagesSquare className="h-4 w-4" /> },
  ];

  const secondary: NavItem[] = [
    { href: '/account', label: 'Account', icon: <Settings className="h-4 w-4" /> },
    {
      href: '/admin',
      label: 'Platform admin',
      icon: <ShieldCheck className="h-4 w-4" />,
      hidden: !platformAdmin,
    },
  ];

  const nav = (items: NavItem[]) =>
    items
      .filter((item) => !item.hidden)
      .map((item) => {
        const active = pathname === item.href || (item.href !== '/feed' && pathname?.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
              active
                ? 'bg-brand/10 font-semibold text-brand'
                : 'text-subtle hover:bg-mutedSurface hover:text-ink',
            )}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </Link>
        );
      });

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-1">
        <Logo href="/feed" size="sm" />
      </div>
      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-1">{nav(primary)}</div>
        <div className="space-y-1">
          <p className="px-3 text-2xs font-semibold uppercase tracking-wider text-subtle">Account</p>
          {nav(secondary)}
        </div>
      </nav>
      <div className="rounded-xl border border-line bg-mutedSurface/60 p-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-subtle">Signed in as</p>
        <p className="mt-1 truncate text-sm font-medium text-ink">{profile?.displayName}</p>
        <p className="truncate text-xs text-subtle">{profile?.handle}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-lift"
      >
        Skip to content
      </a>

      <div className="lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-line bg-surface lg:block">
          <div className="sticky top-0 h-dvh">{sidebar}</div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
            <div className="relative h-full w-72 max-w-[85%] border-r border-line bg-surface shadow-lift">
              <div className="absolute right-2 top-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sidebar}
            </div>
          </div>
        )}

        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="h-4.5 w-4.5" />
                </Button>
                <span className="truncate text-sm font-medium text-ink">{title ?? 'iSchoolie'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/workspaces"
                  className="hidden items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-subtle transition hover:bg-mutedSurface hover:text-ink sm:flex"
                >
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Switch workspace
                </Link>
                <ThemeToggle />
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((value) => !value)}
                    className="flex items-center gap-2 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <Avatar name={profile?.displayName ?? 'You'} src={profile?.photoURL} size="sm" />
                    <span className="sr-only">Account menu</span>
                  </button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
                    >
                      <div className="border-b border-line px-3 py-2">
                        <p className="truncate text-sm font-medium text-ink">{profile?.displayName}</p>
                        <p className="truncate text-xs text-subtle">{profile?.handle}</p>
                      </div>
                      <Link href="/account" role="menuitem" className="block px-3 py-2 text-sm text-ink hover:bg-mutedSurface">
                        My profile
                      </Link>
                      <Link href="/account/security" role="menuitem" className="block px-3 py-2 text-sm text-ink hover:bg-mutedSurface">
                        Security settings
                      </Link>
                      <Link href="/account/providers" role="menuitem" className="block px-3 py-2 text-sm text-ink hover:bg-mutedSurface">
                        Linked providers
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-sm text-danger hover:bg-mutedSurface"
                        onClick={() => {
                          void signOut();
                        }}
                      >
                        <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>

          <footer className="border-t border-line px-4 py-4 text-center text-2xs text-subtle sm:px-6">
            iSchoolie · Learn. Teach. Connect. Grow. ·{' '}
            <Link href="/legal/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>{' '}
            ·{' '}
            <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
              Privacy
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
