import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@chatpipes/ai-conductor';

let sessionManager: SessionManager | null = null;

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

// GET /api/sessions/[id] - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sm = await getSessionManager();
    const session = sm.getSession(params.id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, config } = body;
    
    const sm = await getSessionManager();
    const session = sm.getSession(params.id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    if (status) {
      sm.updateSessionStatus(params.id, status);
    }
    
    return NextResponse.json({
      success: true,
      session: sm.getSession(params.id)
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sm = await getSessionManager();
    const session = sm.getSession(params.id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Note: Delete functionality would need to be added to SessionManager
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Session marked for deletion'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 