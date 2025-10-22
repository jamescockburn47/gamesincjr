# Make Your Game - Vercel AI SDK Implementation

## Architecture Decision: Full Automation via VERCEL_OIDC_TOKEN

### Why Vercel AI SDK over Raw Anthropic SDK

**Automation Benefits:**
1. **Zero API Key Management** - VERCEL_OIDC_TOKEN automatically provided in Vercel deployments
2. **Automatic Provider Failover** - If Anthropic is down, gateway can route to Bedrock
3. **Built-in Caching** - Identical prompts return cached responses (cost savings)
4. **Unified Billing** - Single bill for all AI providers through Vercel
5. **Usage Analytics** - Built-in tracking without custom instrumentation

**Cost:** Identical to raw SDK ($0.013/game generation with Claude Haiku 4.5)

### Implementation Changes

**Before (Raw Anthropic SDK):**
```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // Manual key management
});

const message = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20250514',
  max_tokens: 16000,
  messages: [{ role: 'user', content: prompt }]
});
```

**After (Vercel AI SDK):**
```typescript
const { text, usage } = await generateText({
  model: anthropic('claude-haiku-4-5-20250514'),
  maxTokens: 16000,
  prompt: prompt,
  // Auto-uses VERCEL_OIDC_TOKEN in production - zero config
  providerOptions: {
    anthropic: {
      thinking: {
        type: 'enabled',
        budget_tokens: 4000
      }
    }
  }
});
```

### Environment Variables

**Production (Vercel):**
- `VERCEL_OIDC_TOKEN` - Automatically provided, no configuration needed
- Falls back to `AI_GATEWAY_API_KEY` if OIDC not available

**Development (Local):**
- `ANTHROPIC_API_KEY` - Your personal key for local testing
- Or use `AI_GATEWAY_API_KEY` for consistency

### Deployment Steps

1. **Install dependencies:**
   ```bash
   cd C:\Users\James\Desktop\gamesincjr
   npm install
   ```

2. **Test locally:**
   ```bash
   npm run dev
   ```
   Visit: http://localhost:3000/make-your-game

3. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Implement Make Your Game with Vercel AI SDK and OIDC"
   git push origin main
   ```

4. **Verify deployment:**
   - Vercel auto-deploys on push
   - VERCEL_OIDC_TOKEN automatically injected
   - No manual environment variable configuration needed

### Monitoring

**Check AI usage:**
```bash
vercel logs --project=gamesincjr
```

**View in Vercel Dashboard:**
- Settings → AI Gateway → Usage Analytics
- Real-time cost tracking per model

### Fallback Behavior

If VERCEL_OIDC_TOKEN fails:
1. SDK attempts `AI_GATEWAY_API_KEY`
2. SDK attempts `ANTHROPIC_API_KEY`
3. Error returned if all fail

### Security Notes

- VERCEL_OIDC_TOKEN is scoped to your Vercel project
- Token automatically rotated by Vercel
- No manual key management required
- Keys never committed to git

## Testing the Implementation

### Local Test (requires ANTHROPIC_API_KEY):
```bash
cd C:\Users\James\Desktop\gamesincjr
npm run dev
```

### Production Test (uses VERCEL_OIDC_TOKEN):
Deploy and submit a test game at:
https://gamesincjr.com/make-your-game

### Expected Behavior:
1. User submits game design
2. API returns `submissionId` immediately
3. Background: AI generates HTML5 game
4. Status updates: building → review → approved
5. Admin reviews and publishes

## Cost Analysis

**Per Game Generation:**
- Input tokens: ~500 (prompt)
- Output tokens: ~15,000 (full HTML game)
- Thinking tokens: ~4,000 (code planning)
- **Total cost: $0.013 per game**

**Rate Limits:**
- 3 submissions per email per day
- Prevents abuse while allowing experimentation

## Troubleshooting

**If deployment fails:**
1. Check Vercel build logs: `vercel logs`
2. Verify database connection: `npx prisma db push`
3. Test API endpoint: `curl https://gamesincjr.com/api/games/status/test`

**If AI generation fails:**
1. Check logs for OIDC token errors
2. Verify Vercel AI Gateway enabled for project
3. Test with explicit `AI_GATEWAY_API_KEY` as fallback
