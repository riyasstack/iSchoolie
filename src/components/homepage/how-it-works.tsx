import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

const STEPS = [
  {
    number: '01',
    title: 'Join iSchoolie',
    copy: 'Create your individual account with email or a supported sign-in provider. One identity covers every role you hold.',
  },
  {
    number: '02',
    title: 'Build Your Identity',
    copy: 'Complete the profile that fits your stage — student, educator, guardian or institution — and choose your workspaces.',
  },
  {
    number: '03',
    title: 'Discover and Connect',
    copy: 'Explore relevant people, learning resources, communities and opportunities. Your network grows with what you learn and teach.',
  },
];

export function HowItWorks() {
  return (
    <section className="home-section bg-[#f5f5f7]">
      <div className="home-shell">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="How iSchoolie works"
            title={'Start Connecting in\u00a0Three Simple Steps.'}
            description="No complicated setup and no institutional dependency. Begin with your own account and add the workspaces you need."
          />
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 80}>
              <div className="border-t border-[#d9dde5] pt-6">
                <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-[#98a1b3]">
                  STEP {step.number}
                </p>
                <p className="mt-5 text-[3.4rem] font-semibold leading-none tracking-[-0.06em] text-[#c7d3e6]">
                  {step.number}
                </p>
                <h3 className="mt-4 text-[1.2rem] font-semibold tracking-[-0.02em] text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#64708a]">{step.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={190}>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/signup" className="home-cta home-cta-primary group">
              Join iSchoolie
              <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
            </a>
            <a href="/login" className="home-cta home-cta-ghost">
              I already have an account
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
