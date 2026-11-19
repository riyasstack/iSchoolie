import { z } from 'zod';

export const postSchema = z.object({
  body: z.string().trim().min(2, 'Write something first').max(2000, 'Keep posts under 2,000 characters'),
});
export type PostValues = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Write a comment').max(1000, 'Keep comments under 1,000 characters'),
});
export type CommentValues = z.infer<typeof commentSchema>;

export const communitySchema = z.object({
  name: z.string().trim().min(3, 'Give the community a name').max(80),
  description: z.string().trim().min(20, 'Describe the community').max(400),
  visibility: z.enum(['public', 'institution']).default('public'),
});
export type CommunityValues = z.infer<typeof communitySchema>;

export const reportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user', 'message']),
  targetPath: z.string().min(1),
  targetOwnerUid: z.string().nullable(),
  reason: z.enum(['harassment', 'spam', 'unsafe-content', 'impersonation', 'other']),
  details: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type ReportValues = z.infer<typeof reportSchema>;

export const guardianRequestSchema = z.object({
  studentEmail: z.string().trim().email('Enter the student email address'),
  relationship: z.enum(['mother', 'father', 'legal_guardian', 'grandparent', 'sibling', 'other']),
  consent: z.object({
    academic: z.boolean().default(true),
    attendance: z.boolean().default(false),
    announcements: z.boolean().default(true),
  }),
});
export type GuardianRequestValues = z.infer<typeof guardianRequestSchema>;
