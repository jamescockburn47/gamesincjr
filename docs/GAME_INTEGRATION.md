# Game Integration Guide

## Overview

This guide covers integrating existing games into the Games Inc Jr platform, including various formats and AI-powered games with API cost management.

## Game Types Supported

### 1. HTML5 Games (`gameType: 'html5'`)
**Best for**: Web-based games that run in browsers

```json
{
  "slug": "space-runner",
  "title": "Space Runner",
  "gameType": "html5",
  "demoPath": "/demos/space-runner/index.html",
  "engine": "vanilla-js"
}
```

**Integration Steps**:
1. Copy your HTML5 game files to `public/demos/[game-slug]/`
2. Ensure `index.html` is the main entry point
3. Test the game works in an iframe
4. Add game metadata to `src/data/games.json`

### 2. Video Previews (`gameType: 'video-preview'`)
**Best for**: Games that can't run in browser (Unity, Unreal, etc.)

```json
{
  "slug": "epic-adventure",
  "title": "Epic Adventure",
  "gameType": "video-preview",
  "videoPreview": "/videos/epic-adventure-gameplay.mp4",
  "hero": "/images/epic-adventure-hero.jpg",
  "engine": "unity"
}
```

**Integration Steps**:
1. Create gameplay video (MP4, WebM, or OGG)
2. Place video in `public/videos/`
3. Add video metadata to games.json
4. Video will display with controls and poster image

### 3. Downloadable Games (`gameType: 'download'`)
**Best for**: Desktop games, large games, or games requiring installation

```json
{
  "slug": "desktop-puzzle",
  "title": "Desktop Puzzle Master",
  "gameType": "download",
  "downloadUrl": "/downloads/desktop-puzzle-v1.0.zip",
  "downloadSize": "150 MB",
  "engine": "godot"
}
```

**Integration Steps**:
1. Package your game for distribution
2. Upload to `public/downloads/`
3. Add download metadata to games.json
4. Users can download directly from the game page

### 4. AI-Powered Games (`gameType: 'ai-powered'`)
**Best for**: Games using AI APIs (OpenAI, Anthropic, etc.)

```json
{
  "slug": "ai-storyteller",
  "title": "AI Storyteller Adventure",
  "gameType": "ai-powered",
  "aiProvider": "openai",
  "apiCostPerPlay": 5,
  "demoPath": "/demos/ai-storyteller/index.html",
  "engine": "react"
}
```

**Integration Steps**:
1. Build your AI game with session tracking
2. Implement API usage reporting
3. Add cost tracking to games.json
4. Set up payment integration for API credits

## Local Game Integration Process

### Step 1: Prepare Your Game
```bash
# Example folder structure on your desktop
MyGames/
├── SpaceRunner/          # HTML5 game
│   ├── index.html
│   ├── game.js
│   └── assets/
├── EpicAdventure/        # Unity game
│   ├── gameplay.mp4      # Video preview
│   └── screenshots/
└── AIPuzzle/            # AI-powered game
    ├── index.html
    ├── ai-client.js
    └── session-tracker.js
```

### Step 2: Copy to Website
```bash
# Copy HTML5 games
cp -r ~/Desktop/MyGames/SpaceRunner public/demos/space-runner/

# Copy video previews
cp ~/Desktop/MyGames/EpicAdventure/gameplay.mp4 public/videos/

# Copy downloadable games
cp ~/Desktop/MyGames/DesktopPuzzle.zip public/downloads/
```

