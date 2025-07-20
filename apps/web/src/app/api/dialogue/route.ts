import { NextRequest, NextResponse } from 'next/server';
import { 
  DialoguePipe, 
  MultiAgentDialogue,
  BrowserAgentSession,
  PersonaConfig,
  BrowserAgentConfig 
} from '@chatpipes/ai-conductor';

// In-memory storage for active dialogues (in production, use Redis or similar)
const activeDialogues = new Map<string, any>();

// POST /api/dialogue/start - Start a new dialogue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, agents, config, sessionManager } = body;
    
    // Create personas from agents
    const personas: PersonaConfig[] = agents.map((agent: any) => ({
      name: agent.name,
      description: agent.description || `A ${agent.platform} AI agent`,
      instructions: agent.instructions || `You are a helpful AI assistant using ${agent.platform}.`,
      introPrompt: agent.introPrompt || `You are an AI assistant powered by ${agent.platform}.`,
      behaviorStyle: agent.behaviorStyle || 'helpful and knowledgeable',
      temperature: agent.temperature || 0.7
    }));
    
    // Create browser configurations
    const browserConfig: BrowserAgentConfig = {
      useBrowser: false, // Disable browser for web API
      browserConfig: {
        headless: true
      }
    };
    
    // Create agent sessions
    const agentSessions = agents.map((agent: any, index: number) => 
      new BrowserAgentSession(
        agent.platform,
        personas[index],
        {},
        browserConfig
      )
    );
    
    let dialogue: any;
    const dialogueId = `dialogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (type === 'pipe' && agentSessions.length === 2) {
      // Create DialoguePipe
      dialogue = new DialoguePipe(agentSessions[0], agentSessions[1], {
        maxRounds: config.maxRounds || 10,
        turnDelay: config.turnDelay || 2000,
        enableStreaming: config.enableStreaming !== false,
        sessionName: config.sessionName || 'Web Dialogue'
      });
      
      if (config.startWith === 'agent2') {
        dialogue.setWhoStarts('B');
      }
      
    } else if (type === 'multi' && agentSessions.length >= 3) {
      // Create MultiAgentDialogue
      dialogue = new MultiAgentDialogue(agentSessions, {
        maxRounds: config.maxRounds || 6,
        turnDelay: config.turnDelay || 1500,
        enableStreaming: config.enableStreaming !== false,
        synthesisStrategy: config.synthesisStrategy || 'recent',
        contextWindow: config.contextWindow || 3
      });
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid dialogue type or agent count' },
        { status: 400 }
      );
    }
    
    // Store dialogue
    activeDialogues.set(dialogueId, {
      dialogue,
      type,
      agents: agentSessions,
      config,
      createdAt: new Date(),
      status: 'created'
    });
    
    return NextResponse.json({
      success: true,
      dialogueId,
      type,
      agentCount: agentSessions.length
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 