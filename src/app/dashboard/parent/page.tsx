'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Link2, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useToast } from '@/components/ui/toast';
import {
  cancelGuardianRequest,
  listLinksForGuardian,
  listRequestsForGuardian,
  requestGuardianLink,
  revokeGuardianLink,
  type GuardianRequestDoc,
} from '@/lib/services/guardian';
import { listPublishedGradesForStudent } from '@/lib/services/academics';
import { guardianRequestSchema, type GuardianRequestValues } from '@/lib/schemas/social';
import { RELATIONSHIP_OPTIONS } from '@/lib/constants';
import { formatDate } from '@/lib/utils/dates';
import type { Grade, GuardianLink } from '@/lib/models';

const STATUS_TONE: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
  requested: 'warning',
  pending_verification: 'warning',
  approved: 'success',
  rejected: 'danger',
  revoked: 'neutral',
  expired: 'neutral',
};

export default function ParentDashboardPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [topError, setTopError] = React.useState<string | null>(null);

  const links = useAsync<GuardianLink[]>(
    () => (user ? listLinksForGuardian(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );
  const requests = useAsync<GuardianRequestDoc[]>(
    () => (user ? listRequestsForGuardian(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );
  const approvedLinks = links.data.filter((link) => link.status === 'approved');
  const grades = useAsync<Record<string, Grade[]>>(async () => {
    const entries = await Promise.all(
      approvedLinks.map(async (link) => {
        try {
          const result = await listPublishedGradesForStudent(link.studentUid);
          return [link.studentUid, result] as const;
        } catch {
          return [link.studentUid, [] as Grade[]] as const;
        }
      }),
    );
    return Object.fromEntries(entries);
  }, [approvedLinks.map((link) => link.studentUid).join(',')], {});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuardianRequestValues>({
    resolver: zodResolver(guardianRequestSchema),
    defaultValues: {
      studentEmail: '',
      relationship: 'mother',
      consent: { academic: true, attendance: false, announcements: true },
    },
  });

  async function onRequest(values: GuardianRequestValues) {
    if (!user || !profile) return;
    setTopError(null);
    try {
      await requestGuardianLink({ uid: user.uid, displayName: profile.displayName }, values);
      reset({ ...values, studentEmail: '' });
      toast({
        title: 'Link request sent',
        description: 'Your child must confirm the request before the iSchoolie team verifies it.',
        variant: 'success',
      });
      requests.reload();
    } catch (cause) {
      setTopError(cause instanceof Error ? cause.message : 'Could not send the request.');
    }
  }

  async function revoke(link: GuardianLink) {
    if (!user || busyId) return;
    setBusyId(link.id);
    try {
      await revokeGuardianLink(link.id, user.uid);
      toast({ title: 'Relationship revoked', variant: 'success' });
      links.reload();
    } catch {
      toast({ title: 'Could not revoke', variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(request: GuardianRequestDoc) {
    if (!user || busyId) return;
    setBusyId(request.id);
    try {
      await cancelGuardianRequest(request.id);
      requests.reload();
    } catch {
      toast({ title: 'Could not cancel', variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Parent / Guardian"
        title="Guardian workspace"
        description="Verified relationships only. You never use your child's password."
      />

      <Alert variant="neutral" title="How access is decided" className="mb-6">
        <ol className="list-decimal space-y-1 pl-4 text-xs">
          <li>You request a link using your child&apos;s iSchoolie email.</li>
          <li>Your child confirms the request from their account.</li>
          <li>The iSchoolie team verifies the relationship.</li>
          <li>Only then can you see published results, and only for the categories you were granted.</li>
        </ol>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader title="Request a child link" description="Use the email on your child's iSchoolie account." />
          <CardBody className="space-y-4">
            {topError && <Alert variant="danger" role="alert">{topError}</Alert>}
            <form onSubmit={handleSubmit(onRequest)} className="space-y-4" noValidate>
              <Field label="Child's iSchoolie email" htmlFor="studentEmail" error={errors.studentEmail?.message} required>
                <Input id="studentEmail" type="email" placeholder="child@example.com" {...register('studentEmail')} />
              </Field>
              <Field label="Your relationship" htmlFor="relationship" error={errors.relationship?.message} required>
                <Select id="relationship" {...register('relationship')}>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </Field>
              <fieldset className="space-y-2 rounded-xl border border-line bg-mutedSurface/40 p-3">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-subtle">
                  What you are asking to see
                </legend>
                <Checkbox id="consentAcademic" label="Academic results and assignments" {...register('consent.academic')} />
                <Checkbox id="consentAttendance" label="Attendance records" {...register('consent.attendance')} />
                <Checkbox id="consentAnnouncements" label="Institution announcements" {...register('consent.announcements')} />
              </fieldset>
              <Button type="submit" fullWidth>Send link request</Button>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Linked children" description="Approved relationships only." />
            {links.status === 'loading' && <CardBody><div className="skeleton h-4 w-1/2" /></CardBody>}
            {links.status === 'success' && links.data.length === 0 && (
              <EmptyState icon={<Link2 aria-hidden="true" className="h-5 w-5" />} title="No linked children yet" description="Send a request, then ask your child to confirm it." />
            )}
            <ul className="divide-y divide-line">
              {links.data.map((link) => (
                <li key={link.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{link.studentName}</p>
                      <p className="text-xs text-subtle">
                        Verified {link.verifiedAt ? formatDate(new Date(link.verifiedAt.toDate()).toISOString()) : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[link.status] ?? 'neutral'}>{link.status.replace(/_/g, ' ')}</Badge>
                      {link.status === 'approved' && (
                        <Button size="sm" variant="outline" loading={busyId === link.id} onClick={() => void revoke(link)}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="My requests" />
            {requests.status === 'success' && requests.data.length === 0 && (
              <CardBody><p className="text-sm text-subtle">No requests yet.</p></CardBody>
            )}
            <ul className="divide-y divide-line">
              {requests.data.map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{request.studentEmail}</p>
                    <p className="text-xs text-subtle">{request.relationship.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[request.status] ?? 'neutral'}>{request.status.replace(/_/g, ' ')}</Badge>
                    {(request.status === 'requested' || request.status === 'pending_verification') && (
                      <Button size="sm" variant="ghost" loading={busyId === request.id} onClick={() => void cancel(request)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <ClipboardList aria-hidden="true" className="h-4 w-4" />
          Published results for linked children
        </h2>
        {approvedLinks.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck aria-hidden="true" className="h-5 w-5" />}
            title="Nothing to show yet"
            description="Results appear only for approved links with academic consent."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {approvedLinks.map((link) => (
              <Card key={link.id}>
                <CardHeader
                  title={link.studentName}
                  description={`Consent: ${Object.entries(link.consent ?? {}).filter(([, granted]) => granted).map(([key]) => key).join(', ') || 'none'}`}
                  action={<Badge tone="success"><UserRoundCheck className="h-3 w-3" /> verified</Badge>}
                />
                {!link.consent?.academic ? (
                  <CardBody><Alert variant="neutral">Academic consent was not granted for this relationship.</Alert></CardBody>
                ) : (grades.data[link.studentUid] ?? []).length === 0 ? (
                  <CardBody><p className="text-sm text-subtle">No published results yet.</p></CardBody>
                ) : (
                  <ul className="divide-y divide-line">
                    {(grades.data[link.studentUid] ?? []).map((grade) => (
                      <li key={grade.assignmentId} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-ink">{grade.assignmentTitle}</p>
                          <p className="text-xs text-subtle">{grade.feedback || 'No feedback'}</p>
                        </div>
                        <Badge tone="brand">{grade.score}/{grade.maxScore}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
