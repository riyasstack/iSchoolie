/**
 * Public runtime configuration.
 *
 * WorkOS/AuthKit owns identity; Postgres is the data store. No Firebase.
 */
export const appOrigin = (process.env.NEXT_PUBLIC_APP_ORIGIN ?? '').replace(/\/$/, '');

/**
 * Optional providers are only advertised when an operator has actually
 * configured them. Never render a sign-in button that cannot work.
 */
export const providerFlags = {
  apple: process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED === 'true',
  linkedin: process.env.NEXT_PUBLIC_AUTH_LINKEDIN_ENABLED === 'true',
} as const;

export const PRODUCT = {
  name: 'iSchoolie',
  tagline: 'Learn. Teach. Connect. Grow.',
  supportEmail: 'support@ischoolie.app',
  minIndependentClass: 8,
} as const;