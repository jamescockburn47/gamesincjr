# Magic AI Friends Transcript Maintenance Runbook

This runbook documents how to audit, purge, and validate Magic AI Friends chat transcripts across environments. The goal is to ensure that the "Clear chat" action permanently deletes history, prevents stale rehydration, and keeps blob/filesystem storage tidy.

## 1. Inventory and Configuration

1. Inspect the storage mode:
   ```bash
   echo "$IMAGINARY_FRIENDS_STORAGE"
   ```
   - `filesystem`: transcripts are written under `data/imaginary-friends/conversations/`.
   - `blob`: transcripts live in Vercel Blob storage.
   - `auto` (default): filesystem when running locally, blob on Vercel deployments.
2. Confirm available blob credentials:
   ```bash
   env | grep -E 'VERCEL_BLOB_RW_TOKEN|BLOB_READ_WRITE_TOKEN|BLOB_TOKEN'
   ```
   Record the token that is active in production so purge scripts can authenticate.
3. For local/dev machines note the absolute path of the conversation folder. It is resolved from the project root as `./data/imaginary-friends/conversations/`.

## 2. Purging Existing Logs

### Local / Development (filesystem)

Use the bundled cleanup script to remove every per-user transcript file:
```bash
pnpm tsx scripts/purge-imaginary-friends-history.ts --mode=filesystem
```
- Add `--dry-run` to preview which directories would be deleted.
- The script deletes the entire `conversations` folder and recreates it on demand.

### Production / Vercel (blob storage)

1. Export a blob RW token in your shell session:
   ```bash
   export VERCEL_BLOB_RW_TOKEN="<token from project settings>"
   ```
2. Run the purge script in blob mode (you can run this from a local checkout):
   ```bash
   pnpm tsx scripts/purge-imaginary-friends-history.ts --mode=blob --dry-run
   pnpm tsx scripts/purge-imaginary-friends-history.ts --mode=blob
   ```
3. The script enumerates every blob under `imaginary-friends/conversations/**` and deletes them. Re-run with `--dry-run` to confirm the list is empty afterwards.

> **Safety tip:** To temporarily pause new logging, set `IMAGINARY_FRIENDS_STORAGE=none`, deploy, run the purge, and then restore the previous value before the final deployment.

## 3. Clear Chat Behaviour

- The "Clear chat" button now issues `DELETE /api/imaginary-friends/history` for the active user + character.
- While the deletion request is running the button shows a spinner and is disabled (the "New thread" button is also disabled).
- After the API call succeeds the UI clears local state and records a `sessionStorage` marker so the session will not rehydrate stale turns during the same browsing session.
- When the user sends a new message the marker is removed, allowing fresh history to hydrate later.

## 4. Preventing Immediate Rehydration

`sessionStorage` keeps a `if_clearedConversations` map keyed by `<userId>::<characterId>`. When present, the UI skips the `/history` fetch so cleared chats never resurface until the user starts a new conversation.

## 5. Validation Checklist

1. Start the dev server (`pnpm dev`) and log in as a test user.
2. Open a Magic AI Friends chat, send a message, and confirm it appears.
3. Click **Clear & delete history**. The button should show “Clearing…” briefly and the conversation should empty.
4. Reload the page — no history should reappear.
5. Send a new message to the same friend, reload, and verify the fresh chat persists.
6. Optionally, run the purge script with `--dry-run` to confirm no stray files/blobs remain.

For production rollouts, execute the blob purge on a preview deployment first, then repeat after the production deploy.

## 6. Prisma Engine Warnings (Dev Convenience)

If the Prisma engine checksum warning appears during `pnpm dev`, you can silence it by setting:
```bash
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```
Alternatively update Prisma to the latest compatible release before development if preferred.

## 7. References

- Cleanup script: `scripts/purge-imaginary-friends-history.ts`
- API implementation: `src/app/api/imaginary-friends/_lib/service.ts`
- Front-end behaviour: `src/features/imaginary-friends/ImaginaryFriendsApp.tsx`
