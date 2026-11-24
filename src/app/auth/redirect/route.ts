import { NextResponse, type NextRequest } from 'next/server';
import { getWorkosUser } from '@/lib/server/session';
import { provisionAccount, loadAccount, loadClaims } from '@/lib/server/identity';
import { isWorkosConfigured } from '@/lib/server/workos-config';
import { resolvePostAuthRoute } from '@/lib/auth/workspaces';
import type { MembershipInput } from '@/lib/auth/workspaces';
import type { UserProfile, UserRolesDoc } from '@/lib/models';

export const dynamic = 'force-dynamic';

/**
 * Post-authentication router.
 *
 * WorkOS AuthKit finishes the code exchange in `/callback` and then sends the
 * browser here. The destination is derived from the freshly provisioned
 * account snapshot (email verification, onboarding completion, roles and
 * remembered workspace) rather than a hard-coded path, so a returning user
 * lands on the right place every time.
 */
export async function GET(request: NextRequest) {
  if (!isWorkosConfigured()) {
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }

  const workosUser = await getWorkosUser();
  if (!workosUser) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = await provisionAccount(workosUser);
  const [account, claims] = await Promise.all([loadAccount(user.id), loadClaims(user.id)]);

  const profile = account.profile as UserProfile | null;
  const rolesDoc = (account.roles ?? null) as UserRolesDoc | null;
  const memberships: readonly MembershipInput[] = account.memberships ?? [];

  const decision = resolvePostAuthRoute({
    emailVerified: workosUser.emailVerified,
    profile: profile ? { status: profile.status, onboarding: profile.onboarding, activeWorkspace: profile.activeWorkspace } : null,
    rolesDoc,
    memberships,
    platformAdmin: claims.platformAdmin,
  });

  return NextResponse.redirect(new URL(decision.path, request.url));
}
