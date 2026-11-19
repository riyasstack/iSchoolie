import type { Metadata } from 'next';
import { PRIVACY_VERSION } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What iSchoolie stores, who can read it, and how student data is protected.',
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-2xs uppercase tracking-wider text-subtle">Version {PRIVACY_VERSION}</p>

      <p>
        This policy explains the data iSchoolie collects, where it is stored and who can read it. It is
        a working template and must be reviewed by a qualified lawyer before public launch.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Identity:</strong> name, email, authentication provider identifiers.</li>
        <li><strong>Role data:</strong> the roles you activate and the profile each role needs (class, interests, subjects taught, institution).</li>
        <li><strong>Academic records:</strong> assignments, submissions, grades and attendance, created by you or your institution.</li>
        <li><strong>Safety data:</strong> guardian relationships, consent records and moderation reports.</li>
        <li><strong>Technical data:</strong> authentication events; no third-party advertising trackers are used.</li>
      </ul>

      <h2>2. Where it is stored</h2>
      <p>
        Data is stored in Google Cloud Firestore and Firebase Authentication for the iSchoolie project.
        The browser talks to Firebase directly, and every read and write is authorised by Firestore
        Security Rules on Google&apos;s servers.
      </p>

      <h2>3. Public and private data</h2>
      <ul>
        <li>
          <strong>Public-safe profile:</strong> display name, handle, headline, country and role badges.
          Profiles of learners under 18 are private by default.
        </li>
        <li>
          <strong>Never public:</strong> email, date of birth, school, grade, guardian email and any
          private academic detail. These live in a separate document readable only by you and the
          platform team.
        </li>
        <li>
          <strong>Institution records:</strong> visible to teaching staff of the relevant class and
          administrators of that institution — never to another institution.
        </li>
      </ul>

      <h2>4. Children and safeguarding</h2>
      <p>
        Accounts for learners under 18 use restricted discoverability and no adult–minor direct
        messaging until a guardian relationship is verified. Guardian access requires the
        student&apos;s confirmation and iSchoolie verification, and either party can revoke it.
      </p>

      <h2>5. Legal bases and consent</h2>
      <p>
        Account creation, role onboarding and institution applications record the version of these
        documents you accepted and when. Guardian consent for a minor is acknowledged during
        onboarding.
      </p>

      <h2>6. Retention and deletion</h2>
      <p>
        Deleting your account removes your sign-in immediately and marks your profile for purge.
        Institution-held academic records and audit entries may be retained where required for
        legitimate educational record-keeping, and are removed on verified request.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You can access and correct your profile, change your email and password, review linked
        providers, revoke guardian relationships and request deletion — all from Account settings.
        For an export or a specific request, contact support.
      </p>

      <h2>8. Security</h2>
      <p>
        Access is enforced by database rules rather than by interface state. Privileged actions
        (institution approval, role grants, verification) require a service account held by the
        iSchoolie team and are recorded in an append-only audit log. No service-account key is ever
        shipped to a browser.
      </p>
    </>
  );
}
