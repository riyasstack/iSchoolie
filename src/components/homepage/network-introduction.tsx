import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Compass, Layers, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

const PRINCIPLES = [
  {
    icon: <Layers aria-hidden="true" className="h-4 w-4" />,
    title: 'One identity, every role',
    copy: 'A student can also teach; a teacher can also be a guardian. Each workspace stays clear, connected to one account.',
  },
  {
    icon: <Compass aria-hidden="true" className="h-4 w-4" />,
    title: 'Discovery without noise',
    copy: 'Find educators, institutions and subject communities by what they actually teach and study.',
  },
  {
    icon: <Sparkles aria-hidden="true" className="h-4 w-4" />,
    title: 'Growth that is visible',
    copy: 'Projects, achievements and learning interests become a story that travels with the learner.',
  },
];

export function NetworkIntroduction() {
  return (
    <section id="network" className="home-section scroll-mt-24 bg-white">
      <div className="home-shell grid items-center gap-12 lg:grid-cols-[0.98fr_1.02fr] lg:gap-16">
        <Reveal>
          <div className="relative">
            <div className="home-media media-zoom group shadow-[0_40px_80px_-42px_rgba(16,27,53,0.45)]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/homepage/network-community.webp"
                  alt="A small group of learners working together at a shared table."
                  fill
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="relative mx-4 -mt-10 rounded-2xl border border-[#e7e9ef] bg-white p-4 shadow-[0_26px_60px_-30px_rgba(16,27,53,0.4)] sm:mx-6 sm:p-5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#8a94a8]">
                The network, in practice
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[0.78rem] font-medium text-[#3f4c63]">
                <span className="rounded-full bg-[#f2f4f8] px-2.5 py-1">Learners</span>
                <span aria-hidden="true" className="text-[#b3bbc9]">↔</span>
                <span className="rounded-full bg-[#f2f4f8] px-2.5 py-1">Educators</span>
                <span aria-hidden="true" className="text-[#b3bbc9]">↔</span>
                <span className="rounded-full bg-[#f2f4f8] px-2.5 py-1">Institutions</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#6b768c]">
                Collaboration stays inside role-aware spaces. Private records never become public
                profile content.
              </p>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <SectionHeading
              eyebrow="The education network"
              title="Education Is Better When We’re Connected."
              description="iSchoolie brings learners, educators and institutions into one connected ecosystem built around knowledge, collaboration and growth."
            />
          </Reveal>

          <div className="mt-9 border-t border-[#eceef2]">
            {PRINCIPLES.map((principle, index) => (
              <Reveal key={principle.title} delay={index * 70}>
                <div className="flex gap-4 border-b border-[#eceef2] py-5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f4f8] text-[#2d3b55]">
                    {principle.icon}
                  </span>
                  <div>
                    <h3 className="text-[0.95rem] font-semibold text-navy">{principle.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#64708a]">{principle.copy}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <Link href="/explore" className="home-link group mt-7 text-sm">
              Explore the Network
              <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
