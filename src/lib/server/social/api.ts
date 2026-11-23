import 'server-only';
import { NextResponse } from 'next/server';
import { privateJson, unauthorized } from '@/lib/server/api';
import { getApiViewer, type SocialViewerRecord } from '@/lib/server/social/auth';

/**
 * Same-origin check for cookie-authenticated mutations. Requests without an
 * Origin header (server-to-server, curl) are still required to carry a valid
 * WorkOS session; the check exists to stop a browser on another origin from
 * riding the cookie.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function errorResponse(error: unknown, fallbackStatus = 400): NextResponse {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  const status = /restricted|moderation|administrator/i.test(message)
    ? 403
    : /not available|not found/i.test(message)
      ? 404
      : fallbackStatus;
  // Do not echo stack traces or SQL detail.
  return privateJson({ error: message.slice(0, 240) }, { status });
}

export async function withViewer(
  request: Request,
  handler: (viewer: SocialViewerRecord) => Promise<NextResponse>,
): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return privateJson({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }
  const viewer = await getApiViewer();
  if (!viewer) return unauthorized();
  try {
    return await handler(viewer);
  } catch (error) {
    return errorResponse(error);
  }
}

export function query(request: Request): URLSearchParams {
  return new URL(request.url).searchParams;
}