### Step 3: Update games.json
```json
[
  {
    "slug": "space-runner",
    "title": "Space Runner",
    "description": "Dodge asteroids in this fast-paced space adventure",
    "price": 2.99,
    "tags": ["arcade", "space", "action"],
    "hero": "/games/space-runner/hero.jpg",
    "screenshots": ["/games/space-runner/s1.jpg", "/games/space-runner/s2.jpg"],
    "demoPath": "/demos/space-runner/index.html",
    "gameType": "html5",
    "engine": "vanilla-js",
    "version": "1.0.0"
  },
  {
    "slug": "epic-adventure",
    "title": "Epic Adventure",
    "description": "A massive RPG adventure with stunning graphics",
    "price": 19.99,
    "tags": ["rpg", "adventure", "3d"],
    "hero": "/games/epic-adventure/hero.jpg",
    "screenshots": ["/games/epic-adventure/s1.jpg"],
    "gameType": "video-preview",
    "videoPreview": "/videos/epic-adventure-gameplay.mp4",
    "engine": "unity",
    "version": "2.1.0"
  }
]
```

## AI Game Integration & Cost Management

### Architecture Overview
```
User → Game Page → AI Play API → Session Tracking → Usage Recording → Billing
```

### 1. AI Game Development
Your AI game should include:

```javascript
// In your AI game's JavaScript
class AIGameSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.apiCalls = 0;
    this.totalCost = 0;
  }

  async makeAPICall(prompt) {
    // Your AI API call
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, sessionId: this.sessionId })
    });
    
    this.apiCalls++;
    this.totalCost += 0.05; // Example cost per call
    
    // Report usage
    await this.reportUsage();
    
    return response.json();
  }

  async reportUsage() {
    await fetch('/api/games/ai-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        apiCalls: this.apiCalls,
        totalCost: this.totalCost
      })
    });
  }
}

// Initialize session from URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session');
const gameSession = new AIGameSession(sessionId);
```

### 2. API Cost Tracking
The system tracks:
- **Session ID**: Unique identifier for each play session
- **API Calls**: Number of API requests made
- **Total Cost**: Cumulative cost in cents
- **Duration**: How long the session lasted
- **User**: Who played (when payment is integrated)

### 3. Payment Integration (Future)
```javascript
// When user wants to play AI game
const startAIGame = async () => {
  // Check user's API credit balance
  const balance = await fetch('/api/user/credits');
  
  if (balance < game.apiCostPerPlay) {
    // Redirect to payment page
    window.location.href = '/payment?game=' + game.slug;
    return;
  }
  
  // Start game session
  const response = await fetch('/api/games/ai-play', {
    method: 'POST',
    body: JSON.stringify({ gameSlug: game.slug })
  });
  
  const { gameUrl } = await response.json();
  window.open(gameUrl, '_blank');
};
```

## Deployment Considerations

### Environment Variables
```bash
# For AI games
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# For payment processing
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# For session storage
REDIS_URL=redis://localhost:6379
```

### File Structure
```
public/
├── demos/                 # HTML5 games
│   ├── space-runner/
│   └── ai-storyteller/
├── videos/               # Video previews
│   └── epic-adventure-gameplay.mp4
├── downloads/            # Downloadable games
│   └── desktop-puzzle-v1.0.zip
└── games/               # Game assets
    ├── space-runner/
    └── epic-adventure/
```

## Testing Your Integration

### 1. Local Testing
```bash
# Start dev server
pnpm dev

# Test each game type
# - HTML5: http://localhost:3000/games/space-runner
# - Video: http://localhost:3000/games/epic-adventure
# - Download: http://localhost:3000/games/desktop-puzzle
# - AI: http://localhost:3000/games/ai-storyteller
```

### 2. Production Testing
- Verify all game files are accessible
- Test iframe security policies
- Check video playback on different devices
- Validate download links work
- Test AI session tracking

## Best Practices

### Security
- Sanitize all user inputs in AI games
- Use iframe sandboxing for HTML5 games
- Validate file uploads for downloads
- Implement rate limiting for API calls

### Performance
- Compress video files (use WebM for better compression)
- Optimize HTML5 game assets
- Implement lazy loading for large files
- Cache frequently accessed content

### User Experience
- Provide clear instructions for each game type
- Show loading states during game initialization
- Handle errors gracefully
- Display cost information for AI games upfront

This system provides a flexible foundation for integrating games of any type while maintaining security, cost tracking, and a great user experience.
