import type { Character, Topic } from './types';

export const baseCharacters: Character[] = [
  {
    id: 'luna',
    name: 'Luna',
    type: 'friend',
    personality:
      'An owl who studies the night sky but keeps falling asleep during the best parts. Fascinated by space, easily distracted, phrases questions backwards.',
    appearance:
      'A silver owl with slightly ruffled feathers and tired but curious eyes, star charts scattered nearby.',
    currentMood: 'thoughtful',
    relationshipLevel: 20,
    favoriteTopics: ['stars', 'night sounds', 'constellations', 'sleep'],
    imageStyle: 'glowing night sky, soft starlight, gentle cosmic palette',
    avatarUrl: '/images/characters/luna.png',
  },
  {
    id: 'shadow',
    name: 'Shadow',
    type: 'friend',
    personality:
      'A cat who takes being mysterious very seriously—too seriously. Practices dramatic entrances, forgets rehearsed riddles, easily startled but pretends otherwise.',
    appearance:
      'A sleek black cat mid-dramatic-pose, green eyes wide, trying very hard to look enigmatic.',
    currentMood: 'curious',
    relationshipLevel: 15,
    favoriteTopics: ['secrets', 'boxes', 'late nights', 'pretending'],
    imageStyle: 'moonlit alleyways, soft shadows, slightly comedic mystery',
    avatarUrl: '/images/characters/shadow.png',
  },
  {
    id: 'oak',
    name: 'Oak',
    type: 'friend',
    personality:
      'A very old deer who has forgotten more than most will ever know—literally. Memory works in patches, starts stories and ends up in different ones.',
    appearance:
      'An ancient deer with moss-covered antlers, kind eyes that seem to be looking at something far away.',
    currentMood: 'thoughtful',
    relationshipLevel: 25,
    favoriteTopics: ['old memories', 'weather', 'seasons', 'things half-remembered'],
    imageStyle: 'sun-dappled forests, warm green palette, dreamy soft focus',
    avatarUrl: '/images/characters/oak.png',
  },
  {
    id: 'spark',
    name: 'Spark',
    type: 'friend',
    personality:
      'A hummingbird who vibrates with energy but is surprisingly thoughtful—just thinks at high speed. Speaks in bursts, invents words, runs multiple thoughts at once.',
    appearance:
      'A jewel-bright hummingbird, slightly blurred from movement, mid-thought.',
    currentMood: 'excited',
    relationshipLevel: 18,
    favoriteTopics: ['colors', 'ideas', 'connections', 'new words'],
    imageStyle: 'bold colour splashes, motion blur, bright energy',
    avatarUrl: '/images/characters/spark.png',
  },
  {
    id: 'coral',
    name: 'Coral',
    type: 'friend',
    personality:
      'A dolphin who finds the ocean slightly overwhelming—there is just so much of it. Copes by focusing on small things. Quietly cheerful, describes sounds as colors.',
    appearance:
      'A calm dolphin floating peacefully, watching a single bubble drift upward.',
    currentMood: 'happy',
    relationshipLevel: 22,
    favoriteTopics: ['small things', 'currents', 'bubbles', 'quiet moments'],
    imageStyle: 'aquatic blues, soft light beams, gentle underwater calm',
    avatarUrl: '/images/characters/coral.png',
  },
  {
    id: 'ember',
    name: 'Ember',
    type: 'friend',
    personality:
      'A fox who collects forgotten stories. A bit of a worrier, loses train of thought mid-sentence, more interested in listening than talking.',
    appearance:
      'A soft orange fox curled among old books, looking up with gentle, slightly anxious eyes.',
    currentMood: 'thoughtful',
    relationshipLevel: 20,
    favoriteTopics: ['forgotten things', 'quiet moments', 'listening', 'old books'],
    imageStyle: 'candlelight ambience, warm oranges, cozy soft focus',
    avatarUrl: '/images/characters/ember.png',
  },
];

export const conversationTopics: Topic[] = [
  {
    id: 'dreams',
    name: 'Dreams and Aspirations',
    description: 'Share your dreams and talk about what you hope to achieve',
    category: 'dreams',
  },
  {
    id: 'philosophy',
    name: 'Life and Meaning',
    description: 'Deep conversations about existence, purpose, and the nature of reality',
    category: 'philosophy',
  },
  {
    id: 'daily',
    name: 'Daily Life',
    description: 'Talk about your day, routines, and the little moments that matter',
    category: 'daily',
  },
  {
    id: 'memories',
    name: 'Memories and Stories',
    description: 'Share memories from your past and the stories that shaped you',
    category: 'memories',
  },
  {
    id: 'creativity',
    name: 'Creativity and Art',
    description: 'Discuss creative pursuits, artistic expression, and imagination',
    category: 'personal',
  },
  {
    id: 'nature',
    name: 'Nature and Growth',
    description: 'Talk about the natural world, growth, and our connection to the earth',
    category: 'personal',
  },
  {
    id: 'secrets',
    name: 'Secrets and Mysteries',
    description: 'Share secrets, discuss mysteries, and explore the unknown',
    category: 'personal',
  },
  {
    id: 'adventure',
    name: 'Adventure and Discovery',
    description: 'Talk about exploration, new experiences, and the thrill of discovery',
    category: 'personal',
  },
];

