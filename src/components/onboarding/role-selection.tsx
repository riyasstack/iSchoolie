'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Info,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { useAuth } from '@/components/providers/auth-provider';
import { ROLE_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';

interface RoleCard {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  subOptions?: { label: string; href: string }[];
  note?: string;
}

const CARDS: RoleCard[] = [
  {
    key: 'student',
    icon: <GraduationCap aria-hidden="true" className="h-5 w-5" />,
    title: 'Student',
    description:
      'Learn, connect with educators, explore courses and grow your academic profile.',
    subOptions: [
      { label: 'School student', href: '/onboarding/school-student' },
      { label: 'College / University student', href: '/onboarding/college-student' },
    ],
  },
  {
    key: 'teacher',
    icon: <BookOpen aria-hidden="true" className="h-5 w-5" />,
    title: 'Teacher / Educator',
    description:
      'Build your professional teaching profile, connect with learners and publish educational content.',
    href: '/onboarding/teacher',
  },
  {
    key: 'parent',
    icon: <Users aria-hidden="true" className="h-5 w-5" />,
    title: 'Parent / Guardian',
    description:
      "Stay connected with your child's learning through an authorized guardian account.",
    href: '/onboarding/parent',
  },
];

export function RoleSelection() {
  const { roles, profile, refresh } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const hasRoles = profile?.onboarding.complete === true && roles.length > 0;

  async function finishAsPersonal() {
    setBusy(true);
    await refresh({ forceToken: false });
    setBusy(false);
    router.replace('/dashboard');
  }

  return (
    <div className="space-y-6">
      {hasRoles && (
        <Alert variant="info" title="You can hold more than one role">
          Active roles:{' '}
          <span className="font-medium text-ink">
            {roles.map((role) => ROLE_LABEL[role]).join(', ')}
          </span>
          . Add another role at any time — your account, courses and relationships stay the same.
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((card) => (
          <article
            key={card.key}
            className={cn(
              'flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-brand/40 hover:shadow-lift',
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              {card.icon}
            </span>
            <h2 className="mt-3 text-base font-semibold text-ink">{card.title}</h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-subtle">{card.description}</p>

            {card.href && (
              <Link href={card.href} className={buttonClass('primary', 'md', 'mt-4 w-full')}>
                Continue
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}

            {card.subOptions && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {card.subOptions.map((option) => (
                  <Link
                    key={option.href}
                    href={option.href}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5 text-xs font-medium text-ink transition hover:border-brand hover:bg-brand/5"
                  >
                    {option.label}
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-subtle" />
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}

        <article className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mutedSurface text-subtle">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <Badge tone="neutral">Verification required</Badge>
          </div>
          <h2 className="mt-3 text-base font-semibold text-ink">Institution</h2>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-subtle">
            Register a school, college, coaching centre or educational organization.
          </p>
          <Alert variant="neutral" className="mt-3">
            Institutional access requires verification and approval by the iSchoolie team. You will
            not see institution tools until your application is approved.
          </Alert>
          <Link href="/onboarding/institution" className={buttonClass('secondary', 'md', 'mt-4 w-full')}>
            Request institutional access
          </Link>
        </article>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-mutedSurface/50 p-4">
        <p className="flex items-start gap-2 text-xs text-subtle">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          Roles you choose here are personal workspaces. Privileged permissions — verified educator
          status, institution administration — are granted only by the iSchoolie team.
        </p>
        {hasRoles && (
          <Button variant="primary" size="sm" loading={busy} onClick={() => void finishAsPersonal()}>
            Go to my dashboard
          </Button>
        )}
      </div>

      <p className="flex items-start gap-2 text-2xs text-subtle">
        <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Not sure yet? You can finish setup later — your account is already created and your personal
        profile is available.
      </p>
    </div>
  );
}
