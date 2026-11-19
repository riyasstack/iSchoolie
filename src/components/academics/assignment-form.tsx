'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { assignmentSchema, type AssignmentValues } from '@/lib/schemas/academic';
import { createAssignment } from '@/lib/services/academics';

export function AssignmentForm({
  institutionId,
  classId,
  authorUid,
  onCreated,
}: {
  institutionId: string;
  classId: string;
  authorUid: string;
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
  } = useForm<AssignmentValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      instructions: '',
      dueAt: '',
      maxScore: 100,
      allowLateSubmission: false,
      publish: true,
    },
  });

  async function onSubmit(values: AssignmentValues) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await createAssignment(institutionId, classId, values, { uid: authorUid });
      reset();
      setOpen(false);
      onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the assignment.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
        New assignment
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full space-y-3 rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-ink">Create an assignment</p>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      <Field label="Title" htmlFor="title" error={errors.title?.message} required>
        <Input id="title" disabled={busy} placeholder="e.g. Newton's laws — problem set" {...register('title')} />
      </Field>
      <Field label="Instructions" htmlFor="instructions" error={errors.instructions?.message} required>
        <Textarea id="instructions" rows={4} disabled={busy} {...register('instructions')} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Due date and time" htmlFor="dueAt" optional error={errors.dueAt?.message}>
          <Input id="dueAt" type="datetime-local" disabled={busy} {...register('dueAt')} />
        </Field>
        <Field label="Maximum score" htmlFor="maxScore" error={errors.maxScore?.message} required>
          <Input id="maxScore" type="number" min={1} max={1000} disabled={busy} {...register('maxScore')} />
        </Field>
      </div>
      <div className="space-y-2">
        <Checkbox id="allowLate" label="Accept late submissions" disabled={busy} {...register('allowLateSubmission')} />
        <Checkbox id="publishNow" label="Publish immediately" disabled={busy} {...register('publish')} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy} loadingText="Creating…">Create assignment</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
