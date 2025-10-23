# Admin Dashboard for Game Submissions

Complete admin interface for reviewing, approving, and deploying user-submitted games created by the "Make Your Game" feature.

## Overview

The admin dashboard provides a comprehensive workflow for managing user-generated game submissions:

1. **List View** - Browse all submissions with filtering and search
2. **Detail View** - Inspect individual games with live preview and code review
3. **Approval Workflow** - Approve, reject, or deploy games to production

## Accessing the Dashboard

1. Navigate to `/admin/login`
2. Enter the admin password (set via `ADMIN_PASSWORD` environment variable)
3. Access `/admin/game-submissions` to view all submissions

## List Page (`/admin/game-submissions`)

### Features

- **Status Filter**: Filter submissions by status
  - All - Show all submissions
  - PENDING - Initial state after submission
  - BUILDING - Claude is generating the game
  - REVIEW - Game generated, waiting for admin approval
  - APPROVED - Admin approved, ready to deploy
  - REJECTED - Admin rejected the submission
  - LIVE - Game deployed to production

- **Search**: Filter by
  - Game title
  - Creator name
  - Creator email

- **Auto-Refresh**: Updates every 5 seconds to show new submissions and status changes

- **Table Columns**:
  - Status (color-coded badge)
  - Game Title (with slug)
  - Creator (name and email)
  - Created date
  - Actions (Review button)

### Color Coding

- 🟡 **PENDING** - Gray badge
- 🏗️ **BUILDING** - Yellow badge
- 👀 **REVIEW** - Blue badge
- ✅ **APPROVED** - Green badge
- ❌ **REJECTED** - Red badge
- 🚀 **LIVE** - Purple badge

## Detail Page (`/admin/game-submissions/[id]`)

### Layout

#### Main Content (2/3 width)

**1. Game Preview**
- Live iframe preview of the game
- Allows testing before approval
- Sandbox isolated from admin interface

**2. Game Details**
- Game type (space, runner, puzzle, etc.)
- Game slug (unique identifier)
- Game description
- Difficulty level
- Visual style (art style, colors)

**3. Creator Information**
- Creator name
- Creator email
- Submission date
- Approval date (if approved)

**4. Generated HTML Code**
- Show/hide toggle to view generated code
- First 2000 characters visible
- Copy full code button

#### Sidebar (1/3 width)

**1. Review Notes**
- Editable textarea for admin notes
- Populated from database
- Used for approval/rejection reasons

**2. Action Buttons**
- ✅ **Approve** - Marks submission as APPROVED
- ❌ **Reject** - Marks as REJECTED (requires notes)
- 🚀 **Deploy** - Deploys to production (APPROVED only)
- 👀 **View Live Game** - Opens deployed game (LIVE only)

**3. Status Timeline**
- Shows submission lifecycle
- Timestamps for each status change
- Visual indicators (emoji badges)

## API Endpoints

### List Submissions

```
GET /api/admin/games/list?status=REVIEW&search=title&limit=50&offset=0
```

**Query Parameters:**
- `status` (optional) - Filter by status (default: all)
- `search` (optional) - Search by title/email/name
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "submissions": [...],
  "total": 42,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

### Get Submission

```
GET /api/admin/games/[id]
```

**Response:**
```json
{
  "success": true,
  "submission": {
    "id": "...",
    "status": "REVIEW",
    "gameTitle": "My Game",
    "generatedCode": "<!DOCTYPE html>...",
    ...
  }
}
```

### Update Submission

```
PATCH /api/admin/games/[id]
```

**Body:**
```json
{
  "reviewNotes": "Looks good!",
  ...
}
```

### Approve Submission

```
POST /api/admin/games/[id]/approve
```

**Body:**
```json
{
  "reviewNotes": "Approved - ready for production",
  "adminEmail": "admin@example.com" (optional)
}
```

**Effect:**
- Sets status to APPROVED
- Records approval timestamp
- Saves review notes

### Reject Submission

```
POST /api/admin/games/[id]/reject
```

**Body:**
```json
{
  "reviewNotes": "Code has syntax errors. Please fix and resubmit."
}
```

**Effect:**
- Sets status to REJECTED
- Saves rejection reason in review notes

### Deploy Submission

```
POST /api/admin/games/[id]/deploy
```

**Effect:**
- Creates `/public/demos/[slug]/index.html` with game code
- Updates `/src/data/games.json` with game entry
- Sets status to LIVE
- Records `liveUrl` in database

**Response:**
```json
{
  "success": true,
  "submission": { ... },
  "deployed": {
    "slug": "my-game",
    "demoPath": "/demos/my-game/index.html",
    "gamesJsonUpdated": true
  },
  "message": "Game deployed successfully! Please commit changes to git."
}
```

