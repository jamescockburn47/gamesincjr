/**
 * Structured copy for the public home page.
 * Centralising strings here keeps messaging easy to edit without touching JSX.
 */
export interface HeroStat {
  value: string;
  label: string;
  accent: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
}

export interface CollapsibleSection {
  icon: string;
  title: string;
  summary: string;
  details: string[];
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  featuredWorld: {
    label: string;
    title: string;
    description: string;
    liveMissionTitle: string;
    liveMissionDescription: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

export interface CallToActionContent {
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  reasonsTitle: string;
  reasons: { icon: string; text: string }[];
  tip: string;
}

export interface HomeContent {
  heroStats: HeroStat[];
  featureCards: FeatureCard[];
  collapsibleSections: CollapsibleSection[];
  hero: HeroContent;
  callToAction: CallToActionContent;
}

export const homeContent: HomeContent = {
  heroStats: [
    {
      value: '25+',
      label: 'Playable prototypes across arcade, puzzle and story genres',
      accent: 'text-sky-500',
    },
    {
      value: '40',
      label: 'Kid designers teaching our AI storytellers each season',
      accent: 'text-rose-500',
    },
    {
      value: '0 ads',
      label: 'Safe browser-based play sessions with guardian controls',
      accent: 'text-amber-500',
    },
  ],
  featureCards: [
    {
      icon: '🎮',
      title: 'Fresh games every sprint',
      description:
        'Studios of young inventors prototype new adventures with support from our mentor team.',
      bullets: [
        'Weekly arcade drops come straight from community voting boards.',
        'Story quests remix kid-written scripts, art jams and sound packs.',
      ],
    },
    {
      icon: '🤖',
      title: 'Kid-taught AI guides',
      description:
        'Each world features companions trained on workshop transcripts so they speak like the kids who imagined them.',
      bullets: [
        'AI helpers explain mechanics, celebrate wins and learn from player feedback.',
        'Guardrails keep guidance empathetic, on-topic and age-aware.',
      ],
    },
    {
      icon: '🧪',
      title: 'Test, reflect, evolve',
      description:
        'Playtests conclude with quick reflection loops, turning every session into design input for the next build.',
      bullets: [
        'Dashboards capture favourite mechanics, tricky moments and dream features.',
        'Developers and young creators iterate together in live lab streams.',
      ],
    },
  ],
  collapsibleSections: [
    {
      icon: '🌍',
      title: 'Game collections',
      summary: 'Arcade bursts, logic labs and story journeys for every mood.',
      details: [
        'Arcade worlds like Hoverboard Heroes focus on reflexes with short, replayable levels.',
        'Logic labs such as Circuit Safari build puzzle literacy through collaborative problem solving.',
        'Story journeys like Alien Unicorn Alliance weave kid-written dialogue with branching choices.',
      ],
    },
    {
      icon: '🧒',
      title: 'Designed by kids for kids',
      summary: 'Workshops power the roadmap and train our AI companions.',
      details: [
        'Young creators storyboard characters, sketch interfaces and record the voices that shape each guide.',
        'Feedback from club sessions tunes difficulty, pacing and accessibility.',
        'Educator mentors help translate big ideas into safe, inclusive systems.',
      ],
    },
    {
      icon: '🔐',
      title: 'Trusted play environment',
      summary: 'Family dashboards keep the experience transparent and secure.',
      details: [
        'Moderators review every community asset before it appears in-game.',
        'Guardian controls schedule sessions, set playtime nudges and approve collaborations.',
        'All gameplay stays in-browser with zero ads, loot boxes or in-app purchases.',
      ],
    },
  ],
  hero: {
    eyebrow: 'Co-created with young designers and educators',
    title: 'Play inventive games guided by kid-trained AI companions',
    description:
      'Games inc. Jr pairs original arcade, puzzle and story adventures with copilots that learn from the children who build them. Discover a library of bright worlds, each tuned by real playtest feedback.',
    primaryCta: {
      label: '🎯 Browse all games',
      href: '/games',
    },
    secondaryCta: {
      label: '🦄 Enter Alien Unicorn Alliance',
      href: '/games/alien-unicorn-alliance',
    },
    featuredWorld: {
      label: 'Featured world',
      title: 'Alien Unicorn Alliance',
      description:
        'Glide through aurora meadows, rescue starlit foals and outsmart raider drones with a dazzling harmony pulse.',
      liveMissionTitle: 'Live mission: Harmony Surge',
      liveMissionDescription:
        'Convert three raider squads with a single pulse to unlock the Prism Mane skin.',
      ctaLabel: 'Launch the rescue flight',
      ctaHref: '/games/alien-unicorn-alliance',
    },
  },
  callToAction: {
    title: 'Ready to explore or build the next chapter?',
    description:
      'Jump into a welcoming universe of games made by kids, for kids. Play solo, squad up for co-op missions or join a design sprint to teach our AI new tricks.',
    primaryCta: {
      label: '🌟 Meet the community',
      href: '/community',
    },
    secondaryCta: {
      label: '📚 Explore tutorials',
      href: '/tutorials',
    },
    reasonsTitle: 'Why players keep coming back',
    reasons: [
      {
        icon: '💬',
        text: 'AI copilots cheer progress and offer hints captured from real workshop mentors.',
      },
      {
        icon: '🧩',
        text: 'Levels stay bite-sized so every visit ends with a win and new insight.',
      },
      {
        icon: '🎁',
        text: 'Earnable badges unlock studio tools, colour themes and remix kits.',
      },
    ],
    tip: 'Pro tip: Set weekend design challenges from the parent dashboard to help the AI learn alongside your child.',
  },
};
