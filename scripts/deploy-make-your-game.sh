#!/bin/bash
# Quick deployment script for Make Your Game feature

set -e  # Exit on error

echo "🎮 MAKE YOUR GAME - AUTOMATED DEPLOYMENT"
echo "========================================"
echo ""

# Step 1: Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Run: cd C:/Users/James/Desktop/gamesincjr"
    exit 1
fi

# Step 2: Install dependencies
echo "📦 Installing Vercel AI SDK..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Step 4: Git status check
echo "📊 Current changes:"
git status --short
echo ""

# Step 5: Commit changes
echo "💾 Committing changes..."
git add .
git commit -m "feat: Implement Make Your Game with Vercel AI SDK

- Migrate from raw Anthropic SDK to Vercel AI SDK
- Use VERCEL_OIDC_TOKEN for zero-config authentication
- Enable automatic provider failover via AI Gateway
- Add prompt caching and usage tracking
- Maintain $0.013/game cost with better reliability

Changes:
- Updated /api/games/generate to use generateText()
- Added ai and @ai-sdk/anthropic packages
- Configured extended thinking (4000 tokens) for better code gen
- Added usage logging for cost tracking"

echo "✅ Changes committed"
echo ""

# Step 6: Push to deploy
echo "🚀 Deploying to Vercel..."
git push origin main
echo "✅ Pushed to GitHub"
echo ""

echo "✨ DEPLOYMENT INITIATED!"
echo ""
echo "Next steps:"
echo "1. Monitor deployment: https://vercel.com/team_zsq3KBYG6T0epAFVHqxMQyyO/gamesincjr/deployments"
echo "2. Check build logs: vercel logs --project=gamesincjr"
echo "3. Test endpoint: https://gamesincjr.com/api/games/generate"
echo "4. Submit test game: https://gamesincjr.com/make-your-game"
echo ""
echo "🔒 VERCEL_OIDC_TOKEN will be automatically injected"
echo "💰 Cost tracking: Settings → AI Gateway → Usage Analytics"
echo ""
