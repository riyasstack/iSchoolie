'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, PasswordInput } from '@/components/ui/field';
import { PasswordStrength } from '@/components/auth/password-strength';
import { ProviderButtons } from '@/components/auth/provider-buttons';
import { signupSchema, type SignupValues } from '@/lib/schemas/auth';
import { signUpWithEmail } from '@/lib/auth/operations';
import { isFirebaseConfigured } from '@/lib/config';
import type { NormalisedAuthError } from '@/lib/auth/errors';

export function SignupForm({ nextPath = '/dashboard' }: { nextPath?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [providerBusy, setProviderBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalisedAuthError | null>(null);
  const [password, setPassword] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptPrivacy: false,
    },
    mode: 'onBlur',
  });

  const disabled = busy || providerBusy || isSubmitting;

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const outcome = await signUpWithEmail(
      values.fullName,
      values.email,
      values.password,
      true,
    );
    if (outcome.kind === 'success') {
      // Verification is required before workspaces unlock.
      router.replace(`/verify-email?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    setBusy(false);
    if (outcome.kind === 'error') setError(outcome.error);
  });

  const passwordField = register('password');

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1.5 text-sm text-subtle">
          One iSchoolie account for studying, teaching, parenting and institution access.
        </p>
      </div>

      {error && (
        <Alert
          variant={error.kind === 'email-in-use' ? 'warning' : 'danger'}
          title={error.kind === 'email-in-use' ? 'Account already exists' : 'Could not create your account'}
          role="alert"
          className="mb-4"
          action={
            error.kind === 'email-in-use' ? (
              <Link href="/login" className="text-xs font-semibold text-brand underline-offset-2 hover:underline">
                Sign in
              </Link>
            ) : undefined
          }
        >
          {error.message}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="e.g. Aisha Rahman"
            invalid={Boolean(errors.fullName)}
            disabled={disabled}
            {...register('fullName')}
          />
        </Field>

        <Field
          label="Email address"
          htmlFor="email"
          hint="Use an address you can access — we send a verification link."
          error={errors.email?.message}
          required
        >
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
          hint="At least 8 characters. Length matters more than symbols."
          error={errors.password?.message}
          required
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a password"
            invalid={Boolean(errors.password)}
            disabled={disabled}
            {...passwordField}
            onChange={(event) => {
              setPassword(event.target.value);
              void passwordField.onChange(event);
            }}
          />
          <PasswordStrength value={password} />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your password"
            invalid={Boolean(errors.confirmPassword)}
            disabled={disabled}
            {...register('confirmPassword')}
          />
        </Field>

        <div className="space-y-3 rounded-xl border border-line bg-mutedSurface/50 p-3.5">
          <Checkbox
            id="acceptTerms"
            label={
              <>
                I agree to the{' '}
                <Link href="/legal/terms" className="font-medium text-brand underline-offset-2 hover:underline">
                  Terms and Conditions
                </Link>
              </>
            }
            error={errors.acceptTerms?.message}
            disabled={disabled}
            {...register('acceptTerms')}
          />
          <Checkbox
            id="acceptPrivacy"
            label={
              <>
                I acknowledge the{' '}
                <Link href="/legal/privacy" className="font-medium text-brand underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
              </>
            }
            error={errors.acceptPrivacy?.message}
            disabled={disabled}
            {...register('acceptPrivacy')}
          />
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={busy || isSubmitting}
          loadingText="Creating account…"
          disabled={disabled || !isFirebaseConfigured}
        >
          Create iSchoolie account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-2xs font-medium uppercase tracking-wider text-subtle">or sign up with</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <ProviderButtons disabled={disabled} nextPath={nextPath} onBusyChange={setProviderBusy} />

      <p className="mt-6 text-center text-sm text-subtle">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
