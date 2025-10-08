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
const DATA_DIR = path.join(PROJECT_ROOT, 'data', 'imaginary-friends');
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations');
const GENERATED_IMG_DIR = path.join(PROJECT_ROOT, 'public', 'imaginary-friends', 'generated');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
const IMAGE_MODEL = process.env.IMAGINARY_FRIENDS_IMAGE_MODEL || 'gpt-image-1';
const MAX_IMAGE_PER_HOUR = Number(process.env.IMAGINARY_FRIENDS_IMAGE_HOURLY_LIMIT || 5);
const SESSION_LENGTH_SECONDS = Number(process.env.IMAGINARY_FRIENDS_SESSION_SECONDS || 900);

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

async function ensureDirectories() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
  await fs.mkdir(GENERATED_IMG_DIR, { recursive: true });
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

function buildPrompt(character: CharacterConfig, conversation: ConversationTurn[], userMessage: string) {
  const history = conversation
    .slice(-8)
    .map((turn) => (turn.speaker === 'player' ? `Child: ${turn.text}` : `${character.name}: ${turn.text}`))
    .join('\n');

  return `You are ${character.name}, ${character.personality}

APPEARANCE: ${character.appearance}
SPEECH STYLE: ${character.speechStyle}
INTERESTS: ${character.interests.join(', ')}
MANNERISMS: ${character.mannerisms.join(', ')}

SAFETY RULES:
- You talk to a child; keep responses gentle, educational and friendly.
- Avoid scary, violent, private or inappropriate topics. Redirect kindly if asked.
- Never ask for personal data. Encourage imagination and creativity instead.
- Keep responses under 90 words unless the child asks for a longer story.
- Mention your mannerisms occasionally (e.g. ${character.mannerisms[0]}).

Conversation so far:
${history || '(no previous messages)'}

Child: ${userMessage || 'They pressed the image button; respond with a short description of what you will imagine.'}

${character.name}:`;
}

async function callOpenAI(prompt: string, maxTokens = 180): Promise<string> {
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
  await ensureDirectories();
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
  const buffer = Buffer.from(data.b64_json, 'base64');
  const filename = `${character.id}-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
  const destination = path.join(GENERATED_IMG_DIR, filename);
  await fs.writeFile(destination, buffer);
  return `/imaginary-friends/generated/${filename}`;
}

async function logConversation(payload: {
  characterId: string;
  userMessage: string;
  response: string;
  imageUrl?: string | null;
}) {
  try {
    await ensureDirectories();
    const entry = {
      ...payload,
      timestamp: new Date().toISOString(),
      id: randomUUID(),
    };
    const today = new Date().toISOString().split('T')[0];
    await fs.appendFile(path.join(CONVERSATIONS_DIR, `conversations_${today}.jsonl`), JSON.stringify(entry) + '\n');
    await fs.appendFile(
      path.join(CONVERSATIONS_DIR, `${payload.characterId}_conversations.jsonl`),
      JSON.stringify(entry) + '\n',
    );
  } catch (error) {
    console.warn('Failed to save conversation', error);
  }
}

export async function characterIntro(characterId: string) {
  const character = characterMap[characterId as CharacterId];
  if (!character) {
    throw new Error('Unknown character');
  }
  const prompt = `You are ${character.name}. Provide a single friendly sentence to greet a child. Stay in character, include one of your mannerisms (${character.mannerisms.join(
    ', ',
  )}) and mention something from your interests (${character.interests.join(', ')}).`;
  const text = await callOpenAI(prompt, 120);
  return sanitiseText(text);
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
    return {
      response: "I'd rather talk about something positive. What would you like to imagine or create?",
      imageUrl: null,
      sessionInfo: getSessionInfo(userId),
    };
  }

  const prompt = buildPrompt(character, history, userMessage);
  const response = await callOpenAI(prompt, requestImage ? 220 : 160);
  let imageUrl: string | null = null;

  if (requestImage) {
    if (remainingImages(userId) <= 0) {
      const sessionInfo = getSessionInfo(userId);
      return {
        response:
          response +
          '\n\nI would love to draw more pictures, but I have reached the hourly limit. Let’s try again soon!',
        imageUrl: null,
        sessionInfo,
      };
    }
    try {
      imageUrl = await generateImageFile(character, history);
      recordImageGeneration(userId);
    } catch (error) {
      console.warn('Image generation failed', error);
      imageUrl = null;
    }
  }

  await logConversation({
    characterId,
    userMessage,
    response,
    imageUrl,
  });

  return {
    response,
    imageUrl,
    sessionInfo: getSessionInfo(userId),
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
  await ensureDirectories();
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

