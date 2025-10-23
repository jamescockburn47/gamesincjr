import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import GameSubmissionDetail from '@/components/GameSubmissionDetail';

export default async function GameSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const resolvedParams = await params;
  return <GameSubmissionDetail submissionId={resolvedParams.id} />;
}
