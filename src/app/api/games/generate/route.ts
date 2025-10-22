import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validation schema
const GameSubmissionSchema = z.object({
  gameType: z.enum(['space', 'runner', 'puzzle', 'racing', 'shooter', 'flying', 'collecting', 'fighting', 'strategy']),
  difficulty: z.number().min(1).max(5),
  speed: z.number().min(1).max(5),
  lives: z.number(),
  colors: z.enum(['colorful', 'dark-neon', 'bright', 'retro']),
  artStyle: z.enum(['geometric', 'cartoon', 'pixel', 'fancy']),
  background: z.enum(['space', 'city', 'forest', 'ocean', 'sky']),
  movement: z.enum(['left-right', 'four-way', 'mouse', 'auto-move']),
  specialAction: z.enum(['none', 'shoot', 'jump', 'powerup']),
  collectibles: z.array(z.string()),
  hazards: z.array(z.string()),
  features: z.array(z.string()),
  gameTitle: z.string().min(1).max(30),
  gameDescription: z.string().min(1).max(300),
  creatorName: z.string().min(1).max(30),
  creatorEmail: z.string().email(),
});

type GameSubmission = z.infer<typeof GameSubmissionSchema>;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const submission = GameSubmissionSchema.parse(body);
    
    // Content filtering
    if (!passesContentFilter(submission)) {
      return NextResponse.json(
        { error: 'Submission contains inappropriate content' },
        { status: 400 }
      );
    }
    
    // Rate limiting (check per email)
    const canSubmit = await checkRateLimit(submission.creatorEmail);
    if (!canSubmit) {
      return NextResponse.json(
        { error: 'Too many submissions today. Please try again tomorrow!' },
        { status: 429 }
      );
    }
    
    // Generate submission ID
    const submissionId = crypto.randomUUID();
    const gameSlug = submission.gameTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Save to database (pending status)
    await prisma.gameSubmission.create({
      data: {
        id: submissionId,
        status: 'building',
        creatorName: submission.creatorName,
        creatorEmail: submission.creatorEmail,
        gameTitle: submission.gameTitle,
        gameDescription: submission.gameDescription,
        gameSlug: gameSlug,
        gameType: submission.gameType,
        difficulty: {
          overall: submission.difficulty,
          speed: submission.speed,
          lives: submission.lives
        },
        visualStyle: {
          colors: submission.colors,
          artStyle: submission.artStyle,
          background: submission.background
        },
        controls: {
          movement: submission.movement,
          specialAction: submission.specialAction
        },
        elements: {
          collectibles: submission.collectibles,
          hazards: submission.hazards,
          features: submission.features
        }
      }
    });
    
    // Start async generation (don't await)
    generateGameAsync(submissionId, gameSlug, submission).catch(error => {
      console.error('Game generation failed:', error);
      updateSubmission(submissionId, {
        status: 'rejected',
        reviewNotes: error.message
      }).catch(console.error);
    });
    
    // Return immediately
    return NextResponse.json({
      submissionId,
      status: 'building',
      estimatedTime: 300 // seconds
    });
    
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Invalid submission' },
      { status: 400 }
    );
  }
}

