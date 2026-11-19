'use client';

import * as React from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { FirebaseNotConfiguredError, getFirebaseAuth } from '@/lib/firebase/client';
import { isFirebaseConfigured } from '@/lib/config';
import { ensureAccountDocuments, loadAccount, type AccountSnapshot } from '@/lib/services/users';
import { effectiveRoles } from '@/lib/auth/permissions';
import { buildWorkspaces, type MembershipInput, type WorkspaceOption } from '@/lib/auth/workspaces';
import type { AccountClaims, RoleKey, UserProfile } from '@/lib/models';

export type AuthStatus = 'unconfigured' | 'loading' | 'signed-out' | 'signed-in' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
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

function readClaims(raw: Record<string, unknown> | undefined, rolesDoc: AccountSnapshot['roles']): AccountClaims {
  const rolesFromDoc = rolesDoc ? effectiveRoles(rolesDoc) : [];
  return {
    platformAdmin: raw?.platformAdmin === true,
    teacherVerified: raw?.teacherVerified === true,
    suspended: raw?.suspended === true,
    roles: Array.isArray(raw?.roles)
      ? (raw.roles as RoleKey[])
      : rolesFromDoc,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>(
    isFirebaseConfigured ? 'loading' : 'unconfigured',
  );
  const [user, setUser] = React.useState<User | null>(null);
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

  const hydrate = React.useCallback(async (fbUser: User, forceToken = false) => {
    try {
      await ensureAccountDocuments(fbUser);
      const [snapshot, token] = await Promise.all([
        loadAccount(fbUser.uid),
        fbUser.getIdTokenResult(forceToken),
      ]);
      if (!mounted.current) return;
      setAccount(snapshot);
      setClaims(readClaims(token.claims as Record<string, unknown>, snapshot.roles));
      setError(null);
      setStatus('signed-in');
    } catch (cause) {
      if (!mounted.current) return;
      if (cause instanceof FirebaseNotConfiguredError) {
        setStatus('unconfigured');
        return;
      }
      // Auth succeeded but the profile could not be loaded: show a recoverable
      // state rather than pretending the session is healthy.
      setError(
        cause instanceof Error
          ? cause.message
          : 'We could not load your iSchoolie profile. Check your connection and try again.',
      );
      setStatus('error');
    }
  }, []);

  React.useEffect(() => {
    if (!isFirebaseConfigured) {
      setStatus('unconfigured');
      return;
    }
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
        setUser(fbUser);
        if (!fbUser) {
          setAccount(null);
          setClaims(DEFAULT_CLAIMS);
          setStatus('signed-out');
          return;
        }
        setStatus('loading');
        void hydrate(fbUser);
      });
    } catch {
      setStatus('unconfigured');
    }
    return () => unsubscribe();
  }, [hydrate]);

  const refresh = React.useCallback(
    async (options?: { forceToken?: boolean }) => {
      const current = getFirebaseAuth().currentUser;
      if (!current) return;
      await hydrate(current, options?.forceToken ?? true);
    },
    [hydrate],
  );

  const signOut = React.useCallback(async () => {
    try {
      await fbSignOut(getFirebaseAuth());
    } finally {
      setAccount(null);
      setClaims(DEFAULT_CLAIMS);
      setStatus('signed-out');
    }
  }, []);

  const roles = React.useMemo(
    () => (account?.roles ? effectiveRoles(account.roles) : []),
    [account?.roles],
  );

  const memberships = React.useMemo(
    () => account?.memberships ?? [],
    [account?.memberships],
  );

  const workspaces = React.useMemo(
    () => buildWorkspaces({ roles, memberships }),
    [roles, memberships],
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
      teacherVerified: claims.teacherVerified || account?.roles?.teacherVerification.status === 'verified',
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
      error,
      refresh,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
