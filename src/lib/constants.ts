/**
 * Shared product constants. Keep UI copy and validation ranges here so the
 * eligibility rule (Class 8) has exactly one definition.
 */
import type { InstitutionCategory, RoleKey } from '@/lib/models';

export const MIN_INDEPENDENT_CLASS = 8;
export const MIN_INDEPENDENT_AGE = 13;
export const ADULT_AGE = 18;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const TERMS_VERSION = '2026-11-01';
export const PRIVACY_VERSION = '2026-11-01';

export const GRADE_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export const CLASS_LEVELS = [
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  'Undergraduate',
  'Postgraduate',
  'Diploma',
  'Competitive exam',
  'Other',
];

export const ACADEMIC_STAGES = [
  'First year',
  'Second year',
  'Third year',
  'Final year',
  'Postgraduate',
  'Diploma',
  'Other',
];

export const TEACHING_LEVELS = [
  'Class 8-10',
  'Class 11-12',
  'Undergraduate',
  'Postgraduate',
  'Competitive exams',
  'Professional training',
];

export const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Geography',
  'Economics',
  'Business Studies',
  'Accountancy',
  'Political Science',
  'Psychology',
  'Art & Design',
  'Music',
  'Physical Education',
  'Languages',
  'Engineering',
  'Medicine',
  'Law',
];

export const LEARNING_INTEREST_OPTIONS = [
  'Mathematics',
  'Science',
  'Programming',
  'Languages',
  'Competitive exams',
  'Career skills',
  'Arts',
  'Business',
  'Health sciences',
  'Engineering',
];

export const RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'legal_guardian', label: 'Legal guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
] as const;

export const INSTITUTION_CATEGORY_OPTIONS: { value: InstitutionCategory; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'college', label: 'College' },
  { value: 'university', label: 'University' },
  { value: 'coaching_centre', label: 'Coaching centre' },
  { value: 'training_institution', label: 'Training institution' },
];

export const INSTITUTION_CATEGORY_LABEL: Record<InstitutionCategory, string> = {
  school: 'School',
  college: 'College',
  university: 'University',
  coaching_centre: 'Coaching centre',
  training_institution: 'Training institution',
};

export const ROLE_LABEL: Record<RoleKey, string> = {
  student_school: 'School student',
  student_college: 'College student',
  teacher: 'Teacher',
  parent: 'Parent / Guardian',
  institution_admin: 'Institution administrator',
};

export const PROVIDER_LABEL: Record<string, string> = {
  'password': 'Email & password',
  'google.com': 'Google',
  'github.com': 'GitHub',
  'apple.com': 'Apple',
  'linkedin.com': 'LinkedIn',
};

/** ISO-3166 alpha-2 codes offered in onboarding, rendered via Intl.DisplayNames. */
export const COUNTRY_CODES = (
  'AE,AR,AT,AU,BD,BE,BR,CA,CH,CL,CN,CO,CZ,DE,DK,EG,ES,ET,FI,FR,GB,GH,GR,HK,ID,IE,IL,IN,IT,JP,KE,KR,KW,LK,MX,MY,NG,NL,NO,NZ,OM,PE,PH,PK,PL,PT,QA,RO,RU,SA,SG,SK,TH,TR,TW,TZ,UA,UG,US,VN,ZA,ZW'
).split(',');

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export const COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({ value: code, label: countryName(code) })).sort(
  (a, b) => a.label.localeCompare(b.label),
);
