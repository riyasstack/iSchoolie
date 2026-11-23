'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { EXPLORE_GROUPS, PRIMARY_LINKS } from '@/lib/public-navigation';
import { cn } from '@/lib/utils/cn';

const SEARCH_LINKS = [
  ...EXPLORE_GROUPS.flatMap((group) =>
    group.links.map((link) => ({ ...link, group: group.title })),
  ),
  { href: '/#mission', label: 'About iSchoolie', description: 'Why the network exists.', group: 'Platform' },
  { href: '/#audiences', label: 'For Students', description: 'School, college and university learners.', group: 'Platform' },
  { href: '/#trust', label: 'Trust & Safety', description: 'Privacy, safeguarding and moderation.', group: 'Platform' },
  { href: '/help', label: 'Help Center', description: 'Answers about roles and verification.', group: 'Support' },
];

export function PublicNavbar() {
  const { status, profile, signOut } = useAuth();
  const pathname = usePathname();

  const [scrolled, setScrolled] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [accountOpen, setAccountOpen] = React.useState(false);

  const megaRef = React.useRef<HTMLDivElement | null>(null);
  const accountRef = React.useRef<HTMLDivElement | null>(null);
  const megaButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const mobileTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const mobileCloseRef = React.useRef<HTMLButtonElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close every surface when the route changes.
  React.useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMegaOpen(false);
      setAccountOpen(false);
      setSearchOpen(false);
      setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (megaOpen && megaRef.current && !megaRef.current.contains(event.target as Node)) {
        setMegaOpen(false);
      }
      if (accountOpen && accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [megaOpen, accountOpen]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mobileCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    if (!searchOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = overflow;
    };
  }, [searchOpen]);

  const signedIn = status === 'signed-in';
  const results = query.trim()
    ? SEARCH_LINKS.filter((link) => {
        const haystack = `${link.label} ${link.description ?? ''} ${link.group}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
    : SEARCH_LINKS;

  return (
    <>
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-[background-color,box-shadow,border-color] duration-300',
        scrolled
          ? 'border-b border-[#e6e8ee] bg-white/[0.9] shadow-[0_10px_30px_-24px_rgba(16,27,53,0.45)] backdrop-blur-xl'
          : 'border-b border-transparent bg-[#fbfbfd]/60 backdrop-blur-md',
      )}
    >
      <div className="home-shell relative flex h-[72px] items-center justify-between gap-4 xl:h-[80px]">
        <div className="flex items-center gap-8">
          <Logo size="md" priority className="shrink-0" />
          <nav aria-label="Primary" className="hidden items-center gap-1 xl:absolute xl:left-1/2 xl:flex xl:-translate-x-1/2">
            <div
              ref={megaRef}
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button
                ref={megaButtonRef}
                type="button"
                aria-expanded={megaOpen}
                aria-controls="explore-mega-menu"
                onClick={() => setMegaOpen(true)}
                onFocus={() => setMegaOpen(true)}
                className={cn(
                  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-[0.88rem] font-medium transition',
                  megaOpen ? 'bg-[#eef0f5] text-navy' : 'text-[#43506b] hover:bg-[#f1f2f6] hover:text-navy',
                )}
              >
                Explore
                <ChevronDown
                  aria-hidden="true"
                  className={cn('h-3.5 w-3.5 transition-transform duration-300', megaOpen && 'rotate-180')}
                />
              </button>

              <div
                id="explore-mega-menu"
                aria-label="Explore iSchoolie"
                inert={!megaOpen}
                className={cn(
                  'absolute left-1/2 top-[calc(100%+10px)] w-[min(940px,calc(100vw-3rem))] -translate-x-1/2 rounded-[1.6rem] border border-[#e7e9ef] bg-white p-3 shadow-[0_34px_80px_-32px_rgba(16,27,53,0.45)] transition-all duration-200',
                  megaOpen
                    ? 'pointer-events-auto translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-1.5 opacity-0',
                )}
              >
                <div className="grid gap-2 lg:grid-cols-3">
                  {EXPLORE_GROUPS.map((group) => (
                    <div key={group.title} className="rounded-2xl p-2">
                      <p className="px-3 pb-2 pt-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8a94a8]">
                        {group.title}
                      </p>
                      <ul>
                        {group.links.map((link) => (
                          <li key={`${group.title}-${link.label}`}>
                            <Link
                              href={link.href}
                              onClick={() => setMegaOpen(false)}
                              className="group/item flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-[#f6f7f9]"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 text-[0.86rem] font-semibold text-navy">
                                  {link.label}
                                  <ArrowRight
                                    aria-hidden="true"
                                    className="h-3 w-3 -translate-x-1 text-action opacity-0 transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100"
                                  />
                                </span>
                                {link.description && (
                                  <span className="mt-0.5 block text-xs leading-snug text-[#6b768c]">
                                    {link.description}
                                  </span>
                                )}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8fb] px-4 py-3">
                  <p className="text-xs text-[#5c6880]">
                    New here? One account connects every learning workspace.
                  </p>
                  <a
                    href="/signup"
                    onClick={() => setMegaOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-action hover:underline"
                  >
                    Join iSchoolie
                    <ArrowRight aria-hidden="true" className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full px-3.5 py-2 text-[0.88rem] font-medium text-[#43506b] transition hover:bg-[#f1f2f6] hover:text-navy"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search iSchoolie"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#4b5670] transition hover:bg-[#f1f2f6] hover:text-navy"
          >
            <Search aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" />
          </button>

          {signedIn ? (
            <div ref={accountRef} className="relative flex items-center gap-1.5">
              <Link
                href="/feed"
                className="hidden h-10 items-center gap-2 rounded-full bg-navy px-4 text-[0.83rem] font-semibold text-white transition hover:bg-[#1b2a4d] sm:inline-flex"
              >
                <LayoutDashboard aria-hidden="true" className="h-3.5 w-3.5" />
                My workspace
              </Link>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe3ea] bg-white text-[0.78rem] font-semibold text-navy transition hover:border-[#c7cdd8]"
              >
                {profile?.displayName?.trim()?.charAt(0)?.toUpperCase() ?? 'A'}
                <span className="sr-only">Account menu</span>
              </button>
              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-2xl border border-[#e7e9ef] bg-white py-1.5 shadow-[0_28px_60px_-28px_rgba(16,27,53,0.45)]"
                >
                  <div className="border-b border-[#eef0f4] px-3.5 py-2.5">
                    <p className="truncate text-sm font-semibold text-navy">{profile?.displayName}</p>
                    <p className="truncate text-xs text-[#6b768c]">{profile?.handle}</p>
                  </div>
                  <Link
                    href="/account"
                    role="menuitem"
                    className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-[#37425a] hover:bg-[#f6f7f9]"
                  >
                    <UserRound aria-hidden="true" className="h-4 w-4" /> My account
                  </Link>
                  <Link
                    href="/feed"
                    role="menuitem"
                    className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-[#37425a] hover:bg-[#f6f7f9]"
                  >
                    <LayoutDashboard aria-hidden="true" className="h-4 w-4" /> Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-2 border-t border-[#eef0f4] px-3.5 py-2.5 text-left text-sm text-[#b42318] hover:bg-[#fdf3f2]"
                  >
                    <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/*
                Auth entry points are plain anchors on purpose: `/login` and
                `/signup` answer with a 307 to WorkOS, and the client router
                cannot follow a cross-origin redirect on its RSC fetch. A full
                navigation goes straight there with no error and no shell.
              */}
              <a
                href="/login"
                className="hidden rounded-full px-3.5 py-2 text-[0.88rem] font-medium text-[#43506b] transition hover:bg-[#f1f2f6] hover:text-navy sm:inline-flex"
              >
                Sign in
              </a>
              <a
                href="/signup"
                className="hidden h-10 items-center rounded-full bg-navy px-4 text-[0.83rem] font-semibold text-white transition hover:bg-[#1b2a4d] sm:inline-flex"
              >
                Join iSchoolie
              </a>
            </>
          )}

          <button
            ref={mobileTriggerRef}
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#37425a] transition hover:bg-[#f1f2f6] xl:hidden"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile navigation */}
      <div
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="iSchoolie navigation"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-white transition-opacity duration-300 xl:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#eef0f4] px-5">
          <Logo size="md" href={null} />
          <button
            ref={mobileCloseRef}
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#37425a] transition hover:bg-[#f1f2f6]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
          <div className="mb-5">
            <button
              type="button"
              aria-expanded={mobileExploreOpen}
              onClick={() => setMobileExploreOpen((value) => !value)}
              className="flex w-full items-center justify-between rounded-2xl bg-[#f6f7f9] px-4 py-3.5 text-left text-[1.05rem] font-semibold text-navy"
            >
              Explore
              <ChevronDown
                aria-hidden="true"
                className={cn('h-4 w-4 transition-transform duration-300', mobileExploreOpen && 'rotate-180')}
              />
            </button>
            <div className={cn('overflow-hidden transition-all duration-300', mobileExploreOpen ? 'max-h-[740px]' : 'max-h-0')}>
              <div className="space-y-4 px-1 pb-1 pt-3">
                {EXPLORE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8a94a8]">
                      {group.title}
                    </p>
                    <ul className="mt-1">
                      {group.links.map((link) => (
                        <li key={`${group.title}-${link.label}`}>
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-between rounded-xl px-3 py-3 text-[0.95rem] font-medium text-[#37425a] active:bg-[#f1f2f6]"
                          >
                            {link.label}
                            <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#98a1b3]" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <nav aria-label="Mobile primary" className="space-y-1">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-2xl px-4 py-4 text-[1.05rem] font-semibold text-navy active:bg-[#f1f2f6]"
              >
                {link.label}
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#98a1b3]" />
              </Link>
            ))}
            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-2xl px-4 py-4 text-[1.05rem] font-semibold text-navy active:bg-[#f1f2f6]"
            >
              Help Center
              <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#98a1b3]" />
            </Link>
          </nav>

          <div className="mt-6 space-y-2 border-t border-[#eef0f4] pt-6">
            {signedIn ? (
              <>
                <Link
                  href="/feed"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full bg-navy text-[0.95rem] font-semibold text-white"
                >
                  My workspace
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full border border-[#dfe3ea] text-[0.95rem] font-semibold text-navy"
                >
                  My account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut();
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-full text-[0.95rem] font-semibold text-[#b42318]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full bg-navy text-[0.95rem] font-semibold text-white"
                >
                  Join iSchoolie
                </a>
                <a
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full border border-[#dfe3ea] text-[0.95rem] font-semibold text-navy"
                >
                  Sign in
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search iSchoolie"
        aria-hidden={!searchOpen}
        inert={!searchOpen}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSearchOpen(false);
        }}
        className={cn(
          'fixed inset-0 z-[60] bg-[#0b1220]/35 p-4 backdrop-blur-sm transition-opacity duration-200 sm:p-8',
          searchOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="mx-auto mt-[8vh] w-full max-w-xl overflow-hidden rounded-[1.6rem] border border-[#e7e9ef] bg-white shadow-[0_40px_90px_-30px_rgba(16,27,53,0.5)]">
          <div className="flex items-center gap-3 border-b border-[#eef0f4] px-5 py-4">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7c879b]" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search educators, courses, communities…"
              aria-label="Search iSchoolie"
              className="h-7 w-full bg-transparent text-[0.95rem] text-navy outline-none placeholder:text-[#97a0b2]"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#7c879b] hover:bg-[#f1f2f6]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[52vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#6b768c]">
                No public destination matches “{query.trim()}”. Try “courses”, “educators” or
                “institutions”.
              </p>
            ) : (
              <ul>
                {results.map((link) => (
                  <li key={`${link.group}-${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:bg-[#f6f7f9]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy">{link.label}</span>
                        {link.description && (
                          <span className="block truncate text-xs text-[#6b768c]">{link.description}</span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full bg-[#f1f3f7] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#7c879b]">
                        {link.group}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
