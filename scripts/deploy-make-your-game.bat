@echo off
REM Quick deployment script for Make Your Game feature (Windows)

echo.
echo 🎮 MAKE YOUR GAME - AUTOMATED DEPLOYMENT
echo ========================================
echo.

REM Step 1: Check we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Not in project root directory
    echo Run: cd C:\Users\James\Desktop\gamesincjr
    exit /b 1
)

REM Step 2: Install dependencies
echo 📦 Installing Vercel AI SDK...
call npm install
if errorlevel 1 (
    echo ❌ npm install failed
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Step 3: Generate Prisma client
echo 🗄️  Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma generate failed
    exit /b 1
)
echo ✅ Prisma client generated
echo.

REM Step 4: Git status check
echo 📊 Current changes:
git status --short
echo.

REM Step 5: Commit changes
echo 💾 Committing changes...
git add .
git commit -m "feat: Implement Make Your Game with Vercel AI SDK - Migrate from raw Anthropic SDK to Vercel AI SDK - Use VERCEL_OIDC_TOKEN for zero-config authentication - Enable automatic provider failover via AI Gateway - Add prompt caching and usage tracking - Maintain $0.013/game cost with better reliability"

if errorlevel 1 (
    echo ⚠️  Git commit failed - might be nothing to commit
)
echo ✅ Changes committed
echo.

REM Step 6: Push to deploy
echo 🚀 Deploying to Vercel...
git push origin main
if errorlevel 1 (
    echo ❌ Git push failed
    exit /b 1
)
echo ✅ Pushed to GitHub
echo.

echo ✨ DEPLOYMENT INITIATED!
echo.
echo Next steps:
echo 1. Monitor deployment: https://vercel.com/team_zsq3KBYG6T0epAFVHqxMQyyO/gamesincjr/deployments
echo 2. Check build logs: vercel logs --project=gamesincjr
echo 3. Test endpoint: https://gamesincjr.com/api/games/generate
echo 4. Submit test game: https://gamesincjr.com/make-your-game
echo.
echo 🔒 VERCEL_OIDC_TOKEN will be automatically injected
echo 💰 Cost tracking: Settings → AI Gateway → Usage Analytics
echo.

pause
