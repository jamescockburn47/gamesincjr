type Theme = "space" | "animals" | "pirates" | "sports";

const NAMES = ["Ava", "Liam", "Mia", "Noah", "Zoe", "Leo"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length) % arr.length];
}

function coerceTheme(theme?: string): Theme | undefined {
  if (!theme) return undefined;
  const allowed: Theme[] = ["space", "animals", "pirates", "sports"];
  return (allowed as readonly string[]).includes(theme) ? (theme as Theme) : undefined;
}

export function generateDeterministicProblem(a: number, b: number, theme?: string): { problem: string; operands: [number, number]; op: "*" } {
  const t: Theme = coerceTheme(theme) || "animals";
  const name = pick(NAMES);
  const templates: Record<Theme, (a: number, b: number, name: string) => string> = {
    animals: (x, y, n) => `${n} sees ${x} rows of ${y} birds. How many birds in total?`,
    space: (x, y, n) => `${n} stacks ${x} trays with ${y} star stickers each. How many stickers?`,
    pirates: (x, y, n) => `${n} packs ${x} chests with ${y} coins each. How many coins?`,
    sports: (x, y, n) => `${n} arranges ${x} rows of ${y} balls. How many balls?`,
  };
  const text = templates[t](a, b, name);
  return { problem: text.slice(0, 160), operands: [a, b], op: "*" };
}


