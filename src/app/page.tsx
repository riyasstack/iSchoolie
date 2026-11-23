import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { EnterpriseFooter } from '@/components/layout/enterprise-footer';
import { CinematicHero } from '@/components/homepage/cinematic-hero';
import { NetworkIntroduction } from '@/components/homepage/network-introduction';
import { ProductPillars } from '@/components/homepage/product-pillars';
import { AudienceShowcase } from '@/components/homepage/audience-showcase';
import { NetworkDiscovery } from '@/components/homepage/network-discovery';
import { CourseShowcase } from '@/components/homepage/course-showcase';
import { EducatorSpotlight } from '@/components/homepage/educator-spotlight';
import { CommunityShowcase } from '@/components/homepage/community-showcase';
import { PortfolioShowcase } from '@/components/homepage/portfolio-showcase';
import { InstitutionShowcase } from '@/components/homepage/institution-showcase';
import { OpportunitiesShowcase } from '@/components/homepage/opportunities-showcase';
import { HowItWorks } from '@/components/homepage/how-it-works';
import { TrustSafety } from '@/components/homepage/trust-safety';
import { MissionSection } from '@/components/homepage/mission-section';
import { FaqSection } from '@/components/homepage/faq-section';
import { FinalCta } from '@/components/homepage/final-cta';

const TITLE = 'iSchoolie — Learn. Teach. Connect. Grow. | Education Networking Platform';
const DESCRIPTION =
  'iSchoolie connects students, educators and institutions through learning, educational communities, professional networking and opportunities.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'iSchoolie',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const ORGANISATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'iSchoolie',
  description:
    'An education networking platform connecting learners, educators, guardians and institutions around knowledge, collaboration and opportunity.',
  slogan: 'Learn. Teach. Connect. Grow.',
};

export default function HomePage() {
  return (
    <div className="bg-[#fbfbfd]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy focus:shadow-lift"
      >
        Skip to content
      </a>

      <PublicNavbar />

      <main id="main-content">
        <CinematicHero />
        <NetworkIntroduction />
        <ProductPillars />
        <AudienceShowcase />
        <NetworkDiscovery />
        <CourseShowcase />
        <EducatorSpotlight />
        <CommunityShowcase />
        <PortfolioShowcase />
        <InstitutionShowcase />
        <OpportunitiesShowcase />
        <HowItWorks />
        <TrustSafety />
        <MissionSection />
        <FaqSection />
        <FinalCta />
      </main>

      <EnterpriseFooter />

      <script
        type="application/ld+json"
        // Verified facts only: no invented ratings, addresses or certifications.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATION_JSON_LD) }}
      />
    </div>
  );
}
