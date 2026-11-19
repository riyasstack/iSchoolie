'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, BookOpen, GraduationCap, ShieldAlert } from 'lucide-react';
import { Alert, Badge } from '@/components/ui/alert';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { listMyCourses, listTeachingClasses } from '@/lib/services/academics';
import type { ClassDoc, Course } from '@/lib/models';

const STATUS_COPY: Record<string, { tone: 'neutral' | 'warning' | 'success' | 'danger'; label: string }> = {
  not_submitted: { tone: 'neutral', label: 'Not submitted' },
  pending: { tone: 'warning', label: 'Verification pending' },
  verified: { tone: 'success', label: 'Verified educator' },
  rejected: { tone: 'danger', label: 'Verification rejected' },
  suspended: { tone: 'danger', label: 'Verification suspended' },
};

export default function TeacherDashboardPage() {
  const { user, account, teacherVerified, profile } = useAuth();
  const classes = useAsync<ClassDoc[]>(
    () => (user ? listTeachingClasses(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );
  const courses = useAsync<Course[]>(
    () => (user ? listMyCourses(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );

  const verification = account?.roles?.teacherVerification.status ?? 'not_submitted';
  const statusMeta = STATUS_COPY[verification] ?? STATUS_COPY.not_submitted!;

  return (
    <div>
      <PageHeader
        eyebrow="Teacher Studio"
        title={`Teaching workspace${profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}`}
        description="Your classes, courses and the learners you teach."
        action={<Link href="/courses" className={buttonClass('secondary', 'sm')}>Course catalogue</Link>}
      />

      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${teacherVerified ? 'bg-success/10 text-success' : 'bg-mutedSurface text-subtle'}`}>
              {teacherVerified ? <BadgeCheck aria-hidden="true" className="h-5 w-5" /> : <ShieldAlert aria-hidden="true" className="h-5 w-5" />}
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                Educator verification <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
              </p>
              <p className="mt-1 max-w-xl text-xs text-subtle">
                {teacherVerified
                  ? 'You can publish courses. Your badge is granted by the iSchoolie team and appears on your public profile.'
                  : 'You can build your profile and teach in an approved institution. Publishing public courses requires iSchoolie verification — ask the team from the Help page.'}
              </p>
            </div>
          </div>
          {!teacherVerified && (
            <Link href="/help" className={buttonClass('outline', 'sm')}>Request verification</Link>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={classes.data.length} icon={<GraduationCap aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Courses" value={courses.data.length} icon={<BookOpen aria-hidden="true" className="h-4 w-4 text-subtle" />} />
        <StatCard label="Published" value={courses.data.filter((course) => course.status === 'published').length} hint="Visible in the catalogue" />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Classes I teach</h2>
        {classes.status === 'loading' && <SkeletonCard rows={3} />}
        {classes.status === 'success' && classes.data.length === 0 && (
          <EmptyState
            icon={<GraduationCap aria-hidden="true" className="h-5 w-5" />}
            title="No classes assigned yet"
            description="Class creation lives inside an approved institution workspace. Once your institution is verified, create classes there."
            actionLabel="Open institution workspace"
            actionHref="/dashboard/institution"
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
                    {classDoc.institutionName} · {classDoc.memberCount} learners
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

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">My courses</h2>
        <Card>
          <CardHeader
            title="Published and draft courses"
            description={teacherVerified ? 'Publish a course from the catalogue page.' : 'Course publishing unlocks with educator verification.'}
            action={<Link href="/courses" className={buttonClass('outline', 'sm')}>Manage courses</Link>}
          />
          {courses.status === 'success' && courses.data.length === 0 ? (
            <EmptyState title="No courses yet" description="Create your first course from the catalogue." actionLabel="Go to catalogue" actionHref="/courses" />
          ) : (
            <ul className="divide-y divide-line">
              {courses.data.map((course) => (
                <li key={course.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{course.title}</p>
                    <p className="text-xs text-subtle">{course.enrollCount} enrolled · {course.subject}</p>
                  </div>
                  <Badge tone={course.status === 'published' ? 'success' : 'neutral'}>{course.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {!teacherVerified && (
        <Alert variant="neutral" title="Why verification exists" className="mt-6">
          iSchoolie shows a verified badge only after the team checks a teaching profile. You cannot
          approve yourself, and hiding the publish button is not what stops you — Security Rules
          reject course creation without the verified-teacher claim.
        </Alert>
      )}
    </div>
  );
}
