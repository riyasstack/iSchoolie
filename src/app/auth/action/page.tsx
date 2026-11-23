import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Firebase email-action links used to land here. AuthKit handles verification
 * and password recovery on its own pages, so old links simply restart sign-in.
 */
export default function AuthActionPage() {
  redirect('/sign-in');
}
