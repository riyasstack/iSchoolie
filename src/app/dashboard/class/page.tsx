'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList, FilePlus2, Users } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useQueryParam } from '@/hooks/use-query-param';
import { getClass, getSubmission, listAssignments, listRoster } from '@/lib/services/academics';
import { canTeachInstitution } from '@/lib/auth/permissions';
import { AssignmentForm } from '@/components/academics/assignment-form';
import { formatDateTime } from '@/lib/utils/dates';
import type { Assignment, ClassDoc, ClassEnrollment, Submission } from '@/lib/models';

export default function ClassPage() {
  const { user, memberships } = useAuth();
  const institutionId = useQueryParam('institutionId');
  const classId = useQueryParam('classId');

  const membership = memberships.find(
    (candidate) => candidate.institutionId === institutionId && candidate.status === 'active',
  );
  const isStaff = membership ? canTeachInstitution(membership.role) : false;

  const classDoc = useAsync<ClassDoc | null>(
    () => (institutionId && classId ? getClass(institutionId, classId) : Promise.resolve(null)),
    [institutionId, classId],
    null,
  );
  const assignments = useAsync<Assignment[]>(
    () =>
      institutionId && classId
        ? listAssignments(institutionId, classId, { publishedOnly: !isStaff })
        : Promise.resolve([]),
    [institutionId, classId, isStaff],
    [],
  );
  const roster = useAsync<ClassEnrollment[]>(
    () => (institutionId && classId && isStaff ? listRoster(institutionId, classId) : Promise.resolve([])),
    [institutionId, classId, isStaff],
    [],
  );

  const mySubmissions = useAsync<Record<string, Submission | null>>(async () => {
    if (!user || isStaff || !institutionId || !classId) return {};
    const entries = await Promise.all(
      assignments.data.map(async (assignment) => {
        try {
          const submission = await getSubmission(institutionId, classId, assignment.id, user.uid);
          return [assignment.id, submission] as const;
        } catch {
          return [assignment.id, null] as const;
        }
      }),
    );
    return Object.fromEntries(entries);
  }, [user?.uid, institutionId, classId, isStaff, assignments.data.length], {});

  if (!institutionId || !classId) {
    return (
      <Alert variant="warning" title="Class not specified">
        Open a class from your dashboard or workspace list.
      </Alert>
    );
  }

  if (classDoc.status === 'loading') return <SkeletonCard rows={4} />;

  if (classDoc.status === 'error' || (!classDoc.data && assignments.status !== 'loading' && assignments.data.length === 0)) {
    return (
      <div>
        <PageHeader title="Class unavailable" />
        <Alert variant="danger" title="You cannot open this class" role="alert">
          Either the class does not exist, you are not enrolled in it, or your institution access was
          revoked. Security Rules reject the underlying reads, so this page cannot confirm which of
          those applies.
        </Alert>
        <Link href="/dashboard" className={buttonClass('secondary', 'sm', 'mt-4')}>Back to my dashboard</Link>
      </div>
    );
  }

  const data = classDoc.data!;
  const draftCount = assignments.data.filter((assignment) => assignment.status === 'draft').length;
  const submittedCount = Object.values(mySubmissions.data).filter(
    (submission) => submission?.status === 'submitted',
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow={data.institutionName}
        title={data.name}
        description={`${data.subject} · ${data.level} · ${data.term} · Taught by ${data.teacherName}`}
        action={<Badge tone="brand">{isStaff ? 'Teaching view' : 'Student view'}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assignments" value={assignments.data.length} icon={<ClipboardList aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Learners" value={isStaff ? roster.data.length : data.memberCount} icon={<Users aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard
          label={isStaff ? 'Join code' : 'Submitted'}
          value={isStaff ? data.joinCode : `${submittedCount}/${assignments.data.length}`}
          hint={isStaff ? 'Share to allow self-enrolment' : 'Confirmed submissions'}
        />
      </div>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Assignments</h2>
          {isStaff && user && (
            <AssignmentForm
              institutionId={institutionId}
              classId={classId}
              authorUid={user.uid}
              onCreated={() => assignments.reload()}
            />
          )}
        </div>

        {assignments.status === 'loading' && <SkeletonCard rows={3} />}
        {assignments.status === 'error' && (
          <Alert variant="danger" role="alert">Could not load assignments.</Alert>
        )}
        {assignments.status === 'success' && assignments.data.length === 0 && (
          <EmptyState
            icon={<FilePlus2 aria-hidden="true" className="h-5 w-5" />}
            title="No assignments yet"
            description={isStaff ? 'Create the first assignment for this class.' : 'Your teacher has not published anything yet.'}
          />
        )}

        <div className="space-y-3">
          {assignments.data.map((assignment) => {
            const submission = mySubmissions.data[assignment.id];
            return (
              <Card key={assignment.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{assignment.title}</p>
                    <p className="text-xs text-subtle">
                      {assignment.dueAt ? `Due ${formatDateTime(assignment.dueAt)}` : 'No deadline'} ·{' '}
                      {assignment.maxScore} points
                      {!isStaff && submission?.status === 'submitted' && ' · submitted'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={assignment.status === 'published' ? 'success' : 'neutral'}>
                      {assignment.status}
                    </Badge>
                    {!isStaff && submission?.status === 'submitted' && <Badge tone="brand">Submitted</Badge>}
                    <Link
                      href={`/dashboard/assignment?institutionId=${encodeURIComponent(institutionId)}&classId=${encodeURIComponent(classId)}&assignmentId=${encodeURIComponent(assignment.id)}`}
                      className={buttonClass('secondary', 'sm')}
                    >
                      {isStaff ? 'Review' : 'Open'} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      {isStaff && (
        <section className="mt-8">
          <Card>
            <CardHeader title="Class roster" description="Learners enrolled in this class." />
            {roster.status === 'success' && roster.data.length === 0 && (
              <EmptyState title="No learners yet" description="Share the join code so students can enrol." />
            )}
            <ul className="divide-y divide-line">
              {roster.data.map((student) => (
                <li key={student.uid} className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="truncate text-sm text-ink">{student.displayName}</p>
                  <Badge tone="neutral">{student.role}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {isStaff && draftCount > 0 && (
        <p className="mt-4 text-xs text-subtle">
          {draftCount} draft assignment{draftCount === 1 ? '' : 's'} hidden from learners until published.
        </p>
      )}
    </div>
  );
}
