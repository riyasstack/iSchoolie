import { badRequest, privateJson, readJson, unauthorized } from '@/lib/server/api';
import { provisionAccount } from '@/lib/server/identity';
import { getWorkosUser } from '@/lib/server/session';
import { getWorkOS } from '@workos-inc/authkit-nextjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const workosUser = await getWorkosUser();
  if (!workosUser) return unauthorized();
  await provisionAccount(workosUser);

  const body = await readJson<{ currentPassword?: unknown; newPassword?: unknown }>(request);
  if (!body) return badRequest('Expected a JSON body.');
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!currentPassword || !newPassword) return badRequest('Both passwords are required.');
  if (newPassword.length < 8) return badRequest('The new password is too short.');

  // Verify the current password before allowing a change.
  try {
    await getWorkOS().userManagement.authenticateWithPassword({
      email: workosUser.email,
      password: currentPassword,
    });
  } catch {
    return privateJson({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  try {
    await getWorkOS().userManagement.updateUser({
      userId: workosUser.id,
      password: newPassword,
    });
  } catch {
    return privateJson({ error: 'Could not update the password.' }, { status: 400 });
  }

  return privateJson({ ok: true });
}