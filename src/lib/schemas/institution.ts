import { z } from 'zod';

const requiredText = (label: string, min = 2, max = 160) =>
  z.string().trim().min(min, `Enter ${label}`).max(max, `That is too long`);

export const institutionApplicationSchema = z.object({
  institutionName: requiredText('the institution name', 3, 140),
  category: z.enum(['school', 'college', 'university', 'coaching_centre', 'training_institution'], {
    errorMap: () => ({ message: 'Select an institution category' }),
  }),
  officialEmail: z
    .string()
    .trim()
    .min(1, 'Enter the official institution email')
    .email('Enter a valid email address')
    .transform((value) => value.toLowerCase()),
  contactName: requiredText('the contact person', 2, 80),
  contactDesignation: requiredText('the contact designation', 2, 80),
  contactPhone: z
    .string()
    .trim()
    .min(7, 'Enter a reachable phone number')
    .max(24, 'That phone number is too long')
    .regex(/^[+()\d\s-]+$/, 'Use digits, spaces, +, - or brackets only'),
  website: z
    .string()
    .trim()
    .url('Enter a full URL, for example https://school.edu')
    .max(200)
    .optional()
    .or(z.literal('')),
  country: z.string().min(2, 'Select the institution country'),
  city: requiredText('the city', 2, 80),
  registrationInfo: z.string().trim().max(200).optional().or(z.literal('')),
  declarations: z.object({
    authorizedToApply: z
      .boolean()
      .refine((value) => value === true, {
        message: 'Confirm you are authorised to act for this institution',
      }),
    informationAccurate: z
      .boolean()
      .refine((value) => value === true, { message: 'Confirm the information is accurate' }),
    acceptsTerms: z
      .boolean()
      .refine((value) => value === true, { message: 'Accept the institutional terms to continue' }),
  }),
});
export type InstitutionApplicationValues = z.infer<typeof institutionApplicationSchema>;

export const reviewNoteSchema = z.object({
  note: z.string().trim().min(10, 'Add at least 10 characters of review notes').max(2000),
  decision: z.enum(['under_review', 'more_information_required', 'reject']),
});
export type ReviewNoteValues = z.infer<typeof reviewNoteSchema>;

export const respondToInformationRequestSchema = z.object({
  response: z.string().trim().min(10, 'Describe the additional information').max(2000),
});
export type RespondToInformationRequestValues = z.infer<typeof respondToInformationRequestSchema>;
