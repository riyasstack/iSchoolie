/**
 * Firebase Authentication operations.
 *
 * Everything the UI can do to an identity lives here so that error handling,
 * account linking and re-authentication are implemented once. No page talks to
 * the Auth SDK directly.
 */
import {
  EmailAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  linkWithPopup,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  getRedirectResult,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  unlink,
  updateProfile,
  verifyBeforeUpdateEmail,
  type AuthCredential,
  type OAuthCredential,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { applyPersistence, getFirebaseAuth } from '@/lib/firebase/client';
import { normaliseAuthError, type NormalisedAuthError } from '@/lib/auth/errors';
import { appOrigin } from '@/lib/config';

/** Where a Firebase email action hands control back to this deployment. */
function continueUrl(path: string): string {
  return `${appOrigin || window.location.origin}${path}`;
}

export type ProviderId = 'google.com' | 'github.com' | 'apple.com' | 'linkedin.com';

export type SignInOutcome =
  | { kind: 'success'; user: User }
  | { kind: 'needs-linking'; email: string; methods: string[] }
  /** The page is navigating away to the provider; nothing else will run. */
  | { kind: 'redirecting' }
  | { kind: 'error'; error: NormalisedAuthError };

/**
 * A pending OAuth credential captured from `account-exists-with-different-credential`.
 * It only lives in memory for the current tab: credentials are not persisted.
 */
let pendingCredential: OAuthCredential | null = null;
let pendingEmail: string | null = null;

export function getPendingLink(): { email: string | null; hasCredential: boolean } {
  return { email: pendingEmail, hasCredential: pendingCredential !== null };
}

export function clearPendingLink(): void {
  pendingCredential = null;
  pendingEmail = null;
}

function buildProvider(providerId: ProviderId) {
  switch (providerId) {
    case 'google.com': {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return provider;
    }
    case 'github.com': {
      const provider = new GithubAuthProvider();
      provider.addScope('read:user');
      provider.addScope('user:email');
      return provider;
    }
    case 'apple.com': {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      return provider;
    }
    case 'linkedin.com': {
      return new OAuthProvider('linkedin.com');
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Email & password                                                           */
/* -------------------------------------------------------------------------- */

export async function signInWithEmail(
  email: string,
  password: string,
  remember: boolean,
): Promise<SignInOutcome> {
  try {
    await applyPersistence(remember);
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

    // If an OAuth attempt failed earlier because this email already existed,
    // finish the link now that we have a verified sign-in for the account.
    if (pendingCredential) {
      try {
        await linkWithCredential(credential.user, pendingCredential);
        clearPendingLink();
      } catch (linkError) {
        clearPendingLink();
        if (
          linkError instanceof FirebaseError &&
          linkError.code === 'auth/credential-already-in-use'
        ) {
          return {
            kind: 'error',
            error: {
              kind: 'credential-in-use',
              message:
                'That provider is already linked to another iSchoolie account. Sign in to that account instead.',
              code: linkError.code,
            },
          };
        }
        // Linking failure must not block a valid sign-in.
      }
    }

    return { kind: 'success', user: credential.user };
  } catch (error) {
    return { kind: 'error', error: normaliseAuthError(error) };
  }
}

export async function signUpWithEmail(
  fullName: string,
  email: string,
  password: string,
  remember = true,
): Promise<SignInOutcome> {
  try {
    await applyPersistence(remember);
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    await updateProfile(credential.user, { displayName: fullName.trim() });
    // The account exists from here on, so a failed send must not surface as a
    // failed sign-up: /verify-email offers "Resend verification email".
    try {
      await sendEmailVerification(credential.user, { url: continueUrl('/verify-email') });
    } catch {
      // Deliberately ignored; see above.
    }
    return { kind: 'success', user: credential.user };
  } catch (error) {
    return { kind: 'error', error: normaliseAuthError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/* OAuth providers                                                            */
/* -------------------------------------------------------------------------- */

/** Popup failures that mean "use the redirect flow instead". */
const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
]);

export async function signInWithProvider(
  providerId: ProviderId,
  remember = true,
): Promise<SignInOutcome> {
  const auth = getFirebaseAuth();
  try {
    await applyPersistence(remember);
    const credential = await signInWithPopup(auth, buildProvider(providerId));
    return { kind: 'success', user: credential.user };
  } catch (error) {
    // Managed school devices routinely block pop-ups. Rather than dead-ending
    // the user on "allow pop-ups", fall back to a full-page redirect; the
    // result comes back through `completeRedirectSignIn` on the next load.
    if (error instanceof FirebaseError && REDIRECT_FALLBACK_CODES.has(error.code)) {
      try {
        await applyPersistence(remember);
        await signInWithRedirect(auth, buildProvider(providerId));
        return { kind: 'redirecting' };
      } catch (redirectError) {
        return { kind: 'error', error: normaliseAuthError(redirectError) };
      }
    }
    if (
      error instanceof FirebaseError &&
      error.code === 'auth/account-exists-with-different-credential'
    ) {
      const credential = GithubAuthProvider.credentialFromError(error) ??
        GoogleAuthProvider.credentialFromError(error) ??
        OAuthProvider.credentialFromError(error);
      const email =
        (error.customData?.email as string | undefined) ??
        credential?.idToken ??
        '';
      pendingCredential = credential ?? null;
      pendingEmail = email;

      let methods: string[] = [];
      try {
        methods = email ? await fetchSignInMethodsForEmail(auth, email) : [];
      } catch {
        methods = [];
      }
      return { kind: 'needs-linking', email, methods };
    }
    return { kind: 'error', error: normaliseAuthError(error) };
  }
}

/**
 * Finish a provider sign-in that came back from the redirect fallback.
 *
 * Returns null when this page load is not a redirect return, so callers can
 * treat "nothing pending" differently from a real failure.
 */
let redirectPromise: Promise<SignInOutcome | null> | null = null;

export function completeRedirectSignIn(): Promise<SignInOutcome | null> {
  // React StrictMode mounts effects twice in development; calling
  // getRedirectResult twice on one page load makes the second call return
  // null and silently drop a successful redirect sign-in. Cache the in-flight
  // promise so every caller shares a single resolution.
  if (redirectPromise) return redirectPromise;
  redirectPromise = (async () => {
  try {
    const credential = await getRedirectResult(getFirebaseAuth());
    if (!credential) return null;
    return { kind: 'success', user: credential.user };
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === 'auth/account-exists-with-different-credential'
    ) {
      const credential =
        GoogleAuthProvider.credentialFromError(error) ??
        GithubAuthProvider.credentialFromError(error) ??
        OAuthProvider.credentialFromError(error);
      const email =
        (error.customData?.email as string | undefined) ??
        credential?.idToken ??
        '';
      pendingCredential = credential ?? null;
      pendingEmail = email;
      let methods: string[] = [];
      try {
        methods = email ? await fetchSignInMethodsForEmail(getFirebaseAuth(), email) : [];
      } catch {
        methods = [];
      }
      return { kind: 'needs-linking', email, methods };
    }
    return { kind: 'error', error: normaliseAuthError(error) };
  }
  })();
  redirectPromise.finally(() => {
    setTimeout(() => {
      redirectPromise = null;
    }, 0);
  });
  return redirectPromise;
}

/** Link an additional provider to the signed-in account. */
export async function linkProvider(
  user: User,
  providerId: ProviderId,
): Promise<{ ok: true } | { ok: false; error: NormalisedAuthError }> {
  try {
    await linkWithPopup(user, buildProvider(providerId));
    return { ok: true };
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/credential-already-in-use') {
      return {
        ok: false,
        error: {
          kind: 'credential-in-use',
          message:
            'That sign-in method is already connected to a different iSchoolie account. Sign in to that account to merge the identities manually.',
          code: error.code,
        },
      };
    }
    if (error instanceof FirebaseError && error.code === 'auth/provider-already-linked') {
      return { ok: true };
    }
    if (error instanceof FirebaseError && error.code === 'auth/requires-recent-login') {
      return { ok: false, error: normaliseAuthError(error) };
    }
    return { ok: false, error: normaliseAuthError(error) };
  }
}

export async function unlinkProvider(
  user: User,
  providerId: string,
): Promise<{ ok: true } | { ok: false; error: NormalisedAuthError }> {
  const usable = user.providerData.filter((info) => info.providerId !== 'firebase');
  if (usable.length <= 1) {
    return {
      ok: false,
      error: {
        kind: 'unknown',
        message:
          'This is your only sign-in method. Add another method before removing this one, otherwise you would be locked out.',
        code: 'ischoolie/last-sign-in-method',
      },
    };
  }
  try {
    await unlink(user, providerId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: normaliseAuthError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/* Recovery, verification and sensitive changes                               */
/* -------------------------------------------------------------------------- */

/**
 * Same copy whether or not the address has an account: the reset form must not
 * become an account-enumeration oracle.
 */
const RESET_SENT =
  'If an iSchoolie account exists for that address, a reset link is on its way.';

const EMAIL_DELIVERY_FAILED =
  'We could not send that email right now. Please try again, or contact support if it keeps happening.';

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), {
      // /auth/action understands every shape Firebase can hand back — a bare
      // `oobCode`, or `mode=resetPassword` — and routes on to /reset-password.
      url: continueUrl('/auth/action'),
      // Hand the code to our own page rather than Firebase's hosted widget, so
      // the reset form matches the rest of the app.
      handleCodeInApp: true,
    });
    return { ok: true, message: RESET_SENT };
  } catch (error) {
    const normalised = normaliseAuthError(error);
    // Project-configuration and delivery failures do not reveal whether the
    // account exists, so they can be reported instead of hidden behind the
    // enumeration-safe copy. Anything else (unknown address, disabled user)
    // keeps the neutral response.
    if (normalised.kind === 'email-delivery') {
      return { ok: false, message: normalised.message };
    }
    if (normalised.code === 'auth/operation-not-allowed') {
      return { ok: false, message: EMAIL_DELIVERY_FAILED };
    }
    if (normalised.kind === 'network' || normalised.kind === 'too-many-requests') {
      return { ok: false, message: normalised.message };
    }
    return { ok: true, message: RESET_SENT };
  }
}

export async function verifyPasswordResetCode(code: string): Promise<{ ok: boolean; email?: string; message?: string }> {
  try {
    const { verifyPasswordResetCode: verify } = await import('firebase/auth');
    const email = await verify(getFirebaseAuth(), code);
    return { ok: true, email };
  } catch (error) {
    return { ok: false, message: normaliseAuthError(error).message };
  }
}

export async function confirmPasswordReset(
  code: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const { confirmPasswordReset: confirm } = await import('firebase/auth');
    await confirm(getFirebaseAuth(), code, newPassword);
    return { ok: true, message: 'Password updated. Sign in with your new password.' };
  } catch (error) {
    return { ok: false, message: normaliseAuthError(error).message };
  }
}

export async function resendVerificationEmail(): Promise<{ ok: boolean; message: string }> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return { ok: false, message: 'Sign in again to resend the verification email.' };
  try {
    await sendEmailVerification(user, { url: continueUrl('/verify-email') });
    return { ok: true, message: 'Verification email sent. Check your inbox and spam folder.' };
  } catch (error) {
    return { ok: false, message: normaliseAuthError(error).message };
  }
}

