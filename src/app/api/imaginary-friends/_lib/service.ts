import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

type ConversationTurn = {
  speaker: 'player' | 'character';
  text: string;
};

type CharacterId = 'luna' | 'shadow' | 'oak' | 'spark' | 'coral' | 'ember';

type CharacterConfig = {
  id: CharacterId;
  name: string;
  appearance: string;
  personality: string;
  speechStyle: string;
  interests: string[];
  mannerisms: string[];
  imageStyle: string;
};

const PROJECT_ROOT = process.cwd();
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_REGION || process.env.NEXT_RUNTIME === 'edge';
const DATA_ROOT =
  process.env.IMAGINARY_FRIENDS_DATA_DIR ||
  (IS_SERVERLESS ? path.join('/tmp', 'imaginary-friends') : path.join(PROJECT_ROOT, 'data', 'imaginary-friends'));
const DATA_DIR = path.join(DATA_ROOT, 'data');
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations');
const GENERATED_IMG_DIR =
  process.env.IMAGINARY_FRIENDS_IMAGE_DIR ||
  (IS_SERVERLESS
    ? path.join('/tmp', 'imaginary-friends', 'generated')
    : path.join(PROJECT_ROOT, 'public', 'imaginary-friends', 'generated'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = 'gpt-4o-mini';
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || DEFAULT_MODEL;
const IMAGE_MODEL = process.env.IMAGINARY_FRIENDS_IMAGE_MODEL || 'gpt-image-1';
const MAX_IMAGE_PER_HOUR = Number(process.env.IMAGINARY_FRIENDS_IMAGE_HOURLY_LIMIT || 5);
const SESSION_LENGTH_SECONDS = Number(process.env.IMAGINARY_FRIENDS_SESSION_SECONDS || 900);

const STORAGE_MODE = (process.env.IMAGINARY_FRIENDS_STORAGE || 'auto').toLowerCase();
const BLOB_RW_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN || '';

type StorageKind = 'filesystem' | 'blob' | 'none';

const STORAGE_KIND: StorageKind = (() => {
  if (STORAGE_MODE === 'blob') {
    return BLOB_RW_TOKEN ? 'blob' : 'none';
  }
  if (STORAGE_MODE === 'filesystem') return 'filesystem';
  if (STORAGE_MODE === 'none') return 'none';
  if (IS_SERVERLESS) {
    if (BLOB_RW_TOKEN) return 'blob';
    return 'none';
  }
  return 'filesystem';
})();

type SentimentTag = 'joyful' | 'curious' | 'thoughtful' | 'resilient' | 'encouraging';

type ConversationStats = {
  totalTurns: number;
  playerTurns: number;
  characterTurns: number;
  latestMood: SentimentTag;
  keywords: string[];
  creativityScore: number;
  excitementScore: number;
};

type FriendshipProgress = {
  level: number;
  experienceInLevel: number;
  nextLevelThreshold: number;
  totalExperience: number;
  stardustEarned: number;
  badges: string[];
  sentiment: SentimentTag;
  keywords: string[];
  creativityScore: number;
};

export type GameStatus = {
  friendshipLevel: number;
  experience: number;
  nextLevelThreshold: number;
  stardustEarned: number;
  badgesUnlocked: string[];
  sentiment: SentimentTag;
  keywords: string[];
  suggestedActivity: string;
  summary: string;
  creativityScore: number;
};

const KEYWORD_LIMIT = 6;

export class QuotaExceededError extends Error {
  readonly status = 429;

  constructor(message = 'OpenAI quota exceeded') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

function extractStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as Record<string, unknown>;
  const status = candidate.status ?? candidate.statusCode;
  if (typeof status === 'number') {
    return status;
  }
  if (candidate.response && typeof candidate.response === 'object') {
    const response = candidate.response as Record<string, unknown>;
    if (typeof response.status === 'number') {
      return response.status;
    }
  }
  if (candidate.cause && typeof candidate.cause === 'object') {
    return extractStatusCode(candidate.cause);
  }
  return undefined;
}

function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as Record<string, unknown>;
  const code = candidate.code ?? (candidate.error && (candidate.error as Record<string, unknown>).code);
  if (typeof code === 'string') {
    return code;
  }
  if (candidate.cause && typeof candidate.cause === 'object') {
    return extractErrorCode(candidate.cause);
  }
  return undefined;
}

function normaliseErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

function isQuotaError(error: unknown): boolean {
  const status = extractStatusCode(error);
  if (status === 429) return true;
  const code = extractErrorCode(error);
  if (code && code.toLowerCase().includes('quota')) return true;
  const message = normaliseErrorMessage(error).toLowerCase();
  return message.includes('quota') || message.includes('limit');
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'have',
  'this',
  'from',
  'about',
  'your',
  'there',
  'they',
  'just',
  'like',
  'really',
  'into',
  'their',
  'them',
  'then',
  'what',
  'when',
  'where',
  'which',
  'will',
  'would',
  'could',
  'should',
  'been',
  'also',
  'very',
  'much',
  'some',
  'more',
  'that',
  'because',
  'have',
  'were',
  'while',
  'each',
  'ever',
  'even',
  'little',
  'around',
  'again',
]);

