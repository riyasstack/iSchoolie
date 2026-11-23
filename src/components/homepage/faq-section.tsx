'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SectionHeading } from '@/components/homepage/section-heading';

const FAQS = [
  {
    question: 'What is iSchoolie?',
    answer:
      'iSchoolie is an education networking platform. It connects learners, educators, guardians and institutions around knowledge, collaboration and opportunity — with one account and role-aware workspaces.',
  },
  {
    question: 'Is iSchoolie only for school students?',
    answer:
      'No. School students are one audience, alongside college and university students, independent educators, teachers, tutors, schools, colleges, coaching institutions and guardians.',
  },
  {
    question: 'Can college students join?',
    answer:
      'Yes. College and university students can build academic profiles, follow projects and research interests, join communities and discover internships and other opportunities.',
  },
  {
    question: 'Can educators create professional profiles?',
    answer:
      'Yes. Educators can create a teaching profile immediately. The verified educator badge and course publishing are reviewed by the iSchoolie team and cannot be self-granted.',
  },
  {
    question: 'Can schools and colleges use iSchoolie without an ERP?',
    answer:
      'Yes. Institutional networking, official profiles, communities and communication do not require academic management software. ERP-style services are an optional extension.',
  },
  {
    question: 'What can parents and guardians access?',
    answer:
      'Guardians get their own account and an explicitly authorised view. They see only what the learner or institution has permitted — never a shared password and never the full private record.',
  },
  {
    question: 'Can one person have multiple workspaces?',
    answer:
      'Yes. One identity can hold student, educator, guardian and institution roles at the same time. Each workspace applies its own permissions, and switching workspaces never grants new access.',
  },
  {
    question: 'What is the minimum grade for independent student registration?',
    answer:
      'Independent student registration begins at Class 8. Younger learners participate through a guardian or an institution rather than creating an independent account.',
  },
  {
    question: 'How does iSchoolie protect private institutional information?',
    answer:
      'Access is role-based and institution-scoped: a member sees only the institution data their role permits. Private records are kept separate from public profile content, and institution tools unlock only after verification.',
  },
];

export function FaqSection() {
  const baseId = React.useId();
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id="faq" className="home-section scroll-mt-24 bg-[#f5f5f7]">
      <div className="home-shell grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Frequently asked questions"
            title="Clear answers, before you join."
            description="The short version of how the network works. The Help Center has the longer one."
          />

          <div className="mt-8 rounded-2xl border border-[#e3e6ec] bg-white p-5">
            <p className="text-[0.82rem] font-semibold text-navy">Still deciding?</p>
            <p className="mt-1 text-xs leading-relaxed text-[#64708a]">
              Read the role guides, verification steps and safeguarding notes in the Help Center.
            </p>
            <Link href="/help" className="home-link group mt-3 inline-flex text-sm">
              Visit the Help Center
              <ArrowRight aria-hidden="true" className="arrow-slide h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="border-t border-[#dfe3ea]">
          {FAQS.map((faq, index) => {
            const isOpen = open === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <div key={faq.question} className="border-b border-[#dfe3ea]">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-[0.98rem] font-semibold leading-snug text-navy sm:text-[1.05rem]">
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition duration-300',
                        isOpen
                          ? 'rotate-45 border-navy bg-navy text-white'
                          : 'border-[#d4d9e2] text-[#6b768c]',
                      )}
                    >
                      <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={buttonId} className="faq-panel" data-open={isOpen}>
                  <div>
                    <p className="max-w-2xl pb-5 pr-10 text-[0.88rem] leading-relaxed text-[#5f6b80]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