/** Refresh the cached user so `emailVerified` reflects a just-clicked link. */
export async function refreshAuthUser(): Promise<User | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  await reload(user);
  return getFirebaseAuth().currentUser;
}

export async function reauthenticateWithPassword(password: string): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  const email = user?.email;
  if (!user || !email) return false;
  const credential = EmailAuthProvider.credential(email, password);
  try {
    await reauthenticateWithCredential(user, credential);
    return true;
  } catch {
    return false;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  const user = getFirebaseAuth().currentUser;
  if (!user?.email) return { ok: false, message: 'Sign in with email and password first.' };
  try {
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, currentPassword),
    );
    const { updatePassword } = await import('firebase/auth');
    await updatePassword(user, newPassword);
    return { ok: true, message: 'Password updated. Other devices will need to sign in again.' };
  } catch (error) {
    return { ok: false, message: normaliseAuthError(error).message };
  }
}

/**
 * Email change uses `verifyBeforeUpdateEmail`: the new address only becomes
 * active after the user clicks the link sent to it.
 */
export async function changeEmail(newEmail: string): Promise<{ ok: boolean; message: string }> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return { ok: false, message: 'Sign in again to change your email.' };
  try {
    await verifyBeforeUpdateEmail(user, newEmail.trim(), { url: continueUrl('/account') });
    return {
      ok: true,
      message: `Confirmation sent to ${newEmail.trim()}. Your email changes once you open that link.`,
    };
  } catch (error) {
    return { ok: false, message: normaliseAuthError(error).message };
  }
}

export async function deleteAccount(password?: string): Promise<{ ok: boolean; message: string }> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return { ok: false, message: 'You are not signed in.' };
  try {
    const hasPassword = user.providerData.some((info) => info.providerId === 'password');
    if (hasPassword) {
      if (!password || !user.email) {
        return { ok: false, message: 'Enter your password to confirm deletion.' };
      }
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, password),
      );
    }
    await deleteUser(user);
    return { ok: true, message: 'Your sign-in account has been deleted.' };
  } catch (error) {
    return { ok: false, message: normaliseAuthError(error).message };
  }
}

export async function signOutEverywhere(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function signInWithStoredCredential(
  credential: AuthCredential,
): Promise<UserCredential> {
  return signInWithCredential(getFirebaseAuth(), credential);
}