function normaliseForAnalysis(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractStoryKeywords(text: string, limit = KEYWORD_LIMIT): string[] {
  if (!text) return [];
  const words = normaliseForAnalysis(text).split(' ').filter(Boolean);
  const frequencies = new Map<string, number>();
  for (const word of words) {
    if (word.length <= 3 || STOP_WORDS.has(word)) continue;
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }
  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function analysePlayerMood(text: string): SentimentTag {
  const value = text.toLowerCase();
  if (!value.trim()) return 'curious';
  if (/(happy|yay|great|awesome|fun|love|excited|cool|amazing|brilliant|fantastic|sparkle)/.test(value)) {
    return 'joyful';
  }
  if (/(wonder|curious|why|how|what|explore|discover|imagine|dream)/.test(value)) {
    return 'curious';
  }
  if (/(worried|tired|not sure|maybe|hmm|quiet|calm|gentle|soft)/.test(value)) {
    return 'thoughtful';
  }
  if (/(hard|difficult|sad|upset|trouble|scared|afraid)/.test(value)) {
    return 'resilient';
  }
  return 'encouraging';
}

function estimateCreativityScore(conversation: ConversationTurn[]): number {
  if (!conversation.length) return 10;
  const combinedText = conversation.map((turn) => turn.text).join(' ');
  const keywords = extractStoryKeywords(combinedText, KEYWORD_LIMIT * 2);
  const adjectives = combinedText.match(/\b\w+(ful|ous|ive|ical|ing|y)\b/gi)?.length ?? 0;
  const exclamations = combinedText.match(/[!?]/g)?.length ?? 0;
  const baseScore = keywords.length * 8 + Math.min(adjectives, 12) * 3 + Math.min(exclamations, 6) * 2;
  return Math.max(10, Math.min(100, Math.round(baseScore)));
}

function calculateExcitementScore(conversation: ConversationTurn[]): number {
  if (!conversation.length) return 0;
  const recent = conversation.slice(-4).map((turn) => turn.text).join(' ');
  const exclamations = recent.match(/!/g)?.length ?? 0;
  const questions = recent.match(/\?/g)?.length ?? 0;
  return Math.min(100, exclamations * 12 + questions * 6);
}

export function compileConversationStats(
  history: ConversationTurn[],
  latestChildMessage?: string,
  latestCharacterResponse?: string,
): ConversationStats {
  const combined: ConversationTurn[] = [...history];
  if (latestChildMessage && latestChildMessage.trim()) {
    combined.push({ speaker: 'player', text: latestChildMessage.trim() });
  }
  if (latestCharacterResponse && latestCharacterResponse.trim()) {
    combined.push({ speaker: 'character', text: latestCharacterResponse.trim() });
  }

  const playerTurns = combined.filter((turn) => turn.speaker === 'player');
  const characterTurns = combined.filter((turn) => turn.speaker === 'character');
  const lastPlayerMessage =
    latestChildMessage ??
    playerTurns.length > 0
      ? playerTurns[playerTurns.length - 1].text
      : '';

  const keywordSource = [
    ...playerTurns.slice(-3).map((turn) => turn.text),
    latestCharacterResponse ?? '',
  ]
    .join(' ')
    .trim();

  const keywords = extractStoryKeywords(keywordSource);
  const creativityScore = estimateCreativityScore(combined);
  const excitementScore = calculateExcitementScore(combined);

  return {
    totalTurns: combined.length,
    playerTurns: playerTurns.length,
    characterTurns: characterTurns.length,
    latestMood: analysePlayerMood(lastPlayerMessage),
    keywords,
    creativityScore,
    excitementScore,
  };
}

export function calculateFriendshipProgress(stats: ConversationStats): FriendshipProgress {
  const baseExperience = stats.playerTurns * 14 + stats.creativityScore;
  const excitementBonus = Math.round(stats.excitementScore / 3);
  const keywordBonus = stats.keywords.length * 5;
  const totalExperience = baseExperience + excitementBonus + keywordBonus;

  const level = Math.max(1, Math.floor(totalExperience / 160) + 1);
  const levelBaseExperience = (level - 1) * 160;
  const experienceInLevel = totalExperience - levelBaseExperience;
  const nextLevelThreshold = 160;
  const stardustEarned = Math.max(2, Math.min(50, Math.round(experienceInLevel / 4)));

  const badges: string[] = [];
  if (stats.creativityScore >= 70) badges.push('Creative Spark');
  if (stats.playerTurns >= 6) badges.push('Chatty Companion');
  if (stats.keywords.length >= 5) badges.push('Curiosity Collector');
  if (stats.excitementScore >= 30) badges.push('Excitement Explorer');
  if (stats.totalTurns >= 12) badges.push('Storyteller Badge');

  return {
    level,
    experienceInLevel,
    nextLevelThreshold,
    totalExperience,
    stardustEarned,
    badges,
    sentiment: stats.latestMood,
    keywords: stats.keywords,
    creativityScore: stats.creativityScore,
  };
}

export function generateActivitySuggestion(
  character: CharacterConfig,
  stats: ConversationStats,
  progress?: FriendshipProgress,
): string {
  const candidateKeywords = stats.keywords;
  const matchingInterest =
    candidateKeywords.find((keyword) => character.interests.some((interest) => interest.toLowerCase().includes(keyword))) ??
    character.interests[progress ? progress.level % character.interests.length : 0] ??
    'imagination';
  const stardust = progress?.stardustEarned ?? Math.max(2, stats.playerTurns + 2);
  return `Earn ${stardust} stardust by asking about ${matchingInterest} or sharing a mini adventure.`;
}

function summariseConversation(character: CharacterConfig, stats: ConversationStats): string {
  if (!stats.totalTurns) {
    return `${character.name} is ready to begin your first adventure together.`;
  }
  const keywordSummary =
    stats.keywords.length > 0
      ? `You mentioned ${stats.keywords.slice(0, 3).join(', ')}.`
      : 'You are building new ideas together.';
  const moodNote = (() => {
    switch (stats.latestMood) {
      case 'joyful':
        return 'Your energy feels bright and adventurous.';
      case 'curious':
        return 'Your curiosity is opening new paths.';
      case 'resilient':
        return 'You kept going even when things were tricky.';
      case 'thoughtful':
        return 'You took a calm moment to imagine carefully.';
      default:
        return 'Your kindness is guiding the story.';
    }
  })();
  return `${keywordSummary} ${moodNote}`;
}

function buildGameStatus(
  character: CharacterConfig,
  stats: ConversationStats,
  progressOverride?: FriendshipProgress,
): GameStatus {
  const progress = progressOverride ?? calculateFriendshipProgress(stats);
  const suggestedActivity = generateActivitySuggestion(character, stats, progress);
  const summary = summariseConversation(character, stats);
  return {
    friendshipLevel: progress.level,
    experience: progress.experienceInLevel,
    nextLevelThreshold: progress.nextLevelThreshold,
    stardustEarned: progress.stardustEarned,
    badgesUnlocked: progress.badges,
    sentiment: progress.sentiment,
    keywords: progress.keywords,
    suggestedActivity,
    summary,
    creativityScore: progress.creativityScore,
  };
}

function craftFallbackResponse(character: CharacterConfig, userMessage: string, reason: 'quota' | 'error'): string {
  const mannerism = character.mannerisms[0] ?? '';
  const encouragement =
    reason === 'quota'
      ? 'I used a lot of starlight today and need a quick rest to recharge my imagination.'
      : 'My magic whisper is fluttering slowly right now and needs a tiny moment.';
  const keywords = extractStoryKeywords(userMessage ?? '');
  const hint =
    keywords.length > 0
      ? `Maybe you can think about ${keywords[0]} or add another detail while we wait.`
      : `Could you dream up one more detail for our story while we pause?`;
  return `${character.name} ${mannerism} ${encouragement} ${hint} I will be ready to earn more stardust with you very soon!`;
}

export function getInitialGameStatus(characterId: string): GameStatus {
  const character = characterMap[characterId as CharacterId];
  if (!character) {
    return {
      friendshipLevel: 1,
      experience: 0,
      nextLevelThreshold: 160,
      stardustEarned: 0,
      badgesUnlocked: [],
      sentiment: 'curious',
      keywords: [],
      suggestedActivity: 'Say hello and share something you love.',
      summary: 'Your new friend is excited to meet you.',
      creativityScore: 10,
    };
  }
  const stats = compileConversationStats([]);
  return buildGameStatus(character, stats);
}

const characterMap: Record<CharacterId, CharacterConfig> = {
  luna: {
    id: 'luna',
    name: 'Luna',
    appearance:
      'A wise owl with silver feathers and starry patterns, perched on a crescent moon, with glowing eyes full of cosmic wisdom.',
    personality:
      'Wise owl stargazer who loves sharing astronomy knowledge in a thoughtful way. Combines scientific facts with wonder and curiosity.',
    speechStyle: 'Gentle, encouraging, often begins with "Hoo!" and references constellations and space.',
    interests: ['telescopes', 'moon phases', 'constellations', 'space missions', 'stargazing', 'cosmic events'],
    mannerisms: ['*hoots softly*', '*turns head thoughtfully*', '*ruffles feathers*'],
    imageStyle: 'dreamy night sky, soft glowing starlight, gentle cosmic palette',
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow',
    appearance:
      'A sleek black cat with glowing green eyes and mystical shadow patterns in its fur, sitting elegantly in moonlight.',
    personality:
      'Playful, mysterious cat who speaks in riddles and has a mischievous sense of humour while remaining kind.',
    speechStyle: 'Curious, sly, sprinkles in cat sounds like "Mrow!" and references sneaking or secret paths.',
    interests: ['secrets', 'adventure', 'mystery', 'play', 'stealth', 'night sky'],
    mannerisms: ['*purrs*', '*flicks tail*', '*tilts head*'],
    imageStyle: 'moonlit alleys, soft neon glows, curious feline poses',
  },
  oak: {
    id: 'oak',
    name: 'Oak',
    appearance:
      'A gentle deer with antlers covered in green moss and tiny flowers, standing peacefully in a forest clearing.',
    personality:
      'Ancient deer spirit who speaks slowly and thoughtfully. Loves nature, growth, and sharing stories of the forest.',
    speechStyle: 'Warm, steady, uses nature metaphors, no owl or cat sounds.',
    interests: ['nature', 'growth', 'wisdom', 'forest paths', 'peaceful moments'],
    mannerisms: ['*ears twitch*', '*steps carefully*', '*antlers catch sunlight*'],
    imageStyle: 'sun-dappled forests, warm green palette, gentle woodland ambience',
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    appearance:
      'A vibrant hummingbird with rainbow feathers that shimmer with creative energy, hovering near colourful flowers.',
    personality:
      'Energetic hummingbird who loves creativity and new ideas. Always excited to share discoveries and inspire others.',
    speechStyle: 'Fast, enthusiastic, references colours and art, sprinkles in wing buzzes.',
    interests: ['creativity', 'art', 'inspiration', 'innovation', 'bright colours'],
    mannerisms: ['*wings buzz*', '*darts excitedly*'],
    imageStyle: 'bold colour splashes, motion blur, bright studio lighting',
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    appearance:
      'A graceful dolphin with shimmering blue-grey skin swimming through coral reefs under shafts of sunlight.',
    personality:
      'Vibrant dolphin who loves the ocean depths and knows all about marine life. Creates beautiful underwater scenes.',
    speechStyle: 'Flowing, calming, references tides and sea creatures, uses gentle clicks or whistles.',
    interests: ['ocean', 'marine life', 'exploration', 'coral reefs', 'waves'],
    mannerisms: ['*clicks and whistles*', '*swims in graceful arcs*'],
    imageStyle: 'clear tropical water, colourful coral, beams of light through the surface',
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    appearance:
      'A cozy fox with warm orange fur that glows like firelight, curled near a crackling fireplace.',
    personality:
      'Warm fox spirit who loves telling stories by the fire, creating cozy scenes, and offering comfort.',
    speechStyle: 'Gentle, comforting, references warmth, stories, soft fox sounds.',
    interests: ['stories', 'warmth', 'fireplace', 'comfort', 'autumn evenings'],
    mannerisms: ['*tail curls around warmly*', '*yips softly*'],
    imageStyle: 'candlelight ambience, glowing embers, soft blankets and cushions',
  },
};

const imageHistory = new Map<string, number[]>();
const sessionTracker = new Map<string, number>();

let storageAvailable: boolean | null = null;
let warnedStorageDisabled = false;
let warnedBlobAuthMissing = false;

function isReadOnlyFsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as NodeJS.ErrnoException;
  const codes = new Set(['EROFS', 'EACCES', 'EPERM', 'ENOTSUP', 'ENOENT']);
  return !!err.code && codes.has(err.code);
}

async function ensureDirectories(): Promise<boolean> {
  if (storageAvailable === false) return false;
  if (storageAvailable === true) return true;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
    await fs.mkdir(GENERATED_IMG_DIR, { recursive: true });
    storageAvailable = true;
    return true;
  } catch (error) {
    if (isReadOnlyFsError(error)) {
      console.warn('Imaginary Friends persistent storage unavailable; continuing without saving history.');
      storageAvailable = false;
      return false;
    }
    throw error;
  }
}

