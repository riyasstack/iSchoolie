/**
 * Firebase client initialisation (modular SDK, browser only).
 *
 * Notes for the Spark plan:
 *  - Firestore is initialised with a persistent local cache so repeat
 *    navigation does not re-bill reads for unchanged documents.
 *  - IndexedDB persistence is best-effort: third-party storage can be blocked
 *    (private mode, some managed school devices), so a failure falls back to
 *    the default in-memory cache instead of breaking the app.
 */
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured, useFirebaseEmulators } from '@/lib/config';

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Firebase is not configured. Copy .env.local.example to .env.local and add your project keys.',
    );
    this.name = 'FirebaseNotConfiguredError';
  }
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
const emulatorState = { auth: false, firestore: false };

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured) throw new FirebaseNotConfiguredError();
  if (app) return app;
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseApp(): FirebaseApp {
  return ensureApp();
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const auth = getAuth(ensureApp());
  if (useFirebaseEmulators && !emulatorState.auth) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    emulatorState.auth = true;
  }
  authInstance = auth;
  return auth;
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  const firebaseApp = ensureApp();
  try {
    dbInstance = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      // Rules-visible metadata; ignore undefined fields rather than throwing.
      ignoreUndefinedProperties: true,
    });
  } catch {
    // Already initialised elsewhere in this tab, or persistence unavailable.
    dbInstance = getFirestore(firebaseApp);
  }
  if (useFirebaseEmulators && !emulatorState.firestore) {
    connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
    emulatorState.firestore = true;
  }
  return dbInstance;
}

/**
 * Session persistence policy.
 *
 * `remember` = stay signed in on this device (private device).
 * `!remember` = session-only, cleared when the tab closes (shared school
 * library computer). This is a real mitigation, not a UI adornment.
 */
export async function applyPersistence(remember: boolean): Promise<void> {
  const persistence: Persistence = remember ? browserLocalPersistence : browserSessionPersistence;
  try {
    await setPersistence(getFirebaseAuth(), persistence);
  } catch (error) {
    // Unsupported browser: continue with whatever persistence is available.
    if (process.env.NODE_ENV !== 'production') console.warn('setPersistence failed', error);
  }
}
