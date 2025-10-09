export type Adventure = {
  id: string;
  title: string;
  description: string;
  status: 'Live' | 'New' | 'Wrapping Up';
  progress: number;
};

export const adventures: Adventure[] = [
  {
    id: 'spark-lab',
    title: 'Spark Lab Prototype Run',
    description: 'Invent wild gadgets with Spark’s hummingbird crew.',
    status: 'Live',
    progress: 0.72,
  },
  {
    id: 'luna-watch',
    title: 'Luna’s Meteor Watch',
    description: 'Collect shooting-star data for Luna’s sky map.',
    status: 'Live',
    progress: 0.58,
  },
  {
    id: 'shadow-heist',
    title: 'Shadow’s Cookie Heist',
    description: 'Sneak ingredients past giggling night guards.',
    status: 'New',
    progress: 0.41,
  },
  {
    id: 'coral-reef',
    title: 'Coral Reef Rescue',
    description: 'Guide friendly dolphins through musical whirlpools.',
    status: 'Wrapping Up',
    progress: 0.88,
  },
  {
    id: 'ember-story',
    title: 'Ember’s Storyfire Jam',
    description: 'Collect cosy tales to fuel Ember’s hearth.',
    status: 'New',
    progress: 0.33,
  },
];
