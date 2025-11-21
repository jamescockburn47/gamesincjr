import { NextResponse } from 'next/server';
import { characterRolePrompts } from '@/app/api/imaginary-friends/_lib/prompts';
import fs from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, 'data', 'imaginary-friends');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompt-overrides.json');

async function getOverrides() {
    try {
        const data = await fs.readFile(PROMPTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function saveOverrides(overrides: Record<string, string>) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(overrides, null, 2));
}

export async function GET() {
    const overrides = await getOverrides();
    // Merge defaults with overrides
    const combined = { ...characterRolePrompts, ...overrides };
    return NextResponse.json(combined);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { characterId, prompt } = body;

        console.log('Updating prompt for:', characterId);

        if (!characterId || typeof prompt !== 'string') {
            console.warn('Invalid request body:', body);
            return NextResponse.json({ error: 'Missing characterId or prompt must be a string' }, { status: 400 });
        }

        const overrides = await getOverrides();
        overrides[characterId] = prompt;
        await saveOverrides(overrides);

        console.log('Prompt updated successfully for:', characterId);

        return NextResponse.json({ success: true, prompts: { ...characterRolePrompts, ...overrides } });
    } catch (error) {
        console.error('Failed to update prompt', error);
        return NextResponse.json({ error: 'Failed to update prompt: ' + String(error) }, { status: 500 });
    }
}
