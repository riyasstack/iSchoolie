'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { BookOpen } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useQueryParam } from '@/hooks/use-query-param';
import { useToast } from '@/components/ui/toast';
import { enrollInCourse, getCourse } from '@/lib/services/academics';
import type { Course } from '@/lib/models';

function CourseDetail() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const courseId = useQueryParam('courseId');
  const [busy, setBusy] = React.useState(false);
  const course = useAsync<Course | null>(
    () => (courseId ? getCourse(courseId) : Promise.resolve(null)),
    [courseId],
    null,
  );

  if (!courseId) return <Alert variant="warning" title="Course not specified">Open a course from the catalogue.</Alert>;
  if (course.status === 'loading') return <SkeletonCard rows={4} />;
  if (!course.data) {
    return (
      <Alert variant="danger" title="Course unavailable" role="alert">
        This course is not published, or you do not have access to it.
      </Alert>
    );
  }

  const data = course.data;

  async function enroll() {
    if (!user || !profile || busy) return;
    setBusy(true);
    try {
      await enrollInCourse(data.id, { uid: user.uid, displayName: profile.displayName });
      toast({ title: 'Enrolled', variant: 'success' });
      course.reload();
    } catch {
      toast({ title: 'Could not enrol', variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={`${data.subject} · ${data.level}`}
        title={data.title}
        description={data.summary}
        action={<Badge tone={data.status === 'published' ? 'success' : 'neutral'}>{data.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="About this course" />
          <CardBody>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {data.summary}
            </p>
            <p className="mt-3 text-xs text-subtle">
              {data.teacherName}
              {data.teacherVerified ? ' · iSchoolie verified educator' : ''} · {data.enrollCount} enrolled
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Enrolment" />
          <CardBody className="space-y-3">
            {data.teacherUid === user?.uid ? (
              <Alert variant="neutral">You teach this course.</Alert>
            ) : (
              <Button fullWidth loading={busy} onClick={() => void enroll()}>
                Enrol in this course
              </Button>
            )}
            <Link href="/courses" className={buttonClass('outline', 'sm', 'w-full')}>
              Back to catalogue
            </Link>
            <p className="flex items-start gap-2 text-2xs text-subtle">
              <BookOpen aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Only published courses are visible, and only published courses accept enrolment —
              both checks also run in Security Rules.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <RequireAuth>
      <AppShell title="Course">
        <Suspense fallback={<SkeletonCard rows={4} />}>
          <CourseDetail />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}
