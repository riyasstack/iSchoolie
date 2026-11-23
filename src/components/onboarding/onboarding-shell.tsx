import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/providers/theme-provider';

const STEPS = ['Account', 'Role', 'Profile', 'Workspace'];

export function OnboardingShell({
  title,
  description,
  step,
  children,
  backHref = '/onboarding',
}: {
  title: string;
  description?: string;
  step: 1 | 2 | 3;
  children: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" href="/feed" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/help" className="text-xs text-subtle underline-offset-2 hover:underline">
              Need help?
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
          <ol className="flex items-center gap-2" aria-label="Onboarding progress">
            {STEPS.map((label, index) => {
              const state = index + 1 < step ? 'done' : index + 1 === step ? 'current' : 'upcoming';
              return (
                <li key={label} className="flex flex-1 items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold ${
                      state === 'done'
                        ? 'bg-success text-white'
                        : state === 'current'
                          ? 'bg-brand text-brand-fg'
                          : 'bg-mutedSurface text-subtle'
                    }`}
                    aria-current={state === 'current' ? 'step' : undefined}
                  >
                    {state === 'done' ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span
                    className={`hidden text-xs sm:block ${
                      state === 'upcoming' ? 'text-subtle' : 'font-medium text-ink'
                    }`}
                  >
                    {label}
                  </span>
                  {index < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href={backHref}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-subtle underline-offset-4 hover:text-ink hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="mb-6 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 text-sm text-subtle">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
