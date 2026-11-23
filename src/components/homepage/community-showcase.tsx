import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Atom,
  BriefcaseBusiness,
  Calculator,
  Code2,
  FlaskConical,
  Target,
  Users,
} from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

const COMMUNITIES = [
  { icon: <Calculator aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Mathematics' },
  { icon: <Atom aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Science' },
  { icon: <Code2 aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Technology' },
  { icon: <Target aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Exam Preparation' },
  { icon: <FlaskConical aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Research' },
  { icon: <BriefcaseBusiness aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Career Development' },
];

export function CommunityShowcase() {
  return (
    <section className="home-section bg-[#f5f5f7]">
      <div className="home-shell grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <Reveal>
          <div className="relative">
            <div className="group relative overflow-hidden rounded-[1.75rem] border border-[#e3e6ec]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/homepage/communities-collaboration.webp"
                  alt="Students and mentors collaborating around a shared project table."
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                />
              </div>
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b1322]/60 via-transparent to-transparent" />

              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/60 bg-white/[0.95] p-4 shadow-[0_24px_50px_-26px_rgba(16,27,53,0.5)] backdrop-blur sm:inset-x-5 sm:bottom-5">
                <div className="flex items-center gap-2">
                  <Users aria-hidden="true" className="h-4 w-4 text-action" />
                  <p className="text-[0.82rem] font-semibold text-navy">Community preview</p>
                </div>
                <ul className="mt-2.5 space-y-1.5">
                  {['Study circle · Physics', 'Coding club · Projects', 'Research group · Reading'].map((row) => (
                    <li key={row} className="flex items-center justify-between gap-2 rounded-lg bg-[#f6f7fa] px-2.5 py-1.5">
                      <span className="truncate text-[0.72rem] font-medium text-[#46536c]">{row}</span>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c3c9d4]" />
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#98a1b3]">
                  Interface preview
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <SectionHeading
              eyebrow="Connected learning communities"
              title="Find Your People. Share Your Knowledge."
              description="Subject groups, coding clubs, study circles and academic workshops — spaces where questions are welcome and knowledge is shared."
            />
          </Reveal>

          <div className="mt-8 flex flex-wrap gap-2">
            {COMMUNITIES.map((community, index) => (
              <Reveal key={community.label} delay={index * 50}>
                <Link
                  href="/communities"
                  className="inline-flex items-center gap-2 rounded-full border border-[#dfe3ea] bg-white px-3.5 py-2 text-[0.78rem] font-medium text-[#3f4c63] transition hover:-translate-y-0.5 hover:border-[#c4ccd9] hover:text-navy"
                >
                  <span className="text-[#6b768c]">{community.icon}</span>
                  {community.label}
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#64708a]">
              Community permissions follow the member’s role and institution. Private student
              information and restricted communities stay out of public discovery.
            </p>
            <Link href="/communities" className="home-cta home-cta-primary group mt-7">
              Explore Communities
              <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
