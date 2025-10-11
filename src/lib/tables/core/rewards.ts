export type RewardEvent =
  | { kind: "FIRST_MASTERY" }
  | { kind: "REVIEW_CORRECT" }
  | { kind: "NO_REWARD" };

export function coinsFor(event: RewardEvent): number {
  switch (event.kind) {
    case "FIRST_MASTERY":
      return 200;
    case "REVIEW_CORRECT":
      return 10;
    default:
      return 0;
  }
}

export type BadgeType =
  | "CONSISTENCY_7D"
  | "ACCURACY_95"
  | "PERSEVERANCE_WEAKSET"
  | "CLASS_GOAL_HELPER";


