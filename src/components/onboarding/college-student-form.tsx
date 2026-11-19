'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { ChipGroup } from '@/components/ui/chips';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { collegeStudentSchema, type CollegeStudentValues } from '@/lib/schemas/onboarding';
import { completeOnboarding } from '@/lib/services/onboarding';
import { ACADEMIC_STAGES, COUNTRY_OPTIONS, LEARNING_INTEREST_OPTIONS } from '@/lib/constants';

export function CollegeStudentForm() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [topError, setTopError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CollegeStudentValues>({
    resolver: zodResolver(collegeStudentSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      country: '',
      collegeName: '',
      degree: '',
      department: '',
      academicStage: '',
      learningInterests: [],
    },
    mode: 'onBlur',
  });

  const interests = watch('learningInterests') ?? [];

  async function onSubmit(values: CollegeStudentValues) {
    if (busy) return;
    setBusy(true);
    setTopError(null);
    try {
      await completeOnboarding({
        uid: user!.uid,
        displayName: values.fullName,
        roles: ['student_college'],
        studentLevel: 'college',
        dateOfBirth: values.dateOfBirth,
        publicProfile: {
          country: values.country,
          headline: `${values.degree} · ${values.collegeName}`,
        },
        privateProfile: {
          dateOfBirth: values.dateOfBirth,
          collegeName: values.collegeName,
          degree: values.degree,
          department: values.department,
          academicStage: values.academicStage,
          learningInterests: values.learningInterests,
        },
      });
      await refresh({ forceToken: false });
      toast({ title: 'Higher-education workspace ready', variant: 'success' });
      router.replace('/dashboard/student');
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
          <Input id="fullName" autoComplete="name" disabled={busy} {...register('fullName')} />
        </Field>
        <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message} required>
          <Input
            id="dateOfBirth"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            disabled={busy}
            {...register('dateOfBirth')}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Institution" htmlFor="collegeName" error={errors.collegeName?.message} required>
          <Input id="collegeName" disabled={busy} placeholder="e.g. St. Xavier's College" {...register('collegeName')} />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Degree or programme" htmlFor="degree" error={errors.degree?.message} required>
          <Input id="degree" disabled={busy} placeholder="e.g. BSc Computer Science" {...register('degree')} />
        </Field>
        <Field label="Department" htmlFor="department" error={errors.department?.message} required>
          <Input id="department" disabled={busy} placeholder="e.g. Computer Science" {...register('department')} />
        </Field>
      </div>

      <Field label="Current academic stage" htmlFor="academicStage" error={errors.academicStage?.message} required>
        <Select id="academicStage" disabled={busy} {...register('academicStage')}>
          <option value="">Select your stage</option>
          {ACADEMIC_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </Select>
      </Field>

      <ChipGroup
        id="college-interests"
        legend="Learning interests"
        options={LEARNING_INTEREST_OPTIONS}
        selected={interests}
        max={8}
        error={errors.learningInterests?.message}
        onToggle={(value) => {
          const next = interests.includes(value)
            ? interests.filter((item) => item !== value)
            : [...interests, value];
          setValue('learningInterests', next, { shouldValidate: true });
        }}
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" size="lg" loading={busy || isSubmitting} loadingText="Saving profile…">
          Complete student setup
        </Button>
        <p className="text-xs text-subtle">
          College status does not imply adulthood — age-based safeguards still apply.
        </p>
      </div>
    </form>
  );
}
