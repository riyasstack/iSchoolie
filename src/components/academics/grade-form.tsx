'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { gradeSchema, type GradeValues } from '@/lib/schemas/academic';
import { saveGrade } from '@/lib/services/academics';
import type { Assignment, Grade } from '@/lib/models';

export function GradeForm({
  institutionId,
  classId,
  assignment,
  studentUid,
  studentName,
  existing,
  graderUid,
  onSaved,
}: {
  institutionId: string;
  classId: string;
  assignment: Assignment;
  studentUid: string;
  studentName: string;
  existing: Grade | null;
  graderUid: string;
  onSaved: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GradeValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      score: existing?.score ?? 0,
      feedback: existing?.feedback ?? '',
      publish: existing?.published ?? true,
    },
  });

  async function onSubmit(values: GradeValues) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await saveGrade(institutionId, classId, assignment, studentUid, values, graderUid);
      setMessage(`Grade saved for ${studentName}.`);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the grade.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <Field
          label={`Score / ${assignment.maxScore}`}
          htmlFor={`score-${studentUid}`}
          error={errors.score?.message}
          required
        >
          <Input
            id={`score-${studentUid}`}
            type="number"
            min={0}
            max={assignment.maxScore}
            step="0.5"
            disabled={busy}
            {...register('score')}
          />
        </Field>
        <Field label="Feedback" htmlFor={`feedback-${studentUid}`} optional error={errors.feedback?.message}>
          <Textarea id={`feedback-${studentUid}`} rows={2} disabled={busy} {...register('feedback')} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          id={`publish-${studentUid}`}
          label="Publish to student and authorised guardians"
          disabled={busy}
          {...register('publish')}
        />
        <Button type="submit" size="sm" loading={busy} loadingText="Saving…">
          {existing ? 'Update grade' : 'Save grade'}
        </Button>
      </div>
    </form>
  );
}
