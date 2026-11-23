import { badRequest, privateJson, readJson, unauthorized } from '@/lib/server/api';
import { provisionAccount } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';
import { getWorkOS } from '@workos-inc/authkit-nextjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  await provisionAccount(workosUser);

  const body = await readJson<{ email?: unknown }>(request);
  if (!body) return badRequest('Expected a JSON body.');
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) return badRequest('Enter a valid email address.');
  if (email === workosUser.email.trim().toLowerCase()) {
    return badRequest('That is already your email address.');
  }

  try {
    await getWorkOS().userManagement.updateUser({
      userId: workosUser.id,
      email,
      emailVerified: false,
    });
  } catch {
    return privateJson({ error: 'Could not start the email change.' }, { status: 400 });
  }

  return privateJson({ ok: true });
}