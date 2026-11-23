import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Briefcase,
  CalendarDays,
  Lightbulb,
  Trophy,
  Video,
} from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

const OPPORTUNITIES = [
  { icon: <Award aria-hidden="true" className="h-4 w-4" />, title: 'Scholarships', copy: 'Funding and recognition to aim for.' },
  { icon: <Briefcase aria-hidden="true" className="h-4 w-4" />, title: 'Internships', copy: 'Early professional experience.' },
  { icon: <Lightbulb aria-hidden="true" className="h-4 w-4" />, title: 'Workshops', copy: 'Skills built in a focused session.' },
  { icon: <Trophy aria-hidden="true" className="h-4 w-4" />, title: 'Competitions', copy: 'Test what you know against peers.' },
  { icon: <Video aria-hidden="true" className="h-4 w-4" />, title: 'Webinars', copy: 'Learn from educators, wherever you are.' },
  { icon: <CalendarDays aria-hidden="true" className="h-4 w-4" />, title: 'Academic events', copy: 'Conferences, fairs and open days.' },
];

export function OpportunitiesShowcase() {
  return (
    <section id="opportunities" className="home-section scroll-mt-24 bg-[#f5f9ff]">
      <div className="home-shell grid items-stretch gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
        <div className="flex flex-col">
          <Reveal>
            <SectionHeading
              eyebrow="Educational opportunities"
              title="Opportunity Begins With Discovery."
              description="A scholarship, a competition, an internship or one conversation at a workshop can change a direction. iSchoolie is building one place to find them."
            />
          </Reveal>

          <div className="mt-8 grid flex-1 content-start gap-3 sm:grid-cols-2">
            {OPPORTUNITIES.map((item, index) => (
              <Reveal key={item.title} delay={index * 50}>
                <Link
                  href="/explore"
                  className="group flex h-full items-start gap-3 rounded-2xl border border-[#e0e7f2] bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#c4d3e8] hover:shadow-[0_20px_45px_-30px_rgba(16,27,53,0.4)]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-action">
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-[0.85rem] font-semibold text-navy">
                      {item.title}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-3 w-3 -translate-x-1 text-action opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      />
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-[#64708a]">{item.copy}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140}>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/explore" className="home-cta home-cta-primary group">
                Explore Opportunities
                <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
              </Link>
              <p className="text-xs leading-relaxed text-[#7b8497]">
                Listings appear only when an organiser publishes them. No invented deadlines.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div className="relative h-full min-h-[22rem] overflow-hidden rounded-[1.9rem] border border-[#dde6f3]">
            <Image
              src="/images/homepage/opportunities-workshop.webp"
              alt="A workshop audience listening to a speaker in a lecture theatre."
              fill
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover"
              style={{ objectPosition: '50% 45%' }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b1a30] via-[#0b1a30]/25 to-transparent" />
            <div className="absolute inset-x-5 bottom-5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/60">
                Discovery destination
              </p>
              <p className="mt-2 max-w-sm text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-white">
                The next opportunity should be easier to find.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Scholarships', 'Internships', 'Competitions'].map((tag) => (
                  <span key={tag} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[0.65rem] font-medium text-white/85 backdrop-blur">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
