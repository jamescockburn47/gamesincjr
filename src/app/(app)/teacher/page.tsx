export const revalidate = 0;

export default function TeacherPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Teacher Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Class heatmap and suggestions coming soon.</p>
      <a className="mt-4 inline-block rounded border px-3 py-2" href="/api/tables/scheduler/next">Preview next batch API</a>
    </div>
  );
}


