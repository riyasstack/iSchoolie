/**
 * Browser push notifications (Firebase Cloud Messaging).
 *
 * Everything here runs in the browser: permission, service-worker
 * registration and the FCM registration token. There is no server in this
 * deployment, so obtaining a token is the end of the line — see
 * `docs/RUNBOOK.md` for what still has to exist before a push can be
 * *delivered*.
 */
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from 'firebase/messaging';
import { FirebaseError } from 'firebase/app';
import { getFirebaseApp } from '@/lib/firebase/client';
import { fcmVapidKey, firebaseConfig, isPushConfigured } from '@/lib/config';

const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';
const TOKEN_STORAGE_KEY = 'ischoolie:push-token';

export type PushOutcome =
  | { ok: true; token: string }
  | { ok: false; message: string };

export type PushAvailability = 'ready' | 'unsupported' | 'unconfigured' | 'insecure';

/** The token obtained on this device, if push was enabled here before. */
export function storedPushToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Whether this browser can do web push at all. */
export async function pushAvailability(): Promise<PushAvailability> {
  if (typeof window === 'undefined') return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  if (!isPushConfigured) return 'unconfigured';
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return 'unsupported';
  try {
    return (await isSupported()) ? 'ready' : 'unsupported';
  } catch {
    return 'unsupported';
  }
}

function messaging(): Messaging {
  return getMessaging(getFirebaseApp());
}

/**
 * Ask for permission, register the service worker and obtain an FCM token.
 *
 * Must be called from a user gesture: browsers ignore `Notification
 * .requestPermission()` prompts that are not triggered by interaction.
 */
export async function enablePush(): Promise<PushOutcome> {
  const availability = await pushAvailability();
  if (availability === 'insecure') {
    return {
      ok: false,
      message: 'Push needs HTTPS (or localhost). Serve this build over a secure origin.',
    };
  }
  if (availability === 'unconfigured') {
    return {
      ok: false,
      message:
        'Push is not configured for this build. Set NEXT_PUBLIC_FCM_VAPID_KEY and use a real Firebase project — the emulator cannot issue push tokens.',
    };
  }
  if (availability === 'unsupported') {
    return {
      ok: false,
      message:
        'This browser cannot receive push notifications. On iOS, add iSchoolie to the Home Screen first.',
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      message:
        permission === 'denied'
          ? 'Notifications are blocked for this site. Re-enable them in your browser’s site settings, then try again.'
          : 'Notifications were not allowed, so this device was not registered.',
    };
  }

  try {
    // The worker is registered with the public project config in the query
    // string so the static file never has to hard-code one project.
    const registration = await navigator.serviceWorker.register(
      `${SERVICE_WORKER_PATH}?config=${encodeURIComponent(JSON.stringify(firebaseConfig))}`,
      { scope: '/' },
    );
    const token = await getToken(messaging(), {
      vapidKey: fcmVapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) {
      return { ok: false, message: 'Firebase did not return a push token for this device.' };
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return { ok: true, token };
  } catch (error) {
    return { ok: false, message: describePushError(error) };
  }
}

/** Stop receiving pushes on this device and forget its token. */
export async function disablePush(): Promise<void> {
  try {
    await deleteToken(messaging());
  } catch {
    // A missing/invalid registration is already the desired end state.
  }
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    const registration = await navigator.serviceWorker.getRegistration('/');
    await registration?.unregister();
  } catch {
    // Nothing else to undo.
  }
}

/**
 * Foreground messages never reach the service worker, so the page has to show
 * them itself. Returns an unsubscribe function.
 */
export function watchForegroundPush(
  onNotification: (title: string, body: string) => void,
): () => void {
  try {
    return onMessage(messaging(), (payload) => {
      onNotification(
        payload.notification?.title ?? 'iSchoolie',
        payload.notification?.body ?? '',
      );
    });
  } catch {
    return () => {};
  }
}

function describePushError(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code.includes('token-subscribe-failed')) {
      return 'Firebase refused the push registration. Check that the VAPID key belongs to this Firebase project.';
    }
    if (error.code.includes('invalid-vapid-key')) {
      return 'The push key (NEXT_PUBLIC_FCM_VAPID_KEY) is not a valid Web Push certificate key.';
    }
    if (error.code.includes('unauthorized') || error.code.includes('permission')) {
      return 'This browser or an extension blocked push registration. Check site permissions and try again.';
    }
  }
  return 'Could not register this device for push notifications. Please try again.';
}
