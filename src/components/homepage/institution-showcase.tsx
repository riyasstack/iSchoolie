import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Building2, Check } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';

const FEATURES = [
  'Establish an official institution profile',
  'Connect your education community',
  'Share announcements with the right people',
  'Build a credible institutional identity',
  'Support digital learning across classes',
  'Adopt optional academic management services',
];

export function InstitutionShowcase() {
  return (
    <section id="institutions" className="home-section scroll-mt-24 bg-white">
      <div className="home-shell">
        <Reveal>
          <div className="overflow-hidden rounded-[1.9rem] border border-[#e4e7ee] bg-[#f5f5f7] lg:grid lg:grid-cols-[1.06fr_0.94fr]">
            <div className="relative min-h-[20rem] lg:min-h-[34rem]">
              <Image
                src="/images/homepage/campus-architecture.webp"
                alt="Historic university campus architecture against a clear sky."
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover"
                style={{ objectPosition: '50% 42%' }}
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b1322]/40 via-transparent to-transparent" />
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/90 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#41506b] backdrop-blur">
                <Building2 aria-hidden="true" className="h-3 w-3" />
                Institution profile · preview
              </div>
            </div>

            <div className="bg-white p-6 sm:p-9 lg:p-11">
              <p className="home-eyebrow text-[#7b8497]">Institutions and education organisations</p>
              <h2 className="home-h2 mt-4 text-navy">Bring Your Institution Into a Connected World.</h2>
              <p className="home-lead mt-4 text-[#5f6b80]">
                Schools, colleges and coaching organisations can join the network with an official
                identity — connect learners and educators, share updates and support digital
                learning from day one.
              </p>

              <ul className="mt-7 grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[0.8rem] leading-snug text-[#4b5872]">
                    <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1d7a44]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#f7f8fb] p-3 text-[0.72rem] leading-relaxed text-[#64708a]">
                <BadgeCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-action" />
                Institution access requires verification by the iSchoolie team. Academic management
                services are optional — they are not a prerequisite for joining the network.
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/onboarding/institution" className="home-cta home-cta-primary group">
                  Register Your Institution
                  <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
                </Link>
                <Link href="/help" className="home-cta home-cta-ghost">
                  What reviewers need
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
