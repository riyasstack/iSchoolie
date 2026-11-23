import 'server-only';
import { withAuth } from '@workos-inc/authkit-nextjs';
import type { User as WorkosUser } from '@workos-inc/node';
import type { SessionUser } from '@/lib/models';
import { isWorkosConfigured } from '@/lib/server/workos-config';

export interface SessionResult {
  configured: boolean;
  user: SessionUser | null;
}

/** WorkOS is the credential store; this is the only place it is read. */
export function toSessionUser(user: WorkosUser): SessionUser {
  const name =
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email.split('@')[0];

  return {
    uid: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: name,
    photoURL: user.profilePictureUrl,
    // AuthKit does not expose the linked-method list in the session; the
    // account pages read it from WorkOS through the management API later.
    providerData: [],
    metadata: { lastSignInTime: user.lastSignInAt ? user.lastSignInAt.toISOString() : null },
  };
}

/**
 * Current session, or `{ configured: false }` when the keys are still the
 * placeholders committed to `.env.local.example`.
 */
export async function getSession(): Promise<SessionResult> {
  if (!isWorkosConfigured()) return { configured: false, user: null };
  const { user } = await withAuth();
  return { configured: true, user: user ? toSessionUser(user) : null };
}

/** Session required for a private API route. */
export async function requireSessionUser(): Promise<SessionUser | null> {
  const { user } = await getSession();
  return user;
}

export async function getWorkosUser(): Promise<WorkosUser | null> {
  if (!isWorkosConfigured()) return null;
  const { user } = await withAuth();
  return user ?? null;
}
