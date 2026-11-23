import { NextResponse } from 'next/server';

/** Private, per-user JSON. Never cached by a CDN or the browser. */
export function privateJson<T>(body: T, init?: { status?: number }): NextResponse<T> {
  const response = NextResponse.json(body, { status: init?.status ?? 200 });
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Vary', 'Cookie');
  return response;
}

export function unauthorized(): NextResponse<{ error: string }> {
  return privateJson({ error: 'Sign in to continue.' }, { status: 401 });
}

export function badRequest(message: string): NextResponse<{ error: string }> {
  return privateJson({ error: message }, { status: 400 });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
