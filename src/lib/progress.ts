import type { Tier } from './user-session';

export type ProgressSnapshot = {
  level: number;
  streak: number;
  dailyGoalPercent: number;
  stars: number;
  nextReward: string;
  badges: Array<{
    name: string;
    description: string;
    earned: boolean;
  }>;
  focusActivities: Array<{
    label: string;
    completed: boolean;
  }>;
};

const tierScaling: Record<Tier, { level: number; streak: number; stars: number; progress: number }> = {
  free: { level: 2, streak: 1, stars: 120, progress: 0.35 },
  starter: { level: 4, streak: 3, stars: 260, progress: 0.48 },
  explorer: { level: 6, streak: 5, stars: 420, progress: 0.62 },
  champion: { level: 9, streak: 8, stars: 780, progress: 0.82 },
  premium_ai: { level: 11, streak: 12, stars: 980, progress: 0.9 },
};

const baseBadges = [
  {
    name: 'Curiosity Spark',
    description: 'Ask 3 “how” questions in a single session.',
  },
  {
    name: 'Creative Burst',
    description: 'Generate a story or drawing prompt.',
  },
  {
    name: 'Kindness Echo',
    description: 'Share a compliment with a character.',
  },
];

const baseActivities = [
  { label: 'Play a co-op adventure for 10 minutes', key: 'co-op' },
  { label: 'Imagine a new world with an AI friend', key: 'ai' },
  { label: 'Complete a calming breathing break', key: 'calm' },
];

export async function getUserProgressSnapshot(tier: Tier): Promise<ProgressSnapshot> {
  const scaling = tierScaling[tier] ?? tierScaling.free;

  const badges = baseBadges.map((badge, index) => ({
    ...badge,
    earned: index < Math.round(scaling.level / 4),
  }));

  const focusActivities = baseActivities.map((activity, index) => ({
    label: activity.label,
    completed: scaling.progress > 0.5 ? index < 2 : index === 0,
  }));

  return {
    level: scaling.level,
    streak: scaling.streak,
    stars: scaling.stars,
    dailyGoalPercent: Math.min(1, Math.max(0.1, scaling.progress)),
    nextReward: scaling.level >= 8 ? 'Unlock: Aurora Sound Packs' : 'Unlock: Story Mode Stickers',
    badges,
    focusActivities,
  };
}
