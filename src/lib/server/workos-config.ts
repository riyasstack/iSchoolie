/**
 * WorkOS AuthKit configuration guard.
 *
 * The repository ships placeholder values so the project builds and boots
 * before the real keys exist. Anything containing `placeholder` is treated as
 * "not configured": the app then shows a setup notice instead of sending the
 * browser to a WorkOS sign-in page that would reject the client id.
 */
export function isWorkosConfigured(): boolean {
  const clientId = process.env.WORKOS_CLIENT_ID ?? '';
  const cookiePassword = process.env.WORKOS_COOKIE_PASSWORD ?? '';
  if (!clientId || !cookiePassword) return false;
  if (clientId.includes('placeholder') || cookiePassword.includes('placeholder')) return false;
  // AuthKit encrypts the session cookie with this value; it must be >= 32 chars.
  return cookiePassword.length >= 32;
}

export const WORKOS_ENV_KEYS = [
  'WORKOS_CLIENT_ID',
  'WORKOS_API_KEY',
  'WORKOS_COOKIE_PASSWORD',
  'NEXT_PUBLIC_WORKOS_REDIRECT_URI',
] as const;
