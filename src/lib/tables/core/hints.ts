function keyFor(a: number, b: number): string {
  const [x, y] = [a, b].sort((m, n) => m - n);
  return `${x}x${y}`;
}

const MNEMONICS: Record<string, string> = {
  '3x4': '3×4? Think of 12 like “quarter past” on a clock—three groups of four quarters.',
  '4x4': '4×4 is 16: picture four rows of four tiles making a neat square.',
  '4x6': '4×6? Double 4×3=12 to get 24—halve and double to keep it friendly.',
  '5x6': '5×6: half of 6×10=60, so divide by two → 30.',
  '6x6': '6×6=36—remember six packs of six eggs make 36.',
  '6x7': 'Six sevens forty-two—say it out loud!',
  '6x8': 'Six times eight is forty-eight—classic chant.',
  '7x7': '7×7=49—“seven-square, four-nine flair.”',
  '7x8': 'Think 7×8=56: five-six. A handy rhyme!',
  '7x9': '7×9=63—drop one from 7 to get 6, digits 6+3 still equal 9.',
  '8x8': 'Eight times eight is 64—“eight ate six-ty four.”',
  '8x9': '8×9=72—digits add to 9; swap to 7 and 2.',
  '9x9': '9×9=81—the tens drop to 8, the ones climb to 1; digits add to 9.',
  '11x11': '11×11=121—the middle digit is 1+1.',
};

function sameDigitHint(n: number): string | null {
  if (n === 0) return 'Zero times zero is still zero—no groups at all.';
  if (n === 1) return 'One times one stays one—identity keeps it simple.';
  if (n === 2) return '2×2=4—two pairs make four.';
  if (n === 3) return '3×3=9—think of a Tic-Tac-Toe grid: 3 rows of 3.';
  if (n === 4) return MNEMONICS['4x4'];
  if (n === 5) return '5×5=25—five nickels make a quarter.';
  if (n === 6) return MNEMONICS['6x6'];
  if (n === 7) return MNEMONICS['7x7'];
  if (n === 8) return MNEMONICS['8x8'];
  if (n === 9) return MNEMONICS['9x9'];
  if (n === 10) return '10×10=100—add two zeros.';
  if (n === 11) return MNEMONICS['11x11'];
  if (n === 12) return '12×12=144—the famous dozen square.';
  return null;
}

function evenHint(x: number, y: number): string {
  const half = x / 2;
  const doubled = y * 2;
  return `Both even: halve one (${x}/2=${half}) and double the other (${y}×2=${doubled}). Still ${x * y}.`;
}

function nineHint(other: number): string {
  const tens = other - 1;
  const ones = 9 - tens;
  const product = 9 * other;
  return `For 9×${other}, drop one (${other - 1}) for the tens and choose ones so they add to 9 → ${product} (${tens}${ones}).`;
}

export function deterministicHint(a: number, b: number): string {
  const [x, y] = [a, b];

  if (x === 0 || y === 0) return 'Anything times zero is zero—there are no groups to count.';
  if (x === 1 || y === 1) return 'Anything times one stays the same number.';
  if (x === 10 || y === 10) return 'Multiplying by ten? Attach a zero to the other number.';

  if (x === y) {
    const same = sameDigitHint(x);
    if (same) return same;
  }

  if (x === 9) return nineHint(y);
  if (y === 9) return nineHint(x);

  const key = keyFor(x, y);
  if (MNEMONICS[key]) return MNEMONICS[key];

  if (x % 2 === 0 && y % 2 === 0) return evenHint(x, y);

  if (x % 5 === 0 || y % 5 === 0) {
    const multiplier = x % 5 === 0 ? x : y;
    const other = multiplier === x ? y : x;
    const result = x * y;
    return `${multiplier}×${other}: use tens. ${other}×10=${other * 10}, then halve because it’s ×5 → ${result}.`;
  }

  const doubled = x * 2;
  const halved = Math.round(y / 2);
  if (y % 2 === 0) {
    return `Split and double: ${x}×${y} = ${x}×( ${y / 2}×2 ) → ${x}×${y / 2} doubled.`;
  }

  return 'Split it into friendlier pieces: try (a×10) − (a×(10−b)) or double one number and halve the other.';
}
