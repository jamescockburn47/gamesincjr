export function sessionScore(accuracy: number, uniqueMastered: number, base = 100): number {
  const safeAccuracy = Math.max(0, Math.min(1, accuracy || 0));
  const mastered = Math.max(1, uniqueMastered || 0);
  return Math.round(base * Math.pow(safeAccuracy, 2) * Math.sqrt(mastered));
}


