import { redirect } from 'next/navigation';

export default function PersonalDashboardRedirect() {
  redirect('/feed');
}
