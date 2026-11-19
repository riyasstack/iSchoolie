import type { Metadata } from 'next';
import { TERMS_VERSION } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'The terms that govern use of iSchoolie for students, educators, guardians and institutions.',
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms and Conditions</h1>
      <p className="text-2xs uppercase tracking-wider text-subtle">Version {TERMS_VERSION}</p>

      <p>
        These terms are a working template for the iSchoolie platform. They describe how accounts,
        roles and institution access work. Before a public launch they must be reviewed by a lawyer
        qualified in the jurisdictions iSchoolie operates in — this file is not legal advice.
      </p>

      <h2>1. One account per person</h2>
      <p>
        iSchoolie issues one account per person, identified by a single Firebase Authentication UID.
        You may hold several roles (student, educator, guardian, institution administrator) under
        that one account. You must not create additional accounts to circumvent a suspension, a role
        revocation or an access decision.
      </p>

      <h2>2. Eligibility and age</h2>
      <ul>
        <li>Independent student accounts are available from Class 8 and age 13.</li>
        <li>
          Learners under 18 get private-by-default profiles and restricted discoverability, and
          cannot use direct messaging until a guardian relationship is verified.
        </li>
        <li>
          Learners below the eligibility threshold cannot create independent public-network
          accounts. A guardian account or a school-managed profile is the supported route.
        </li>
      </ul>

      <h2>3. Roles are not permissions</h2>
      <p>
        Choosing a role during onboarding creates a personal workspace. It does not grant privileged
        permissions. Verified educator status, institution administration and platform administration
        are granted only by the iSchoolie team through a privileged, audited process.
      </p>

      <h2>4. Institutions</h2>
      <p>
        Institutions must apply and be verified. Approval creates the institution record, assigns its
        owner and is recorded in an append-only audit trail. Applicants cannot approve themselves, and
        an institution account cannot access institution tools, student records or staff management
        before approval.
      </p>

      <h2>5. Guardians</h2>
      <p>
        Guardian access requires the student&apos;s confirmation and iSchoolie verification. Guardians
        must never use a child&apos;s password. Access is limited to the data categories granted, and
        may be revoked by either party at any time.
      </p>

      <h2>6. Academic records</h2>
      <p>
        Teachers and authorised institution staff control official grades and attendance. Students
        cannot edit their own official results. Institution records may be retained after an account is
        deleted where required for legitimate educational record-keeping.
      </p>

      <h2>7. Acceptable use</h2>
      <ul>
        <li>No harassment, impersonation, spam or sharing of another person&apos;s private data.</li>
        <li>No attempts to bypass authorisation, probe other institutions or scrape the network.</li>
        <li>Reports are reviewed by the iSchoolie team; safeguarding matters are escalated.</li>
      </ul>

      <h2>8. Availability on the free plan</h2>
      <p>
        iSchoolie initially runs on Firebase&apos;s no-cost Spark plan, which has daily Firestore
        quotas. During extreme peaks the service may temporarily degrade rather than incur charges.
        Examinations that cannot tolerate interruption should not rely on any single cloud service,
        including this one.
      </p>

      <h2>9. Changes</h2>
      <p>
        Material changes to these terms are presented for acceptance, and the accepted version is
        recorded with a timestamp. Continued use after acceptance constitutes agreement.
      </p>
    </>
  );
}
