import { NextRequest, NextResponse } from 'next/server';
import { Interjection } from '@chatpipes/ai-conductor';

// In-memory storage for active dialogues
const activeDialogues = new Map<string, any>();

// GET /api/dialogue/[id] - Get dialogue status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dialogueData = activeDialogues.get(params.id);
    
    if (!dialogueData) {
      return NextResponse.json(
        { success: false, error: 'Dialogue not found' },
        { status: 404 }
      );
    }
    
    const { dialogue, type, agents, config, createdAt, status } = dialogueData;
    const state = dialogue.getState();
    
    return NextResponse.json({
      success: true,
      dialogue: {
        id: params.id,
        type,
        status: state.isActive ? 'active' : state.isPaused ? 'paused' : 'stopped',
        currentRound: state.currentRound || state.turn || 0,
        currentTurn: state.currentTurn,
        maxRounds: config.maxRounds,
        agentCount: agents.length,
        createdAt,
        state
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/dialogue/[id]/start - Start dialogue
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action } = body;
    
    const dialogueData = activeDialogues.get(params.id);
    
    if (!dialogueData) {
      return NextResponse.json(
        { success: false, error: 'Dialogue not found' },
        { status: 404 }
      );
    }
    
    const { dialogue } = dialogueData;
    
    switch (action) {
      case 'start':
        // Start the dialogue in background
        dialogue.runLoopUntilStopped().catch(console.error);
        dialogueData.status = 'running';
        break;
        
      case 'pause':
        dialogue.pause();
        dialogueData.status = 'paused';
        break;
        
      case 'resume':
        dialogue.resume();
        dialogueData.status = 'running';
        break;
        
      case 'stop':
        dialogue.stop();
        dialogueData.status = 'stopped';
        break;
        
      case 'interjection':
        const { text, target, priority, type } = body;
        const interjection: Interjection = {
          id: `interjection-${Date.now()}`,
          type: type || 'side_question',
          text,
          target: target || 'both',
          priority: priority || 'medium',
          timestamp: new Date()
        };
        dialogue.addInterjection(interjection);
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      action,
      status: dialogueData.status
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/dialogue/[id] - Stop and remove dialogue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dialogueData = activeDialogues.get(params.id);
    
    if (!dialogueData) {
      return NextResponse.json(
        { success: false, error: 'Dialogue not found' },
        { status: 404 }
      );
    }
    
    const { dialogue } = dialogueData;
    dialogue.stop();
    activeDialogues.delete(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Dialogue stopped and removed'
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 