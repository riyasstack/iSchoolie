import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Compass,
  MessagesSquare,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

const HIGHLIGHTS = [
  {
    icon: <Users aria-hidden="true" className="h-4 w-4" />,
    title: 'Discover educators',
    copy: 'Subject expertise, teaching style and shared resources.',
  },
  {
    icon: <Building2 aria-hidden="true" className="h-4 w-4" />,
    title: 'Find institutions',
    copy: 'Official school, college and coaching profiles.',
  },
  {
    icon: <MessagesSquare aria-hidden="true" className="h-4 w-4" />,
    title: 'Explore communities',
    copy: 'Study circles and subject groups you can belong to.',
  },
  {
    icon: <Compass aria-hidden="true" className="h-4 w-4" />,
    title: 'Follow your interests',
    copy: 'A feed shaped by what you learn and teach, not ads.',
  },
];

const RESULTS = [
  {
    icon: <BookOpen aria-hidden="true" className="h-4 w-4" />,
    title: 'Mathematics educators',
    meta: 'Algebra · Geometry · Competitive exams',
    tag: 'Educators',
  },
  {
    icon: <MessagesSquare aria-hidden="true" className="h-4 w-4" />,
    title: 'Science & research communities',
    meta: 'Physics · Chemistry · Biology · Research',
    tag: 'Communities',
  },
  {
    icon: <Building2 aria-hidden="true" className="h-4 w-4" />,
    title: 'Colleges & universities',
    meta: 'Undergraduate · Postgraduate · Campus',
    tag: 'Institutions',
  },
];

export function NetworkDiscovery() {
  return (
    <section className="home-section bg-white">
      <div className="home-shell grid items-center gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="Discover your education network"
              title="Connect With People Who Inspire You."
              description="Search the network by subject, interest or stage. Public profiles and communities are readable before you join — private records never are."
            />
          </Reveal>

          <div className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {HIGHLIGHTS.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f4f9] text-[#2d3b55]">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="text-[0.86rem] font-semibold text-navy">{item.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#64708a]">{item.copy}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140}>
            <Link href="/explore" className="home-cta home-cta-primary group mt-8">
              Explore the Network
              <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-5 rounded-[2.6rem] bg-[#f4f7fc]"
            />
            <div className="relative overflow-hidden rounded-[1.9rem] border border-[#e4e8f0] bg-white p-3 shadow-[0_40px_80px_-46px_rgba(16,27,53,0.45)] sm:p-4">
              <div className="flex items-center gap-2 rounded-2xl border border-[#e8ebf1] bg-[#fbfbfd] px-3.5 py-3">
                <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-[#8a94a8]" />
                <p className="text-[0.82rem] text-[#8a94a8]">Search educators, institutions, communities…</p>
                <span className="ml-auto rounded-md border border-[#e4e7ee] bg-white px-1.5 py-0.5 text-[0.6rem] font-semibold text-[#9aa3b4]">
                  ⌘K
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 px-1">
                {['All', 'Educators', 'Institutions', 'Communities'].map((filter, index) => (
                  <span
                    key={filter}
                    className={
                      index === 0
                        ? 'rounded-full bg-navy px-3 py-1.5 text-[0.68rem] font-semibold text-white'
                        : 'rounded-full border border-[#e6e9ef] px-3 py-1.5 text-[0.68rem] font-medium text-[#64708a]'
                    }
                  >
                    {filter}
                  </span>
                ))}
              </div>

              <ul className="mt-3 divide-y divide-[#eef0f4]">
                {RESULTS.map((result) => (
                  <li key={result.title} className="flex items-center gap-3 px-1 py-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f9] text-[#2d3b55]">
                      {result.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.85rem] font-semibold text-navy">{result.title}</p>
                      <p className="truncate text-[0.7rem] text-[#76829a]">{result.meta}</p>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-[#f4f6fa] px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-[#8a94a8] sm:inline">
                      {result.tag}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8fb] px-3.5 py-3">
                <p className="text-[0.68rem] leading-snug text-[#6b768c]">
                  Interface preview — public profiles and communities are readable before you join.
                </p>
                <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-[#9aa3b4]" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
