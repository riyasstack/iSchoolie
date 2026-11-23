import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';

const PRINCIPLES = [
  {
    title: 'People over metrics',
    copy: 'The homepage you are reading does not invent testimonials, logos or user numbers. Credibility is earned when real institutions and educators join.',
  },
  {
    title: 'Privacy by design',
    copy: 'Profiles are built around what is safe to share. Institutional records and guardian relationships are never treated as marketing content.',
  },
  {
    title: 'One identity, many roles',
    copy: 'A learner can become an educator; a teacher can be a guardian. The network should not force people to create a new account for every chapter.',
  },
];

export function MissionSection() {
  return (
    <section id="mission" className="scroll-mt-24 bg-[#0b1322] py-20 text-white sm:py-24 lg:py-28">
      <div className="home-shell">
        <Reveal>
          <p className="home-eyebrow text-white/40">Why iSchoolie exists</p>
          <h2 className="home-h2 mt-5 max-w-4xl text-white">
            Education deserves infrastructure built around trust, not attention.
          </h2>
          <p className="home-lead mt-6 max-w-2xl text-white/60">
            iSchoolie is being built as an education networking platform first — a place where
            knowledge, people and opportunity can find each other. Institutional management tools
            are an optional extension, never the reason the network exists.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3 md:gap-8">
          {PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.title} delay={index * 80}>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white/35">
                0{index + 1}
              </p>
              <h3 className="mt-3 text-[1.05rem] font-semibold text-white">{principle.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{principle.copy}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <Link href="/explore" className="home-link group mt-12 inline-flex text-sm text-white/80">
            See how the network is taking shape
            <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