## Approval Workflow

### Typical Flow

1. **Creator submits game** via `/make-your-game`
   - Status: PENDING
   - Claude starts generation (async)

2. **Game generation completes** (1-5 minutes)
   - Status: REVIEW
   - Admin can see preview and code

3. **Admin reviews** the game
   - Test in preview iframe
   - Inspect generated code
   - Check creator info
   - Add review notes

4. **Admin approves or rejects**
   - **Approve**: Status → APPROVED (ready to deploy)
   - **Reject**: Status → REJECTED (creator can try again)

5. **Deploy to production** (for approved games)
   - Status: APPROVED → LIVE
   - Files created on disk
   - games.json updated
   - **Must commit to git!**

### Status Transitions

```
PENDING ──build──> BUILDING ──complete──> REVIEW
                                            │
                                     ┌──────┼──────┐
                                     │             │
                              (admin rejects)  (admin approves)
                                     │             │
                                  REJECTED      APPROVED
                                                   │
                                            (admin deploys)
                                                   │
                                                 LIVE
```

## Security Considerations

1. **Authentication**: All routes require valid admin session cookie
2. **CSRF Protection**: HTTP-only, secure cookies with strict SameSite
3. **File Operations**: Only in trusted `public/` and `src/data/` directories
4. **Input Validation**: Code not executed server-side, only displayed in sandboxed iframe
5. **Database Queries**: Parameterized queries via Prisma ORM

## Deployment Notes

### Important: Files Must Be Committed

After deploying a game with the "Deploy" button:

1. Files are created on disk:
   - `/public/demos/[slug]/index.html` - The game
   - Files in `/public/games/[slug]/` - Hero and screenshot assets (created separately)

2. `src/data/games.json` is updated

3. **These changes must be committed to git and pushed**

```bash
git add public/demos/ src/data/games.json
git commit -m "Deploy game: [game-title]"
git push
```

Vercel will auto-deploy the changes to production.

### Handling Deployment Errors

If file system errors occur during deployment:

1. The submission stays in APPROVED status (not marked LIVE)
2. Review notes will contain the error message
3. Admin can retry the deployment later
4. Or manually create the files and commit to git

## Database Schema

The admin dashboard works with the `GameSubmission` model:

```prisma
model GameSubmission {
  id              String   @id
  status          SubmissionStatus  // PENDING, BUILDING, REVIEW, APPROVED, REJECTED, LIVE
  gameTitle       String
  gameSlug        String   @unique
  gameDescription String
  creatorName     String
  creatorEmail    String
  generatedCode   String?  // Full HTML code generated by Claude
  heroSvg         String?  // Hero image SVG
  screenshotsSvg  Json?    // Array of screenshot SVGs
  reviewNotes     String?  // Admin review notes
  approvedAt      DateTime?
  approvedBy      String?
  liveUrl         String?  // URL when deployed
  createdAt       DateTime
  updatedAt       DateTime
}
```

## Monitoring

### Check for Stale Submissions

Call the cleanup endpoint to mark submissions stuck in BUILDING > 6 minutes as REJECTED:

```
GET /api/games/generate
```

This can be set up as a Vercel cron job:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/games/generate",
    "schedule": "*/5 * * * *"
  }]
}
```

### Logs

Check Vercel logs for:
- `[Admin]` - Admin dashboard actions
- `[Game Generator]` - Submission generation progress/errors

## Example Workflow

### As an Admin

1. Go to `/admin/game-submissions`
2. See a new submission in REVIEW status
3. Click "Review" button
4. Test the game in the preview
5. Read the code
6. Check creator info
7. Add review notes: "Great game! Approved."
8. Click "Approve"
9. Status changes to APPROVED
10. Click "Deploy to Production"
11. Status changes to LIVE
12. Go to terminal: `git push` (changes committed by deploy endpoint)
13. Vercel deploys automatically

## Troubleshooting

### "Submission not found"
- Invalid submission ID
- Check the URL

### "Failed to fetch submission"
- Network error
- Check admin authentication
- Check Vercel logs

### "File system deployment failed"
- Vercel read-only filesystem issue
- Games must be committed via git
- Manual workaround: copy game files locally and commit

### "Only approved submissions can be deployed"
- Submission must be in APPROVED status first
- Click "Approve" button before deploying

### Game won't load after deployment
- Check `/public/demos/[slug]/index.html` exists
- Check `src/data/games.json` has correct entry
- Check deployed game works in detail view preview

## Future Enhancements

- [ ] Batch deployment
- [ ] Email notifications to creators
- [ ] Game analytics dashboard
- [ ] Moderation queue for flagged content
- [ ] User-generated game showcase page
- [ ] Ratings and reviews from other users
