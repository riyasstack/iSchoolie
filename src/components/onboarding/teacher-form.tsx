'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Info } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ChipGroup } from '@/components/ui/chips';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { teacherSchema, type TeacherValues } from '@/lib/schemas/onboarding';
import { completeOnboarding } from '@/lib/services/onboarding';
import { COUNTRY_OPTIONS, SUBJECT_OPTIONS, TEACHING_LEVELS } from '@/lib/constants';

export function TeacherForm() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [topError, setTopError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      fullName: '',
      country: '',
      subjects: [],
      levels: [],
      qualification: '',
      yearsExperience: 0,
      bio: '',
      institutionName: '',
    },
    mode: 'onBlur',
  });

  const subjects = watch('subjects') ?? [];
  const levels = watch('levels') ?? [];

  async function onSubmit(values: TeacherValues) {
    if (busy) return;
    setBusy(true);
    setTopError(null);
    try {
      await completeOnboarding({
        uid: user!.uid,
        displayName: values.fullName,
        roles: ['teacher'],
        publicProfile: {
          country: values.country,
          headline: `Educator · ${values.subjects.slice(0, 2).join(', ')}`,
          teacher: {
            subjects: values.subjects,
            levels: values.levels,
            yearsExperience: values.yearsExperience,
            bio: values.bio,
            qualification: values.qualification || null,
            institutionName: values.institutionName || null,
          },
        },
      });
      await refresh({ forceToken: false });
      toast({ title: 'Teacher studio created', variant: 'success' });
      router.replace('/feed');
    } catch (cause) {
      setBusy(false);
      setTopError(cause instanceof Error ? cause.message : 'Could not save your profile.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {topError && (
        <Alert variant="danger" role="alert" title="We could not save your profile">
          {topError}
        </Alert>
      )}

      <Alert variant="neutral" title="Verification is separate from this profile">
        <span className="inline-flex items-start gap-2">
          <BadgeCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          You can create a teaching profile now. The verified educator badge, and the ability to
          publish courses, require review by the iSchoolie team.
        </span>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
          <Input id="fullName" autoComplete="name" disabled={busy} {...register('fullName')} />
        </Field>
        <Field label="Country" htmlFor="country" error={errors.country?.message} required>
          <Select id="country" disabled={busy} {...register('country')}>
            <option value="">Select your country</option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <ChipGroup
        id="subjects"
        legend="Teaching subjects"
        options={SUBJECT_OPTIONS}
        selected={subjects}
        max={8}
        error={errors.subjects?.message}
        onToggle={(value) => {
          const next = subjects.includes(value)
            ? subjects.filter((item) => item !== value)
            : [...subjects, value];
          setValue('subjects', next, { shouldValidate: true });
        }}
      />

      <ChipGroup
        id="levels"
        legend="Levels you teach"
        options={TEACHING_LEVELS}
        selected={levels}
        max={6}
        error={errors.levels?.message}
        onToggle={(value) => {
          const next = levels.includes(value)
            ? levels.filter((item) => item !== value)
            : [...levels, value];
          setValue('levels', next, { shouldValidate: true });
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Highest qualification"
          htmlFor="qualification"
          optional
          error={errors.qualification?.message}
        >
          <Input id="qualification" disabled={busy} placeholder="e.g. MSc Physics, B.Ed" {...register('qualification')} />
        </Field>
        <Field label="Years of experience" htmlFor="yearsExperience" error={errors.yearsExperience?.message} required>
          <Input
            id="yearsExperience"
            type="number"
            min={0}
            max={60}
            disabled={busy}
            {...register('yearsExperience')}
          />
        </Field>
      </div>

      <Field
        label="Professional biography"
        htmlFor="bio"
        hint="At least 40 characters. Describe your approach and what learners can expect."
        error={errors.bio?.message}
        required
      >
        <Textarea
          id="bio"
          rows={5}
          disabled={busy}
          placeholder="I teach physics through experiment-first lessons…"
          {...register('bio')}
        />
      </Field>

      <Field
        label="Current institution"
        htmlFor="institutionName"
        optional
        hint="Entering a name here does not grant institution permissions."
        error={errors.institutionName?.message}
      >
        <Input id="institutionName" disabled={busy} {...register('institutionName')} />
      </Field>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" size="lg" loading={busy || isSubmitting} loadingText="Saving profile…">
          Complete educator setup
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-subtle">
          <Info aria-hidden="true" className="h-3.5 w-3.5" />
          You cannot verify yourself. Verification is an iSchoolie team decision.
        </p>
      </div>
    </form>
  );
}
