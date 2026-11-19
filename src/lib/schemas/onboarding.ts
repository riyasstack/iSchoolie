import { z } from 'zod';
import { MIN_INDEPENDENT_AGE, MIN_INDEPENDENT_CLASS } from '@/lib/constants';
import { ageFromDate, isValidEmail } from '@/lib/utils/dates';
import type { RoleKey } from '@/lib/models';

const fullName = z.string().trim().min(2, 'Enter your full name').max(80, 'Name is too long');

const isoDate = z
  .string()
  .min(1, 'Enter your date of birth')
  .refine((value) => ageFromDate(value) !== null, 'Enter a valid date');

const country = z.string().min(2, 'Select your country');

const interests = z
  .array(z.string())
  .min(1, 'Choose at least one interest')
  .max(8, 'Choose up to 8 interests');

/** Independent school-student onboarding (Class 8+, age 13+). */
export const schoolStudentSchema = z
  .object({
    fullName,
    dateOfBirth: isoDate,
    grade: z.coerce.number().int().min(1).max(12),
    country,
    schoolName: z.string().trim().max(120).optional().or(z.literal('')),
    learningInterests: interests,
    guardianEmail: z.string().trim().optional().or(z.literal('')),
    guardianAcknowledged: z.boolean().default(false),
  })
  .superRefine((values, ctx) => {
    const age = ageFromDate(values.dateOfBirth);
    if (age !== null && age < MIN_INDEPENDENT_AGE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message: `iSchoolie independent accounts are for learners aged ${MIN_INDEPENDENT_AGE} and over. A parent or guardian can create their own account and link to a school-managed profile.`,
      });
    }
    if (values.grade < MIN_INDEPENDENT_CLASS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['grade'],
        message: `Independent student onboarding starts at Class ${MIN_INDEPENDENT_CLASS}.`,
      });
    }
    const isMinor = age !== null && age < 18;
    if (isMinor && !values.guardianAcknowledged) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['guardianAcknowledged'],
        message: 'A parent or guardian must be aware of this account.',
      });
    }
    if (isMinor && values.guardianEmail && !isValidEmail(values.guardianEmail)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['guardianEmail'],
        message: 'Enter a valid guardian email address.',
      });
    }
  });
export type SchoolStudentValues = z.infer<typeof schoolStudentSchema>;

export const collegeStudentSchema = z.object({
  fullName,
  dateOfBirth: isoDate,
  country,
  collegeName: z.string().trim().min(2, 'Enter your institution').max(120),
  degree: z.string().trim().min(2, 'Enter your degree or programme').max(120),
  department: z.string().trim().min(2, 'Enter your department').max(120),
  academicStage: z.string().min(1, 'Select your academic stage'),
  learningInterests: interests,
});
export type CollegeStudentValues = z.infer<typeof collegeStudentSchema>;

export const teacherSchema = z.object({
  fullName,
  country,
  subjects: z.array(z.string()).min(1, 'Choose at least one subject').max(8),
  levels: z.array(z.string()).min(1, 'Choose at least one level').max(6),
  qualification: z.string().trim().max(160).optional().or(z.literal('')),
  yearsExperience: z.coerce.number().int().min(0, 'Cannot be negative').max(60),
  bio: z
    .string()
    .trim()
    .min(40, 'Write at least 40 characters so learners know your approach')
    .max(800, 'Keep your biography under 800 characters'),
  institutionName: z.string().trim().max(120).optional().or(z.literal('')),
});
export type TeacherValues = z.infer<typeof teacherSchema>;

export const parentSchema = z.object({
  fullName,
  country,
  relationship: z.enum(['mother', 'father', 'legal_guardian', 'grandparent', 'sibling', 'other']),
});
export type ParentValues = z.infer<typeof parentSchema>;

export const ROLE_CARD_ROLES: RoleKey[] = [
  'student_school',
  'student_college',
  'teacher',
  'parent',
];
