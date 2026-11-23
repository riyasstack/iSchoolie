import { badRequest, privateJson, readJson, unauthorized } from '@/lib/server/api';
import { getMyApplication, saveInstitutionApplication } from '@/lib/server/institutions';
import { provisionAccount } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';
import { institutionApplicationSchema } from '@/lib/schemas/institution';

export const dynamic = 'force-dynamic';

/**
 * The caller's own institution application.
 *
 * Identity comes from the WorkOS session only — the client never sends a user
 * id, so one applicant can never read or write another's application.
 */

export async function GET() {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);
  return privateJson({ application: await getMyApplication(user.id) });
}

export async function POST(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  const user = await provisionAccount(workosUser);

  const body = await readJson<{
    values?: unknown;
    submit?: unknown;
    applicantName?: unknown;
  }>(request);
  if (!body) return badRequest('Expected a JSON body.');

  // Declarations are part of the schema: a submission cannot skip them just
  // because it skipped the form.
  const parsed = institutionApplicationSchema.safeParse(body.values);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? 'Check the application details.');
  }

  const applicantName =
    typeof body.applicantName === 'string' && body.applicantName.trim().length > 0
      ? body.applicantName.trim().slice(0, 80)
      : user.displayName;

  try {
    await saveInstitutionApplication(user.id, parsed.data, {
      submit: body.submit === true,
      applicantName,
    });
  } catch (cause) {
    return badRequest(
      cause instanceof Error ? cause.message : 'Could not save your application.',
    );
  }

  return privateJson({ application: await getMyApplication(user.id) });
}
