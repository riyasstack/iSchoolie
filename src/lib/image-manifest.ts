/**
 * Homepage photography manifest.
 *
 * All photographs are sourced from Unsplash and used under the Unsplash
 * License (free for commercial and non-commercial use; attribution is not
 * required but is recorded here). Files are downloaded into
 * `public/images/homepage` and re-encoded as WebP — nothing is hotlinked.
 *
 * Photographer names are not exposed by the image CDN; the canonical source
 * URL for each asset is recorded below so attribution can be completed from
 * the Unsplash photo page.
 */

export interface HomepageImage {
  file: string;
  width: number;
  height: number;
  sourceUrl: string;
  license: 'Unsplash License';
  section: string;
  alt: string;
}

export const HOMEPAGE_IMAGES: HomepageImage[] = [
  {
    file: '/images/homepage/hero-collaboration.webp',
    width: 2000,
    height: 1333,
    sourceUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
    license: 'Unsplash License',
    section: 'Hero — The connected education network',
    alt: 'Students collaborating around laptops in a bright academic workspace.',
  },
  {
    file: '/images/homepage/network-community.webp',
    width: 1600,
    height: 1067,
    sourceUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    license: 'Unsplash License',
    section: 'Education network introduction',
    alt: 'A small group of learners working together at a shared table.',
  },
  {
    file: '/images/homepage/university-collaboration.webp',
    width: 1600,
    height: 1200,
    sourceUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66',
    license: 'Unsplash License',
    section: 'Audiences — college and university students',
    alt: 'University students studying together in a campus library.',
  },
  {
    file: '/images/homepage/educator-teaching.webp',
    width: 1600,
    height: 2397,
    sourceUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
    license: 'Unsplash License',
    section: 'Educator spotlight',
    alt: 'An educator explaining a concept in a professional learning environment.',
  },
  {
    file: '/images/homepage/campus-architecture.webp',
    width: 1600,
    height: 1048,
    sourceUrl: 'https://images.unsplash.com/photo-1562774053-701939374585',
    license: 'Unsplash License',
    section: 'Institutions',
    alt: 'Historic university campus architecture against a clear sky.',
  },
  {
    file: '/images/homepage/lab-innovation.webp',
    width: 1600,
    height: 1004,
    sourceUrl: 'https://unsplash.com/photos/scientist-using-pipette-with-test-tubes-in-lab-RlOAwXt2fEA',
    license: 'Unsplash License',
    section: 'Student portfolio and projects',
    alt: 'A researcher pipetting samples in a science laboratory.',
  },
  {
    file: '/images/homepage/opportunities-workshop.webp',
    width: 1600,
    height: 1067,
    sourceUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655',
    license: 'Unsplash License',
    section: 'Educational opportunities',
    alt: 'A workshop audience listening to a speaker in a lecture theatre.',
  },
  {
    file: '/images/homepage/parent-engagement.webp',
    width: 1600,
    height: 1067,
    sourceUrl: 'https://unsplash.com/photos/family-helping-child-with-schoolwork-zgq9OXecyqI',
    license: 'Unsplash License',
    section: 'Audiences — guardians',
    alt: 'Parents helping their child with schoolwork on a laptop.',
  },
  {
    file: '/images/homepage/closing-graduation.webp',
    width: 2000,
    height: 1333,
    sourceUrl: 'https://unsplash.com/photos/graduates-throwing-caps-in-celebration-hpRGrfOIybc',
    license: 'Unsplash License',
    section: 'Final call to action',
    alt: 'Graduates in caps and gowns throwing their caps in the air outside a university building.',
  },
  {
    file: '/images/homepage/library-study.webp',
    width: 1600,
    height: 1067,
    sourceUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da',
    license: 'Unsplash License',
    section: 'Product pillars — Learn, Teach, Connect, Grow',
    alt: 'A grand library reading room lined with books.',
  },
  {
    file: '/images/homepage/technology-learning.webp',
    width: 1600,
    height: 1067,
    sourceUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
    license: 'Unsplash License',
    section: 'Courses and digital learning',
    alt: 'A learner working with technology at a desk.',
  },
  {
    file: '/images/homepage/communities-collaboration.webp',
    width: 1600,
    height: 1067,
    sourceUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
    license: 'Unsplash License',
    section: 'Connected learning communities',
    alt: 'Students and mentors collaborating around a shared project table.',
  },
  {
    file: '/images/homepage/educator-classroom.webp',
    width: 1600,
    height: 996,
    sourceUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7',
    license: 'Unsplash License',
    section: 'Audiences — school students',
    alt: 'School students raising their hands in a classroom.',
  },
  {
    file: '/images/homepage/educator-whiteboard.webp',
    width: 1080,
    height: 675,
    sourceUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd',
    license: 'Unsplash License',
    section: 'Audiences — teachers and educators',
    alt: 'An educator explaining a concept at a whiteboard.',
  },
];
