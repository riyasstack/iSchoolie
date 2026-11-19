'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { Building2, Terminal } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select, Textarea } from '@/components/ui/field';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useQueryParam } from '@/hooks/use-query-param';
import { useToast } from '@/components/ui/toast';
import { recordReviewDecision } from '@/lib/services/institutions';
import { listAllApplications, listApplicationEvents } from '@/lib/services/institutions';
import { approveInstitutionCommand } from '@/lib/services/admin';
import { formatDateTime } from '@/lib/utils/dates';
import { INSTITUTION_CATEGORY_LABEL } from '@/lib/constants';
import type { InstitutionApplication, InstitutionApplicationEvent } from '@/lib/models';

const STATUS_TONE: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
  draft: 'neutral',
  submitted: 'warning',
  under_review: 'warning',
  more_information_required: 'warning',
  approved: 'success',
  rejected: 'danger',
};

function AdminInstitutions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const selectedId = useQueryParam('applicationId');
  const applications = useAsync<InstitutionApplication[]>(() => listAllApplications(), [], []);
  const [decision, setDecision] = React.useState<'under_review' | 'more_information_required' | 'reject'>('under_review');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const selected = applications.data.find((application) => application.id === selectedId) ?? null;
  const events = useAsync<InstitutionApplicationEvent[]>(
    () => (selectedId ? listApplicationEvents(selectedId) : Promise.resolve([])),
    [selectedId],
    [],
  );

  async function submitReview() {
    if (!selected || !user || busy) return;
    if (note.trim().length < 10) {
      toast({ title: 'Add at least 10 characters of notes', variant: 'warning' });
      return;
    }
    setBusy(true);
    try {
      await recordReviewDecision(selected.id, { decision, note, reviewerUid: user.uid });
      toast({ title: 'Review recorded', variant: 'success' });
      setNote('');
      applications.reload();
      events.reload();
    } catch (cause) {
      toast({
        title: 'Could not record the review',
        description: cause instanceof Error ? cause.message : undefined,
        variant: 'danger',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Institution applications"
        title="Verification queue"
        description="Inspect applications, request more information, or deny. Approval creates the institution and is CLI-only."
      />

      <Alert variant="neutral" title="Why approval is not in this UI" className="mb-5">
        Approval creates an institution document, the owner membership and custom claims. On the
        Spark plan there are no Cloud Functions, so that privileged step runs from the local Admin
        SDK CLI with a service account. Firestore rules reject `status = approved` from any browser.
      </Alert>

      {applications.status === 'loading' && <SkeletonCard rows={4} />}
      {applications.status === 'success' && applications.data.length === 0 && (
        <EmptyState
          icon={<Building2 aria-hidden="true" className="h-5 w-5" />}
          title="No applications yet"
          description="Applications appear here as soon as an institution submits the form."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          {applications.data.map((application) => (
            <a
              key={application.id}
              href={`/admin/institutions?applicationId=${encodeURIComponent(application.id)}`}
              className={`block rounded-2xl border bg-surface p-4 shadow-card transition hover:border-brand/40 ${
                selectedId === application.id ? 'border-brand' : 'border-line'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{application.institutionName}</p>
                  <p className="truncate text-xs text-subtle">
                    {INSTITUTION_CATEGORY_LABEL[application.category]} · {application.city},{' '}
                    {application.country}
                  </p>
                  <p className="mt-1 truncate text-2xs text-subtle">{application.officialEmail}</p>
                </div>
                <Badge tone={STATUS_TONE[application.status] ?? 'neutral'}>
                  {application.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </a>
          ))}
        </div>

        <div>
          {!selected && (
            <Card>
              <CardBody>
                <p className="text-sm text-subtle">Select an application to inspect it.</p>
              </CardBody>
            </Card>
          )}

          {selected && (
            <Card>
              <CardHeader
                title={selected.institutionName}
                description={`Application ${selected.id}`}
                action={<Badge tone={STATUS_TONE[selected.status] ?? 'neutral'}>{selected.status.replace(/_/g, ' ')}</Badge>}
              />
              <CardBody className="space-y-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    ['Official email', selected.officialEmail],
                    ['Contact', `${selected.contactName} (${selected.contactDesignation})`],
                    ['Phone', selected.contactPhone],
                    ['Website', selected.website ?? '—'],
                    ['Registration', selected.registrationInfo ?? 'Not provided'],
                    ['Submitted', selected.submittedAt ? formatDateTime(selected.submittedAt) : 'Not submitted'],
                    ['Declarations', Object.entries(selected.declarations ?? {}).filter(([, value]) => value).map(([key]) => key).join(', ')],
                    ['Institution', selected.institutionId ?? 'Not created'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-2xs font-semibold uppercase tracking-wide text-subtle">{label}</dt>
                      <dd className="break-anywhere text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>

                {selected.reviewNote && (
                  <Alert variant="neutral" title="Last review note">{selected.reviewNote}</Alert>
                )}

                {selected.status !== 'approved' && (
                  <div className="space-y-3 rounded-xl border border-line p-3">
                    <p className="text-sm font-semibold text-ink">Record a review decision</p>
                    <Field label="Decision" htmlFor="decision" required>
                      <Select
                        id="decision"
                        value={decision}
                        onChange={(event) => setDecision(event.target.value as typeof decision)}
                      >
                        <option value="under_review">Mark under review</option>
                        <option value="more_information_required">Request more information</option>
                        <option value="reject">Reject</option>
                      </Select>
                    </Field>
                    <Field label="Review notes" htmlFor="reviewNote" required>
                      <Textarea
                        id="reviewNote"
                        rows={3}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="What was verified, who you spoke to, why the decision was made…"
                      />
                    </Field>
                    <Button onClick={() => void submitReview()} loading={busy}>
                      Save review decision
                    </Button>
                    <p className="text-2xs text-subtle">
                      Approving is deliberately not offered here. Use the CLI command below after
                      verification is complete.
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-ink/95 p-3 text-white">
                  <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-white/60">
                    <Terminal aria-hidden="true" className="h-3.5 w-3.5" /> Approve with the admin CLI
                  </p>
                  <code className="mt-1.5 block break-anywhere font-mono text-xs text-white/90">
                    {approveInstitutionCommand(selected.id)}
                  </code>
                  <p className="mt-1.5 text-2xs text-white/50">
                    Requires a service-account key on the operator machine. Never run in a browser.
                  </p>
                </div>
              </CardBody>

              <CardHeader title="Review history" />
              <ol className="divide-y divide-line">
                {events.data.map((event) => (
                  <li key={event.id} className="p-3">
                    <p className="text-xs font-medium text-ink">{event.action.replace(/_/g, ' ')}</p>
                    {event.note && <p className="text-2xs text-subtle">{event.note}</p>}
                    <p className="text-2xs text-subtle">
                      {event.actorKind} · {formatDateTime(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminInstitutionsPage() {
  return (
    <Suspense fallback={<SkeletonCard rows={4} />}>
      <AdminInstitutions />
    </Suspense>
  );
}
