function keyFor(a: number, b: number): string {
  const [x, y] = [a, b].sort((m, n) => m - n);
  return `${x}x${y}`;
}

const MNEMONICS: Record<string, string> = {
  "7x8": "Think 7×8=56: five-six. A handy rhyme!",
  // 9xN rule communicated when one operand is 9
};

export function deterministicHint(a: number, b: number): string {
  if (a === 9 || b === 9) {
    return "For 9×N, the digits sum to 9 (e.g., 9×7=63 → 6+3=9).";
  }
  const k = keyFor(a, b);
  return MNEMONICS[k] || "Break it down: (a×10) − (a×(10−b)).";
}


