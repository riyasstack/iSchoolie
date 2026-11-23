import { badRequest, privateJson, readJson, unauthorized } from '@/lib/server/api';
import { loadPrivateProfile, provisionAccount, updatePrivateProfile } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/** Owner-only private profile (was `users/{uid}/private/profile`). */
export async function GET() {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);
  return privateJson({ profile: await loadPrivateProfile(user.id) });
}

const ALLOWED_KEYS = new Set([
  'dateOfBirth',
  'schoolName',
  'grade',
  'collegeName',
  'degree',
  'department',
  'academicStage',
  'learningInterests',
  'guardianEmail',
]);

export async function PATCH(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);

  const body = await readJson<Record<string, unknown>>(request);
  if (!body || typeof body !== 'object') return badRequest('Expected a JSON body.');

  const values: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    // Email is controlled by WorkOS, not by this endpoint.
    if (!ALLOWED_KEYS.has(key)) continue;
    values[key] = value;
  }
  if (Object.keys(values).length === 0) return badRequest('No editable fields supplied.');

  await updatePrivateProfile(
    user.id,
    values as Parameters<typeof updatePrivateProfile>[1],
  );

  return privateJson({ profile: await loadPrivateProfile(user.id) });
}
