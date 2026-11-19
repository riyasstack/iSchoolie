'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
  ShieldQuestion,
  Users,
} from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import {
  listMyCourseEnrollments,
  listPublishedGradesForStudent,
  listStudentClasses,
} from '@/lib/services/academics';
import {
  confirmGuardianRequest,
  listRequestsForStudentEmail,
  type GuardianRequestDoc,
} from '@/lib/services/guardian';
import { formatDate } from '@/lib/utils/dates';
import { useToast } from '@/components/ui/toast';
import type { ClassDoc, Course, Grade } from '@/lib/models';

export default function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [busyRequest, setBusyRequest] = React.useState<string | null>(null);

  const classes = useAsync<ClassDoc[]>(
    () => (user ? listStudentClasses(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );
  const courses = useAsync<Course[]>(
    () => (user ? listMyCourseEnrollments(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );
  const grades = useAsync<Grade[]>(
    () => (user ? listPublishedGradesForStudent(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );
  const requests = useAsync<GuardianRequestDoc[]>(
    () => (user?.email ? listRequestsForStudentEmail(user.email) : Promise.resolve([])),
    [user?.email],
    [],
  );

  async function confirm(request: GuardianRequestDoc) {
    if (!user || busyRequest) return;
    setBusyRequest(request.id);
    try {
      await confirmGuardianRequest(request.id, user.uid);
      toast({
        title: 'Guardian request confirmed',
        description: 'The iSchoolie team will verify the relationship before any results are shared.',
        variant: 'success',
      });
      requests.reload();
    } catch {
      toast({ title: 'Could not confirm the request', variant: 'danger' });
    } finally {
      setBusyRequest(null);
    }
  }

  const pending = requests.data.filter((request) => request.status === 'requested');

  return (
    <div>
      <PageHeader
        eyebrow="Student Learning"
        title={`Your learning space${profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}`}
        description="Classes you belong to, courses you follow and the results your teachers have published."
        action={
          <Link href="/courses" className={buttonClass('secondary', 'sm')}>
            Browse courses
          </Link>
        }
      />

      {profile?.safeguarding.isMinor && (
        <Alert variant="neutral" title="Safeguarding is active on your account" className="mb-5">
          Your profile is private by default and direct messaging stays off until a guardian
          relationship is verified. That is expected for learners under 18.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={classes.data.length} icon={<GraduationCap aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Courses" value={courses.data.length} icon={<BookOpen aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Published results" value={grades.data.length} icon={<ClipboardList aria-hidden="true" className="h-4 w-4 text-subtle" />} />
      </div>

      {pending.length > 0 && (
        <Card className="mt-6 border-warn/40">
          <CardHeader
            title="Guardian link requests"
            description="Someone asked to be linked to your account. Only confirm if you know them."
          />
          <CardBody className="space-y-3">
            {pending.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{request.guardianName}</p>
                  <p className="text-xs text-subtle">
                    Claimed relationship: {request.relationship.replace(/_/g, ' ')} ·{' '}
                    {formatDate(String(request.createdAt ?? ''))}
                  </p>
                </div>
                <Button
                  size="sm"
                  loading={busyRequest === request.id}
                  onClick={() => void confirm(request)}
                >
                  Confirm this guardian
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">My classes</h2>
        {classes.status === 'loading' && <SkeletonCard rows={3} />}
        {classes.status === 'error' && (
          <Alert variant="danger" role="alert">Could not load your classes. Try refreshing.</Alert>
        )}
        {classes.status === 'success' && classes.data.length === 0 && (
          <EmptyState
            icon={<GraduationCap aria-hidden="true" className="h-5 w-5" />}
            title="No classes yet"
            description="Once your teacher adds you to a class — or you join with a class code — assignments and results appear here."
            actionLabel="Browse courses"
            actionHref="/courses"
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.data.map((classDoc) => (
            <Card key={`${classDoc.institutionId}-${classDoc.id}`}>
              <CardBody className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <GraduationCap aria-hidden="true" className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{classDoc.name}</p>
                  <p className="truncate text-xs text-subtle">
                    {classDoc.institutionName} · {classDoc.subject} · {classDoc.teacherName}
                  </p>
                </div>
                <Link
                  href={`/dashboard/class?institutionId=${encodeURIComponent(classDoc.institutionId)}&classId=${encodeURIComponent(classDoc.id)}`}
                  className={buttonClass('ghost', 'sm')}
                >
                  Open <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">My courses</h2>
          <Card>
            {courses.status === 'loading' && <CardBody><div className="skeleton h-4 w-1/2" /></CardBody>}
            {courses.status === 'success' && courses.data.length === 0 && (
              <EmptyState title="No courses yet" description="Enrol in a published course to see it here." actionLabel="Find a course" actionHref="/courses" />
            )}
            <ul className="divide-y divide-line">
              {courses.data.map((course) => (
                <li key={course.id} className="flex items-center gap-3 p-4">
                  <BookOpen aria-hidden="true" className="h-4 w-4 text-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{course.title}</p>
                    <p className="truncate text-xs text-subtle">{course.teacherName}</p>
                  </div>
                  <Link href={`/courses/detail?courseId=${encodeURIComponent(course.id)}`} className={buttonClass('ghost', 'sm')}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Published results</h2>
          <Card>
            {grades.status === 'loading' && <CardBody><div className="skeleton h-4 w-2/3" /></CardBody>}
            {grades.status === 'success' && grades.data.length === 0 && (
              <EmptyState
                icon={<ClipboardList aria-hidden="true" className="h-5 w-5" />}
                title="No published results"
                description="Grades appear here once a teacher publishes them."
              />
            )}
            <ul className="divide-y divide-line">
              {grades.data.map((grade) => (
                <li key={`${grade.institutionId}-${grade.assignmentId}`} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{grade.assignmentTitle}</p>
                    <p className="text-xs text-subtle">{grade.feedback || 'No feedback'}</p>
                  </div>
                  <Badge tone="brand">
                    {grade.score} / {grade.maxScore}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
          <p className="mt-2 flex items-center gap-1.5 text-2xs text-subtle">
            <ShieldQuestion aria-hidden="true" className="h-3.5 w-3.5" />
            You cannot edit an official grade. Only teachers in the class can change scores.
          </p>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">Guardians</h2>
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              A guardian needs your confirmation and iSchoolie verification before they can see any
              academic information.
            </p>
            <Link href="/dashboard/parent" className={buttonClass('outline', 'sm')}>
              <Users aria-hidden="true" className="h-3.5 w-3.5" /> Guardian workspace
            </Link>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
