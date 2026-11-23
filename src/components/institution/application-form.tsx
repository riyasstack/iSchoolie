'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, MailCheck, ShieldCheck } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { SkeletonCard } from '@/components/ui/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import {
  institutionApplicationSchema,
  type InstitutionApplicationValues,
} from '@/lib/schemas/institution';
import { getMyApplication, saveInstitutionApplication } from '@/lib/services/institutions';
import { COUNTRY_OPTIONS, INSTITUTION_CATEGORY_OPTIONS } from '@/lib/constants';

const EMPTY: InstitutionApplicationValues = {
  institutionName: '',
  category: 'school',
  officialEmail: '',
  contactName: '',
  contactDesignation: '',
  contactPhone: '',
  website: '',
  country: '',
  city: '',
  registrationInfo: '',
  declarations: { authorizedToApply: false, informationAccurate: false, acceptsTerms: false },
};

export function InstitutionApplicationForm() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [topError, setTopError] = React.useState<string | null>(null);
  const [existingStatus, setExistingStatus] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InstitutionApplicationValues>({
    resolver: zodResolver(institutionApplicationSchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  });

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyApplication()
      .then((application) => {
        if (cancelled) return;
        if (application) {
          setExistingStatus(application.status);
          reset({
            institutionName: application.institutionName,
            category: application.category,
            officialEmail: application.officialEmail,
            contactName: application.contactName,
            contactDesignation: application.contactDesignation,
            contactPhone: application.contactPhone,
            website: application.website ?? '',
            country: application.country,
            city: application.city,
            registrationInfo: application.registrationInfo ?? '',
            declarations: {
              authorizedToApply: true,
              informationAccurate: true,
              acceptsTerms: true,
            },
          });
        }
      })
      .catch(() => {
        /* A missing application simply means a fresh form. */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, reset]);

  async function persist(values: InstitutionApplicationValues, submit: boolean) {
    if (busy || !user) return;
    setBusy(true);
    setTopError(null);
    try {
      await saveInstitutionApplication(values, {
        submit,
        applicantName: profile?.displayName ?? 'Applicant',
      });
      toast({
        title: submit ? 'Application submitted' : 'Draft saved',
        description: submit
          ? 'The iSchoolie team will review your institution.'
          : 'You can finish and submit whenever you are ready.',
        variant: 'success',
      });
      router.replace('/institution/status');
    } catch (cause) {
      setTopError(cause instanceof Error ? cause.message : 'Could not save your application.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard rows={4} />
        <SkeletonCard rows={3} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((values) => persist(values, true))} noValidate className="space-y-6">
      {existingStatus && (
        <Alert variant="info" title="You already have an application">
          Current status: <span className="font-medium text-ink">{existingStatus.replace(/_/g, ' ')}</span>.{' '}
          <Link href="/institution/status" className="font-semibold text-brand underline-offset-2 hover:underline">
            View the status page
          </Link>
          .
        </Alert>
      )}

      {topError && (
        <Alert variant="danger" role="alert" title="We could not save your application">
          {topError}
        </Alert>
      )}

      <Alert variant="neutral" title="How verification works on the free plan">
        <span className="grid gap-2 text-xs">
          <span className="inline-flex items-start gap-2">
            <MailCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            No document upload is required. The iSchoolie team verifies your organisation by writing
            to the official email address and calling the contact number you provide.
          </span>
          <span className="inline-flex items-start gap-2">
            <FileText aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            Registration or affiliation details you enter are reviewed by a person, then recorded in
            the audit trail.
          </span>
          <span className="inline-flex items-start gap-2">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            You cannot approve this application, and no institution tools unlock until the team
            approves it.
          </span>
        </span>
      </Alert>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink">Institution details</legend>
        <Field label="Institution name" htmlFor="institutionName" error={errors.institutionName?.message} required>
          <Input id="institutionName" disabled={busy} placeholder="e.g. Greenfield Public School" {...register('institutionName')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Institution category" htmlFor="category" error={errors.category?.message} required>
            <Select id="category" disabled={busy} {...register('category')}>
              {INSTITUTION_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Official institution email"
            htmlFor="officialEmail"
            hint="Use a domain address where possible — verification is sent there."
            error={errors.officialEmail?.message}
            required
          >
            <Input
              id="officialEmail"
              type="email"
              disabled={busy}
              placeholder="admin@school.edu"
              {...register('officialEmail')}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country" htmlFor="country" error={errors.country?.message} required>
            <Select id="country" disabled={busy} {...register('country')}>
              <option value="">Select country</option>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="City" htmlFor="city" error={errors.city?.message} required>
            <Input id="city" disabled={busy} {...register('city')} />
          </Field>
        </div>

        <Field label="Website" htmlFor="website" optional error={errors.website?.message}>
          <Input id="website" type="url" disabled={busy} placeholder="https://school.edu" {...register('website')} />
        </Field>

        <Field
          label="Registration or affiliation information"
          htmlFor="registrationInfo"
          optional
          hint="Board affiliation, registration number, accreditation body — whatever applies."
          error={errors.registrationInfo?.message}
        >
          <Textarea id="registrationInfo" rows={3} disabled={busy} {...register('registrationInfo')} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink">Contact person</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact name" htmlFor="contactName" error={errors.contactName?.message} required>
            <Input id="contactName" autoComplete="name" disabled={busy} {...register('contactName')} />
          </Field>
          <Field label="Designation" htmlFor="contactDesignation" error={errors.contactDesignation?.message} required>
            <Input id="contactDesignation" disabled={busy} placeholder="e.g. Principal" {...register('contactDesignation')} />
          </Field>
        </div>
        <Field label="Contact phone" htmlFor="contactPhone" error={errors.contactPhone?.message} required>
          <Input id="contactPhone" type="tel" disabled={busy} placeholder="+1 555 0100" {...register('contactPhone')} />
        </Field>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-line bg-mutedSurface/40 p-4">
        <legend className="px-1 text-sm font-semibold text-ink">Declarations</legend>
        <Checkbox
          id="authorizedToApply"
          label="I am authorised to apply on behalf of this institution."
          error={errors.declarations?.authorizedToApply?.message}
          disabled={busy}
          {...register('declarations.authorizedToApply')}
        />
        <Checkbox
          id="informationAccurate"
          label="The information provided is accurate and can be verified."
          error={errors.declarations?.informationAccurate?.message}
          disabled={busy}
          {...register('declarations.informationAccurate')}
        />
        <Checkbox
          id="acceptsTerms"
          label={
            <>
              I accept the{' '}
              <Link href="/legal/terms" className="font-medium text-brand underline-offset-2 hover:underline">
                institutional terms
              </Link>{' '}
              and the{' '}
              <Link href="/legal/privacy" className="font-medium text-brand underline-offset-2 hover:underline">
                privacy policy
              </Link>
              .
            </>
          }
          error={errors.declarations?.acceptsTerms?.message}
          disabled={busy}
          {...register('declarations.acceptsTerms')}
        />
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" size="lg" loading={busy} loadingText="Submitting…">
          Submit application
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={busy}
          onClick={handleSubmit((values) => persist(values, false))}
        >
          Save draft
        </Button>
        <p className="text-xs text-subtle">Typical review time: 2–5 working days.</p>
      </div>
    </form>
  );
}
