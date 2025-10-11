function addDays(date: Date, days: number): Date {
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(date.getTime() + ms);
}

export type UserFact = {
  id: string;
  userId: string;
  factId: string;
  masteryLevel: number;
  streak: number;
  easiness: number;
  intervalDays: number;
  dueAt: Date;
  lastLatencyMs?: number;
  lastAccuracy?: number;
};

export function onAttemptUpdateUF(uf: UserFact, correct: boolean): UserFact {
  if (correct) {
    uf.streak += 1;
    uf.easiness = Math.max(1.3, uf.easiness + 0.1);
    uf.masteryLevel = Math.min(5, uf.masteryLevel + 1);
    const base = uf.streak === 1 ? 1 : uf.streak === 2 ? 3 : Math.pow(2, uf.streak);
    uf.intervalDays = Math.min(30, base * uf.easiness);
  } else {
    uf.streak = 0;
    uf.easiness = Math.max(1.3, uf.easiness - 0.2);
    uf.masteryLevel = Math.max(0, uf.masteryLevel - 1);
    uf.intervalDays = 0.04; // ~1 hour
  }
  uf.dueAt = addDays(new Date(), uf.intervalDays);
  return uf;
}

// Reserved for future use
// type Fact = { id: string; a: number; b: number; op: "*" | "÷" };

function byWeakness(a: UserFact, b: UserFact): number {
  // Lower mastery first; earlier dueAt first
  if (a.masteryLevel !== b.masteryLevel) return a.masteryLevel - b.masteryLevel;
  return a.dueAt.getTime() - b.dueAt.getTime();
}

function respectsMinSpacing(): boolean {
  // Placeholder: allow all in this MVP; spacing handled by dueAt
  return true;
}

export function selectNextBatch(dueFacts: UserFact[], backlogFacts: UserFact[], k = 10): UserFact[] {
  const due = [...dueFacts].sort(byWeakness).slice(0, k);
  if (due.length >= k) return due;
  const fill = backlogFacts.filter(respectsMinSpacing).sort(byWeakness).slice(0, k - due.length);
  return [...due, ...fill];
}


