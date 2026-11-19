'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { ChipGroup } from '@/components/ui/chips';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { schoolStudentSchema, type SchoolStudentValues } from '@/lib/schemas/onboarding';
import { completeOnboarding } from '@/lib/services/onboarding';
import {
  COUNTRY_OPTIONS,
  GRADE_OPTIONS,
  LEARNING_INTEREST_OPTIONS,
  MIN_INDEPENDENT_AGE,
  MIN_INDEPENDENT_CLASS,
} from '@/lib/constants';
import { ageFromDate } from '@/lib/utils/dates';

export function SchoolStudentForm() {
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
  } = useForm<SchoolStudentValues>({
    resolver: zodResolver(schoolStudentSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      grade: 8,
      country: '',
      schoolName: '',
      learningInterests: [],
      guardianEmail: '',
      guardianAcknowledged: false,
    },
    mode: 'onBlur',
  });

  const grade = Number(watch('grade'));
  const dob = watch('dateOfBirth');
  const interests = watch('learningInterests') ?? [];
  const age = dob ? ageFromDate(dob) : null;
  const isMinor = age !== null && age < 18;
  const belowEligibility = Number.isFinite(grade) && grade < MIN_INDEPENDENT_CLASS;
  const tooYoung = age !== null && age < MIN_INDEPENDENT_AGE;

  async function onSubmit(values: SchoolStudentValues) {
    if (busy) return;
    setBusy(true);
    setTopError(null);
    try {
      await completeOnboarding({
        uid: user!.uid,
        displayName: values.fullName,
        roles: ['student_school'],
        studentLevel: 'school',
        dateOfBirth: values.dateOfBirth,
        guardianEmail: values.guardianEmail || null,
        guardianAcknowledged: values.guardianAcknowledged,
        publicProfile: { country: values.country, headline: `Class ${values.grade} student` },
        privateProfile: {
          dateOfBirth: values.dateOfBirth,
          grade: values.grade,
          schoolName: values.schoolName || null,
          learningInterests: values.learningInterests,
        },
      });
      await refresh({ forceToken: false });
      toast({ title: 'Student learning space ready', variant: 'success' });
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
        <Field
          label="Date of birth"
          htmlFor="dateOfBirth"
          hint="Used only to apply age and consent rules."
          error={errors.dateOfBirth?.message}
          required
        >
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
        <Field label="Class / grade" htmlFor="grade" error={errors.grade?.message} required>
          <Select id="grade" disabled={busy} {...register('grade')}>
            {GRADE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Class {option}
              </option>
            ))}
          </Select>
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

      {belowEligibility && (
        <Alert variant="warning" title={`Independent accounts start at Class ${MIN_INDEPENDENT_CLASS}`} role="alert">
          iSchoolie does not create independent public-network accounts for learners below Class
          {' '}{MIN_INDEPENDENT_CLASS}. A parent or guardian can create their own account and link to
          a school-managed profile once your school joins iSchoolie.
        </Alert>
      )}

      {tooYoung && (
        <Alert variant="warning" title="Age requirement" role="alert">
          Independent iSchoolie accounts are for learners aged {MIN_INDEPENDENT_AGE} and over. Ask a
          parent or guardian to create a guardian account instead.
        </Alert>
      )}

      <Field
        label="School name"
        htmlFor="schoolName"
        optional
        hint="Leave blank if you are studying independently."
        error={errors.schoolName?.message}
      >
        <Input id="schoolName" disabled={busy} placeholder="e.g. Greenfield Public School" {...register('schoolName')} />
      </Field>

      <ChipGroup
        id="interests"
        legend="Learning interests"
        hint="Choose up to 8. This shapes the communities and courses we suggest."
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

      {isMinor && !tooYoung && (
        <div className="space-y-3 rounded-xl border border-line bg-mutedSurface/50 p-4">
          <p className="flex items-start gap-2 text-xs text-subtle">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            Because you are under 18, your profile is private by default and direct messaging stays
            disabled until a guardian relationship is verified.
          </p>
          <Field
            label="Parent or guardian email"
            htmlFor="guardianEmail"
            optional
            hint="We will invite them to create their own guardian account."
            error={errors.guardianEmail?.message}
          >
            <Input
              id="guardianEmail"
              type="email"
              disabled={busy}
              placeholder="guardian@example.com"
              {...register('guardianEmail')}
            />
          </Field>
          <Checkbox
            id="guardianAcknowledged"
            label="A parent or guardian is aware that I am creating this account."
            error={errors.guardianAcknowledged?.message}
            disabled={busy}
            {...register('guardianAcknowledged')}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button
          type="submit"
          size="lg"
          loading={busy || isSubmitting}
          loadingText="Saving profile…"
          disabled={belowEligibility || tooYoung}
        >
          Complete student setup
        </Button>
        <p className="text-xs text-subtle">You can edit these details later in Account settings.</p>
      </div>
    </form>
  );
}
