import { describe, expect, it } from 'vitest';
import { signupSchema, loginSchema } from '@/lib/schemas/auth';
import { schoolStudentSchema, teacherSchema } from '@/lib/schemas/onboarding';
import { institutionApplicationSchema } from '@/lib/schemas/institution';
import { assignmentSchema, submissionSchema } from '@/lib/schemas/academic';

const signupBase = {
  fullName: 'Aisha Rahman',
  email: 'Aisha@Example.com ',
  password: 'longenough1',
  confirmPassword: 'longenough1',
  acceptTerms: true,
  acceptPrivacy: true,
};

describe('signup schema', () => {
  it('normalises the email to lower case', () => {
    const parsed = signupSchema.parse(signupBase);
    expect(parsed.email).toBe('aisha@example.com');
  });

  it('requires both consent checkboxes', () => {
    const result = signupSchema.safeParse({ ...signupBase, acceptTerms: false });
    expect(result.success).toBe(false);
  });

  it('requires matching passwords', () => {
    const result = signupSchema.safeParse({ ...signupBase, confirmPassword: 'different1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('confirmPassword');
    }
  });

  it('rejects weak and common passwords', () => {
    expect(signupSchema.safeParse({ ...signupBase, password: 'short', confirmPassword: 'short' }).success).toBe(false);
    expect(
      signupSchema.safeParse({ ...signupBase, password: 'password123', confirmPassword: 'password123' }).success,
    ).toBe(false);
  });
});

describe('login schema', () => {
  it('defaults remember to true and accepts any non-empty password', () => {
    const parsed = loginSchema.parse({ email: 'a@b.co', password: 'x' });
    expect(parsed.remember).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
  });
});

describe('school student onboarding', () => {
  const base = {
    fullName: 'Aarav Shah',
    dateOfBirth: '2011-05-04',
    grade: 10,
    country: 'IN',
    schoolName: 'Greenfield',
    learningInterests: ['Physics'],
    guardianEmail: '',
    guardianAcknowledged: true,
  };

  it('accepts a Class 10 learner of 15 whose guardian acknowledged the account', () => {
    expect(schoolStudentSchema.safeParse(base).success).toBe(true);
  });

  it('rejects learners below Class 8', () => {
    const result = schoolStudentSchema.safeParse({ ...base, grade: 6 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('grade'))).toBe(true);
    }
  });

  it('rejects children under 13 even in a high class', () => {
    const result = schoolStudentSchema.safeParse({
      ...base,
      grade: 9,
      dateOfBirth: new Date(Date.now() - 11 * 365.25 * 86_400_000).toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it('requires guardian acknowledgement for minors', () => {
    expect(schoolStudentSchema.safeParse({ ...base, guardianAcknowledged: false }).success).toBe(false);
    expect(schoolStudentSchema.safeParse({ ...base, guardianAcknowledged: true }).success).toBe(true);
    expect(
      schoolStudentSchema.safeParse({ ...base, guardianEmail: 'not-an-email', guardianAcknowledged: true })
        .success,
    ).toBe(false);
  });

  it('accepts adults without guardian acknowledgement', () => {
    const result = schoolStudentSchema.safeParse({
      ...base,
      dateOfBirth: '2001-01-01',
      grade: 12,
      guardianAcknowledged: false,
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one learning interest', () => {
    expect(schoolStudentSchema.safeParse({ ...base, learningInterests: [] }).success).toBe(false);
  });
});

describe('teacher onboarding', () => {
  const base = {
    fullName: 'Priya Nair',
    country: 'IN',
    subjects: ['Physics'],
    levels: ['Class 11-12'],
    qualification: 'MSc',
    yearsExperience: 8,
    bio: 'I teach physics through experiment-first lessons and weekly problem clinics.',
    institutionName: '',
  };

  it('accepts a complete educator profile', () => {
    expect(teacherSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a biography that is too short to be useful', () => {
    expect(teacherSchema.safeParse({ ...base, bio: 'Physics' }).success).toBe(false);
  });

  it('rejects an impossible experience value', () => {
    expect(teacherSchema.safeParse({ ...base, yearsExperience: 99 }).success).toBe(false);
  });
});

describe('institution application', () => {
  const base = {
    institutionName: 'Greenfield Public School',
    category: 'school' as const,
    officialEmail: 'office@greenfield.edu',
    contactName: 'Meera Shah',
    contactDesignation: 'Principal',
    contactPhone: '+91 90000 00000',
    website: 'https://greenfield.edu',
    country: 'IN',
    city: 'Pune',
    registrationInfo: 'CBSE affiliation 1234',
    declarations: { authorizedToApply: true, informationAccurate: true, acceptsTerms: true },
  };

  it('accepts a complete application', () => {
    expect(institutionApplicationSchema.safeParse(base).success).toBe(true);
  });

  it('refuses to submit without the declarations', () => {
    const result = institutionApplicationSchema.safeParse({
      ...base,
      declarations: { authorizedToApply: true, informationAccurate: false, acceptsTerms: true },
    });
    expect(result.success).toBe(false);
  });

  it('validates the website shape', () => {
    expect(institutionApplicationSchema.safeParse({ ...base, website: 'greenfield.edu' }).success).toBe(false);
    expect(institutionApplicationSchema.safeParse({ ...base, website: '' }).success).toBe(true);
  });

  it('rejects an invalid phone number', () => {
    expect(institutionApplicationSchema.safeParse({ ...base, contactPhone: 'call me' }).success).toBe(false);
  });
});

describe('academic schemas', () => {
  it('requires a maximum score between 1 and 1000', () => {
    expect(
      assignmentSchema.safeParse({
        title: 'Problem set',
        instructions: 'Answer questions 1 to 5 with working.',
        dueAt: '',
        maxScore: 0,
        allowLateSubmission: false,
        publish: true,
      }).success,
    ).toBe(false);
  });

  it('rejects empty submissions', () => {
    expect(submissionSchema.safeParse({ content: '   ' }).success).toBe(false);
  });
});
