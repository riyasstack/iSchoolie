import {
  BadgeCheck,
  Building2,
  EyeOff,
  Flag,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

const PRINCIPLES = [
  {
    icon: <EyeOff aria-hidden="true" className="h-4 w-4" />,
    title: 'Privacy-aware profiles',
    copy: 'Public identity and private records are separate. Sensitive details are not part of discovery.',
  },
  {
    icon: <Building2 aria-hidden="true" className="h-4 w-4" />,
    title: 'Controlled institutional access',
    copy: 'Institution tools unlock only after the iSchoolie team verifies the organisation.',
  },
  {
    icon: <KeyRound aria-hidden="true" className="h-4 w-4" />,
    title: 'Role-based permissions',
    copy: 'Every workspace checks the role that is acting, not just the account that signed in.',
  },
  {
    icon: <UserCheck aria-hidden="true" className="h-4 w-4" />,
    title: 'Age-appropriate safeguards',
    copy: 'Minors get private-by-default profiles and restricted discoverability; independent registration starts at Class 8.',
  },
  {
    icon: <BadgeCheck aria-hidden="true" className="h-4 w-4" />,
    title: 'Verified educators & institutions',
    copy: 'The verified badge is reviewed by people. It cannot be self-granted in the interface.',
  },
  {
    icon: <Flag aria-hidden="true" className="h-4 w-4" />,
    title: 'Reporting & moderation',
    copy: 'Communities have reporting paths, and moderation decisions belong to the platform team.',
  },
];

export function TrustSafety() {
  return (
    <section id="trust" className="home-section scroll-mt-24 bg-white">
      <div className="home-shell grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="Trust, safety and privacy"
              title="Built Around Trust. Designed for Education."
              description="A network that includes minors and institutional records has to be careful by default — in what it shows, who can act and what it stores."
            />
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-8 rounded-2xl border border-[#e7e9ef] bg-[#fbfbfd] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#2d3b55]" />
                <p className="text-[0.82rem] font-semibold text-navy">An honest note</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#64708a]">
                These are iSchoolie’s platform design principles. iSchoolie does not claim external
                certification, audit or regulatory compliance that has not been independently
                verified.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[#64708a]">
                Younger learners join through a guardian or institution. Independent student
                registration begins at Class 8.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
          {PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.title} delay={index * 50}>
              <div className="border-t border-[#e7e9ef] py-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f4f8] text-[#2d3b55]">
                  {principle.icon}
                </span>
                <h3 className="mt-3 text-[0.9rem] font-semibold text-navy">{principle.title}</h3>
                <p className="mt-1.5 text-[0.8rem] leading-relaxed text-[#64708a]">{principle.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
