export const revalidate = 0;

function Cell({ mastered }: { mastered: boolean }) {
  return <div className={"h-7 w-7 rounded " + (mastered ? "bg-green-500" : "bg-red-400")}></div>;
}

export default async function DashboardPage() {
  const grid = Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => Math.random() > 0.6));
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Mastery Heatmap</h1>
      <div className="mt-4 grid grid-cols-12 gap-1">
        {grid.flatMap((row, i) => row.map((m, j) => <Cell key={`${i}-${j}`} mastered={m} />))}
      </div>
    </div>
  );
}