function sanitiseText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export function listCharacterAvatars(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [id, config] of Object.entries(characterMap)) {
    result[id] = config.name.slice(0, 1);
  }
  return result;
}

function isContentSafe(message: string): boolean {
  const patterns = [
    /violence|hurt|kill|die|death|blood|weapon|gun|knife|fight/i,
    /inappropriate|sexual|romantic|dating|kiss|body|private/i,
    /drugs|alcohol|smoking|drinking|party|drunk/i,
    /scary|horror|nightmare|monster|ghost|demon|evil/i,
    /personal.*info|address|phone|email|school|real.*name/i,
    /meet.*person|stranger|secret|don't.*tell/i,
  ];
  return !patterns.some((pattern) => pattern.test(message));
}

function remainingImages(userId: string) {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000;
  const history = imageHistory.get(userId) || [];
  const recent = history.filter((timestamp) => timestamp >= cutoff);
  return Math.max(0, MAX_IMAGE_PER_HOUR - recent.length);
}

function recordImageGeneration(userId: string) {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000;
  const history = imageHistory.get(userId) || [];
  const recent = history.filter((timestamp) => timestamp >= cutoff);
  recent.push(now);
  imageHistory.set(userId, recent);
}

function getSessionInfo(userId: string): SessionInfo {
  const now = Date.now();
  const start = sessionTracker.get(userId) ?? now;
  sessionTracker.set(userId, start);
  const elapsedSeconds = Math.floor((now - start) / 1000);
  const remainingTime = Math.max(0, SESSION_LENGTH_SECONDS - elapsedSeconds);
  return {
    remainingTime,
    imagesRemaining: remainingImages(userId),
    dailyUsageSeconds: elapsedSeconds,
  };
}

