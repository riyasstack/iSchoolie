import { badRequest, privateJson, readJson, unauthorized } from '@/lib/server/api';
import { loadAccount, loadClaims, provisionAccount, updatePublicProfile } from '@/lib/server/identity';
import { getWorkosUser, toSessionUser } from '@/lib/server/session';
import { isWorkosConfigured } from '@/lib/server/workos-config';

export const dynamic = 'force-dynamic';

/**
 * Who am I, and what may I open?
 *
 * Firestore used to answer this from the browser with two document reads plus
 * a collection-group query. The same snapshot is now built server-side from
 * the WorkOS session and Postgres, and the client never supplies the user id.
 */
export async function GET() {
  if (!isWorkosConfigured()) {
    return privateJson({ configured: false, user: null, account: null, claims: null });
  }

  const workosUser = await getWorkosUser();
  if (!workosUser) {
    return privateJson({ configured: true, user: null, account: null, claims: null });
  }

  // Idempotent bootstrap: a retried callback can never create a second row.
  const user = await provisionAccount(workosUser);
  const [account, claims] = await Promise.all([loadAccount(user.id), loadClaims(user.id)]);

  return privateJson({
    configured: true,
    user: toSessionUser(workosUser),
    account,
    claims,
  });
}

/** Public-safe profile fields only. */
export async function PATCH(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);

  const body = await readJson<{
    displayName?: unknown;
    headline?: unknown;
    country?: unknown;
  }>(request);
  if (!body) return badRequest('Expected a JSON body.');

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || body.displayName.trim().length < 2) {
      return badRequest('Display name must be at least 2 characters.');
    }
  }
  if (body.headline !== undefined && body.headline !== null && typeof body.headline !== 'string') {
    return badRequest('Headline must be text.');
  }
  if (body.country !== undefined && body.country !== null && typeof body.country !== 'string') {
    return badRequest('Country must be text.');
  }

  await updatePublicProfile(user.id, {
    displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
    headline:
      body.headline === undefined ? undefined : (body.headline as string | null),
    country: body.country === undefined ? undefined : (body.country as string | null),
  });

  return privateJson({ account: await loadAccount(user.id) });
}
