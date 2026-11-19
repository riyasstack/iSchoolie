/**
 * Public runtime configuration.
 *
 * Only `NEXT_PUBLIC_*` values are available in the browser, and they are
 * inlined at build time. Nothing here is a secret: Firestore Security Rules
 * are the security boundary, not the obscurity of these identifiers.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
} as const;

/** True when enough config exists to initialise the Firebase JS SDK. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/** Point the SDK at the local emulator suite instead of a real project. */
export const useFirebaseEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export const appOrigin = (process.env.NEXT_PUBLIC_APP_ORIGIN ?? '').replace(/\/$/, '');

/**
 * FCM Web Push certificate key. Public by design — it is handed to the browser
 * with `getToken`. Without it, no push registration is attempted.
 */
export const fcmVapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY ?? '';

/**
 * Push needs a real Firebase project: the emulator suite has no FCM service,
 * and a demo project id can never obtain a registration token.
 */
export const isPushConfigured =
  Boolean(fcmVapidKey) && isFirebaseConfigured && !useFirebaseEmulators;

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
