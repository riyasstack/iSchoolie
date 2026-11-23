import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0b1322]">
      <Image
        src="/images/homepage/closing-graduation.webp"
        alt="Graduates in caps and gowns throwing their caps in the air."
        fill
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: '50% 42%' }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[#0b1322]/70" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 70% at 50% 50%, rgba(0,113,227,0.16) 0%, rgba(11,19,34,0) 72%)',
        }}
      />

      <div className="home-shell relative flex min-h-[30rem] flex-col items-center justify-center py-20 text-center sm:min-h-[36rem] sm:py-24">
        <Reveal>
          <p className="home-eyebrow text-white/50">The connected education network</p>
          <h2 className="home-display mx-auto mt-5 max-w-4xl text-white">
            Your Future Is Better Connected.
          </h2>
          <p className="home-lead mx-auto mt-6 max-w-xl text-white/70">
            Join an education network built to connect people, knowledge and opportunity.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/signup" className="home-cta bg-white text-navy hover:-translate-y-0.5 hover:bg-white/90">
              Join iSchoolie
              <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
            </a>
            <Link href="/#network" className="home-cta home-cta-light">
              Explore the Network
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/45">
            Free to join · Independent registration from Class 8 · One account, every workspace
          </p>
        </Reveal>
      </div>
    </section>
  );
}
