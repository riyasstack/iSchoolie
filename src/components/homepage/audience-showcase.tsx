import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

interface Audience {
  key: string;
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  image?: string;
  alt?: string;
  span: string;
  badge?: string;
  tone?: 'light' | 'dark';
}

const AUDIENCES: Audience[] = [
  {
    key: 'school',
    eyebrow: 'School students',
    title: 'Learn beyond the classroom.',
    copy: 'From Class 8 onwards, build subject confidence, join permitted learning communities and connect with educators — inside age-aware safeguards.',
    href: '/onboarding/social',
    image: '/images/homepage/educator-classroom.webp',
    alt: 'School students raising their hands in a classroom.',
    span: 'lg:col-span-7',
    badge: 'Class 8 onwards',
  },
  {
    key: 'college',
    eyebrow: 'College & university',
    title: 'Build a professional academic identity.',
    copy: 'Work on projects, follow research interests, meet mentors and prepare for internships and career opportunities.',
    href: '/onboarding/social',
    image: '/images/homepage/university-collaboration.webp',
    alt: 'University students studying together in a campus library.',
    span: 'lg:col-span-5',
  },
  {
    key: 'educators',
    eyebrow: 'Teachers & educators',
    title: 'Teach with a profile that travels.',
    copy: 'Share expertise, publish courses, connect with other educators and grow a verified professional presence.',
    href: '/onboarding/social',
    image: '/images/homepage/educator-whiteboard.webp',
    alt: 'An educator explaining a concept at a whiteboard.',
    span: 'lg:col-span-5',
  },
  {
    key: 'institutions',
    eyebrow: 'Schools & institutions',
    title: 'Bring your institution into the network.',
    copy: 'An official identity, connected communities and optional academic tools — independent of any ERP decision.',
    href: '/onboarding/institution',
    image: '/images/homepage/campus-architecture.webp',
    alt: 'Historic university campus architecture against a clear sky.',
    span: 'lg:col-span-4',
  },
  {
    key: 'guardians',
    eyebrow: 'Parents & guardians',
    title: 'Support learning, with clear boundaries.',
    copy: 'Your own account, explicit authorisation and a view limited to what a guardian is permitted to see.',
    href: '/onboarding/social',
    image: '/images/homepage/parent-engagement.webp',
    alt: 'Parents helping their child with schoolwork on a laptop.',
    span: 'lg:col-span-3',
  },
];

export function AudienceShowcase() {
  return (
    <section id="audiences" className="home-section scroll-mt-24 bg-[#f5f5f7]">
      <div className="home-shell">
        <Reveal>
          <SectionHeading
            eyebrow="Built for every stage of education"
            title={
              <>
                One Network.
                <br />
                A World of Possibilities.
              </>
            }
            description="Different roles need different rooms in the same house. iSchoolie gives each audience a workspace that fits, inside one shared education network."
          />
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {AUDIENCES.map((audience, index) => (
            <Reveal
              key={audience.key}
              delay={index * 60}
              className={`${audience.span} sm:col-span-1`}
            >
              <Link
                href={audience.href}
                className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[#e4e7ee] bg-white transition duration-300 hover:-translate-y-0.5 hover:border-[#cfd5e0] hover:shadow-[0_28px_60px_-34px_rgba(16,27,53,0.4)]"
              >
                {audience.image && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#eef0f4]">
                    <Image
                      src={audience.image}
                      alt={audience.alt ?? ''}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                      className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                    {audience.badge && (
                      <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#41506b] backdrop-blur">
                        {audience.badge}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#8a94a8]">
                    {audience.eyebrow}
                  </p>
                  <h3 className="mt-2 text-[1.12rem] font-semibold leading-snug tracking-[-0.02em] text-navy">
                    {audience.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[0.82rem] leading-relaxed text-[#64708a]">
                    {audience.copy}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-action">
                    Start in this workspace
                    <ArrowRight aria-hidden="true" className="arrow-slide h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
