'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, FileCheck2, Lock } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useQueryParam } from '@/hooks/use-query-param';
import {
  getAssignment,
  getGrade,
  getSubmission,
  listGrades,
  listSubmissions,
} from '@/lib/services/academics';
import { canTeachInstitution } from '@/lib/auth/permissions';
import { SubmissionForm } from '@/components/academics/submission-form';
import { GradeForm } from '@/components/academics/grade-form';
import { formatDateTime } from '@/lib/utils/dates';
import type { Assignment, Grade, Submission } from '@/lib/models';

export default function AssignmentPage() {
  const { user, profile, memberships } = useAuth();
  const institutionId = useQueryParam('institutionId');
  const classId = useQueryParam('classId');
  const assignmentId = useQueryParam('assignmentId');

  const membership = memberships.find(
    (candidate) => candidate.institutionId === institutionId && candidate.status === 'active',
  );
  const isStaff = membership ? canTeachInstitution(membership.role) : false;

  const assignment = useAsync<Assignment | null>(
    () =>
      institutionId && classId && assignmentId
        ? getAssignment(institutionId, classId, assignmentId)
        : Promise.resolve(null),
    [institutionId, classId, assignmentId],
    null,
  );

  const mine = useAsync<{ submission: Submission | null; grade: Grade | null }>(async () => {
    if (!user || !institutionId || !classId || !assignmentId) {
      return { submission: null, grade: null };
    }
    const [submission, grade] = await Promise.all([
      getSubmission(institutionId, classId, assignmentId, user.uid).catch(() => null),
      getGrade(institutionId, classId, assignmentId, user.uid).catch(() => null),
    ]);
    return { submission, grade };
  }, [user?.uid, institutionId, classId, assignmentId], { submission: null, grade: null });

  const classWork = useAsync<{ submissions: Submission[]; grades: Grade[] }>(async () => {
    if (!isStaff || !institutionId || !classId || !assignmentId) {
      return { submissions: [], grades: [] };
    }
    const [submissions, grades] = await Promise.all([
      listSubmissions(institutionId, classId, assignmentId),
      listGrades(institutionId, classId, assignmentId),
    ]);
    return { submissions, grades };
  }, [isStaff, institutionId, classId, assignmentId], { submissions: [], grades: [] });

  if (!institutionId || !classId || !assignmentId) {
    return (
      <Alert variant="warning" title="Assignment not specified">
        Open an assignment from a class page.
      </Alert>
    );
  }

  if (assignment.status === 'loading') return <SkeletonCard rows={5} />;

  if (!assignment.data) {
    return (
      <div>
        <PageHeader title="Assignment unavailable" />
        <Alert variant="danger" title="You cannot open this assignment" role="alert">
          It may be unpublished, from a class you are not enrolled in, or behind revoked access.
          Firestore Security Rules reject the read either way.
        </Alert>
        <Link href="/feed" className={buttonClass('secondary', 'sm', 'mt-4')}>Back to home</Link>
      </div>
    );
  }

  const data = assignment.data;
  const grade = mine.data.grade;
  const submission = mine.data.submission;

  return (
    <div>
      <PageHeader
        eyebrow={isStaff ? 'Review submissions' : 'Assignment'}
        title={data.title}
        description={`${data.maxScore} points · ${data.dueAt ? `due ${formatDateTime(data.dueAt)}` : 'no deadline'} · ${data.allowLateSubmission ? 'late submissions accepted' : 'late submissions rejected'}`}
        action={<Badge tone={data.status === 'published' ? 'success' : 'neutral'}>{data.status}</Badge>}
      />

      {isStaff ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader title="Instructions" />
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-ink">{data.instructions}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Submissions"
              description={`${classWork.data.submissions.length} received · ${classWork.data.grades.filter((entry) => entry.published).length} published grades`}
            />
            {classWork.status === 'loading' && <CardBody><div className="skeleton h-4 w-1/2" /></CardBody>}
            {classWork.status === 'success' && classWork.data.submissions.length === 0 && (
              <EmptyState icon={<FileCheck2 aria-hidden="true" className="h-5 w-5" />} title="No submissions yet" />
            )}
            <ul className="divide-y divide-line">
              {classWork.data.submissions.map((entry) => {
                const existingGrade = classWork.data.grades.find(
                  (candidate) => candidate.studentUid === entry.studentUid,
                );
                return (
                  <li key={entry.studentUid} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">{entry.studentName}</p>
                        <p className="text-xs text-subtle">
                          Submitted {formatDateTime(entry.submittedAt)} · attempt {entry.attempt}
                        </p>
                      </div>
                      <Badge tone={existingGrade?.published ? 'success' : existingGrade ? 'warning' : 'neutral'}>
                        {existingGrade ? (existingGrade.published ? `${existingGrade.score}/${existingGrade.maxScore}` : 'Graded (draft)') : 'Ungraded'}
                      </Badge>
                    </div>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-mutedSurface p-3 text-xs text-ink">
                      {entry.content}
                    </pre>
                    {user && (
                      <GradeForm
                        institutionId={institutionId}
                        classId={classId}
                        assignment={data}
                        studentUid={entry.studentUid}
                        studentName={entry.studentName}
                        existing={existingGrade ?? null}
                        graderUid={user.uid}
                        onSaved={() => classWork.reload()}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card>
            <CardHeader title="Instructions" />
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-ink">{data.instructions}</p>
            </CardBody>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                title="My submission"
                description={
                  submission?.status === 'submitted'
                    ? 'Confirmed on the server.'
                    : 'Your answer is only confirmed when this says submitted.'
                }
                action={
                  submission?.status === 'submitted' ? (
                    <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> submitted</Badge>
                  ) : (
                    <Badge tone="warning"><Clock className="h-3 w-3" /> not submitted</Badge>
                  )
                }
              />
              <CardBody>
                {user && profile && (
                  <SubmissionForm
                    institutionId={institutionId}
                    classId={classId}
                    assignment={data}
                    student={{ uid: user.uid, displayName: profile.displayName }}
                    existing={submission}
                    onSubmitted={() => mine.reload()}
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Result" description="Visible only when your teacher publishes it." />
              <CardBody>
                {grade && grade.published ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold tabular-nums text-ink">
                      {grade.score} <span className="text-base font-normal text-subtle">/ {grade.maxScore}</span>
                    </p>
                    <p className="text-sm text-subtle">{grade.feedback || 'No feedback provided.'}</p>
                    <p className="text-2xs text-subtle">Graded {formatDateTime(grade.gradedAt)}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-subtle">
                    <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    {grade ? 'Your grade exists but is not published yet.' : 'Not graded yet.'}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
