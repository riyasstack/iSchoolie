import { WORKOS_ENV_KEYS } from '@/lib/server/workos-config';

/**
 * Shown when WorkOS keys are still the committed placeholders. Rendering a
 * notice beats redirecting to AuthKit with a client id that does not exist.
 */
export function AuthUnavailable({ title }: { title?: string }) {
  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-card">
      <h1 className="text-xl font-semibold tracking-tight text-ink">
        {title ?? 'Sign-in is not configured yet'}
      </h1>
      <p className="mt-2 text-sm text-subtle">
        iSchoolie now signs people in with WorkOS AuthKit. Add real credentials to{' '}
        <code className="font-mono text-xs">.env.local</code> and restart the dev server:
      </p>
      <ul className="mt-3 space-y-1 text-sm text-ink">
        {WORKOS_ENV_KEYS.map((key) => (
          <li key={key}>
            <code className="font-mono text-xs">{key}</code>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-2xs text-subtle">
        In the WorkOS dashboard set the redirect URI to{' '}
        <code className="font-mono">/callback</code>, the initiate-login URI to{' '}
        <code className="font-mono">/sign-in</code>, and the sign-out URI to <code className="font-mono">/</code>.
      </p>
    </div>
  );
}
