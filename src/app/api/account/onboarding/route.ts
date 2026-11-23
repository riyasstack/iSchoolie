import { badRequest, privateJson, readJson, unauthorized } from '@/lib/server/api';
import { completeOnboarding, loadAccount, provisionAccount } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * Onboarding write path.
 *
 * Replaces the Firestore transaction in `src/lib/services/onboarding.ts`. The
 * client still calls the same `completeOnboarding` helper, but that helper now
 * posts to this route instead of opening a Firestore transaction.
 */
export async function POST(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();

  const user = await provisionAccount(workosUser);

  const body = await readJson<{
    displayName?: unknown;
    roles?: unknown;
    publicProfile?: unknown;
    privateProfile?: unknown;
    studentLevel?: unknown;
    dateOfBirth?: unknown;
    guardianEmail?: unknown;
    guardianAcknowledged?: unknown;
  }>(request);
  if (!body) return badRequest('Expected a JSON body.');

  if (typeof body.displayName !== 'string' || body.displayName.trim().length < 2) {
    return badRequest('displayName must be at least 2 characters.');
  }
  if (!Array.isArray(body.roles)) {
    return badRequest('roles must be an array.');
  }
  const roles = body.roles.filter(
    (role): role is string => typeof role === 'string' && role.length > 0,
  );
  if (roles.length === 0) {
    return badRequest('Select at least one role to continue.');
  }

  const studentLevel =
    body.studentLevel === 'school' || body.studentLevel === 'college'
      ? body.studentLevel
      : null;

  const dateOfBirth =
    typeof body.dateOfBirth === 'string' && body.dateOfBirth.trim().length > 0
      ? body.dateOfBirth.trim()
      : null;

  const guardianEmail =
    typeof body.guardianEmail === 'string'
      ? body.guardianEmail.trim() || null
      : null;

  const guardianAcknowledged =
    typeof body.guardianAcknowledged === 'boolean'
      ? body.guardianAcknowledged
      : false;

  const publicProfile =
    typeof body.publicProfile === 'object' && body.publicProfile !== null
      ? Object.fromEntries(
          Object.entries(body.publicProfile as Record<string, unknown>).filter(
            ([, value]) => value !== undefined && value !== null,
          ),
        )
      : undefined;

  const privateProfile =
    typeof body.privateProfile === 'object' && body.privateProfile !== null
      ? Object.fromEntries(
          Object.entries(body.privateProfile as Record<string, unknown>).filter(
            ([, value]) => value !== undefined && value !== null,
          ),
        )
      : undefined;

  try {
    await completeOnboarding(user.id, {
      uid: user.id,
      displayName: body.displayName.trim(),
      roles: roles as Parameters<typeof completeOnboarding>[1]['roles'],
      publicProfile,
      privateProfile,
      studentLevel,
      dateOfBirth,
      guardianEmail,
      guardianAcknowledged,
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : 'Could not save your profile.';
    return badRequest(message);
  }

  const account = await loadAccount(user.id);
  return privateJson({
    account,
    isMinor: account.profile?.safeguarding.isMinor ?? false,
    roles: account.roles?.selfDeclared ?? [],
  });
}

