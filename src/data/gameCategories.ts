export const gameCategories = {
  arcade: {
    label: "Arcade",
    icon: "Joystick",
    emoji: "🕹️",
    color: "bg-orange-100 text-orange-700",
    borderColor: "border-orange-200",
    description: "Fast-paced action games",
  },
  puzzle: {
    label: "Puzzle",
    icon: "Puzzle",
    emoji: "🧩",
    color: "bg-blue-100 text-blue-700",
    borderColor: "border-blue-200",
    description: "Brain teasers and logic games",
  },
  adventure: {
    label: "Adventure",
    icon: "Map",
    emoji: "🗺️",
    color: "bg-green-100 text-green-700",
    borderColor: "border-green-200",
    description: "Explore new worlds",
  },
  action: {
    label: "Action",
    icon: "Zap",
    emoji: "⚡",
    color: "bg-red-100 text-red-700",
    borderColor: "border-red-200",
    description: "High-energy excitement",
  },
  racing: {
    label: "Racing",
    icon: "Car",
    emoji: "🏎️",
    color: "bg-yellow-100 text-yellow-700",
    borderColor: "border-yellow-200",
    description: "Speed and competition",
  },
  strategy: {
    label: "Strategy",
    icon: "Brain",
    emoji: "🧠",
    color: "bg-purple-100 text-purple-700",
    borderColor: "border-purple-200",
    description: "Think and plan to win",
  },
  flight: {
    label: "Flight",
    icon: "Plane",
    emoji: "✈️",
    color: "bg-sky-100 text-sky-700",
    borderColor: "border-sky-200",
    description: "Take to the skies",
  },
  space: {
    label: "Space",
    icon: "Rocket",
    emoji: "🚀",
    color: "bg-indigo-100 text-indigo-700",
    borderColor: "border-indigo-200",
    description: "Explore the cosmos",
  },
} as const;

export type GameCategory = keyof typeof gameCategories;

export const navCategories = [
  {
    label: "Play",
    icon: "Gamepad2",
    items: [
      { href: "/games", label: "All Games", icon: "Grid3x3", emoji: "🎮" },
      { href: "/games?filter=new", label: "New Games", icon: "Sparkles", emoji: "✨" },
      { href: "/games?filter=popular", label: "Popular", icon: "Flame", emoji: "🔥" },
    ],
  },
  {
    label: "Create",
    icon: "Wrench",
    items: [
      { href: "/make-your-game", label: "Make a Game", icon: "Hammer", emoji: "🛠️" },
      { href: "/imaginary-friends", label: "Magic Friends", icon: "Bot", emoji: "🤖" },
    ],
  },
  {
    label: "Learn",
    icon: "GraduationCap",
    items: [
      { href: "/tutorials", label: "Tutorials", icon: "BookOpen", emoji: "📚" },
      { href: "/community", label: "Community", icon: "Users", emoji: "👥" },
    ],
  },
] as const;

export type NavCategory = (typeof navCategories)[number];
