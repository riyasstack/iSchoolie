'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, Clock, FileText, ShieldCheck } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import {
  getMyApplication,
  listApplicationEvents,
} from '@/lib/services/institutions';
import { formatDateTime } from '@/lib/utils/dates';
import type { InstitutionApplication } from '@/lib/models';
import type { InstitutionApplicationEvent } from '@/lib/models';

const STATUS_META: Record<
  InstitutionApplication['status'],
  { tone: 'neutral' | 'warning' | 'success' | 'danger'; title: string; blurb: string }
> = {
  draft: { tone: 'neutral', title: 'Draft', blurb: 'Not submitted yet. Nothing is under review.' },
  submitted: { tone: 'warning', title: 'Submitted', blurb: 'Waiting for the iSchoolie team to pick it up.' },
  under_review: { tone: 'warning', title: 'Under review', blurb: 'The team is verifying your institution.' },
  more_information_required: {
    tone: 'warning',
    title: 'More information required',
    blurb: 'The reviewer needs additional details. Update the application and resubmit.',
  },
  approved: { tone: 'success', title: 'Approved', blurb: 'Your institution workspace is available.' },
  rejected: { tone: 'danger', title: 'Rejected', blurb: 'This application was declined. You can re-apply with more detail.' },
};

function StatusScreen() {
  const { user } = useAuth();
  const application = useAsync<InstitutionApplication | null>(
    () => (user ? getMyApplication(user.uid) : Promise.resolve(null)),
    [user?.uid],
    null,
  );
  const events = useAsync<InstitutionApplicationEvent[]>(
    () => (user ? listApplicationEvents(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );

  if (application.status === 'loading') return <SkeletonCard rows={4} />;

  if (!application.data) {
    return (
      <div>
        <PageHeader
          eyebrow="Institution"
          title="No application on file"
          description="Institution access is granted only after verification by the iSchoolie team."
        />
        <EmptyState
          icon={<Building2 aria-hidden="true" className="h-5 w-5" />}
          title="You have not applied yet"
          description="Submit an application to register a school, college, coaching centre or training institution."
          actionLabel="Start an application"
          actionHref="/onboarding/institution"
        />
        <Alert variant="neutral" title="Login is not institution access" className="mt-6">
          Having an iSchoolie account does not grant institution tools. Approval creates the
          institution, assigns its owner and records the decision in the audit trail.
        </Alert>
      </div>
    );
  }

  const data = application.data;
  const meta = STATUS_META[data.status];

  return (
    <div>
      <PageHeader
        eyebrow="Institution application"
        title={data.institutionName}
        description={`${data.category.replace(/_/g, ' ')} · ${data.city}, ${data.country}`}
        action={<Badge tone={meta.tone}>{meta.title}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Alert
            variant={data.status === 'approved' ? 'success' : data.status === 'rejected' ? 'danger' : 'info'}
            title={meta.title}
          >
            {meta.blurb}
            {data.reviewNote && (
              <p className="mt-2 rounded-lg bg-surface/70 p-2 text-xs text-ink">
                <span className="font-semibold">Reviewer note:</span> {data.reviewNote}
              </p>
            )}
          </Alert>

          <Card>
            <CardHeader title="Application details" />
            <CardBody>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ['Official email', data.officialEmail],
                  ['Contact', `${data.contactName} (${data.contactDesignation})`],
                  ['Phone', data.contactPhone],
                  ['Website', data.website ?? '—'],
                  ['Registration / affiliation', data.registrationInfo ?? 'Not provided'],
                  ['Submitted', data.submittedAt ? formatDateTime(data.submittedAt) : 'Not submitted'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-2xs font-semibold uppercase tracking-wide text-subtle">{label}</dt>
                    <dd className="mt-0.5 break-anywhere text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

          {data.status === 'more_information_required' && (
            <Alert variant="warning" title="Action needed">
              Update your application with the requested information and resubmit.
              <div className="mt-2">
                <Link href="/onboarding/institution" className={buttonClass('primary', 'sm')}>
                  Update application
                </Link>
              </div>
            </Alert>
          )}

          {data.status === 'rejected' && (
            <Link href="/onboarding/institution" className={buttonClass('secondary', 'sm')}>
              Re-apply
            </Link>
          )}

          {data.status === 'approved' && (
            <Alert variant="success" title="Institution workspace unlocked">
              <Link href="/dashboard/institution" className={buttonClass('primary', 'sm', 'mt-2')}>
                Open institution workspace
              </Link>
            </Alert>
          )}
        </div>

        <Card>
          <CardHeader title="Review history" description="Append-only. Only the iSchoolie team can add entries." />
          {events.status === 'loading' && <CardBody><div className="skeleton h-4 w-1/2" /></CardBody>}
          {events.status === 'success' && events.data.length === 0 && (
            <CardBody><p className="text-sm text-subtle">No history recorded yet.</p></CardBody>
          )}
          <ol className="divide-y divide-line">
            {events.data.map((event) => (
              <li key={event.id} className="flex gap-3 p-4">
                <span className="mt-1 shrink-0 text-subtle">
                  {event.actorKind === 'platform_admin' ? (
                    <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                  ) : event.action.includes('submitted') ? (
                    <FileText aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Clock aria-hidden="true" className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{event.action.replace(/_/g, ' ')}</p>
                  {event.note && <p className="text-xs text-subtle">{event.note}</p>}
                  <p className="mt-0.5 text-2xs text-subtle">{formatDateTime(event.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <p className="mt-6 text-xs text-subtle">
        Verification is manual: the team writes to your official email and calls the contact number.
        No document upload is required, and no Cloud Storage bucket is needed.
      </p>
    </div>
  );
}

export default function InstitutionStatusPage() {
  return (
    <RequireAuth>
      <AppShell title="Institution application">
        <StatusScreen />
      </AppShell>
    </RequireAuth>
  );
}