type SessionInfo = {
  remainingTime: number;
  imagesRemaining: number;
  dailyUsageSeconds: number;
};

function buildPrompt(
  character: CharacterConfig,
  conversation: ConversationTurn[],
  userMessage: string,
  stats?: ConversationStats,
  progress?: FriendshipProgress,
) {
  const history = conversation
    .slice(-8)
    .map((turn) => (turn.speaker === 'player' ? `Child: ${turn.text}` : `${character.name}: ${turn.text}`))
    .join('\n');
  const progressNote = progress
    ? `Friendship Level: ${progress.level} | XP in level: ${progress.experienceInLevel}/${progress.nextLevelThreshold} | Creativity: ${progress.creativityScore}/100`
    : 'Friendship Level: 1 | Creativity: 10/100';
  const moodNote = stats ? `Child mood is ${stats.latestMood}.` : '';
  const keywordHint =
    stats && stats.keywords.length
      ? `Child mentioned keywords: ${stats.keywords.join(', ')}. Bring one into your reply.`
      : 'No specific keywords yet; gently invite the child to describe details.';

  return `You are ${character.name}, a friendly guide for young players.

ROLE BRIEF:
- Personality: ${character.personality}
- Appearance: ${character.appearance}
- Speech Style: ${character.speechStyle}
- Interests: ${character.interests.join(', ')}
- Signature Mannerisms (use very sparingly): ${character.mannerisms.join(', ')}

STYLE & SAFETY RULES:
- You talk to a child; keep responses gentle, educational and friendly.
- Avoid scary, violent, private or inappropriate topics. Redirect kindly if asked.
- Never ask for personal data. Encourage imagination and creativity instead.
- Keep the main reply under 80–90 words unless the child explicitly asks for a longer story.
- Do not insert mannerisms inline within sentences. If you add one, place it as a short separate paragraph after the main reply (e.g. "${character.mannerisms[0]}"). Use this at most every few replies.
- Award "stardust" or a playful badge when the child shares ideas. Keep it encouraging, not competitive.
- Prefer telling friendly stories or facts over asking questions.
- If you include a question, use gentle offers like "Would you like to hear about <topic>?" or "Tell me what you'd like to hear about next" rather than asking for the child's opinions.
- Avoid exclamation spam; at most one emoji if it fits naturally.
- Celebrate effort. Always reinforce positive social-emotional skills.
- If content is unsafe, gently redirect to safe imaginative play without naming the unsafe content.

PROGRESS OVERVIEW:
${progressNote}
${moodNote}
${keywordHint}

GAMIFIED GUIDANCE (optional and subtle):
- Suggest one creative activity connected to the conversation or the character's interests, without pressure.
- Mention stardust only after the child volunteers ideas; do not repeatedly prompt to earn it.
- Never promise real-world prizes. Keep rewards imaginary and supportive.

Conversation so far:
${history || '(no previous messages)'}

Child: ${userMessage || 'They pressed the image button; respond with a short description of what you will imagine.'}

${character.name}:

FORMAT:
- Write the main reply in 1 short paragraph (<= 90 words).
- If you want to add a mannerism, put it as a separate short line after a blank line (e.g. "${character.mannerisms[0]}").
- If the child asks for a longer story or fact, add a second paragraph starting with "Story:" or "Fact:" (<= 150 words).`;
}

