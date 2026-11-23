/**
 * Account read/write services (client side).
 *
 * This module used to talk to Firestore directly. Identity now lives in
 * Postgres behind `/api/*` route handlers, so every call here is an HTTP
 * request whose identity is resolved from the WorkOS session cookie — no
 * caller ever passes a user id.
 */
import type {
  AccountClaims,
  AccountSnapshot,
  AppNotification,
  SessionUser,
  UserPrivateProfile,
} from '@/lib/models';

export type { AccountSnapshot } from '@/lib/models';

export interface AccountPayload {
  configured: boolean;
  user: SessionUser | null;
  account: AccountSnapshot | null;
  claims: AccountClaims | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status}).`);
  }
  return payload as T;
}

/** Session + account snapshot in one round trip. */
export function fetchAccount(): Promise<AccountPayload> {
  return request<AccountPayload>('/api/account');
}

export async function loadPrivateProfile(): Promise<UserPrivateProfile | null> {
  const { profile } = await request<{ profile: UserPrivateProfile | null }>(
    '/api/account/profile',
  );
  return profile;
}

export async function setActiveWorkspace(workspaceId: string | null): Promise<void> {
  await request<{ ok: boolean }>('/api/account/workspace', {
    method: 'POST',
    body: JSON.stringify({ workspaceId }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await request<{ ok: boolean }>('/api/account/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return { ok: true };
  } catch (cause) {
    return { ok: false, message: cause instanceof Error ? cause.message : 'Could not update password.' };
  }
}

export async function changeEmail(email: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await request<{ ok: boolean }>('/api/account/email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return { ok: true };
  } catch (cause) {
    return { ok: false, message: cause instanceof Error ? cause.message : 'Could not start the email change.' };
  }
}

export async function revokeAllSessions(): Promise<void> {
  await request<{ ok: boolean }>('/api/account/sessions', { method: 'DELETE' });
}

export async function deleteAccount(password?: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await request<{ ok: boolean }>('/api/account/delete', {
      method: 'POST',
      body: JSON.stringify({ password: password ?? '' }),
    });
    return { ok: true };
  } catch (cause) {
    return { ok: false, message: cause instanceof Error ? cause.message : 'Could not delete the account.' };
  }
}

export interface LinkedIdentity {
  idpId: string;
  type: string;
  provider: string;
}

export async function listIdentities(): Promise<LinkedIdentity[]> {
  const { identities } = await request<{ identities: LinkedIdentity[] }>('/api/account/identities');
  return identities ?? [];
}
export async function updatePublicProfile(
  values: {
    displayName?: string;
    headline?: string | null;
    country?: string | null;
  },
): Promise<void> {
  await request<{ account: AccountSnapshot }>('/api/account', {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
}

export async function updatePrivateProfile(
  values: Partial<Omit<UserPrivateProfile, 'email' | 'updatedAt' | 'consent'>>,
): Promise<void> {
  await request<{ profile: UserPrivateProfile }>('/api/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
}

export async function listNotifications(max = 20): Promise<AppNotification[]> {
  const { notifications } = await request<{ notifications: AppNotification[] }>(
    `/api/notifications?max=${encodeURIComponent(String(max))}`,
  );
  return notifications;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await request<{ ok: boolean }>('/api/notifications', {
    method: 'POST',
    body: JSON.stringify({ id: notificationId }),
  });
}

export async function markAllNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await request<{ ok: boolean }>('/api/notifications', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}
