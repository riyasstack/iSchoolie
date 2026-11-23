/**
 * Public navigation for the marketing homepage.
 *
 * Every destination is either a real route in this repository or an anchor on
 * the homepage. Nothing here points at a page that does not exist.
 */

export interface NavLink {
  href: string;
  label: string;
  description?: string;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

export const EXPLORE_GROUPS: NavGroup[] = [
  {
    title: 'Discover',
    links: [
      {
        href: '/#network',
        label: 'Education Network',
        description: 'One connected ecosystem of learners and educators.',
      },
      {
        href: '/#educators',
        label: 'Educators',
        description: 'Teaching profiles, expertise and shared resources.',
      },
      { href: '/courses', label: 'Courses', description: 'Published learning from verified educators.' },
      { href: '/communities', label: 'Communities', description: 'Subject groups and study circles.' },
    ],
  },
  {
    title: 'Institutions',
    links: [
      { href: '/#institutions', label: 'Schools', description: 'Official profiles for schools.' },
      {
        href: '/#institutions',
        label: 'Colleges & Universities',
        description: 'Campus communities and academic identity.',
      },
      {
        href: '/#institutions',
        label: 'Coaching Institutions',
        description: 'Learning organisations and training centres.',
      },
      {
        href: '/onboarding/institution',
        label: 'Register Institution',
        description: 'Apply for verification by the iSchoolie team.',
      },
    ],
  },
  {
    title: 'Opportunities',
    links: [
      { href: '/#opportunities', label: 'Events', description: 'Academic events, webinars and workshops.' },
      { href: '/#opportunities', label: 'Scholarships', description: 'Funding and recognition to aim for.' },
      { href: '/#opportunities', label: 'Internships', description: 'Early professional experience.' },
      {
        href: '/#opportunities',
        label: 'Academic Opportunities',
        description: 'Competitions, research and presentations.',
      },
    ],
  },
];

export const PRIMARY_LINKS: NavLink[] = [
  { href: '/courses', label: 'Courses' },
  { href: '/communities', label: 'Community' },
  { href: '/#educators', label: 'For Educators' },
  { href: '/#institutions', label: 'For Institutions' },
];

export const FOOTER_GROUPS: NavGroup[] = [
  {
    title: 'Explore',
    links: [
      { href: '/#network', label: 'Education Network' },
      { href: '/#educators', label: 'Educators' },
      { href: '/courses', label: 'Courses' },
      { href: '/communities', label: 'Communities' },
      { href: '/#institutions', label: 'Institutions' },
      { href: '/#opportunities', label: 'Opportunities' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { href: '/#mission', label: 'About iSchoolie' },
      { href: '/#audiences', label: 'For Students' },
      { href: '/#educators', label: 'For Educators' },
      { href: '/#institutions', label: 'For Institutions' },
      { href: '/#opportunities', label: 'Events' },
      { href: '/explore', label: 'Resources' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/help', label: 'Help Center' },
      { href: 'mailto:support@ischoolie.app', label: 'Contact' },
      { href: '/#trust', label: 'Trust & Safety' },
      { href: '/#trust', label: 'Community Guidelines' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/privacy', label: 'Privacy Policy' },
      { href: '/legal/terms', label: 'Terms of Service' },
    ],
  },
];
