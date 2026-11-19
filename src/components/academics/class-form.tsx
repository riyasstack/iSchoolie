'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { classSchema, type ClassValues } from '@/lib/schemas/academic';
import { createClass } from '@/lib/services/academics';
import { CLASS_LEVELS } from '@/lib/constants';

export function ClassForm({
  institutionId,
  institutionName,
  teacher,
  onCreated,
}: {
  institutionId: string;
  institutionName: string;
  teacher: { uid: string; displayName: string };
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: '', subject: '', level: 'Class 10', term: '', allowSelfEnroll: true },
  });

  async function onSubmit(values: ClassValues) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await createClass(institutionId, values, teacher, institutionName);
      reset();
      setOpen(false);
      onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the class.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
        New class
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full space-y-3 rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-ink">Create a class</p>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Class name" htmlFor="className" error={errors.name?.message} required>
          <Input id="className" disabled={busy} placeholder="e.g. Physics — Section A" {...register('name')} />
        </Field>
        <Field label="Subject" htmlFor="subject" error={errors.subject?.message} required>
          <Input id="subject" disabled={busy} placeholder="e.g. Physics" {...register('subject')} />
        </Field>
        <Field label="Level" htmlFor="level" error={errors.level?.message} required>
          <Select id="level" disabled={busy} {...register('level')}>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </Select>
        </Field>
        <Field label="Term" htmlFor="term" error={errors.term?.message} required>
          <Input id="term" disabled={busy} placeholder="e.g. 2026–27 Term 1" {...register('term')} />
        </Field>
      </div>
      <Checkbox
        id="allowSelfEnroll"
        label="Allow students with the class code to join"
        disabled={busy}
        {...register('allowSelfEnroll')}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy} loadingText="Creating…">Create class</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
