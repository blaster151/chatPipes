import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@chatpipes/ai-conductor';

let sessionManager: SessionManager | null = null;

// Initialize session manager
async function getSessionManager() {
  if (!sessionManager) {
    sessionManager = new SessionManager({
      storagePath: './sessions',
      autoSave: true,
      saveInterval: 10000
    });
    await sessionManager.init();
  }
  return sessionManager;
}

// GET /api/sessions - List all sessions
export async function GET() {
  try {
    const sm = await getSessionManager();
    const sessions = sm.getAllSessions();
    
    return NextResponse.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        name: session.name,
        type: session.type,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        agentCount: session.agents.length,
        exchangeCount: session.exchanges.length,
        interjectionCount: session.interjections.length
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, agents, config } = body;
    
    const sm = await getSessionManager();
    const session = sm.createSession(name, type, agents, config);
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        name: session.name,
        type: session.type,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 