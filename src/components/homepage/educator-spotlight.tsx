import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';

const CAPABILITIES = [
  'Build a professional teaching profile',
  'Share expertise and publish courses',
  'Create educational resources',
  'Connect with other educators',
  'Offer learning experiences',
  'Grow a verified professional presence',
];

export function EducatorSpotlight() {
  return (
    <section id="educators" className="home-section relative scroll-mt-24 overflow-hidden bg-[#101a2e] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(48% 52% at 12% 8%, rgba(0,113,227,0.16) 0%, rgba(0,113,227,0) 70%)',
        }}
      />
      <div className="home-shell relative grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
        <div>
          <Reveal>
            <p className="home-eyebrow text-white/45">Professional educator spotlight</p>
            <h2 className="home-h2 mt-4 max-w-xl text-white">
              Great Educators Create Lasting Impact.
            </h2>
            <p className="home-lead mt-5 max-w-xl text-white/60">
              Your expertise deserves more than a staff-room noticeboard. iSchoolie gives educators
              a professional identity that reaches learners, peers and institutions.
            </p>
          </Reveal>

          <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {CAPABILITIES.map((item, index) => (
              <Reveal key={item} delay={index * 50}>
                <li className="flex items-start gap-2.5 text-[0.86rem] leading-relaxed text-white/70">
                  <BadgeCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#6fb4ff]" />
                  {item}
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/onboarding/social" className="home-cta bg-white text-navy hover:-translate-y-0.5 hover:bg-white/90">
                Become an Educator
                <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
              </Link>
              <Link href="/help" className="home-cta home-cta-light">
                How verification works
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/40">
              The verified badge and course publishing are reviewed by the iSchoolie team. You
              cannot grant yourself either.
            </p>
          </Reveal>
        </div>

        <Reveal delay={90}>
          <div className="relative mx-auto w-full max-w-[30rem]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.12]">
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src="/images/homepage/educator-teaching.webp"
                  alt="An educator explaining a concept in a professional learning environment."
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                  style={{ objectPosition: '50% 28%' }}
                />
              </div>
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a1220] via-transparent to-transparent" />

              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/25 bg-white/95 p-4 text-navy shadow-[0_24px_50px_-26px_rgba(0,0,0,0.55)] backdrop-blur sm:inset-x-5 sm:bottom-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                    T
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.9rem] font-semibold">Your teaching profile</p>
                    <p className="flex items-center gap-1 text-[0.7rem] text-[#64708a]">
                      <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5 text-action" />
                      Verified after review
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['Subject', 'Level', 'Resources', 'Courses'].map((chip) => (
                    <span key={chip} className="rounded-full bg-[#f1f4f9] px-2.5 py-1 text-[0.65rem] font-medium text-[#4b5872]">
                      {chip}
                    </span>
                  ))}
                </div>
                <p className="mt-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#98a1b3]">
                  Interface preview
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
