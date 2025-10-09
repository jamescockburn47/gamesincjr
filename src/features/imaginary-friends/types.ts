export type Mood = 'happy' | 'sad' | 'excited' | 'thoughtful' | 'curious';

export type FriendSentiment = 'joyful' | 'curious' | 'thoughtful' | 'resilient' | 'encouraging';

export interface Character {
  id: string;
  name: string;
  type: 'friend' | 'animal';
  personality: string;
  appearance: string;
  currentMood: Mood;
  relationshipLevel: number;
  favoriteTopics: string[];
  imageStyle?: string;
  avatarUrl?: string;
}

export interface ConversationMessage {
  id: string;
  speaker: 'player' | 'character';
  text: string;
  timestamp: Date;
  emotion?: string;
  imageUrl?: string | null;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'philosophy' | 'daily' | 'dreams' | 'memories';
  unlockCondition?: string;
}

export interface SessionInfo {
  remainingTime: number;
  imagesRemaining: number;
  dailyUsageSeconds: number;
  imageAllowanceRemaining?: number;
  messageAllowanceRemaining?: number;
  budgetCentsRemaining?: number;
}

export interface GameStatus {
  friendshipLevel: number;
  experience: number;
  nextLevelThreshold: number;
  stardustEarned: number;
  badgesUnlocked: string[];
  sentiment: FriendSentiment;
  keywords: string[];
  suggestedActivity: string;
  summary: string;
  creativityScore: number;
}


export interface ChatResponse {
  response: string;
  imageUrl?: string | null;
  sessionInfo?: SessionInfo;
  timeLimitReached?: boolean;
  imageLimitReached?: boolean;
  gameStatus?: GameStatus;
}

export interface CharacterIntroResponse {
  introduction: string;
  imageUrl?: string | null;
  gameStatus?: GameStatus;
}
