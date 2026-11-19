'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput } from '@/components/ui/field';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { PasswordStrength } from '@/components/auth/password-strength';
import { safeRedirectPath } from '@/lib/auth/redirect';
import { firebaseConfig, useFirebaseEmulators } from '@/lib/config';
import {
  confirmPasswordReset,
  refreshAuthUser,
  requestPasswordReset,
  resendVerificationEmail,
  verifyPasswordResetCode,
} from '@/lib/auth/operations';
import { assessPassword, isAcceptablePassword } from '@/lib/utils/password';
import { useToast } from '@/components/ui/toast';

/* ------------------------------- Login ---------------------------------- */

export function LoginScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useAuth();
  const nextPath = safeRedirectPath(params.get('next'));
  const email = params.get('email') ?? '';
  const error = params.get('error');

  React.useEffect(() => {
    if (status === 'signed-in') router.replace(nextPath);
  }, [status, router, nextPath]);

  return <LoginForm nextPath={nextPath} defaultEmail={email} initialError={error} />;
}

/* ------------------------------- Signup --------------------------------- */

export function SignupScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { status, profile } = useAuth();
  const nextPath = safeRedirectPath(params.get('next'));

  React.useEffect(() => {
    if (status !== 'signed-in') return;
    // A signed-in visitor who already finished onboarding goes to their app.
    if (profile?.onboarding.complete) router.replace(nextPath);
    else router.replace('/verify-email');
  }, [status, profile, router, nextPath]);

  return <SignupForm nextPath={nextPath} />;
}

/* ------------------------- Local development ---------------------------- */

type DevRequestType = 'VERIFY_EMAIL' | 'PASSWORD_RESET';

interface EmulatorOobCode {
  email?: string;
  requestType?: string;
  oobLink?: string;
}

/**
 * Local development only: the Auth emulator records one-time action links
 * instead of sending mail. `process.env.NODE_ENV` is inlined by the bundler,
 * so in a production build this function collapses to `null` and the emulator
 * request below is dropped from the bundle.
 */
async function loadDevActionLink(
  email: string,
  requestType: DevRequestType,
): Promise<string | null> {
  if (process.env.NODE_ENV === 'production' || !useFirebaseEmulators) return null;
  try {
    const response = await fetch(
      `http://127.0.0.1:9099/emulator/v1/projects/${firebaseConfig.projectId}/oobCodes`,
    );
    if (!response.ok) return null;
    const { oobCodes = [] } = (await response.json()) as { oobCodes?: EmulatorOobCode[] };
    const wanted = email.trim().toLowerCase();
    const matches = oobCodes.filter(
      (code) => code.requestType === requestType && code.email?.toLowerCase() === wanted,
    );
    const link = matches[matches.length - 1]?.oobLink;
    if (!link) return null;
    if (requestType !== 'PASSWORD_RESET') return link;
    // A real `handleCodeInApp` link lands on our page with the code in the
    // query string. The emulator's own action URL instead demands the new
    // password as a query parameter and never reaches the app, so reset links
    // are rewritten to the shape /reset-password already understands.
    const code = new URL(link).searchParams.get('oobCode');
    return code ? `/reset-password?oobCode=${encodeURIComponent(code)}` : null;
  } catch {
    return null;
  }
}

/**
 * Explains why no email arrived and links to the one-time link the Auth
 * emulator recorded instead. Never rendered in production: `href` is only ever
 * set by `loadDevActionLink`.
 */
function DevMailNotice({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Alert variant="info" className="mt-4" title="Local development: no email is sent">
      {children}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block rounded-md border border-line bg-surface px-3 py-2 text-center font-semibold text-brand underline-offset-2 hover:underline"
      >
        Open the link
      </a>
    </Alert>
  );
}

/* --------------------------- Forgot password ---------------------------- */

export function ForgotPasswordScreen() {
  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState<string | null>(null);
  const [devLink, setDevLink] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (!result.ok) setError(result.message);
    else {
      setSent(result.message);
      setDevLink(await loadDevActionLink(email, 'PASSWORD_RESET'));
    }
  }

  if (sent) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-ink">Check your inbox</h1>
        <Alert variant="success" className="mt-4" title="Reset link sent">
          {sent} The link expires after one hour.
        </Alert>
        {devLink && (
          <DevMailNotice href={devLink}>
            The Auth emulator does not send real email. Use this link to reset your password.
          </DevMailNotice>
        )}
        <div className="mt-6 space-y-3">
          <Link href="/login" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
            Back to sign in
          </Link>
          <button
            type="button"
            className="block text-sm text-subtle underline-offset-4 hover:underline"
            onClick={() => setSent(null)}
          >
            Use a different email address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-subtle">
        Enter the email address on your iSchoolie account and we will send a reset link.
      </p>
      {error && (
        <Alert variant="danger" role="alert" className="mt-4">
          {error}
        </Alert>
      )}
      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            disabled={busy}
          />
        </Field>
        <Button type="submit" fullWidth size="lg" loading={busy} loadingText="Sending link…">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-subtle">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

