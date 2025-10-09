export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  importance: 'info' | 'success' | 'reminder';
};

export const notifications: NotificationItem[] = [
  {
    id: 'mission-aurora',
    title: 'New story mission',
    message: 'Luna opened a telescope quest about the Perseid meteor shower.',
    timeAgo: '2m ago',
    importance: 'info',
  },
  {
    id: 'streak',
    title: 'Streak unlocked',
    message: 'Day 5 streak! Earn double stardust for creativity prompts today.',
    timeAgo: '1h ago',
    importance: 'success',
  },
  {
    id: 'parent-checkin',
    title: 'Parent dashboard tip',
    message: 'Review screen-time goals and toggle calming breaks for bedtime.',
    timeAgo: '3h ago',
    importance: 'reminder',
  },
];
