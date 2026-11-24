import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { provisionAccount } from '@/lib/server/identity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleAuth({
    returnPathname: '/auth/redirect',
    onSuccess: async ({ user }) => {
      await provisionAccount(user);
    },
    onError: ({ error }) => {
      console.error('[AuthKit callback error]', error);
      const url = new URL('/auth/error', request.url);
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code?: unknown }).code;
        if (typeof code === 'string') url.searchParams.set('reason', code);
      }
      return NextResponse.redirect(url);
    },
  })(request);
}