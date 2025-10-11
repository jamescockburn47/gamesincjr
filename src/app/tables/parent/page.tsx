export const revalidate = 0;

export default function ParentPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Parent Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Weekly summary and next targets coming soon.</p>
    </div>
  );
}

export { default } from "../../(app)/parent/page";


