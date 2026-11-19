'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  completeRedirectSignIn,
  signInWithProvider,
  type ProviderId,
} from '@/lib/auth/operations';
import { isFirebaseConfigured, providerFlags } from '@/lib/config';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.1-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.8 1.1 1.8 1.1 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

const PROVIDERS: { id: ProviderId; label: string; icon: React.ReactNode; enabled: boolean }[] = [
  { id: 'google.com', label: 'Continue with Google', icon: <GoogleIcon />, enabled: true },
  { id: 'github.com', label: 'Continue with GitHub', icon: <GithubIcon />, enabled: true },
  {
    id: 'apple.com',
    label: 'Continue with Apple',
    icon: <span aria-hidden="true" className="text-base leading-none">&#63743;</span>,
    enabled: providerFlags.apple,
  },
  {
    id: 'linkedin.com',
    label: 'Continue with LinkedIn',
    icon: <span aria-hidden="true" className="text-xs font-bold">in</span>,
    enabled: providerFlags.linkedin,
  },
];

export function ProviderButtons({
  disabled,
  nextPath,
  onBusyChange,
}: {
  disabled?: boolean;
  nextPath: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const router = useRouter();
  const [busyProvider, setBusyProvider] = React.useState<ProviderId | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [needsLinking, setNeedsLinking] = React.useState<{ email: string; methods: string[] } | null>(
    null,
  );

  const enabledProviders = PROVIDERS.filter((provider) => provider.enabled);

  // A provider sign-in that fell back to the redirect flow lands back here.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const outcome = await completeRedirectSignIn();
      if (!outcome || cancelled) return;
      if (outcome.kind === 'success') {
        router.replace(nextPath);
        return;
      }
      if (outcome.kind === 'needs-linking') {
        setNeedsLinking({ email: outcome.email, methods: outcome.methods });
        return;
      }
      if (outcome.kind === 'error') setMessage(outcome.error.message);
    })();
    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  async function start(providerId: ProviderId) {
    setMessage(null);
    setNeedsLinking(null);
    setBusyProvider(providerId);
    onBusyChange?.(true);
    const outcome = await signInWithProvider(providerId, true);
    if (outcome.kind === 'redirecting') {
      // The page is leaving for the provider; keep every control disabled and
      // say what is happening instead of appearing to have done nothing.
      const label = PROVIDERS.find((provider) => provider.id === providerId)?.label ?? 'the provider';
      setMessage(`Taking you to ${label.replace('Continue with ', '')}. You will be brought back here.`);
      return;
    }
    onBusyChange?.(false);
    setBusyProvider(null);

    if (outcome.kind === 'success') {
      router.replace(nextPath);
      return;
    }
    if (outcome.kind === 'needs-linking') {
      setNeedsLinking({ email: outcome.email, methods: outcome.methods });
      return;
    }
    setMessage(outcome.error.message);
  }

  return (
    <div className="space-y-2.5">
      {!isFirebaseConfigured && (
        <Alert variant="warning" title="Sign-in is not configured yet">
          Add your Firebase keys to <code className="font-mono text-xs">.env.local</code> to enable
          authentication.
        </Alert>
      )}

      {enabledProviders.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          fullWidth
          icon={provider.icon}
          loading={busyProvider === provider.id}
          loadingText="Opening…"
          disabled={disabled || !isFirebaseConfigured || busyProvider !== null}
          onClick={() => void start(provider.id)}
          className="justify-center"
        >
          {provider.label}
        </Button>
      ))}

      {needsLinking && (
        <Alert variant="warning" title="This email already has an iSchoolie account" role="alert">
          <p>
            {needsLinking.email ? (
              <>
                <span className="font-medium text-ink">{needsLinking.email}</span> is already
                registered with another sign-in method.
              </>
            ) : (
              'That email is already registered with another sign-in method.'
            )}{' '}
            Sign in with the original method and iSchoolie will link this provider to the same
            account — no second identity is created.
          </p>
          <Link
            href={`/login?email=${encodeURIComponent(needsLinking.email)}`}
            className="mt-2 inline-block text-xs font-semibold text-brand underline-offset-2 hover:underline"
          >
            Go to sign in
          </Link>
        </Alert>
      )}

      {message && (
        <Alert variant="danger" role="alert">
          {message}
        </Alert>
      )}

      {(!providerFlags.apple || !providerFlags.linkedin) && (
        <p className="text-2xs leading-relaxed text-subtle">
          Apple and LinkedIn appear only when an administrator has configured them in Firebase
          Authentication. Hidden buttons are not broken buttons.
        </p>
      )}
    </div>
  );
}
