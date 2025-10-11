type Theme = 'space' | 'animals' | 'pirates' | 'sports';

const THEMES: Theme[] = ['animals', 'space', 'pirates', 'sports'];
const NAMES = ['Ava', 'Liam', 'Mia', 'Noah', 'Zoe', 'Leo', 'Ivy', 'Owen'];
const OBJECTS: Record<Theme, string[]> = {
  animals: ['birds', 'butterflies', 'puppies', 'kittens'],
  space: ['star stickers', 'comets', 'planets', 'satellites'],
  pirates: ['coins', 'treasures', 'shells', 'maps'],
  sports: ['balls', 'cones', 'ribbons', 'jerseys'],
};

function hashSeed(a: number, b: number, theme?: string): number {
  let seed = 2166136261;
  const input = `${a}-${b}-${theme ?? ''}`;
  for (let i = 0; i < input.length; i += 1) {
    seed ^= input.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
    seed >>>= 0;
  }
  return seed;
}

function pick<T>(items: readonly T[], seed: number, offset = 0): T {
  const index = Math.abs(seed + offset) % items.length;
  return items[index];
}

function coerceTheme(theme?: string, seed = 0): Theme {
  if (!theme) return THEMES[seed % THEMES.length];
  const normalised = theme.toLowerCase();
  const match = THEMES.find((t) => t === normalised);
  return match ?? THEMES[seed % THEMES.length];
}

export function generateDeterministicProblem(
  a: number,
  b: number,
  theme?: string,
): { problem: string; operands: [number, number]; op: '*' } {
  const baseSeed = hashSeed(a, b, theme);
  const tpl = coerceTheme(theme, baseSeed);
  const name = pick(NAMES, baseSeed, 7);
  const object = pick(OBJECTS[tpl], baseSeed, 13);

  const templates: Record<Theme, (x: number, y: number, n: string, obj: string) => string> = {
    animals: (x, y, n, obj) => `${n} spots ${x} rows of ${y} ${obj}. How many are there altogether?`,
    space: (x, y, n, obj) => `${n} stacks ${x} trays with ${y} ${obj} each. How many ${obj} in total?`,
    pirates: (x, y, n, obj) => `${n} fills ${x} treasure bags with ${y} ${obj}. How many ${obj}?`,
    sports: (x, y, n, obj) => `${n} sets up ${x} rows of ${y} ${obj}. What is the total?`,
  };

  const text = templates[tpl](a, b, name, object);
  return {
    problem: text.slice(0, 160),
    operands: [a, b],
    op: '*',
  };
}
