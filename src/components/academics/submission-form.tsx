'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Save, Send, WifiOff } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { submissionSchema, type SubmissionValues } from '@/lib/schemas/academic';
import { DuplicateSubmissionError, submitAssignment } from '@/lib/services/academics';
import type { Assignment, Submission } from '@/lib/models';

const DRAFT_PREFIX = 'ischoolie-draft:';

export function SubmissionForm({
  institutionId,
  classId,
  assignment,
  student,
  existing,
  onSubmitted,
}: {
  institutionId: string;
  classId: string;
  assignment: Assignment;
  student: { uid: string; displayName: string };
  existing: Submission | null;
  onSubmitted: () => void;
}) {
  const storageKey = `${DRAFT_PREFIX}${assignment.id}:${student.uid}`;
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const [draftSaved, setDraftSaved] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubmissionValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { content: '' },
  });

  // Local drafts are a convenience. They are explicitly *not* a submission.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setValue('content', stored);
        setDraftSaved('Restored your local draft from this device.');
      }
    } catch {
      /* storage blocked */
    }
  }, [storageKey, setValue]);

  const content = watch('content');

  function saveDraft() {
    try {
      window.localStorage.setItem(storageKey, content ?? '');
      setDraftSaved('Draft saved on this device only — it is not submitted yet.');
    } catch {
      setDraftSaved('This browser blocked local storage, so no draft could be saved.');
    }
  }

  async function onSubmit(values: SubmissionValues) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await submitAssignment(institutionId, classId, assignment, student, values.content);
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      setConfirmed(true);
      onSubmitted();
    } catch (cause) {
      if (cause instanceof DuplicateSubmissionError) {
        setError(
          'You have already submitted this assignment. A confirmed submission cannot be duplicated — ask your teacher if you need to resubmit.',
        );
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : 'We could not confirm your submission. Check your connection and try again.',
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (existing && existing.status === 'submitted') {
    return (
      <Alert variant="success" title="Submission received">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" />
            Confirmed by the server. Your teacher can now review it.
          </p>
          <p className="text-xs text-subtle">Attempt {existing.attempt}. Submitted work cannot be edited unless your teacher reopens the assignment.</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-ink">View what you submitted</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-mutedSurface p-3 text-xs text-ink">
              {existing.content}
            </pre>
          </details>
        </div>
      </Alert>
    );
  }

  if (confirmed) {
    return <Alert variant="success" title="Submitted">Your answer is saved. Refresh if the status above has not updated.</Alert>;
  }

  const closed = assignment.status !== 'published';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {error && (
        <Alert variant="danger" role="alert" title="Submission not confirmed">
          {error}
          <p className="mt-1 flex items-center gap-1.5 text-xs">
            <WifiOff aria-hidden="true" className="h-3.5 w-3.5" />
            If the connection dropped, your text is still in this form — copy it somewhere safe
            before retrying.
          </p>
        </Alert>
      )}
      {draftSaved && <Alert variant="neutral">{draftSaved}</Alert>}

      <Field
        label="Your answer"
        htmlFor="content"
        hint="Write your final answer here. Submitting confirms it to your teacher."
        error={errors.content?.message}
        required
      >
        <Textarea
          id="content"
          rows={10}
          disabled={busy || closed}
          placeholder="Type your answer…"
          {...register('content')}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={busy} loadingText="Submitting…" disabled={closed} icon={<Send className="h-4 w-4" />}>
          Submit final answer
        </Button>
        <Button type="button" variant="outline" onClick={saveDraft} disabled={busy} icon={<Save className="h-4 w-4" />}>
          Save draft locally
        </Button>
        {closed && <p className="text-xs text-subtle">This assignment is closed for submissions.</p>}
      </div>
    </form>
  );
}
