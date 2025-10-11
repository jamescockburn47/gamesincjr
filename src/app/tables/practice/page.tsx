import { createSessionWithTargets } from "@/lib/tables/service";
import { PracticeClient } from "./PracticeClient";

export const runtime = "nodejs";

export default async function PracticePage() {
  const { session, userId, targets } = await createSessionWithTargets({
    mode: "PRACTICE",
    batchSize: 10,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="flex flex-col gap-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Practice mode</p>
        <h1 className="text-3xl font-semibold">Warm up your multiplication muscles</h1>
        <p className="text-sm text-muted-foreground">
          Answer each fact at your own pace. Hints stay privacy-first and offline safe.
        </p>
      </header>
      <div className="mt-8">
        <PracticeClient sessionId={session.id} userId={userId} initialTargets={targets} />
      </div>
    </div>
  );
}