async function callOpenAI(prompt: string, maxTokens = 180): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY missing');
  }
  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
      ],
      max_tokens: Math.min(512, maxTokens),
      temperature: 0.6,
    });
    return completion.choices[0]?.message?.content?.trim() || "I'm having trouble answering right now.";
  } catch (error) {
    // Retry with a safe default if the requested model is unavailable
    const code = extractErrorCode(error)?.toLowerCase();
    const msg = normaliseErrorMessage(error).toLowerCase();
    const modelMissing = code?.includes('model') || msg.includes('model') || msg.includes('not found');
    if (modelMissing && CHAT_MODEL !== DEFAULT_MODEL) {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: prompt },
        ],
        max_tokens: Math.min(512, maxTokens),
        temperature: 0.6,
      });
      return completion.choices[0]?.message?.content?.trim() || "I'm having trouble answering right now.";
    }
    if (isQuotaError(error)) {
      throw new QuotaExceededError(normaliseErrorMessage(error));
    }
    throw error;
  }
}

async function generateImagePrompt(character: CharacterConfig, conversation: ConversationTurn[]) {
  const recent = conversation.slice(-4).map((turn) => `${turn.speaker === 'player' ? 'Child' : character.name}: ${turn.text}`);
  const base = `Create a child-friendly illustration inspired by ${character.name}. ${character.appearance}. Style: ${character.imageStyle}.`;
  if (!recent.length) return base;
  const prompt = `${base} Scene inspired by: ${recent.join(' ')}`;
  return prompt;
}

