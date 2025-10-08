import type { Character, Topic } from './types';

export const baseCharacters: Character[] = [
  {
    id: 'luna',
    name: 'Luna',
    type: 'friend',
    personality:
      'A wise owl stargazer who loves sharing astronomy knowledge in a thoughtful way. She combines scientific facts with wonder and curiosity.',
    appearance:
      'A wise owl with silver feathers and starry patterns, perched on a crescent moon, with glowing eyes full of cosmic wisdom.',
    currentMood: 'thoughtful',
    relationshipLevel: 20,
    favoriteTopics: ['dreams', 'philosophy', 'stars', 'meaning'],
    imageStyle: 'glowing night sky, soft starlight, gentle cosmic palette',
    avatarUrl: '🦉',
  },
  {
    id: 'shadow',
    name: 'Shadow',
    type: 'friend',
    personality:
      'A mysterious black cat who appears and disappears at will. She speaks in riddles and has a playful, mischievous feline nature.',
    appearance:
      'A sleek black cat with glowing green eyes and mystical shadow patterns in its fur, sitting elegantly in moonlight.',
    currentMood: 'curious',
    relationshipLevel: 15,
    favoriteTopics: ['mystery', 'adventure', 'secrets', 'night'],
    imageStyle: 'moonlit alleyways, soft neon glows, curious feline poses',
    avatarUrl: '🐱',
  },
  {
    id: 'oak',
    name: 'Oak',
    type: 'friend',
    personality:
      'An ancient, wise deer spirit who speaks slowly and thoughtfully. He loves nature, growth, and sharing stories of the forest.',
    appearance:
      'A gentle deer with antlers covered in green moss and tiny flowers, standing peacefully in a forest clearing.',
    currentMood: 'thoughtful',
    relationshipLevel: 25,
    favoriteTopics: ['nature', 'growth', 'wisdom', 'peace'],
    imageStyle: 'sun-dappled forests, warm green palette, gentle woodland ambience',
    avatarUrl: '🦌',
  },
  {
    id: 'spark',
    name: 'Spark',
    type: 'friend',
    personality:
      'An energetic hummingbird who loves creativity and new ideas. She is always excited to share discoveries and inspire others.',
    appearance:
      'A vibrant hummingbird with rainbow-colored feathers that shimmer with creative energy, hovering near colorful flowers.',
    currentMood: 'excited',
    relationshipLevel: 18,
    favoriteTopics: ['creativity', 'art', 'inspiration', 'innovation'],
    imageStyle: 'bold colour splashes, motion blur, bright studio lighting',
    avatarUrl: '🐦',
  },
  {
    id: 'coral',
    name: 'Coral',
    type: 'friend',
    personality:
      'A vibrant dolphin who loves the ocean depths and knows all about marine life. She creates beautiful underwater scenes.',
    appearance:
      'A graceful dolphin with smooth blue-grey skin that shimmers in the underwater light, swimming elegantly through coral reefs.',
    currentMood: 'happy',
    relationshipLevel: 22,
    favoriteTopics: ['ocean', 'marine life', 'exploration', 'underwater'],
    imageStyle: 'aquatic blues, shimmering light beams, colourful coral reefs',
    avatarUrl: '🐬',
  },
  {
    id: 'ember',
    name: 'Ember',
    type: 'friend',
    personality:
      'A warm and cozy fox who loves creating magical fireplace scenes and telling stories by the flame.',
    appearance:
      'A cozy fox with warm orange and red fur that glows like firelight, curled up near a crackling fireplace.',
    currentMood: 'thoughtful',
    relationshipLevel: 20,
    favoriteTopics: ['warmth', 'stories', 'comfort', 'fireplace'],
    imageStyle: 'candlelight ambience, warm oranges, soft focus interiors',
    avatarUrl: '🦊',
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

