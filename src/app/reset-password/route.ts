import { NextResponse, type NextRequest } from 'next/server';
import { isWorkosConfigured } from '@/lib/server/workos-config';

export const dynamic = 'force-dynamic';

/** Password reset links are completed by AuthKit; forward to the sign-in screen. */
export async function GET(request: NextRequest) {
  const target = isWorkosConfigured() ? '/sign-in' : '/auth/error';
  return NextResponse.redirect(new URL(target, request.url));
}
