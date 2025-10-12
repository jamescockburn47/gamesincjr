/**
 * @file Purge Magic AI Friends conversation transcripts across configured storage backends.
 *
 * Usage:
 *   pnpm tsx scripts/purge-imaginary-friends-history.ts [--mode=filesystem|blob|all] [--dry-run]
 *
 * Flags:
 *   --mode       Force a specific backend (filesystem, blob, or all). Auto-detects when omitted.
 *   --dry-run    Log the files/blobs that would be removed without deleting them.
 *   --verbose    Print additional diagnostic details.
 *   --help       Show this help message.
 *
 * The script respects IMAGINARY_FRIENDS_STORAGE to guide detection and checks
 * for VERCEL_BLOB_RW_TOKEN or BLOB_READ_WRITE_TOKEN when targeting blob storage.
 */

import fs from 'node:fs';
import { rm, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

type Mode = 'filesystem' | 'blob';

type CliOptions = {
  dryRun: boolean;
  verbose: boolean;
  modes: Mode[];
};

const CONVERSATIONS_PATH = path.join('data', 'imaginary-friends', 'conversations');

const args = process.argv.slice(2);

function printUsage() {
  console.info(`\nMagic AI Friends transcript purge utility\n\n` +
    `Usage:\n  pnpm tsx scripts/purge-imaginary-friends-history.ts [options]\n\n` +
    `Options:\n  --mode=filesystem|blob|all  Select the storage backend to purge.\n` +
    `  --dry-run                 Preview actions without deleting data.\n` +
    `  --verbose                Print additional diagnostic output.\n` +
    `  --help                   Show this message.\n`);
}

if (args.includes('--help')) {
  printUsage();
  process.exit(0);
}

function resolveModes(): Mode[] {
  const modeArg = args.find((arg) => arg.startsWith('--mode='));
  if (modeArg) {
    const value = modeArg.split('=')[1];
    if (value === 'all') return ['filesystem', 'blob'];
    if (value === 'filesystem' || value === 'blob') return [value];
    throw new Error(`Unsupported mode "${value}". Use filesystem, blob, or all.`);
  }

  const inferred: Set<Mode> = new Set();
  const storageMode = (process.env.IMAGINARY_FRIENDS_STORAGE ?? 'auto').toLowerCase();
  const rootPath = process.cwd();
  const localPath = path.join(rootPath, CONVERSATIONS_PATH);

  if (storageMode === 'filesystem' || storageMode === 'auto') {
    if (fs.existsSync(localPath)) {
      inferred.add('filesystem');
    }
  }

  const blobToken =
    process.env.VERCEL_BLOB_RW_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_TOKEN;
  if ((storageMode === 'blob' || storageMode === 'auto') && blobToken) {
    inferred.add('blob');
  }

  return Array.from(inferred);
}

function parseCliOptions(): CliOptions {
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  const modes = resolveModes();
  return { dryRun, verbose, modes };
}

async function purgeFilesystem({ dryRun, verbose }: CliOptions) {
  const target = path.join(process.cwd(), CONVERSATIONS_PATH);
  try {
    await stat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      if (verbose) {
        console.info(`[filesystem] No local transcripts found at ${target}`);
      }
      return;
    }
    throw error;
  }

  if (dryRun) {
    console.info(`[filesystem] Dry run: would remove ${target}`);
    return;
  }

  await rm(target, { recursive: true, force: true });
  console.info(`[filesystem] Removed ${target}`);
}

async function collectBlobs(token: string) {
  const { list } = await import('@vercel/blob');
  const prefix = 'imaginary-friends/conversations/';
  const all: Array<{ pathname: string }> = [];
  let cursor: string | undefined;
  do {
    const response = await list({ prefix, token, cursor });
    all.push(...response.blobs.map((blob) => ({ pathname: blob.pathname })));
    cursor = response.cursor ?? undefined;
  } while (cursor);
  return all;
}

async function purgeBlob({ dryRun, verbose }: CliOptions) {
  const token =
    process.env.VERCEL_BLOB_RW_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_TOKEN;
  if (!token) {
    throw new Error('Blob mode requested but no Vercel blob RW token found in the environment.');
  }

  const blobs = await collectBlobs(token);
  if (!blobs.length) {
    if (verbose) {
      console.info('[blob] No blob transcripts found for imaginary-friends/conversations/.');
    }
    return;
  }

  if (dryRun) {
    console.info(`[blob] Dry run: would delete ${blobs.length} blob(s).`);
    blobs.slice(0, 10).forEach((blob) => console.info(`  - ${blob.pathname}`));
    if (blobs.length > 10) console.info('  ...');
    return;
  }

  const { del } = await import('@vercel/blob');
  let failureCount = 0;
  await Promise.all(
    blobs.map((blob) =>
      del(blob.pathname, { token }).catch((error: unknown) => {
        failureCount += 1;
        if (verbose) {
          console.warn(`[blob] Failed to delete ${blob.pathname}:`, error);
        }
      }),
    ),
  );

  const successCount = blobs.length - failureCount;
  console.info(`[blob] Deleted ${successCount} blob(s).`);
  if (failureCount > 0) {
    console.warn(`[blob] ${failureCount} blob(s) could not be removed. Inspect logs above for details.`);
  }
}

async function main() {
  try {
    const options = parseCliOptions();
    if (options.modes.length === 0) {
      console.info('No storage backends detected. Use --mode to force a specific target.');
      return;
    }

    for (const mode of options.modes) {
      if (mode === 'filesystem') {
        await purgeFilesystem(options);
      } else if (mode === 'blob') {
        await purgeBlob(options);
      }
    }
    console.info('Purge complete.');
  } catch (error) {
    console.error('Failed to purge Magic AI Friends transcripts:', error);
    process.exitCode = 1;
  }
}

void main();
