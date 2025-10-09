export type ActivityHighlight = {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
  progress: number;
};

export const activityHighlights: ActivityHighlight[] = [
  {
    id: 'spark-lab',
    title: 'Spark Lab prototype testing',
    description: 'Kids co-designed 3 new puzzle levels for the Spark hummingbird.',
    tag: 'Community playtest',
    icon: '🧪',
    progress: 0.7,
  },
  {
    id: 'luna-skywatch',
    title: 'Luna skywatch live stream',
    description: 'Over 420 stargazers tuned in to learn about the meteor shower tonight.',
    tag: 'Live event',
    icon: '🌌',
    progress: 0.54,
  },
  {
    id: 'parent-note',
    title: 'Parent setup checklist',
    description: '3 of 5 safety and screen time steps configured—finish to unlock bedtime mode.',
    tag: 'Parent tip',
    icon: '🛡️',
    progress: 0.6,
  },
];
