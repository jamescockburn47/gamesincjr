import GameSubmissionsList from '@/components/GameSubmissionsList';

export default async function GameSubmissionsPage() {
  // TODO: Re-enable auth after testing
  // const isAuthenticated = await isAdminAuthenticated();
  // if (!isAuthenticated) {
  //   redirect('/admin/login');
  // }

  return <GameSubmissionsList />;
}
