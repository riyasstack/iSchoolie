import { z } from 'zod';

export const classSchema = z.object({
  name: z.string().trim().min(3, 'Give the class a name').max(80),
  subject: z.string().trim().min(2, 'Enter the subject').max(60),
  level: z.string().min(1, 'Select a level'),
  term: z.string().trim().min(2, 'Enter the term').max(40),
  allowSelfEnroll: z.boolean().default(true),
});
export type ClassValues = z.infer<typeof classSchema>;

export const assignmentSchema = z.object({
  title: z.string().trim().min(4, 'Give the assignment a title').max(120),
  instructions: z.string().trim().min(10, 'Add instructions for students').max(4000),
  dueAt: z.string().trim().optional().or(z.literal('')),
  maxScore: z.coerce.number().int().min(1, 'Minimum score is 1').max(1000, 'Maximum score is 1000'),
  allowLateSubmission: z.boolean().default(false),
  publish: z.boolean().default(true),
});
export type AssignmentValues = z.infer<typeof assignmentSchema>;

export const submissionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Write your answer before submitting')
    .max(20000, 'Keep your answer under 20,000 characters'),
});
export type SubmissionValues = z.infer<typeof submissionSchema>;

export const gradeSchema = z.object({
  score: z.coerce.number().min(0, 'Score cannot be negative').max(1000, 'Score is too high'),
  feedback: z.string().trim().max(2000, 'Keep feedback under 2,000 characters').default(''),
  publish: z.boolean().default(true),
});
export type GradeValues = z.infer<typeof gradeSchema>;

export const courseSchema = z.object({
  title: z.string().trim().min(4, 'Give the course a title').max(120),
  summary: z.string().trim().min(20, 'Write a one-line summary').max(200),
  subject: z.string().trim().min(2, 'Enter the subject').max(60),
  level: z.string().min(1, 'Select a level'),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
});
export type CourseValues = z.infer<typeof courseSchema>;
