import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award, BookMarked, Briefcase, FolderKanban, GraduationCap, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/homepage/reveal';
import { SectionHeading } from '@/components/homepage/section-heading';

const PORTFOLIO_ITEMS = [
  { icon: <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Skills' },
  { icon: <FolderKanban aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Projects' },
  { icon: <Award aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Achievements' },
  { icon: <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Education' },
  { icon: <BookMarked aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Certificates' },
  { icon: <Briefcase aria-hidden="true" className="h-3.5 w-3.5" />, label: 'Opportunities' },
];

export function PortfolioShowcase() {
  return (
    <section className="home-section bg-white">
      <div className="home-shell grid items-center gap-12 lg:grid-cols-[0.96fr_1.04fr] lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="Student identity and portfolio"
              title="Your Education Story Deserves to Be Seen."
              description="College students and eligible learners can bring skills, projects and achievements into one academic identity — ready for internships, research and the next step."
            />
          </Reveal>

          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PORTFOLIO_ITEMS.map((item, index) => (
              <Reveal key={item.label} delay={index * 50}>
                <div className="flex items-center gap-2 rounded-xl border border-[#e7e9ef] bg-[#fbfbfd] px-3 py-2.5 text-[0.78rem] font-medium text-[#3f4c63]">
                  <span className="text-[#6b768c]">{item.icon}</span>
                  {item.label}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140}>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#64708a]">
              You decide what is public. Private academic records, guardian links and institution
              data are never published automatically.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/onboarding/social" className="home-cta home-cta-primary group">
                Build your profile
                <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
              </Link>
              <Link href="/explore" className="home-link text-sm">
                See what discovery looks like
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={90}>
          <div className="relative">
            <div className="home-media group border border-[#e3e6ec]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/homepage/lab-innovation.webp"
                  alt="A researcher pipetting samples in a science laboratory."
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />
              </div>
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b1322]/55 via-transparent to-transparent" />

              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-[0_24px_50px_-26px_rgba(16,27,53,0.5)] backdrop-blur sm:inset-x-5 sm:bottom-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef4ff] text-sm font-bold text-action">
                      S
                    </span>
                    <div>
                      <p className="text-[0.82rem] font-semibold text-navy">Student portfolio</p>
                      <p className="text-[0.68rem] text-[#64708a]">Illustrative preview</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#eef7f0] px-2 py-0.5 text-[0.6rem] font-semibold text-[#1d7a44]">
                    You control visibility
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {['Research', 'Robotics', 'Olympiad'].map((project) => (
                    <span key={project} className="rounded-lg bg-[#f5f7fa] px-2 py-1.5 text-center text-[0.66rem] font-medium text-[#4b5872]">
                      {project}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
