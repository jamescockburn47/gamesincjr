import GameSubmissionDetail from '@/components/GameSubmissionDetail';

export default async function GameSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // TODO: Re-enable auth after testing
  // const isAuthenticated = await isAdminAuthenticated();
  // if (!isAuthenticated) {
  //   redirect('/admin/login');
  // }

  const resolvedParams = await params;
  return <GameSubmissionDetail submissionId={resolvedParams.id} />;
}
