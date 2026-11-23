import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  Calculator,
  Code2,
  Languages,
  Palette,
  Target,
} from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

const CATEGORIES = [
  {
    icon: <Calculator aria-hidden="true" className="h-4 w-4" />,
    title: 'Mathematics & Science',
    copy: 'Algebra, physics, chemistry and biology.',
  },
  {
    icon: <Code2 aria-hidden="true" className="h-4 w-4" />,
    title: 'Programming & Technology',
    copy: 'Coding, data and digital building.',
  },
  {
    icon: <Target aria-hidden="true" className="h-4 w-4" />,
    title: 'Competitive Examinations',
    copy: 'Focused preparation and practice.',
  },
  {
    icon: <Languages aria-hidden="true" className="h-4 w-4" />,
    title: 'Languages & Communication',
    copy: 'Reading, writing and speaking well.',
  },
  {
    icon: <Palette aria-hidden="true" className="h-4 w-4" />,
    title: 'Arts & Creativity',
    copy: 'Design, music and visual expression.',
  },
  {
    icon: <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />,
    title: 'Professional Skills',
    copy: 'The capabilities careers are built on.',
  },
];

export function CourseShowcase() {
  return (
    <section id="learning" className="home-section scroll-mt-24 bg-[#f5f9ff]">
      <div className="home-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Courses and digital learning"
            title="Knowledge Opens New Possibilities."
            description="Explore subjects that stretch you — taught by educators who publish on iSchoolie and reviewed before they carry a verified badge."
            action={
              <Link href="/courses" className="home-cta home-cta-primary group">
                Explore Courses
                <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
              </Link>
            }
          />
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <Reveal>
            <div className="group relative h-full min-h-[24rem] overflow-hidden rounded-[1.75rem] border border-[#dde6f3] bg-[#eef3fb]">
              <Image
                src="/images/homepage/technology-learning.webp"
                alt="A learner working with technology at a desk."
                fill
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
                style={{ objectPosition: '50% 40%' }}
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-[#0b1a30]/35 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/60">
                  Learning space
                </p>
                <h3 className="mt-2 max-w-sm text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[2rem]">
                  Courses that meet you where you are.
                </h3>
                <p className="mt-3 max-w-md text-[0.85rem] leading-relaxed text-white/70">
                  Browse by subject and stage. Every published course is labelled with its educator,
                  level and verification status.
                </p>
                <Link
                  href="/courses"
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Open the catalogue
                  <ArrowRight aria-hidden="true" className="arrow-slide h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((category, index) => (
              <Reveal key={category.title} delay={index * 50}>
                <Link
                  href="/courses"
                  className="group flex h-full flex-col justify-between rounded-2xl border border-[#e0e7f2] bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#c4d3e8] hover:shadow-[0_20px_45px_-30px_rgba(16,27,53,0.4)] sm:p-5"
                >
                  <div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ff] text-action">
                      {category.icon}
                    </span>
                    <h3 className="mt-3 text-[0.86rem] font-semibold leading-snug text-navy">
                      {category.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#64708a]">{category.copy}</p>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#9aa3b4] transition group-hover:text-action">
                    Browse
                    <ArrowRight aria-hidden="true" className="h-3 w-3" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