/* --------------------------- Reset password ----------------------------- */

export function ResetPasswordScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get('oobCode') ?? '';
  const [state, setState] = React.useState<{
    status: 'checking' | 'ready' | 'invalid' | 'done';
    email?: string;
    message?: string;
  }>({ status: 'checking' });
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!code) {
      setState({ status: 'invalid', message: 'This recovery link is missing its one-time code.' });
      return;
    }
    void verifyPasswordResetCode(code).then((result) => {
      if (result.ok) setState({ status: 'ready', email: result.email });
      else setState({ status: 'invalid', message: result.message });
    });
  }, [code]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!isAcceptablePassword(password)) {
      setState((current) => ({ ...current, message: assessPassword(password).suggestions[0] ?? 'Choose a stronger password.' }));
      return;
    }
    if (password !== confirm) {
      setState((current) => ({ ...current, message: 'Passwords do not match.' }));
      return;
    }
    setBusy(true);
    const result = await confirmPasswordReset(code, password);
    setBusy(false);
    if (result.ok) {
      setState({ status: 'done' });
      window.setTimeout(() => router.replace('/login'), 2200);
    } else {
      setState({ status: 'invalid', message: result.message });
    }
  }

  if (state.status === 'checking') {
    return <Alert variant="neutral">Checking your recovery link…</Alert>;
  }

  if (state.status === 'invalid') {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-ink">Link not valid</h1>
        <Alert variant="danger" role="alert" className="mt-4">
          {state.message ?? 'This link has expired or has already been used.'}
        </Alert>
        <Link
          href="/forgot-password"
          className="mt-5 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (state.status === 'done') {
    return (
      <div className="w-full">
        <CheckCircle2 aria-hidden="true" className="h-10 w-10 text-success" />
        <h1 className="mt-3 text-2xl font-semibold text-ink">Password updated</h1>
        <p className="mt-2 text-sm text-subtle">
          Redirecting you to sign in with your new password…
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline">
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Choose a new password</h1>
      {state.email && (
        <p className="mt-1.5 text-sm text-subtle">
          Resetting the password for <span className="font-medium text-ink">{state.email}</span>.
        </p>
      )}
      {state.message && (
        <Alert variant="danger" role="alert" className="mt-4">
          {state.message}
        </Alert>
      )}
      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
        <Field label="New password" htmlFor="newPassword" required>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
          />
          <PasswordStrength value={password} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" required>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            disabled={busy}
          />
        </Field>
        <Button type="submit" fullWidth size="lg" loading={busy} loadingText="Updating…">
          Update password
        </Button>
      </form>
    </div>
  );
}

/* ---------------------------- Verify email ------------------------------ */

