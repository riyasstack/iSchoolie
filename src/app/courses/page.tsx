'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, GraduationCap, Plus } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Alert, Badge } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-styles';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useAsync } from '@/hooks/use-async';
import { useToast } from '@/components/ui/toast';
import {
  createCourse,
  enrollInCourse,
  listMyCourses,
  listPublishedCourses,
} from '@/lib/services/academics';
import { courseSchema, type CourseValues } from '@/lib/schemas/academic';
import { CLASS_LEVELS, SUBJECT_OPTIONS } from '@/lib/constants';
import type { Course } from '@/lib/models';

function CoursesScreen() {
  const { user, profile, roles, teacherVerified } = useAuth();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const catalog = useAsync<Course[]>(() => listPublishedCourses(), [], []);
  const mine = useAsync<Course[]>(
    () => (user ? listMyCourses(user.uid) : Promise.resolve([])),
    [user?.uid],
    [],
  );

  const isTeacher = roles.includes('teacher');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', summary: '', subject: 'Mathematics', level: 'Class 10', description: '' },
  });

  async function publish(values: CourseValues) {
    if (!user || !profile) return;
    setFormError(null);
    try {
      await createCourse(
        values,
        { uid: user.uid, displayName: profile.displayName, verified: teacherVerified },
        { publish: true },
      );
      reset();
      setShowForm(false);
      toast({ title: 'Course published', variant: 'success' });
      catalog.reload();
      mine.reload();
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : 'Could not publish the course. Verified educators only.',
      );
    }
  }

  async function enroll(course: Course) {
    if (!user || !profile || busyId) return;
    setBusyId(course.id);
    try {
      await enrollInCourse(course.id, { uid: user.uid, displayName: profile.displayName });
      toast({ title: `Enrolled in ${course.title}`, variant: 'success' });
      catalog.reload();
    } catch {
      toast({ title: 'Could not enrol', description: 'The course may no longer be open.', variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Courses">
      <PageHeader
        eyebrow="Catalogue"
        title="Courses on iSchoolie"
        description="Published courses from verified educators. Enrolment is instant and free."
        action={
          isTeacher ? (
            <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowForm((value) => !value)}>
              New course
            </Button>
          ) : (
            <Link href="/onboarding/social" className={buttonClass('secondary', 'sm')}>
              Teach on iSchoolie
            </Link>
          )
        }
      />

      {!teacherVerified && isTeacher && (
        <Alert variant="neutral" title="Publishing requires verification" className="mb-5">
          Course creation is rejected by Firestore Security Rules without the verified-educator
          claim. Ask the iSchoolie team to review your teaching profile.
        </Alert>
      )}

      {showForm && isTeacher && (
        <Card className="mb-6">
          <CardHeader title="Publish a course" description="Courses appear in the public catalogue immediately." />
          <CardBody>
            {formError && <Alert variant="danger" role="alert" className="mb-3">{formError}</Alert>}
            <form onSubmit={handleSubmit(publish)} className="space-y-3" noValidate>
              <Field label="Title" htmlFor="courseTitle" error={errors.title?.message} required>
                <Input id="courseTitle" placeholder="e.g. Mechanics for Class 11" {...register('title')} />
              </Field>
              <Field label="One-line summary" htmlFor="courseSummary" error={errors.summary?.message} required>
                <Input id="courseSummary" placeholder="A short description learners will see" {...register('summary')} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Subject" htmlFor="courseSubject" error={errors.subject?.message} required>
                  <Select id="courseSubject" {...register('subject')}>
                    {SUBJECT_OPTIONS.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Level" htmlFor="courseLevel" error={errors.level?.message} required>
                  <Select id="courseLevel" {...register('level')}>
                    {CLASS_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Description" htmlFor="courseDescription" optional>
                <Textarea id="courseDescription" rows={4} {...register('description')} />
              </Field>
              <Button type="submit" disabled={!teacherVerified}>Publish course</Button>
            </form>
          </CardBody>
        </Card>
      )}

      {mine.data.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">Courses I teach</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {mine.data.map((course) => (
              <Card key={course.id}>
                <CardBody className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{course.title}</p>
                    <p className="text-xs text-subtle">{course.enrollCount} enrolled</p>
                  </div>
                  <Badge tone={course.status === 'published' ? 'success' : 'neutral'}>{course.status}</Badge>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {catalog.status === 'loading' && <SkeletonCard rows={4} />}
      {catalog.status === 'error' && <Alert variant="danger" role="alert">Could not load the catalogue.</Alert>}
      {catalog.status === 'success' && catalog.data.length === 0 && (
        <EmptyState
          icon={<BookOpen aria-hidden="true" className="h-5 w-5" />}
          title="No published courses yet"
          description="Courses appear here as soon as a verified educator publishes one."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.data.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardBody className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <GraduationCap aria-hidden="true" className="h-4.5 w-4.5" />
                </span>
                {course.teacherVerified && <Badge tone="success">Verified</Badge>}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink">{course.title}</h3>
              <p className="mt-1 flex-1 text-xs text-subtle">{course.summary}</p>
              <p className="mt-2 text-2xs text-subtle">
                {course.teacherName} · {course.subject} · {course.enrollCount} enrolled
              </p>
              <div className="mt-3 flex gap-2">
                <Link href={`/courses/detail?courseId=${encodeURIComponent(course.id)}`} className={buttonClass('outline', 'sm', 'flex-1')}>
                  Details
                </Link>
                <Button
                  size="sm"
                  className="flex-1"
                  loading={busyId === course.id}
                  onClick={() => void enroll(course)}
                  disabled={course.teacherUid === user?.uid}
                >
                  {course.teacherUid === user?.uid ? 'Yours' : 'Enrol'}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export default function CoursesPage() {
  return (
    <RequireAuth>
      <CoursesScreen />
    </RequireAuth>
  );
}
