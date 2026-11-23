'use client';

import * as React from 'react';
import { fetchAccount, type AccountSnapshot } from '@/lib/services/users';
import { effectiveRoles } from '@/lib/auth/permissions';
import { buildWorkspaces, type MembershipInput, type WorkspaceOption } from '@/lib/auth/workspaces';
import type { AccountClaims, RoleKey, SessionUser, UserProfile } from '@/lib/models';

export type AuthStatus = 'unconfigured' | 'loading' | 'signed-out' | 'signed-in' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  profile: UserProfile | null;
  account: AccountSnapshot | null;
  claims: AccountClaims;
  roles: RoleKey[];
  memberships: MembershipInput[];
  workspaces: WorkspaceOption[];
  platformAdmin: boolean;
  teacherVerified: boolean;
  error: string | null;
  refresh: (options?: { forceToken?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
}

const DEFAULT_CLAIMS: AccountClaims = {
  platformAdmin: false,
  teacherVerified: false,
  roles: [],
  suspended: false,
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

/**
 * Session provider.
 *
 * WorkOS AuthKit owns the credentials and the cookie; this provider only loads
 * the iSchoolie account snapshot that the cookie authorises. Sign-in and
 * sign-out are full-page navigations to `/sign-in` and `/sign-out`, so the
 * browser always carries the sealed session cookie.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>('loading');
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [account, setAccount] = React.useState<AccountSnapshot | null>(null);
  const [claims, setClaims] = React.useState<AccountClaims>(DEFAULT_CLAIMS);
  const [error, setError] = React.useState<string | null>(null);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = React.useCallback(async () => {
    try {
      const payload = await fetchAccount();
      if (!mounted.current) return;

      if (!payload.configured) {
        setUser(null);
        setAccount(null);
        setClaims(DEFAULT_CLAIMS);
        setStatus('unconfigured');
        return;
      }

      if (!payload.user) {
        setUser(null);
        setAccount(null);
        setClaims(DEFAULT_CLAIMS);
        setStatus('signed-out');
        return;
      }

      setUser(payload.user);
      setAccount(payload.account);
      setClaims(payload.claims ?? DEFAULT_CLAIMS);
      setError(null);
      setStatus('signed-in');
    } catch (cause) {
      if (!mounted.current) return;
      // The session is valid but the account could not be loaded: show a
      // recoverable state rather than pretending everything is fine.
      setError(
        cause instanceof Error
          ? cause.message
          : 'We could not load your iSchoolie profile. Check your connection and try again.',
      );
      setStatus('error');
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const refresh = React.useCallback(
    async (_options?: { forceToken?: boolean }) => {
      await load();
    },
    [load],
  );

  const signOut = React.useCallback(async () => {
    setUser(null);
    setAccount(null);
    setClaims(DEFAULT_CLAIMS);
    setStatus('signed-out');
    // Ends the AuthKit session server-side and clears the cookie.
    window.location.assign('/sign-out');
  }, []);

  const roles = React.useMemo(
    () => (account?.roles ? effectiveRoles(account.roles) : claims.roles),
    [account?.roles, claims.roles],
  );

  const memberships = React.useMemo(
    () => account?.memberships ?? [],
    [account?.memberships],
  );

  const workspaces = React.useMemo(
    () => buildWorkspaces({ roles, memberships }),
    [roles, memberships],
  );

  const teacherVerified = React.useMemo(
    () =>
      claims.teacherVerified ||
      account?.roles?.teacherVerification.status === 'verified',
    [claims.teacherVerified, account?.roles?.teacherVerification.status],
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile: account?.profile ?? null,
      account,
      claims,
      roles,
      memberships,
      workspaces,
      platformAdmin: claims.platformAdmin,
      teacherVerified,
      error,
      refresh,
      signOut,
    }),
    [
      status,
      user,
      account,
      claims,
      roles,
      memberships,
      workspaces,
      teacherVerified,
      error,
      refresh,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