export function VerifyEmailScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { status, user, refresh } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [devLink, setDevLink] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const nextPath = safeRedirectPath(params.get('next'), '/dashboard');

  React.useEffect(() => {
    if (status === 'signed-out') router.replace('/login');
  }, [status, router]);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function checkVerified() {
    setBusy(true);
    // The verification link applies server-side; a click straight after coming
    // back can land before it lands. Retry briefly before saying otherwise.
    let refreshed = await refreshAuthUser();
    for (let attempt = 0; attempt < 5 && !refreshed?.emailVerified; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      refreshed = await refreshAuthUser();
    }
    if (refreshed?.emailVerified) {
      await refresh({ forceToken: true });
      router.replace(nextPath);
      return;
    }
    setBusy(false);
    setMessage(
      'We could not see a verified email yet. Open the link in your inbox, then try again. Check spam if it has not arrived.',
    );
  }

  async function resend() {
    setBusy(true);
    const result = await resendVerificationEmail();
    setBusy(false);
    setMessage(result.message);
    if (result.ok) setCooldown(60);
    if (result.ok && user?.email) {
      setDevLink(await loadDevActionLink(user.email, 'VERIFY_EMAIL'));
    }
  }

  // In local dev the emulator never sends mail, so surface the link directly.
  React.useEffect(() => {
    if (!user?.email) return;
    void loadDevActionLink(user.email, 'VERIFY_EMAIL').then(setDevLink);
  }, [user?.email]);

  if (status === 'unconfigured') {
    return (
      <Alert variant="warning" title="Firebase is not configured">
        Add your project keys to .env.local to use email verification.
      </Alert>
    );
  }

  if (status === 'loading') {
    return <Alert variant="neutral">Loading your account…</Alert>;
  }

  if (status === 'signed-out') {
    return <Alert variant="neutral">Redirecting to sign in…</Alert>;
  }

  if (user?.emailVerified) {
    return (
      <div className="w-full text-center">
        <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-success" />
        <h1 className="mt-3 text-2xl font-semibold text-ink">Email verified</h1>
        <Link
          href={nextPath}
          className="mt-4 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          Continue to iSchoolie
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5 lg:hidden">
        <Logo size="sm" />
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <MailCheck aria-hidden="true" className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Verify your email</h1>
      <p className="mt-1.5 text-sm text-subtle">
        We sent a verification link to{' '}
        <span className="font-medium text-ink">{user?.email ?? 'your email address'}</span>. Open it
        to unlock onboarding and your workspaces.
      </p>

      {message && (
        <Alert variant="info" className="mt-4" role="status">
          {message}
        </Alert>
      )}

      {devLink && (
        <DevMailNotice href={devLink}>
          The Auth emulator does not send real email. Open this link to verify your address.
        </DevMailNotice>
      )}

      <div className="mt-5 space-y-2.5">
        <Button fullWidth size="lg" loading={busy} loadingText="Checking…" onClick={() => void checkVerified()}>
          I have verified my email
        </Button>
        <Button
          variant="outline"
          fullWidth
          disabled={busy || cooldown > 0}
          onClick={() => void resend()}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
        </Button>
      </div>

      <p className="mt-5 text-center text-xs text-subtle">
        Wrong address?{' '}
        <Link href="/account/security" className="font-medium text-brand underline-offset-2 hover:underline">
          Change it in Security settings
        </Link>{' '}
        after verifying, or contact{' '}
        <Link href="/help" className="font-medium text-brand underline-offset-2 hover:underline">
          support
        </Link>
        .
      </p>
    </div>
  );
}

/* ------------------------- Auth action handler -------------------------- */

/**
 * Landing page for Firebase action links when the hosted handler is not used.
 * It routes to the right screen without ever treating the code as trusted.
 */
export function AuthActionScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get('mode');
  const code = params.get('oobCode');

  React.useEffect(() => {
    if (mode === 'resetPassword' && code) {
      router.replace(`/reset-password?oobCode=${encodeURIComponent(code)}`);
      return;
    }
    if (mode === 'verifyEmail') {
      router.replace('/verify-email');
    }
  }, [mode, code, router]);

  return (
    <Alert variant="neutral">
      Completing your request… If nothing happens, use the link from your email again or{' '}
      <Link href="/help" className="font-medium text-brand underline-offset-2 hover:underline">
        contact support
      </Link>
      .
    </Alert>
  );
}

/* ---------------------------- Auth error -------------------------------- */

export function AuthErrorScreen() {
  const params = useSearchParams();
  const message = params.get('message');
  const code = params.get('code');

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-ink">Sign-in was interrupted</h1>
      <Alert variant="danger" role="alert" className="mt-4" title="Authentication error">
        {message ?? 'The authentication provider returned an unexpected response.'}
        {code && <p className="mt-1 font-mono text-2xs text-subtle">Reference: {code}</p>}
      </Alert>
      <div className="mt-5 space-y-3 text-sm">
        <p className="text-subtle">
          This usually means the sign-in window was closed, the provider is not enabled for this
          project, or this domain is not authorised in Firebase Authentication.
        </p>
        <Link href="/login" className="block font-semibold text-brand underline-offset-4 hover:underline">
          Try signing in again
        </Link>
        <Link href="/help" className="block text-subtle underline-offset-4 hover:underline">
          Get help
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------ Shared UI -------------------------------- */

export function AuthLoading() {
  const { toast } = useToast();
  React.useEffect(() => {
    // no-op: keeps the hook tree stable for Suspense fallbacks
    void toast;
  }, [toast]);
  return (
    <div className="w-full space-y-3" aria-busy="true">
      <div className="skeleton h-6 w-1/2" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-11 w-full" />
      <div className="skeleton h-11 w-full" />
    </div>
  );
}
