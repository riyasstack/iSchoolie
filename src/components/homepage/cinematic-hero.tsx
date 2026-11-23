import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, MessagesSquare } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';

export function CinematicHero() {
  return (
    <section className="relative overflow-hidden bg-[#fbfbfd]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hero-glow" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hairline-grid opacity-70" />

      <div className="home-shell relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:py-24">
        <div>
          <p className="home-eyebrow home-enter flex items-center gap-2.5 text-[#526078]" style={{ animationDelay: '40ms' }}>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-action" />
            The connected education network
          </p>

          <h1 className="home-display home-enter mt-6 text-navy" style={{ animationDelay: '120ms' }}>
            Where Learning{' '}
            <span className="block">and Connections{' '}</span>
            <span className="block bg-gradient-to-r from-navy via-[#1b3a6b] to-action bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h1>

          <p className="home-lead home-enter mt-7 max-w-xl text-[#566276]" style={{ animationDelay: '200ms' }}>
            Connect with educators, discover knowledge, join learning communities and explore new
            opportunities — all in one education network.
          </p>

          <div className="home-enter mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '280ms' }}>
            <a href="/signup" className="home-cta home-cta-primary group">
              Join iSchoolie
              <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
            </a>
            <Link href="/#network" className="home-cta home-cta-ghost">
              Explore the Network
            </Link>
          </div>

          <div
            className="home-enter mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8791a3]"
            style={{ animationDelay: '360ms' }}
          >
            <span>Learn</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#c3c9d4]" />
            <span>Teach</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#c3c9d4]" />
            <span>Connect</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#c3c9d4]" />
            <span>Grow</span>
          </div>
        </div>

        <div className="home-enter relative" style={{ animationDelay: '180ms' }}>
          <div className="home-media media-zoom shadow-[0_50px_100px_-48px_rgba(16,27,53,0.55)]">
            <div className="relative aspect-[4/3] w-full sm:aspect-[5/4] lg:aspect-[10/11]">
              <Image
                src="/images/homepage/hero-collaboration.webp"
                alt="Students collaborating around laptops in a bright academic workspace."
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
                style={{ objectPosition: '50% 44%' }}
              />
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b1322]/45 via-transparent to-transparent" />

            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#41506b] backdrop-blur sm:left-5 sm:top-5">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#18a05a]" />
              Education network
            </div>

            <div className="absolute right-4 top-4 hidden w-[12.5rem] rounded-2xl border border-white/70 bg-white/[0.94] p-3.5 shadow-[0_22px_48px_-24px_rgba(16,27,53,0.55)] backdrop-blur sm:right-5 sm:top-5 sm:block">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-[0.7rem] font-bold text-white">
                  A
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.78rem] font-semibold text-navy">Educator profile</p>
                  <p className="flex items-center gap-1 text-[0.65rem] text-[#6b768c]">
                    <BadgeCheck aria-hidden="true" className="h-3 w-3 text-action" />
                    Verified educator
                  </p>
                </div>
              </div>
              <p className="mt-2.5 rounded-lg bg-[#f5f7fa] px-2 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#8a94a8]">
                Interface preview
              </p>
            </div>

            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/55 bg-white/[0.94] p-4 shadow-[0_22px_48px_-22px_rgba(16,27,53,0.5)] backdrop-blur sm:bottom-5 sm:left-5 sm:right-auto sm:w-[17.5rem]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-action/10 text-action">
                  <MessagesSquare aria-hidden="true" className="h-4 w-4" />
                </span>
                <p className="text-[0.82rem] font-semibold text-navy">Learning community</p>
              </div>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-[#64708a]">
                Subject groups, study circles and shared resources — open to every verified member.
              </p>
              <p className="mt-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#98a1b3]">
                Interface preview
              </p>
            </div>
          </div>
        </div>
      </div>

      <Reveal className="home-shell relative pb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e7e9ef] py-6 text-[0.75rem] text-[#7b8497]">
          <p className="font-medium text-[#566276]">One account. Every role. One education network.</p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>Students · Class 8 onwards</span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-[#c3c9d4] sm:block" />
            <span>Educators</span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-[#c3c9d4] sm:block" />
            <span>Institutions</span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-[#c3c9d4] sm:block" />
            <span>Guardians</span>
          </p>
        </div>
      </Reveal>
    </section>
  );
}
