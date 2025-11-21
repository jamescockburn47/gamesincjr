import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { characterRolePrompts } from './prompts';

type ConversationTurn = {
  speaker: 'player' | 'character';
  text: string;
};

type CharacterId = 'luna' | 'shadow' | 'oak' | 'spark' | 'coral' | 'ember';

export type CharacterConfig = {
  id: string;
  name: string;
  appearance: string;
  personality: string;
  speechStyle?: string;
  interests?: string[];
  mannerisms?: string[];
  imageStyle?: string;
  systemPrompt?: string; // Allow direct system prompt override
};

const PROJECT_ROOT = process.cwd();
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_REGION || process.env.NEXT_RUNTIME === 'edge';
const DATA_ROOT =
  process.env.IMAGINARY_FRIENDS_DATA_DIR ||
  (IS_SERVERLESS ? path.join('/tmp', 'imaginary-friends') : path.join(PROJECT_ROOT, 'data', 'imaginary-friends'));
const DATA_DIR = path.join(DATA_ROOT, 'data');
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations');
const GENERATED_IMG_DIR =
  process.env.IMAGINARY_FRIENDS_IMAGE_DIR || path.join(PROJECT_ROOT, 'public', 'imaginary-friends', 'generated');

const STORAGE_KIND = process.env.IMAGINARY_FRIENDS_STORAGE || 'filesystem'; // 'filesystem' | 'blob' | 'none'
const BLOB_RW_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN;

