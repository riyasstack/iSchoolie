import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { provisionAccount } from '@/lib/server/identity';

export const dynamic = 'force-dynamic';

/**
 * OAuth callback for WorkOS AuthKit. The redirect URI must match the WorkOS
 * dashboard and `NEXT_PUBLIC_WORKOS_REDIRECT_URI`
 * (`http://localhost:3000/callback` in development).
 *
 * `onSuccess` bootstraps the account on first sign-in; it is keyed on the
 * WorkOS user id, so retries cannot create a second row.
 *
 * `onError` covers every failed callback — a direct visit without a PKCE
 * cookie, an expired or reused link, a state mismatch, or a rejected code
 * exchange. Without it AuthKit answers with a 500 JSON body. The browser goes
 * to `/auth/error` (never back to `/login`): bouncing into the sign-in entry
 * point would immediately start a new authorization and loop when the failure
 * is persistent.
 */
export async function GET(request: NextRequest) {
  return handleAuth({
    returnPathname: '/auth/redirect',
    onSuccess: async ({ user }) => {
      await provisionAccount(user);
    },
    onError: () => NextResponse.redirect(new URL('/auth/error', request.url)),
  })(request);
}