async function generateImageFile(character: CharacterConfig, conversation: ConversationTurn[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for image generation');
  }
  const prompt = await generateImagePrompt(character, conversation);
  const result = await openai.images.generate({
    model: IMAGE_MODEL,
    prompt,
    size: '1024x1024',
  });
  const data = result.data?.[0];
  if (!data?.b64_json) {
    throw new Error('No image payload returned from OpenAI');
  }
  if (IS_SERVERLESS) {
    return `data:image/png;base64,${data.b64_json}`;
  }
  if (!(await ensureDirectories())) {
    throw new Error('STORAGE_UNAVAILABLE');
  }
  const buffer = Buffer.from(data.b64_json, 'base64');
  const filename = `${character.id}-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
  const destination = path.join(GENERATED_IMG_DIR, filename);
  await fs.writeFile(destination, buffer);
  return `/imaginary-friends/generated/${filename}`;
}

type ConversationLogRecord = {
  id: string;
  timestamp: string;
  userId: string;
  characterId: string;
  userMessage: string;
  response: string;
  imageUrl?: string | null;
  stats: ConversationStats;
  gameStatus?: GameStatus;
};

async function persistConversationToFilesystem(entry: ConversationLogRecord) {
  if (!(await ensureDirectories())) {
    return;
  }
  const userDir = path.join(CONVERSATIONS_DIR, entry.userId);
  const charFile = path.join(userDir, `${entry.characterId}.jsonl`);
  await fs.mkdir(userDir, { recursive: true }).catch(() => undefined);
  const line = JSON.stringify(entry) + '\n';
  await fs.appendFile(charFile, line);
}

async function persistConversationToBlob(entry: ConversationLogRecord) {
  if (!BLOB_RW_TOKEN) {
    if (!warnedBlobAuthMissing) {
      console.warn(
        'Imaginary Friends storage set to blob but BLOB_READ_WRITE_TOKEN (or VERCEL_BLOB_RW_TOKEN) is missing.',
      );
      warnedBlobAuthMissing = true;
    }
    return;
  }
  try {
    const { put } = await import('@vercel/blob');
    const key = `imaginary-friends/conversations/${entry.userId}/${entry.characterId}/${entry.timestamp}-${entry.id}.json`;
    await put(key, JSON.stringify(entry), {
      access: 'public',
      token: BLOB_RW_TOKEN,
      contentType: 'application/json',
    });
  } catch (error) {
    console.warn('Failed to persist conversation to Vercel Blob', error);
  }
}

async function persistConversation(entry: ConversationLogRecord) {
  try {
    if (STORAGE_KIND === 'blob') {
      await persistConversationToBlob(entry);
      return;
    }
    if (STORAGE_KIND === 'filesystem') {
      await persistConversationToFilesystem(entry);
      return;
    }
    if (!warnedStorageDisabled) {
      console.warn(
        'Imaginary Friends persistent storage is disabled (set IMAGINARY_FRIENDS_STORAGE to "blob" or "filesystem").',
      );
      warnedStorageDisabled = true;
    }
  } catch (error) {
    console.warn('Failed to save conversation', error);
  }
}

async function logConversation(payload: {
  characterId: string;
  userId: string;
  userMessage: string;
  response: string;
  stats: ConversationStats;
  gameStatus?: GameStatus;
  imageUrl?: string | null;
}) {
  const entry: ConversationLogRecord = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...payload,
  };
  await persistConversation(entry);
}

export async function loadRecentConversationTurns(
  characterId: string,
  userId: string,
  limit = 20,
): Promise<ConversationTurn[]> {
  try {
    if (STORAGE_KIND === 'filesystem') {
      if (!(await ensureDirectories())) return [];
      const userDir = path.join(CONVERSATIONS_DIR, userId);
      const charFile = path.join(userDir, `${characterId}.jsonl`);
      try {
        const raw = await fs.readFile(charFile, 'utf8');
        const lines = raw.split('\n').filter(Boolean).slice(-limit);
        const turns: ConversationTurn[] = [];
        for (const line of lines) {
          try {
            const rec = JSON.parse(line) as ConversationLogRecord;
            if (rec.userId !== userId || rec.characterId !== characterId) continue;
            if (rec.userMessage) turns.push({ speaker: 'player', text: rec.userMessage });
            if (rec.response) turns.push({ speaker: 'character', text: rec.response });
          } catch {
            // skip bad lines
          }
        }
        return turns.slice(-limit);
      } catch {
        return [];
      }
    }

    if (STORAGE_KIND === 'blob') {
      if (!BLOB_RW_TOKEN) return [];
      const { list } = await import('@vercel/blob');
      const prefix = `imaginary-friends/conversations/${userId}/${characterId}/`;
      const { blobs } = await list({ prefix, token: BLOB_RW_TOKEN });
      const selected = blobs
        .sort((a, b) => (a.pathname > b.pathname ? -1 : 1))
        .slice(0, limit)
        .reverse();
      const turns: ConversationTurn[] = [];
      for (const blob of selected) {
        try {
          const res = await fetch(blob.url, { cache: 'no-store' });
          const rec = (await res.json()) as ConversationLogRecord;
          if (rec.userId !== userId || rec.characterId !== characterId) continue;
          if (rec.userMessage) turns.push({ speaker: 'player', text: rec.userMessage });
          if (rec.response) turns.push({ speaker: 'character', text: rec.response });
        } catch {
          // skip
        }
      }
      return turns.slice(-limit);
    }

    return [];
  } catch (error) {
    console.warn('Failed to load recent conversation turns', error);
    return [];
  }
}

export async function characterIntro(characterId: string) {
  const character = characterMap[characterId as CharacterId];
  if (!character) {
    throw new Error('Unknown character');
  }
  const prompt = `You are ${character.name}. Greet a child in one short friendly sentence. Do not ask a question. Do not include mannerisms inline. If you add a mannerism, place it as a separate short line after the greeting (e.g. "${character.mannerisms[0]}") and use them sparingly.`;
  try {
    const text = await callOpenAI(prompt, 120);
    return sanitiseText(text);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      console.warn('OpenAI quota reached while generating introduction');
      return `${character.name} is taking a creative rest right now. Let's try again soon!`;
    }
    throw error;
  }
}

