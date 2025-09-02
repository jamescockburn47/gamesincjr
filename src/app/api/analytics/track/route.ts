import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory analytics store
// In production, use a database like PostgreSQL or MongoDB
const analytics = {
  gamePlays: new Map<string, number>(),
  pageViews: new Map<string, number>(),
  apiUsage: new Map<string, { calls: number; cost: number }>(),
};

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json();

    switch (event) {
      case 'game_play':
        const gameSlug = data.gameSlug;
        if (gameSlug) {
          analytics.gamePlays.set(gameSlug, (analytics.gamePlays.get(gameSlug) || 0) + 1);
        }
        break;

      case 'page_view':
        const page = data.page;
        if (page) {
          analytics.pageViews.set(page, (analytics.pageViews.get(page) || 0) + 1);
        }
        break;

      case 'api_usage':
        const sessionId = data.sessionId;
        const cost = data.cost || 0;
        if (sessionId) {
          const current = analytics.apiUsage.get(sessionId) || { calls: 0, cost: 0 };
          analytics.apiUsage.set(sessionId, {
            calls: current.calls + 1,
            cost: current.cost + cost,
          });
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    gamePlays: Object.fromEntries(analytics.gamePlays),
    pageViews: Object.fromEntries(analytics.pageViews),
    apiUsage: Object.fromEntries(analytics.apiUsage),
  });
}
