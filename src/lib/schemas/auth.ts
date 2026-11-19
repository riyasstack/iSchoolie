import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/constants';
import { isAcceptablePassword } from '@/lib/utils/password';

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .max(254, 'That email address is too long')
  .email('Enter a valid email address')
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters`)
  .refine(isAcceptablePassword, 'Choose a less common password');

const checkbox = (message: string) =>
  z.boolean().refine((value) => value === true, { message });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().default(true),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name')
      .max(80, 'Name is too long'),
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: checkbox('Accept the Terms and Conditions to continue'),
    acceptPrivacy: checkbox('Acknowledge the Privacy Policy to continue'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: password,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({ email });
export type ChangeEmailValues = z.infer<typeof changeEmailSchema>;

export const reauthSchema = z.object({ password: z.string().min(1, 'Enter your password') });
export type ReauthValues = z.infer<typeof reauthSchema>;