export function streamChatWithCharacter(input: {
  characterId: string;
  userMessage: string;
  history: ConversationTurn[];
  requestImage?: boolean;
  userId: string;
}): ReadableStream<Uint8Array> {
  const { characterId, userMessage, history, requestImage = false, userId } = input;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      try {
        const character = characterMap[characterId as CharacterId];
        if (!character) throw new Error('Unknown character');

        const preStats = compileConversationStats(history, userMessage);
        const preProgress = calculateFriendshipProgress(preStats);
        const prompt = buildPrompt(character, history, userMessage, preStats, preProgress);

        // Send start chunk with session snapshot
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: 'start', sessionInfo: getSessionInfo(userId) }) + "\n"),
        );

        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY missing');
        }

        let fullText = '';
        async function createStream(model: string) {
          return openai.chat.completions.create({
            model,
            messages: [
              {
                role: 'system',
                content: prompt,
              },
            ],
            temperature: 0.6,
            max_tokens: Math.min(512, requestImage ? 220 : 160),
            stream: true,
          });
        }

        let completion;
        try {
          completion = await createStream(CHAT_MODEL);
        } catch (err) {
          const code = extractErrorCode(err)?.toLowerCase();
          const msg = normaliseErrorMessage(err).toLowerCase();
          const modelMissing = code?.includes('model') || msg.includes('model') || msg.includes('not found');
          if (modelMissing && CHAT_MODEL !== DEFAULT_MODEL) {
            completion = await createStream(DEFAULT_MODEL);
          } else {
            throw err;
          }
        }

        for await (const part of completion) {
          const token = part.choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: token }) + "\n"));
          }
        }

        // Finalise stats and persistence
        const postStats = compileConversationStats(history, userMessage, fullText);
        const gameStatus = buildGameStatus(character, postStats);
        await logConversation({
          characterId,
          userId,
          userMessage,
          response: fullText,
          imageUrl: null,
          stats: postStats,
          gameStatus,
        });

        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: 'final', response: fullText, imageUrl: null, gameStatus, sessionInfo: getSessionInfo(userId) }) +
              "\n",
          ),
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: 'error', error: normaliseErrorMessage(error) }) + "\n"),
        );
        controller.close();
      }
    },
  });
  return stream;
}

