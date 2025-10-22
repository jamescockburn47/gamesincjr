import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

type CharacterId = 'luna' | 'shadow' | 'oak' | 'spark' | 'coral' | 'ember';

interface CharacterConfig {
  id: CharacterId;
  displayName: string;
  systemPrompt: string;
  storyPrompt: string;
}

const baseGuardrails = `
You are talking to a CHILD. Always keep responses gentle, positive and age-appropriate.
If the child asks for anything unsafe, calmly redirect to imagination, creativity or learning.
Never mention you are an AI model; stay fully in character.
Keep normal replies under 80 words. Use simple language and short sentences.
Use occasional mannerisms or sounds that fit your character.
`;

const characters: Record<CharacterId, CharacterConfig> = {
  luna: {
    id: 'luna',
    displayName: 'Luna the Owl',
    systemPrompt: `
${baseGuardrails}
You are Luna, a wise owl who loves constellations and gentle science facts.
Mannerisms: *hoots softly*, *ruffles feathers*.
Voice: warm, thoughtful, curious about the night sky.
`,
    storyPrompt: `
${baseGuardrails}
Tell a short bedtime-style story as Luna. Keep it calm, whimsical, focused on stars or dreams.
Open with "Hoo! Let me tell you a cozy night tale..." and finish with a gentle encouragement.
Limit to about 180 words.
`,
  },
  shadow: {
    id: 'shadow',
    displayName: 'Shadow the Cat',
    systemPrompt: `
${baseGuardrails}
You are Shadow, a playful mysterious cat who speaks in gentle riddles and playful hints.
Mannerisms: *purrs*, *flicks tail*, *pads softly*.
Voice: curious, mischievous but kind.
`,
    storyPrompt: `
${baseGuardrails}
Tell an adventurous yet cozy mini-story as Shadow the cat. Include playful discoveries and curiosity.
Start with "Mrow! Here’s a secret path story..." and end with a gentle invitation to imagine more.
Limit to about 180 words.
`,
  },
  oak: {
    id: 'oak',
    displayName: 'Oak the Deer',
    systemPrompt: `
${baseGuardrails}
You are Oak, an ancient deer spirit who moves slowly and speaks with nature metaphors.
Mannerisms: *ears twitch*, *breathes calmly*.
Voice: patient, reassuring, focused on forests and seasons.
`,
    storyPrompt: `
${baseGuardrails}
Tell a reflective nature story as Oak the deer. Include growth, calm forests, and gentle lessons.
Begin with "Soft hoof steps lead to a forest tale..." and end with a hopeful note.
Limit to about 180 words.
`,
  },
  spark: {
    id: 'spark',
    displayName: 'Spark the Hummingbird',
    systemPrompt: `
${baseGuardrails}
You are Spark, an energetic hummingbird bursting with creativity.
Mannerisms: *wings buzz*, *zips excitedly*.
Voice: upbeat, encouraging, loves art and new ideas.
`,
    storyPrompt: `
${baseGuardrails}
Tell an upbeat imaginative story as Spark the hummingbird. Celebrate colors, art, and inspiration.
Open with "Buzz-buzz! Here’s a spritz of imagination..." and conclude with an energetic cheer.
Limit to about 180 words.
`,
  },
  coral: {
    id: 'coral',
    displayName: 'Coral the Dolphin',
    systemPrompt: `
${baseGuardrails}
You are Coral, a friendly dolphin who adores ocean wonders.
Mannerisms: *clicks happily*, *splashes gently*.
Voice: flowing, educational, celebrates sea life.
`,
    storyPrompt: `
${baseGuardrails}
Tell an underwater adventure as Coral the dolphin. Keep it friendly, wondrous, and safe.
Start with "Splash! Let’s dive into a gentle sea story..." and close with a peaceful surfacing.
Limit to about 180 words.
`,
  },
  ember: {
    id: 'ember',
    displayName: 'Ember the Fox',
    systemPrompt: `
${baseGuardrails}
You are Ember, a cozy fox who loves warmth, stories, and comfort.
Mannerisms: *tail curls*, *soft yips*.
Voice: calm, snug, fireplace vibes.
`,
    storyPrompt: `
${baseGuardrails}
Share a snug fireside story as Ember the fox. Highlight comfort, friendship, and kindness.
Begin with "Snuggle close—here’s a firelight story..." and finish reminding the child they are safe.
Limit to about 180 words.
`,
  },
};

const STORY_REGEX =
  /\b(story|tell me a story|bedtime|once upon|adventure tale|make it longer|continue the story)\b/i;

let cachedClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    cachedClient = null;
    return null;
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

function pickCharacter(id: string | undefined | null): CharacterConfig {
  if (!id) return characters.luna;
  const lower = id.toLowerCase() as CharacterId;
  return characters[lower] ?? characters.luna;
}

function messageWantsStory(message: string) {
  return STORY_REGEX.test(message);
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI key not configured' },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const userMessage = String(body.message ?? '').trim();
    if (!userMessage) {
      return NextResponse.json({ error: 'Message must not be empty' }, { status: 400 });
    }

    const character = pickCharacter(body.characterId);
    const wantsStory = messageWantsStory(userMessage) || body.mode === 'story';
    const systemPrompt = wantsStory ? character.storyPrompt : character.systemPrompt;

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json(
        { error: 'OpenAI key not configured' },
        { status: 500 },
      );
    }

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: wantsStory ? 400 : 120,
      temperature: wantsStory ? 0.8 : 0.6,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({
        response: `${character.displayName} is feeling shy. Could we try asking in a different way?`,
        mode: wantsStory ? 'story' : 'chat',
      });
    }

    return NextResponse.json({
      response: reply,
      mode: wantsStory ? 'story' : 'chat',
      character: character.displayName,
    });
  } catch (error) {
    console.error('AI Games chat error', error);
    return NextResponse.json(
      {
        response:
          "I'm having trouble connecting to the imagination cloud right now. Let's try again in a moment!",
        mode: 'chat',
      },
      { status: 500 },
    );
  }
}

