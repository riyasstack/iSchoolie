'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, PasswordInput } from '@/components/ui/field';
import { ProviderButtons } from '@/components/auth/provider-buttons';
import { loginSchema, type LoginValues } from '@/lib/schemas/auth';
import { signInWithEmail } from '@/lib/auth/operations';
import { isFirebaseConfigured } from '@/lib/config';
import { safeRedirectPath } from '@/lib/auth/redirect';
import type { NormalisedAuthError } from '@/lib/auth/errors';

export function LoginForm({
  nextPath,
  defaultEmail = '',
  initialError = null,
}: {
  nextPath: string;
  defaultEmail?: string;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [providerBusy, setProviderBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalisedAuthError | string | null>(
    initialError ? { kind: 'unknown', message: initialError, code: 'initial' } : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: '', remember: true },
    mode: 'onBlur',
  });

  const disabled = busy || providerBusy || isSubmitting;

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return; // guard against a double submit event
    setBusy(true);
    setError(null);
    const outcome = await signInWithEmail(values.email, values.password, values.remember);
    if (outcome.kind === 'success') {
      router.replace(safeRedirectPath(nextPath));
      return;
    }
    setBusy(false);
    if (outcome.kind === 'error') setError(outcome.error);
  });

  const errorMessage = typeof error === 'string' ? error : error?.message;
  const errorKind = typeof error === 'string' ? 'unknown' : error?.kind;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-subtle">Sign in to your iSchoolie account.</p>
      </div>

      {errorMessage && (
        <Alert
          variant={errorKind === 'account-disabled' ? 'warning' : 'danger'}
          title={errorKind === 'account-disabled' ? 'Account disabled' : 'Could not sign you in'}
          role="alert"
          className="mb-4"
          action={
            errorKind === 'email-not-verified' ? (
              <Link href="/verify-email" className="text-xs font-semibold text-brand underline-offset-2 hover:underline">
                Verify
              </Link>
            ) : undefined
          }
        >
          {errorMessage}
          {errorKind === 'network' && (
            <p className="mt-1">Your session data has not been lost. Retry when you are back online.</p>
          )}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email address" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            disabled={disabled}
            {...register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            invalid={Boolean(errors.password)}
            disabled={disabled}
            {...register('password')}
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox
            id="remember"
            label="Remember me on this device"
            description="Uncheck on shared or school computers."
            disabled={disabled}
            {...register('remember')}
          />
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={busy || isSubmitting}
          loadingText="Signing in…"
          disabled={disabled || !isFirebaseConfigured}
        >
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-2xs font-medium uppercase tracking-wider text-subtle">or continue with</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <ProviderButtons
        disabled={disabled}
        nextPath={safeRedirectPath(nextPath)}
        onBusyChange={setProviderBusy}
      />

      <p className="mt-6 text-center text-sm text-subtle">
        New to iSchoolie?{' '}
        <Link
          href={`/signup?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Create account
        </Link>
      </p>

      <p className="mt-4 text-center text-2xs text-subtle">
        By signing in you agree to our{' '}
        <Link href="/legal/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link> and{' '}
        <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
      </p>
    </div>
  );
}
