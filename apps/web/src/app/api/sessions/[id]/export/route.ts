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

// GET /api/sessions/[id]/export - Export session as JSON
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
    
    const exportedData = sm.exportSession(params.id);
    
    // Return as downloadable file
    return new NextResponse(exportedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="session-${params.id}.json"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 