async function generateGameAsync(
  submissionId: string,
  gameSlug: string,
  submission: GameSubmission
) {
  // Build the prompt with strict requirements for functional output
  const prompt = buildEnhancedGamePrompt(gameSlug, submission);
  
  try {
    console.log('[Game Generator] Starting generation for:', submissionId);
    
    // Call Claude Haiku 4.5 via Vercel AI SDK
    // Uses VERCEL_OIDC_TOKEN automatically in production (zero config)
    // Falls back to ANTHROPIC_API_KEY in development
    const { text, usage } = await generateText({
      model: anthropic('claude-haiku-4-5-20250514', {
        cacheControl: true,
      }),
      maxTokens: 16000,
      temperature: 1.0,
      prompt: prompt,
      // Vercel AI Gateway automatically handles:
      // - Authentication (VERCEL_OIDC_TOKEN in prod)
      // - Automatic failover if Anthropic is down
      // - Response caching for identical prompts
      // - Rate limiting across providers
      providerOptions: {
        anthropic: {
          // Extended thinking for better code generation
          thinking: {
            type: 'enabled',
            budget_tokens: 4000
          }
        }
      }
    });
    
    console.log('[Game Generator] Claude responded, extracting HTML...');
    console.log('[Game Generator] Tokens used:', usage);
    
    // Extract HTML code from response
    const generatedCode = extractHTMLFromResponse(text);
    
    // Validate the generated code
    if (!validateGeneratedCode(generatedCode)) {
      throw new Error('Generated code failed validation');
    }
    
    console.log('[Game Generator] Code validated, generating assets...');
    
    // Generate placeholder assets
    const assets = generatePlaceholderAssets(submission.gameTitle, submission.colors);
    
    // Save generated content
    await updateSubmission(submissionId, {
      status: 'review',
      generatedCode,
      heroSvg: assets.hero,
      screenshotsSvg: assets.screenshots,
    });
    
    console.log('[Game Generator] ✓ Complete! Status: review');
    
    // TODO: Notify admin via email
    // await notifyAdmin(submissionId, submission, gameSlug);
    
  } catch (error) {
    console.error('[Game Generator] ERROR:', error);
    await updateSubmission(submissionId, {
      status: 'rejected',
      reviewNotes: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    // TODO: Notify user of failure
  }
}

function buildEnhancedGamePrompt(gameSlug: string, submission: GameSubmission): string {
  return `You are creating a complete, production-ready HTML5 game. This game MUST work perfectly with ZERO manual fixes required.

GAME IDENTITY:
- Title: "${submission.gameTitle}"
- Slug: ${gameSlug}
- Description: "${submission.gameDescription}"
- Creator: ${submission.creatorName}
- Type: ${submission.gameType}

KEY REQUIREMENTS (MANDATORY):
✅ Complete single-file HTML with embedded CSS and JavaScript
✅ Fun and exciting for 10-year-olds
✅ Child-friendly (colorful, encouraging, positive)
✅ Animated sprites (NOT static rectangles)
✅ Particle effects on key events
✅ Sound effects using Web Audio API
✅ Smooth 60 FPS gameplay
✅ Forgiving hitboxes (70% of visual size)
✅ Tutorial-easy first 30 seconds
✅ Both keyboard and touch controls
✅ Score submission to /api/scores/save
✅ localStorage for high scores

DIFFICULTY: ${submission.difficulty}/5
SPEED: ${submission.speed}/5
LIVES: ${submission.lives === 999 ? 'Infinite' : submission.lives}

VISUAL STYLE:
- Colors: ${submission.colors}
- Art: ${submission.artStyle}
- Background: ${submission.background}

CONTROLS:
- Movement: ${submission.movement}
- Action: ${submission.specialAction}

ELEMENTS:
- Collect: ${submission.collectibles.join(', ')}
- Avoid: ${submission.hazards.join(', ')}
- Features: ${submission.features.join(', ')}

Create a complete, functional, fun HTML5 game. Return ONLY the HTML file, nothing else.`;
}

function extractHTMLFromResponse(text: string): string {
  let html = text;
  
  // Remove markdown code blocks if present
  html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');
  
  // Find <!DOCTYPE html> and take everything from there
  const doctypeIndex = html.indexOf('<!DOCTYPE html>');
  if (doctypeIndex !== -1) {
    html = html.substring(doctypeIndex);
  }
  
  // Remove any text after closing </html>
  const htmlEndIndex = html.lastIndexOf('</html>');
  if (htmlEndIndex !== -1) {
    html = html.substring(0, htmlEndIndex + 7);
  }
  
  return html.trim();
}

function validateGeneratedCode(code: string): boolean {
  if (!code.includes('<!DOCTYPE html>')) return false;
  if (!code.includes('<canvas')) return false;
  if (!code.includes('requestAnimationFrame')) return false;
  if (code.includes('undefined')) return false;
  if (code.includes('TODO')) return false;
  if (code.includes('PLACEHOLDER')) return false;
  
  return true;
}

function generatePlaceholderAssets(title: string, colors: string) {
  const hero = `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="450" fill="#1a237e"/>
    <text x="400" y="225" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="#fff">
      ${title}
    </text>
  </svg>`;
  
  return {
    hero,
    screenshots: [hero, hero]
  };
}

function passesContentFilter(submission: GameSubmission): boolean {
  const inappropriateWords = [
    'kill', 'murder', 'blood', 'gore', 'violence', 'death', 'die',
    'sex', 'sexy', 'porn', 'nude', 'naked',
    'drug', 'weed', 'cocaine', 'meth',
    'hate', 'racist', 'nazi',
  ];
  
  const textToCheck = [
    submission.gameTitle,
    submission.gameDescription,
    submission.creatorName
  ].join(' ').toLowerCase();
  
  for (const word of inappropriateWords) {
    if (textToCheck.includes(word)) {
      return false;
    }
  }
  
  return true;
}

async function checkRateLimit(email: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await prisma.gameSubmission.count({
    where: {
      creatorEmail: email,
      createdAt: { gte: today }
    }
  });
  
  return count < 3; // Max 3 per day
}

async function updateSubmission(id: string, updates: any): Promise<void> {
  await prisma.gameSubmission.update({
    where: { id },
    data: updates
  });
}