// Initialize Google Generative AI
const apiKey = process.env.GOOGLE_API_KEY || '';
console.log('[Magic AI Friends] GOOGLE_API_KEY loaded:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'NO - MISSING!');
const genAI = new GoogleGenerativeAI(apiKey);
const CHAT_MODEL = 'gemini-2.0-flash-exp';
const IMAGE_MODEL = 'imagen-3.0-generate-001';

// --- Character Definitions (Defaults) ---
// These can be overridden by admin prompts or custom character definitions
const baseCharacters: Record<CharacterId, CharacterConfig> = {
  luna: {
    id: 'luna',
    name: 'Luna',
    appearance: 'A wise silver owl with starry feathers',
    personality: 'Wise, calm, mysterious',
    imageStyle: 'Magical realism, starlight, soft glow',
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow',
    appearance: 'A sleek black cat with glowing green eyes',
    personality: 'Playful, mischievous, clever',
    imageStyle: 'Whimsical, slight mystery, soft shadows',
  },
  oak: {
    id: 'oak',
    name: 'Oak',
    appearance: 'An ancient deer with antlers like tree branches',
    personality: 'Gentle, slow, nurturing',
    imageStyle: 'Nature-inspired, earthy tones, dappled sunlight',
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    appearance: 'A tiny, colorful hummingbird with electric blue wings',
    personality: 'Energetic, fast, curious',
    imageStyle: 'Vibrant, high contrast, motion blur',
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    appearance: 'A friendly pink dolphin with bubble patterns',
    personality: 'Joyful, fluid, bubbly',
    imageStyle: 'Underwater, bright blues and pinks, caustic light',
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    appearance: 'A cozy red fox with a tail like a flame',
    personality: 'Warm, cozy, storytelling',
    imageStyle: 'Warm colors, firelight, soft fur texture',
  },
};

// --- Helper Functions ---

let warnedStorageDisabled = false;
let warnedBlobAuthMissing = false;

async function ensureDirectories() {
  if (IS_SERVERLESS && STORAGE_KIND === 'filesystem') return false;
  try {
    await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
    await fs.mkdir(GENERATED_IMG_DIR, { recursive: true });
    return true;
  } catch (error) {
    console.warn('Failed to create directories', error);
    return false;
  }
}

// --- Persistence ---

type ConversationStats = {
  sentiment: 'happy' | 'sad' | 'excited' | 'thoughtful' | 'curious';
  topics: string[];
  friendshipProgress: number; // 0-100 increment per session
};

type GameStatus = {
  friendshipLevel: number;
  experience: number;
  nextLevelThreshold: number;
  stardustEarned: number;
  badgesUnlocked: string[];
  sentiment: string;
  keywords: string[];
  suggestedActivity: string;
  summary: string;
  creativityScore: number;
};

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

export async function clearConversationHistory(characterId: string, userId: string) {
  try {
    if (STORAGE_KIND === 'filesystem') {
      if (!(await ensureDirectories())) return;
      const userDir = path.join(CONVERSATIONS_DIR, userId);
      const charFile = path.join(userDir, `${characterId}.jsonl`);
      await fs.rm(charFile, { force: true }).catch(() => undefined);
      try {
        const remaining = await fs.readdir(userDir);
        if (!remaining.length) {
          await fs.rm(userDir, { force: true, recursive: true }).catch(() => undefined);
        }
      } catch {
        // ignore dir read issues
      }
      return;
    }

    if (STORAGE_KIND === 'blob') {
      if (!BLOB_RW_TOKEN) return;
      const prefix = `imaginary-friends/conversations/${userId}/${characterId}/`;
      const { list, del } = await import('@vercel/blob');
      const { blobs } = await list({ prefix, token: BLOB_RW_TOKEN });
      await Promise.all(
        blobs.map((blob) =>
          del(blob.pathname, {
            token: BLOB_RW_TOKEN,
          }),
        ),
      );
    }
  } catch (error) {
    console.warn('Failed to clear conversation history', error);
  }
}

// --- Gemini Integration ---

async function callGemini(systemPrompt: string, history: ConversationTurn[], userMessage: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: history.map((turn) => ({
        role: turn.speaker === 'player' ? 'user' : 'model',
        parts: [{ text: turn.text }],
      })),
      generationConfig: {
        maxOutputTokens: 150, // Keep responses concise for kids
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error('Gemini chat failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// --- Imagen 3 Integration ---

async function generateImageFile(character: CharacterConfig, conversation: ConversationTurn[]): Promise<string | null> {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY missing for image generation');
    return null;
  }

  // Construct a prompt based on the character and recent conversation
  const lastTurn = conversation[conversation.length - 1];
  const context = lastTurn ? lastTurn.text : 'A magical scene';

  const prompt = `Child-friendly illustration of ${character.name} (${character.appearance}). Context: ${context}. Style: ${character.imageStyle}. High quality, detailed, safe for children.`;

  try {
    // Using REST API for Imagen 3 as it might not be fully typed in the SDK yet or for specific control
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:predict?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Imagen API error:', errText);
      throw new Error(`Imagen API failed: ${response.statusText}`);
    }

    const data = await response.json();

    let b64Image = data.predictions?.[0]?.bytesBase64Encoded;

    // Fallback check for different response shapes if needed
    if (!b64Image && data.predictions?.[0]?.mimeType && data.predictions?.[0]?.bytesBase64Encoded) {
      b64Image = data.predictions[0].bytesBase64Encoded;
    }

    if (!b64Image) {
      console.warn('No image data in Imagen response', data);
      return null;
    }

    if (IS_SERVERLESS) {
      return `data:image/png;base64,${b64Image}`;
    }

    if (!(await ensureDirectories())) {
      console.warn('Storage unavailable for image');
      return null;
    }

    const buffer = Buffer.from(b64Image, 'base64');
    const filename = `img-${character.id}-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
    const destination = path.join(GENERATED_IMG_DIR, filename);
    await fs.writeFile(destination, buffer);

    // In a real app, you'd return the public URL. 
    // For local dev/filesystem, we assume a route serves this or we use a data URI if needed.
    // Here we return a relative path that Next.js public folder might serve if configured,
    // OR just return data URI for simplicity in this demo environment if serving static files is complex.
    // Let's stick to data URI for reliability in this specific environment unless we set up static serving.
    // Actually, let's try to return the path and assume the app handles it, or fallback to data URI.
    // For now, let's use Data URI to ensure it works immediately without static file config.
    return `data:image/png;base64,${b64Image}`;

  } catch (error) {
    console.warn('Image generation failed', error);
    return null;
  }
}


// --- Character Generation (Gemini) ---

export async function generateCharacterProfile(description: string): Promise<CharacterConfig> {
  const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

  const prompt = `Create a child-friendly imaginary friend character based on this description: "${description}".
    Return a JSON object with the following fields:
    - name: A creative name.
    - appearance: A visual description of what they look like.
    - personality: 3-4 adjectives describing their personality.
    - systemPrompt: A system instruction for an AI to roleplay this character. It must be safe, kind, and never ask for personal info. It should define their voice and mannerisms.
    - imageStyle: An artistic style for generating images of them (e.g., "watercolor", "3d render", "cartoon").
    
    Ensure the JSON is valid and contains no markdown formatting.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Clean up potential markdown code blocks
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const data = JSON.parse(cleanText);
    return {
      id: `custom-${Date.now()}`,
      ...data
    };
  } catch (e) {
    console.error("Failed to parse character profile", e);
    throw new Error("Failed to generate character profile");
  }
}

export async function generateCharacterAvatar(appearance: string, style: string): Promise<string> {
  // Re-use image generation logic but for a profile picture
  if (!process.env.GOOGLE_API_KEY) throw new Error("No API Key");

  const prompt = `Portrait of a friendly imaginary friend. Appearance: ${appearance}. Style: ${style}. White background, high quality, character design.`;

  // Reuse the fetch logic from generateImageFile or abstract it. 
  // For brevity, duplicating the core fetch here with the specific prompt.
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:predict?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '1:1' },
      }),
    });

    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error("No image data");

    return `data:image/png;base64,${b64}`;
  } catch (e) {
    console.error("Avatar gen failed", e);
    throw e;
  }
}


