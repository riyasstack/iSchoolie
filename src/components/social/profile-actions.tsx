'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flag, MoreHorizontal, Share2, UserX, VolumeX, Volume2, UserCheck, Pencil } from 'lucide-react';
import { FollowButton } from '@/components/social/follow-button';
import { ReportDialog } from '@/components/social/report-dialog';
import { buttonClass } from '@/components/ui/button-styles';
import type { FollowState } from '@/lib/social/types';

export function ProfileActions({
  targetId,
  handle,
  displayName,
  followState,
  canFollow,
  isSelf,
  isBlocked,
  isMuted,
}: {
  targetId: string;
  handle: string;
  displayName: string;
  followState: FollowState;
  canFollow: boolean;
  isSelf: boolean;
  isBlocked: boolean;
  isMuted: boolean;
}) {
  const router = useRouter();
  const [menu, setMenu] = React.useState(false);
  const [reporting, setReporting] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [blocked, setBlocked] = React.useState(isBlocked);
  const [muted, setMuted] = React.useState(isMuted);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menu) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  async function block() {
    if (!window.confirm(`Block @${handle}? This removes any follow relationship in both directions.`)) {
      return;
    }
    setBusy('block');
    setError(null);
    try {
      const response = await fetch('/api/social/blocks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not block this account.');
      }
      setBlocked(true);
      setMenu(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not block this account.');
    } finally {
      setBusy(null);
    }
  }

  async function unblock() {
    setBusy('block');
    try {
      await fetch('/api/social/blocks', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      setBlocked(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function toggleMute() {
    setBusy('mute');
    setError(null);
    try {
      const response = await fetch('/api/social/mutes', {
        method: muted ? 'DELETE' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not update this account.');
      }
      setMuted(!muted);
      setMenu(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this account.');
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    const url = `${window.location.origin}/u/${handle}`;
    try {
      if (navigator.share) await navigator.share({ title: `${displayName} on iSchoolie`, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      setError('Could not share this profile.');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isSelf ? (
        <Link href="/settings/profile" className={buttonClass('outline', 'sm', 'rounded-full')}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit profile
        </Link>
      ) : blocked ? (
        <button
          type="button"
          onClick={() => void unblock()}
          disabled={busy !== null}
          className={buttonClass('danger', 'sm', 'rounded-full')}
        >
          <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Unblock
        </button>
      ) : (
        <FollowButton
          targetId={targetId}
          initialState={followState}
          canFollow={canFollow}
          size="sm"
        />
      )}

      <button
        type="button"
        onClick={() => void share()}
        aria-label="Share profile"
        className="rounded-full border border-line p-2 text-subtle transition hover:border-brand/40 hover:text-brand"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {!isSelf && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenu((value) => !value)}
            aria-label="Profile options"
            aria-haspopup="menu"
            aria-expanded={menu}
            className="rounded-full border border-line p-2 text-subtle transition hover:border-brand/40 hover:text-brand"
          >
            <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {menu && (
            <div
              role="menu"
              className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lift"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => void toggleMute()}
                disabled={busy !== null}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-mutedSurface"
              >
                {muted ? (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                )}
                {muted ? 'Unmute account' : 'Mute account'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void (blocked ? unblock() : block())}
                disabled={busy !== null}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-mutedSurface"
              >
                <UserX className="h-4 w-4" aria-hidden="true" />
                {blocked ? 'Unblock account' : 'Block account'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  setReporting(true);
                }}
                className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-sm text-ink hover:bg-mutedSurface"
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                Report account
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="w-full text-right text-2xs font-medium text-danger">
          {error}
        </p>
      )}

      {reporting && (
        <ReportDialog
          targetType="user"
          targetId={targetId}
          targetLabel={`@${handle} · ${displayName}`}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
