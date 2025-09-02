import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getGames } from '@/lib/games';
import AdminDashboard from '@/components/AdminDashboard';

export default async function AdminDashboardPage() {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const games = getGames();

  return <AdminDashboard games={games} />;
}