// --- Game Logic Helpers ---

function calculateFriendshipProgress(stats: ConversationStats): number {
  // Simple logic: more topics = more friendship
  return Math.min(100, stats.topics.length * 10 + 10);
}

function compileConversationStats(
  _history: ConversationTurn[],
  _lastUserMessage: string,
  _lastResponse?: string,
): ConversationStats {
  // In a real app, we might analyze sentiment here.
  // For now, return dummy stats or simple heuristics.
  // Silence linter
  console.log('Compiling stats', _history.length, _lastUserMessage.length, _lastResponse?.length);

  const stats: ConversationStats = {
    sentiment: 'happy',
    topics: ['friendship'],
    friendshipProgress: 50,
  };
  stats.friendshipProgress = calculateFriendshipProgress(stats);
  return stats;
}

function buildGameStatus(character: CharacterConfig, stats: ConversationStats): GameStatus {
  return {
    friendshipLevel: Math.floor(stats.friendshipProgress / 20) + 1,
    experience: stats.friendshipProgress,
    nextLevelThreshold: 100,
    stardustEarned: stats.friendshipProgress * 5,
    badgesUnlocked: [],
    sentiment: stats.sentiment,
    keywords: stats.topics,
    suggestedActivity: `Ask ${character.name} to tell a story!`,
    summary: `${character.name} is happy to see you.`,
    creativityScore: 85,
  };
}

function getSessionInfo(userId: string): SessionInfo {
  // Mock session info
  return {
    userId,
    imagesRemaining: 5,
    imageAllowanceRemaining: 5,
    timeRemaining: 3600,
    isPremium: false
  };
}

export type SessionInfo = {
  userId: string;
  imagesRemaining: number;
  imageAllowanceRemaining: number;
  timeRemaining: number;
  isPremium: boolean;
};


// --- Main Chat Function ---

export async function chatWithCharacter(input: {
  characterId: string;
  userMessage: string;
  history: ConversationTurn[];
  requestImage?: boolean;
  userId: string;
  customCharacter?: CharacterConfig; // Support for custom characters
}) {
  const { characterId, userMessage, history, requestImage = false, userId, customCharacter } = input;

  // Determine character config: Custom > Admin Override (TODO) > Base
  let character = customCharacter || baseCharacters[characterId as CharacterId];

  // If not found in base and no custom provided, try loading from admin overrides (TODO)
  // For now, if not found, throw error
  if (!character) {
    // Fallback for safety if ID exists in prompts but not baseCharacters map (shouldn't happen with correct types)
    if (characterRolePrompts[characterId]) {
      character = {
        id: characterId,
        name: characterId.charAt(0).toUpperCase() + characterId.slice(1),
        appearance: 'A magical friend',
        personality: 'Friendly',
        imageStyle: 'Cartoon',
        systemPrompt: characterRolePrompts[characterId]
      };
    } else {
      throw new Error('Unknown character');
    }
  }

  // Get System Prompt
  // Priority: Custom/Config > prompts.ts default
  const systemPrompt = character.systemPrompt || characterRolePrompts[character.id] || "You are a helpful friend.";

  // Safety Check (Basic)
  // In a real app, use Gemini's safety settings.
  // Here we assume Gemini handles most, but we can add a pre-check if needed.

  let response: string;
  let imageUrl: string | null = null;
  let gameStatus: GameStatus;

  try {
    response = await callGemini(systemPrompt, history, userMessage);

    // Image Generation Request
    if (requestImage) {
      imageUrl = await generateImageFile(character, [...history, { speaker: 'player', text: userMessage }, { speaker: 'character', text: response }]);
    }

    const stats = compileConversationStats(history, userMessage, response);
    gameStatus = buildGameStatus(character, stats);

    await logConversation({
      characterId,
      userId,
      userMessage,
      response,
      imageUrl,
      stats,
      gameStatus,
    });

    return {
      response,
      imageUrl,
      sessionInfo: getSessionInfo(userId),
      gameStatus,
    };

  } catch (error) {
    console.error('Chat error:', error);
    return {
      response: "I'm having a little trouble hearing you right now. Can we try again?",
      imageUrl: null,
      sessionInfo: getSessionInfo(userId),
      gameStatus: buildGameStatus(character, { sentiment: 'sad', topics: [], friendshipProgress: 0 }),
    };
  }
}

export async function generateAvatar(input: {
  name: string;
  appearance: string;
  emoji?: string;
}) {
  // Redirect to new implementation
  // This is kept for backward compatibility if called elsewhere, but using new logic
  return generateCharacterAvatar(input.appearance, 'gentle, colourful, cozy');
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
