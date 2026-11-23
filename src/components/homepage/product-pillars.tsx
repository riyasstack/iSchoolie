import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Sparkles, Users } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';

const SMALL_PILLARS = [
  {
    key: 'teach',
    icon: <GraduationCap aria-hidden="true" className="h-5 w-5" />,
    title: 'Teach',
    copy: 'Share expertise, build a professional educator identity and publish learning that reaches beyond one classroom.',
    href: '/#educators',
    linkLabel: 'For educators',
  },
  {
    key: 'connect',
    icon: <Users aria-hidden="true" className="h-5 w-5" />,
    title: 'Connect',
    copy: 'Build meaningful educational relationships — subject groups, study circles and institution communities.',
    href: '/communities',
    linkLabel: 'Explore communities',
  },
  {
    key: 'grow',
    icon: <Sparkles aria-hidden="true" className="h-5 w-5" />,
    title: 'Grow',
    copy: 'Showcase achievements, discover opportunities and let your education story travel with you.',
    href: '/#opportunities',
    linkLabel: 'Find opportunities',
  },
];

export function ProductPillars() {
  return (
    <section className="relative overflow-hidden bg-[#0b1322] py-16 text-white sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(55% 55% at 82% 0%, rgba(0,113,227,0.2) 0%, rgba(0,113,227,0) 70%)',
        }}
      />
      <div className="home-shell relative">
        <Reveal>
          <p className="home-eyebrow text-white/45">One idea, four directions</p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="home-h2 max-w-2xl text-white">Learn. Teach. Connect. Grow.</h2>
            <p className="home-lead max-w-md text-white/60">
              Four verbs describe the whole platform. Everything iSchoolie builds serves at least
              one of them.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <Link
              href="/courses"
              className="group relative flex h-full min-h-[24rem] flex-col justify-end overflow-hidden rounded-[1.75rem] border border-white/10 p-7 sm:min-h-[30rem] sm:p-9"
            >
              <Image
                src="/images/homepage/library-study.webp"
                alt="A grand library reading room lined with books."
                fill
                sizes="(max-width: 1024px) 100vw, 62vw"
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#08101d] via-[#08101d]/55 to-[#08101d]/10" />
              <div className="relative">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur">
                  <BookOpen aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.04em]">
                  Learn
                </h3>
                <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/70">
                  Discover courses, resources and learning opportunities from educators who know
                  their subject — and the learners who are exploring it with them.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Explore courses
                  <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
                </span>
              </div>
            </Link>
          </Reveal>

          {SMALL_PILLARS.map((pillar, index) => (
            <Reveal key={pillar.key} delay={80 + index * 60} className={pillar.key === 'teach' ? 'lg:col-span-2' : 'lg:col-span-1'}>
              <Link
                href={pillar.href}
                className="group flex h-full min-h-[13.5rem] flex-col justify-between rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.075] sm:p-7"
              >
                <div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/85">
                    {pillar.icon}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{pillar.title}</h3>
                  <p className="mt-2 text-[0.86rem] leading-relaxed text-white/60">{pillar.copy}</p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/50 transition group-hover:text-white/85">
                  {pillar.linkLabel}
                  <ArrowRight aria-hidden="true" className="arrow-slide h-3.5 w-3.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
