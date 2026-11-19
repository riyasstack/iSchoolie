'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { parentSchema, type ParentValues } from '@/lib/schemas/onboarding';
import { completeOnboarding } from '@/lib/services/onboarding';
import { COUNTRY_OPTIONS, RELATIONSHIP_OPTIONS } from '@/lib/constants';

export function ParentForm() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [topError, setTopError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ParentValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: { fullName: '', country: '', relationship: 'mother' },
    mode: 'onBlur',
  });

  async function onSubmit(values: ParentValues) {
    if (busy) return;
    setBusy(true);
    setTopError(null);
    try {
      await completeOnboarding({
        uid: user!.uid,
        displayName: values.fullName,
        roles: ['parent'],
        publicProfile: { country: values.country },
      });
      await refresh({ forceToken: false });
      toast({
        title: 'Guardian workspace created',
        description: 'Next: request a link to your child.',
        variant: 'success',
      });
      router.replace('/dashboard/parent');
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

      <Alert variant="neutral" title="Your own account, never your child’s password">
        A guardian workspace is a separate iSchoolie account. You will request a link to your child,
        they confirm it, and the iSchoolie team verifies the relationship before any academic
        information is shared.
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

      <Field label="Relationship to your child" htmlFor="relationship" error={errors.relationship?.message} required>
        <Select id="relationship" disabled={busy} {...register('relationship')}>
          {RELATIONSHIP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="border-t border-line pt-4">
        <Button type="submit" size="lg" loading={busy || isSubmitting} loadingText="Creating workspace…">
          Create guardian workspace
        </Button>
      </div>
    </form>
  );
}
