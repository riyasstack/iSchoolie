import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { PRODUCT } from '@/lib/config';
import { buttonClass } from '@/components/ui/button-styles';

export const metadata: Metadata = {
  title: 'Help and Support',
  description: 'Get help with your iSchoolie account, roles, guardian links and institution verification.',
};

const FAQS = [
  {
    question: 'I signed up but cannot reach my dashboard.',
    answer:
      'Check that you opened the verification link we emailed you. Verified email is required before onboarding. If the link expired, sign in and choose “Resend verification email”.',
  },
  {
    question: 'Why can’t I publish a course?',
    answer:
      'Publishing requires iSchoolie educator verification. Your teaching profile can be created immediately, but the verified badge — and the database rule that allows course creation — comes from the iSchoolie team after review.',
  },
  {
    question: 'I applied for an institution. Why is nothing unlocked?',
    answer:
      'Institution tools unlock only after the iSchoolie team approves the application and provisions the owner. Track progress on the institution status page. Applicants can never approve themselves.',
  },
  {
    question: 'How do I see my child’s results?',
    answer:
      'Create your own guardian account, send a link request with your child’s iSchoolie email, ask them to confirm it, then wait for iSchoolie verification. Access is limited to the categories you were granted.',
  },
  {
    question: 'I am below Class 8. Can I still use iSchoolie?',
    answer:
      'Independent public-network accounts start at Class 8 and age 13. A school-managed profile or a guardian account is the supported route for younger learners.',
  },
  {
    question: 'Someone else’s account is using my email.',
    answer:
      'Do not create a second account. Sign in with the original method; when you add another provider, iSchoolie links it to the same identity. If you cannot access the original method, contact support for verified recovery.',
  },
  {
    question: 'I lost my phone and am still signed in somewhere.',
    answer:
      'Change your password from Account → Security (this invalidates other sessions’ refresh tokens), then contact support if you need the account disabled immediately.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" />
          <Link href="/login" className="text-xs text-subtle underline-offset-2 hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Help and Support</h1>
        <p className="mt-2 text-sm text-subtle">
          Answers to the questions we see most. For anything else, email{' '}
          <a className="font-medium text-brand underline-offset-2 hover:underline" href={`mailto:${PRODUCT.supportEmail}`}>
            {PRODUCT.supportEmail}
          </a>
          .
        </p>

        <div className="mt-8 space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group rounded-xl border border-line bg-surface p-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {faq.question}
                  <span aria-hidden="true" className="text-subtle transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-subtle">{faq.answer}</p>
            </details>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Contact routes</h2>
          <ul className="mt-3 space-y-2 text-sm text-subtle">
            <li><strong className="text-ink">Account and access:</strong> {PRODUCT.supportEmail}</li>
            <li><strong className="text-ink">Educator verification:</strong> include your profile link and teaching experience.</li>
            <li><strong className="text-ink">Institution applications:</strong> the status page shows exactly what the reviewers need.</li>
            <li><strong className="text-ink">Safety concerns:</strong> mark the report in-app and email support with “safeguarding” in the subject line.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className={buttonClass('secondary', 'sm')}>Sign in</Link>
            <Link href="/legal/privacy" className={buttonClass('ghost', 'sm')}>Privacy policy</Link>
            <Link href="/legal/terms" className={buttonClass('ghost', 'sm')}>Terms</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
