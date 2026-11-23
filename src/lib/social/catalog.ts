/**
 * Social product catalogue.
 *
 * Shared by server validation and client UI so a goal, stage or topic can
 * never be spelled one way in a form and another in the database.
 */

export const EDUCATION_STAGES = [
  {
    value: 'school_student',
    label: 'School student',
    hint: 'Class 8 onwards, with age and consent requirements.',
  },
  {
    value: 'college_student',
    label: 'College or university student',
    hint: 'Undergraduate, postgraduate or diploma study.',
  },
  { value: 'teacher', label: 'Teacher or educator', hint: 'School, college or independent teaching.' },
  {
    value: 'education_professional',
    label: 'Education professional',
    hint: 'Researchers, administrators, counsellors and mentors.',
  },
  { value: 'parent', label: 'Parent or guardian', hint: 'Supporting a learner in your family.' },
  {
    value: 'lifelong_learner',
    label: 'Lifelong learner or exploring',
    hint: 'Learning for its own sake, at any stage.',
  },
] as const;

export type EducationStageValue = (typeof EDUCATION_STAGES)[number]['value'];

export const EDUCATION_STAGE_LABEL: Record<EducationStageValue, string> = Object.fromEntries(
  EDUCATION_STAGES.map((stage) => [stage.value, stage.label]),
) as Record<EducationStageValue, string>;

export const EDUCATION_GOALS = [
  'Learn new subjects',
  'Connect with educators',
  'Meet academic peers',
  'Share knowledge',
  'Discover opportunities',
  'Prepare for examinations',
  'Explore careers',
  'Showcase achievements',
  'Participate in research discussions',
  'Build a professional education network',
] as const;

export interface TopicSeed {
  slug: string;
  name: string;
  description: string;
  category: string;
}

/** The approved initial topic directory. */
export const TOPIC_CATALOG: TopicSeed[] = [
  {
    slug: 'mathematics',
    name: 'Mathematics',
    description: 'Algebra, calculus, geometry, statistics and mathematical reasoning.',
    category: 'STEM',
  },
  {
    slug: 'physics',
    name: 'Physics',
    description: 'Mechanics, electromagnetism, quantum theory and the physical world.',
    category: 'STEM',
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    description: 'Organic, inorganic and physical chemistry, from atoms to materials.',
    category: 'STEM',
  },
  {
    slug: 'biology',
    name: 'Biology',
    description: 'Living systems, genetics, ecology, medicine and the life sciences.',
    category: 'STEM',
  },
  {
    slug: 'programming',
    name: 'Programming',
    description: 'Software craft, data structures, web and systems development.',
    category: 'Technology',
  },
  {
    slug: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    description: 'Machine learning, responsible AI, robotics and intelligent systems.',
    category: 'Technology',
  },
  {
    slug: 'engineering',
    name: 'Engineering',
    description: 'Civil, mechanical, electrical and emerging engineering disciplines.',
    category: 'STEM',
  },
  {
    slug: 'research',
    name: 'Research',
    description: 'Research methods, papers, academic collaboration and scientific inquiry.',
    category: 'Research',
  },
  {
    slug: 'languages',
    name: 'Languages',
    description: 'Language learning, linguistics, translation and communication.',
    category: 'Languages',
  },
  {
    slug: 'design',
    name: 'Design',
    description: 'Product, graphic, interaction and design thinking practice.',
    category: 'Design',
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'Entrepreneurship, management, finance and economics.',
    category: 'Business',
  },
  {
    slug: 'competitive-exams',
    name: 'Competitive Exams',
    description: 'Preparation strategy and resources for entrance and scholarship exams.',
    category: 'Exams',
  },
  {
    slug: 'career-development',
    name: 'Career Development',
    description: 'Internships, early careers, mentoring and professional growth.',
    category: 'Careers',
  },
  {
    slug: 'teaching',
    name: 'Teaching',
    description: 'Pedagogy, classroom practice, assessment and educator development.',
    category: 'Teaching',
  },
  {
    slug: 'higher-education',
    name: 'Higher Education',
    description: 'Universities, admissions, scholarships and postgraduate study.',
    category: 'Higher education',
  },
  {
    slug: 'arts-humanities',
    name: 'Arts and Humanities',
    description: 'History, literature, philosophy, social sciences and creative practice.',
    category: 'Humanities',
  },
];

export const TOPIC_BY_SLUG = new Map(TOPIC_CATALOG.map((topic) => [topic.slug, topic]));

export const DISCOVERY_TABS = [
  { value: 'for-you', label: 'For You' },
  { value: 'educators', label: 'Educators' },
  { value: 'peers', label: 'Academic Peers' },
  { value: 'researchers', label: 'Researchers' },
  { value: 'professionals', label: 'Professionals' },
  { value: 'connections', label: 'Following Connections' },
] as const;

export type DiscoveryTab = (typeof DISCOVERY_TABS)[number]['value'];

export const REPORT_REASONS = [
  'Harassment or bullying',
  'Hateful or discriminatory content',
  'Spam or misleading activity',
  'Impersonation',
  'Unsafe contact involving a minor',
  'Private or sensitive information',
  'Academic dishonesty',
  'Other',
] as const;

export const LIST_SUGGESTIONS = [
  'Science Educators',
  'AI Researchers',
  'Competitive Exam Resources',
  'Academic Career Guides',
] as const;

export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  follow: 'New follower',
  follow_request: 'Follow request',
  follow_accepted: 'Request accepted',
  reaction: 'Reaction',
  reply: 'Reply',
  mention: 'Mention',
  repost: 'Repost',
  quote: 'Quote',
  moderation: 'Moderation',
  invitation: 'Invitation',
};

export const PRIVACY_COPY = {
  minor:
    'Student accounts under 18 are private by default. Adults cannot discover or follow a student account, and student posts are visible only to approved followers.',
  adult:
    'Your date of birth, email and contact details are never shown on your social profile. You choose whether your profile can appear in search and recommendations.',
} as const;

export const POST_MAX_LENGTH = 2000;
export const POST_MAX_MEDIA = 4;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;
