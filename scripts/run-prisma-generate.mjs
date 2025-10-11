#!/usr/bin/env node
/**
 * Lightweight wrapper around `prisma generate` that tolerates missing
 * engine checksum files (common in sandboxed CI/test environments).
 *
 * Usage: `node scripts/run-prisma-generate.mjs`
 */
import { spawn } from 'node:child_process';

function runPrismaGenerate() {
  let stderr = '';
  const child = spawn('pnpm', ['prisma', 'generate'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1',
    },
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderr += text;
    process.stderr.write(chunk);
  });

  child.on('close', (code, signal) => {
    if (signal) {
      console.error(`prisma generate terminated with signal ${signal}`);
      process.exit(1);
    }
    if (code && /403 Forbidden/.test(stderr)) {
      console.warn('Skipping prisma generate because engine download is blocked (HTTP 403).');
      console.warn('The Prisma client will be unavailable; features that rely on the database may not function.');
      process.exit(0);
    }
    if (code !== 0) {
      console.error(`prisma generate exited with code ${code}`);
      process.exit(code ?? 1);
    }
  });

  child.on('error', (error) => {
    console.error('Failed to start prisma generate:', error);
    process.exit(1);
  });
}

runPrismaGenerate();
