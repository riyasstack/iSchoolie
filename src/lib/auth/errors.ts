/**
 * Firebase Auth error translation.
 *
 * Two goals:
 *  1. Actionable, human copy for real failures.
 *  2. Avoid account enumeration: invalid password, unknown email and
 *     "invalid credential" collapse into one message.
 */
import { FirebaseError } from 'firebase/app';
import { useFirebaseEmulators } from '@/lib/config';

export type AuthErrorKind =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'too-many-requests'
  | 'network'
  | 'popup-blocked'
  | 'popup-closed'
  | 'provider-not-enabled'
  | 'unauthorized-domain'
  | 'account-disabled'
  | 'email-not-verified'
  | 'requires-recent-login'
  | 'credential-in-use'
  | 'different-credential'
  | 'invalid-action-code'
  | 'operation-not-allowed'
  | 'email-delivery'
  | 'unknown';

export interface NormalisedAuthError {
  kind: AuthErrorKind;
  message: string;
  /** Provider id carried by `account-exists-with-different-credential`. */
  pendingProviderId?: string;
  /** The original code, for logs and tests. Never shown raw to users. */
  code: string;
}

const MESSAGES: Record<AuthErrorKind, string> = {
  'invalid-credentials': 'That email and password combination is not correct. Please try again.',
  'email-in-use': 'An iSchoolie account already exists for this email. Sign in instead.',
  'weak-password': 'Choose a stronger password of at least 8 characters.',
  'too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  network: useFirebaseEmulators
    ? 'The local Firebase emulators are not reachable. Start them with `npm run emulators` and try again.'
    : 'We could not reach iSchoolie. Check your connection and try again.',
  'popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups and try again.',
  'popup-closed': 'Sign-in was cancelled before it finished.',
  'provider-not-enabled':
    'This sign-in method is not available right now. Use email and password, or contact support.',
  'unauthorized-domain':
    'This domain is not authorised for sign-in. Add it under Firebase Authentication → Settings → Authorized domains.',
  'account-disabled': 'This account has been disabled. Contact iSchoolie support for help.',
  'email-not-verified': 'Verify your email address to continue.',
  'requires-recent-login': 'For your security, sign in again before making this change.',
  'credential-in-use': 'That sign-in method is already linked to another iSchoolie account.',
  'different-credential':
    'This email is already registered with a different sign-in method. Sign in with that method to link it.',
  'invalid-action-code':
    'This link has expired or has already been used. Request a new one and try again.',
  'operation-not-allowed':
    'This sign-in method has not been enabled for iSchoolie. Please use another method.',
  'email-delivery':
    'We could not send that email right now. Please try again, or contact support if it keeps happening.',
  unknown: 'Something went wrong. Please try again.',
};

/** Map a Firebase error code to a normalised, user-facing result. */
export function normaliseAuthError(error: unknown): NormalisedAuthError {
  if (!(error instanceof FirebaseError)) {
    if (error instanceof Error && /network|offline|Failed to fetch/i.test(error.message)) {
      return { kind: 'network', message: MESSAGES.network, code: 'network' };
    }
    return { kind: 'unknown', message: MESSAGES.unknown, code: 'unknown' };
  }

  const code = error.code;
  const customData = error.customData as Record<string, unknown> | undefined;
  const pendingProviderId =
    typeof customData?.pendingCredential === 'object' && customData.pendingCredential
      ? undefined
      : undefined;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return { kind: 'invalid-credentials', message: MESSAGES['invalid-credentials'], code };
    case 'auth/email-already-in-use':
      return { kind: 'email-in-use', message: MESSAGES['email-in-use'], code };
    case 'auth/weak-password':
      return { kind: 'weak-password', message: MESSAGES['weak-password'], code };
    case 'auth/too-many-requests':
      return { kind: 'too-many-requests', message: MESSAGES['too-many-requests'], code };
    case 'auth/network-request-failed':
      return { kind: 'network', message: MESSAGES.network, code };
    case 'auth/popup-blocked':
      return { kind: 'popup-blocked', message: MESSAGES['popup-blocked'], code };
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return { kind: 'popup-closed', message: MESSAGES['popup-closed'], code };
    case 'auth/operation-not-allowed':
      return { kind: 'provider-not-enabled', message: MESSAGES['provider-not-enabled'], code };
    case 'auth/unauthorized-domain':
      return { kind: 'unauthorized-domain', message: MESSAGES['unauthorized-domain'], code };
    case 'auth/user-disabled':
      return { kind: 'account-disabled', message: MESSAGES['account-disabled'], code };
    case 'auth/requires-recent-login':
      return { kind: 'requires-recent-login', message: MESSAGES['requires-recent-login'], code };
    case 'auth/credential-already-in-use':
      return { kind: 'credential-in-use', message: MESSAGES['credential-in-use'], code };
    case 'auth/account-exists-with-different-credential':
      return { kind: 'different-credential', message: MESSAGES['different-credential'], code, pendingProviderId };
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return { kind: 'invalid-action-code', message: MESSAGES['invalid-action-code'], code };
    case 'auth/unauthorized-continue-uri':
    case 'auth/invalid-continue-uri':
    case 'auth/missing-continue-uri':
      return { kind: 'email-delivery', message: MESSAGES['email-delivery'], code };
    default:
      return { kind: 'unknown', message: MESSAGES.unknown, code };
  }
}
