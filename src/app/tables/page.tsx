export const revalidate = 0;

export default function TablesHome() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Times Tables Super Stars ✨</h1>
      <p className="mt-2 text-sm text-muted-foreground">Master 1×1–12×12 with points, badges and boss battles. No downloads.</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <a className="rounded-md border p-4 hover:bg-accent" href="/tables/practice">Practice</a>
        <a className="rounded-md border p-4 hover:bg-accent" href="/tables/challenge">Challenge</a>
        <a className="rounded-md border p-4 hover:bg-accent" href="/tables/boss">Boss Battle</a>
      </div>
    </div>
  );
}

 