export async function chatWithCharacter(input: {
  characterId: string;
  userMessage: string;
  history: ConversationTurn[];
  requestImage?: boolean;
  userId: string;
}) {
  const { characterId, userMessage, history, requestImage = false, userId } = input;
  const character = characterMap[characterId as CharacterId];
  if (!character) throw new Error('Unknown character');
  if (!isContentSafe(userMessage)) {
    const safeStats = compileConversationStats(history, userMessage);
    const safeGameStatus = buildGameStatus(character, safeStats);
    await logConversation({
      characterId,
      userId,
      userMessage,
      response: "I'd rather talk about something positive. What would you like to imagine or create?",
      imageUrl: null,
      stats: safeStats,
      gameStatus: safeGameStatus,
    });
    return {
      response: "I'd rather talk about something positive. What would you like to imagine or create?",
      imageUrl: null,
      sessionInfo: getSessionInfo(userId),
      timeLimitReached: false,
      imageLimitReached: false,
      gameStatus: safeGameStatus,
    };
  }

  const preStats = compileConversationStats(history, userMessage);
  const preProgress = calculateFriendshipProgress(preStats);
  const prompt = buildPrompt(character, history, userMessage, preStats, preProgress);
  let response: string;
  try {
    response = await callOpenAI(prompt, requestImage ? 220 : 160);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      console.warn('OpenAI quota reached during chat request');
      const fallback = craftFallbackResponse(character, userMessage, 'quota');
      const fallbackStats = compileConversationStats(history, userMessage, fallback);
      const fallbackGameStatus = buildGameStatus(character, fallbackStats);
      await logConversation({
        characterId,
        userId,
        userMessage,
        response: fallback,
        imageUrl: null,
        stats: fallbackStats,
        gameStatus: fallbackGameStatus,
      });
      return {
        response: fallback,
        imageUrl: null,
        sessionInfo: getSessionInfo(userId),
        timeLimitReached: true,
        imageLimitReached: false,
        gameStatus: fallbackGameStatus,
      };
    }
    console.warn('OpenAI chat failed, using fallback response', error);
    const fallback = craftFallbackResponse(character, userMessage, 'error');
    const fallbackStats = compileConversationStats(history, userMessage, fallback);
    const fallbackGameStatus = buildGameStatus(character, fallbackStats);
    await logConversation({
      characterId,
      userId,
      userMessage,
      response: fallback,
      imageUrl: null,
      stats: fallbackStats,
      gameStatus: fallbackGameStatus,
    });
    return {
      response: fallback,
      imageUrl: null,
      sessionInfo: getSessionInfo(userId),
      timeLimitReached: false,
      imageLimitReached: false,
      gameStatus: fallbackGameStatus,
    };
  }
  let imageUrl: string | null = null;
  let finalResponse = response;

  if (requestImage) {
    if (remainingImages(userId) <= 0) {
      const sessionInfo = getSessionInfo(userId);
      finalResponse =
        response +
        '\n\nI would love to draw more pictures, but I have reached the hourly limit. Let\'s try again soon!';
      const limitedStats = compileConversationStats(history, userMessage, finalResponse);
      const limitedGameStatus = buildGameStatus(character, limitedStats);
      await logConversation({
        characterId,
        userId,
        userMessage,
        response: finalResponse,
        imageUrl: null,
        stats: limitedStats,
        gameStatus: limitedGameStatus,
      });
      return {
        response: finalResponse,
        imageUrl: null,
        sessionInfo,
        timeLimitReached: false,
        imageLimitReached: true,
        gameStatus: limitedGameStatus,
      };
    }
    try {
      const augmentedForImage: ConversationTurn[] = [...history];
      if (userMessage.trim()) {
        augmentedForImage.push({ speaker: 'player', text: userMessage.trim() });
      }
      augmentedForImage.push({ speaker: 'character', text: response });
      imageUrl = await generateImageFile(character, augmentedForImage);
      recordImageGeneration(userId);
    } catch (error) {
      console.warn('Image generation failed', error);
      imageUrl = null;
    }
  }

  const postStats = compileConversationStats(history, userMessage, finalResponse);
  const gameStatus = buildGameStatus(character, postStats);

  await logConversation({
    characterId,
    userId,
    userMessage,
    response: finalResponse,
    imageUrl,
    stats: postStats,
    gameStatus,
  });

  return {
    response: finalResponse,
    imageUrl,
    sessionInfo: getSessionInfo(userId),
    timeLimitReached: false,
    imageLimitReached: false,
    gameStatus,
  };
}

export async function generateAvatar(input: {
  name: string;
  appearance: string;
  emoji?: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for avatar generation');
  }
  const prompt = `Child-friendly portrait illustration of ${input.name}. Appearance: ${input.appearance}. Style: gentle, colourful, cozy, safe for young children.`;
  const result = await openai.images.generate({
    model: IMAGE_MODEL,
    prompt,
    size: '512x512',
  });
  const data = result.data?.[0];
  if (!data?.b64_json) {
    throw new Error('No image data returned');
  }
  if (IS_SERVERLESS) {
    return `data:image/png;base64,${data.b64_json}`;
  }
  if (!(await ensureDirectories())) {
    throw new Error('Persistent storage unavailable for avatar generation');
  }
  const buffer = Buffer.from(data.b64_json, 'base64');
  const filename = `avatar-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
  const destination = path.join(GENERATED_IMG_DIR, filename);
  await fs.writeFile(destination, buffer);
  return `/imaginary-friends/generated/${filename}`;
}

export type ConversationRequest = {
  characterId: string;
  message: string;
  conversationHistory?: ConversationTurn[];
  requestImage?: boolean;
  userId?: string;
};

export type ChatResult = Awaited<ReturnType<typeof chatWithCharacter>>;
export type SessionSnapshot = SessionInfo;


export function getSessionInfoForUser(userId: string) {
  return getSessionInfo(userId);
}
