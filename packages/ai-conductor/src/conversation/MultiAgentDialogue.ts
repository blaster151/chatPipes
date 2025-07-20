import { EventEmitter } from 'events';
import { 
  AgentSession, 
  AgentInfo, 
  TurnContext, 
  TurnEvent, 
  DialogueEvent, 
  Spectator,
  Interjection 
} from '@chatpipes/types';
import { v4 as uuidv4 } from 'uuid';

export interface MultiAgentConfig {
  maxRounds?: number;
  turnDelay?: number;
  enableStreaming?: boolean;
  contextWindow?: number;
  synthesisStrategy?: 'all' | 'recent' | 'weighted';
  skipInactiveAgents?: boolean;
  allowInterruptions?: boolean;
}

export class MultiAgentDialogue extends EventEmitter {
  public agents: AgentSession[];
  public history: string[] = [];
  public turn: number = 0;
  
  private config: MultiAgentConfig;
  private isActive: boolean = false;
  private isPaused: boolean = false;
  private currentAgentIndex: number = 0;
  private spectators: Spectator[] = [];
  private interjections: Interjection[] = [];
  private messageHistory: Array<{
    agentId: string;
    agentName: string;
    message: string;
    timestamp: Date;
    round: number;
  }> = [];

  constructor(agents: AgentSession[], config: MultiAgentConfig = {}) {
    super();
    this.agents = agents;
    this.config = {
      maxRounds: 10,
      turnDelay: 1000,
      enableStreaming: true,
      contextWindow: 3,
      synthesisStrategy: 'recent',
      skipInactiveAgents: true,
      allowInterruptions: false,
      ...config
    };
  }

  /**
   * Execute the next turn in the round-robin sequence
   */
  async nextTurn(): Promise<void> {
    if (this.isPaused) {
      throw new Error('Dialogue is paused. Call resume() first.');
    }

    if (this.turn >= (this.config.maxRounds || 10)) {
      throw new Error('Maximum rounds reached');
    }

    this.turn++;
    this.isActive = true;

    // Find the next active agent
    let attempts = 0;
    let currentAgent: AgentSession | null = null;
    
    while (attempts < this.agents.length) {
      const agentIndex = (this.currentAgentIndex + attempts) % this.agents.length;
      const agent = this.agents[agentIndex];
      
      if (agent.isActive || !this.config.skipInactiveAgents) {
        currentAgent = agent;
        this.currentAgentIndex = agentIndex;
        break;
      }
      
      attempts++;
    }

    if (!currentAgent) {
      throw new Error('No active agents available');
    }

    // Emit turn start event
    const turnStartEvent: TurnEvent = {
      type: 'turn_start',
      agentId: currentAgent.id,
      agentName: currentAgent.persona.name,
      timestamp: new Date(),
      round: this.turn
    };
    this.emitToSpectators('turn_start', turnStartEvent);

    try {
      // Build synthesized context for the current agent
      const context = await this.buildSynthesizedContext(currentAgent);
      
      // Apply any pending interjections
      const modifiedContext = this.applyInterjections(context, currentAgent.id);
      
      // Agent responds
      const response = await currentAgent.sendPrompt(modifiedContext);
      
      // Store in history
      this.messageHistory.push({
        agentId: currentAgent.id,
        agentName: currentAgent.persona.name,
        message: response,
        timestamp: new Date(),
        round: this.turn
      });
      
      this.history.push(`${currentAgent.persona.name}: ${response}`);

      // Emit turn end event
      const turnEndEvent: TurnEvent = {
        type: 'turn_end',
        agentId: currentAgent.id,
        agentName: currentAgent.persona.name,
        message: response,
        timestamp: new Date(),
        round: this.turn
      };
      this.emitToSpectators('turn_end', turnEndEvent);

      // Move to next agent
      this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length;

      // Add delay between turns
      if (this.config.turnDelay) {
        await this.delay(this.config.turnDelay);
      }

    } catch (error) {
      const errorEvent: TurnEvent = {
        type: 'turn_end',
        agentId: currentAgent.id,
        agentName: currentAgent.persona.name,
        timestamp: new Date(),
        round: this.turn
      };
      this.emitToSpectators('error', errorEvent);
      throw error;
    }
  }

  /**
   * Run the complete round-robin dialogue
   */
  async runLoopUntilStopped(): Promise<void> {
    this.isActive = true;
    
    // Emit dialogue start event
    this.emitToSpectators('dialogue_started', {
      type: 'dialogue_started',
      timestamp: new Date(),
      data: {
        agentCount: this.agents.length,
        agentNames: this.agents.map(a => a.persona.name),
        maxRounds: this.config.maxRounds
      }
    });

    try {
      while (this.isActive && !this.isPaused) {
        // Check if max rounds reached
        if (this.config.maxRounds && this.turn >= this.config.maxRounds) {
          break;
        }

        await this.nextTurn();
      }
    } catch (error) {
      this.emitToSpectators('error', {
        type: 'error',
        timestamp: new Date(),
        data: error
      });
      throw error;
    } finally {
      this.isActive = false;
      
      // Emit dialogue end event
      this.emitToSpectators('dialogue_ended', {
        type: 'dialogue_ended',
        timestamp: new Date(),
        data: {
          totalTurns: this.turn,
          totalMessages: this.messageHistory.length
        }
      });
    }
  }

  /**
   * Build synthesized context for an agent based on other agents' responses
   */
  private async buildSynthesizedContext(agent: AgentSession): Promise<string> {
    const otherAgents = this.agents.filter(a => a.id !== agent.id);
    const otherAgentNames = otherAgents.map(a => a.persona.name);
    
    // Get recent messages based on synthesis strategy
    let recentMessages: typeof this.messageHistory = [];
    
    switch (this.config.synthesisStrategy) {
      case 'all':
        recentMessages = this.messageHistory;
        break;
      case 'recent':
        const window = this.config.contextWindow || 3;
        recentMessages = this.messageHistory.slice(-window * otherAgents.length);
        break;
      case 'weighted':
        // Weight recent messages more heavily
        const totalMessages = this.messageHistory.length;
        const recentWeight = 0.7;
        const recentCount = Math.floor(totalMessages * recentWeight);
        recentMessages = this.messageHistory.slice(-recentCount);
        break;
    }

    // Build context string
    let context = `You are in a conversation with ${otherAgentNames.join(', ')}. `;
    
    if (recentMessages.length > 0) {
      context += `In reply to what ${otherAgentNames.join(' and ')} just said:\n\n`;
      
      // Add recent messages
      for (const msg of recentMessages) {
        if (msg.agentId !== agent.id) {
          context += `${msg.agentName}: ${msg.message}\n`;
        }
      }
      
      context += `\nPlease respond to the above and continue the conversation naturally.`;
    } else {
      context += `Please start the conversation with an engaging topic.`;
    }

    return context;
  }

  /**
   * Apply interjections to modify the context
   */
  private applyInterjections(context: string, targetAgentId: string): string {
    let modifiedContext = context;
    
    // Get interjections for this agent or 'both'
    const relevantInterjections = this.interjections.filter(
      i => i.target === targetAgentId || i.target === 'both'
    );

    for (const interjection of relevantInterjections) {
      if (interjection.promptModification) {
        modifiedContext = interjection.promptModification(modifiedContext);
      } else {
        // Default interjection pattern
        modifiedContext += `\n\nSide question – ${interjection.text}`;
      }
    }

    // Clear processed interjections
    this.interjections = this.interjections.filter(
      i => i.target !== targetAgentId && i.target !== 'both'
    );

    return modifiedContext;
  }

  /**
   * Add an interjection
   */
  addInterjection(interjection: Interjection): void {
    this.interjections.push(interjection);
    
    this.emitToSpectators('interjection_added', {
      type: 'interjection_added',
      timestamp: new Date(),
      data: interjection
    });
  }

  /**
   * Pause the dialogue
   */
  pause(): void {
    this.isPaused = true;
    this.emitToSpectators('dialogue_paused', {
      type: 'dialogue_paused',
      timestamp: new Date()
    });
  }

  /**
   * Resume the dialogue
   */
  resume(): void {
    this.isPaused = false;
    this.emitToSpectators('dialogue_resumed', {
      type: 'dialogue_resumed',
      timestamp: new Date()
    });
  }

  /**
   * Stop the dialogue
   */
  stop(): void {
    this.isActive = false;
  }

  /**
   * Add a spectator
   */
  addSpectator(spectator: Spectator): void {
    this.spectators.push(spectator);
  }

  /**
   * Remove a spectator
   */
  removeSpectator(spectatorId: string): void {
    this.spectators = this.spectators.filter(s => s.id !== spectatorId);
  }

  /**
   * Get agent info
   */
  getAgentInfo(): AgentInfo[] {
    return this.agents.map(agent => ({
      id: agent.id,
      name: agent.persona.name,
      session: agent,
      isActive: agent.isActive
    }));
  }

  /**
   * Get current turn context
   */
  getCurrentTurnContext(): TurnContext | null {
    if (this.turn === 0) return null;

    const currentAgent = this.agents[this.currentAgentIndex];
    const previousMessages = this.messageHistory.slice(-this.config.contextWindow! * this.agents.length);
    
    return {
      agentId: currentAgent.id,
      agentName: currentAgent.persona.name,
      round: this.turn,
      turn: this.currentAgentIndex + 1,
      previousMessages: previousMessages.map(msg => ({
        agentId: msg.agentId,
        agentName: msg.agentName,
        message: msg.message,
        timestamp: msg.timestamp
      })),
      synthesizedContext: this.buildSynthesizedContext(currentAgent).then(ctx => ctx)
    };
  }

  /**
   * Emit events to all spectators
   */
  private emitToSpectators(eventType: string, event: any): void {
    for (const spectator of this.spectators) {
      try {
        switch (eventType) {
          case 'turn_start':
          case 'turn_end':
            spectator.onTurnEvent(event);
            break;
          case 'dialogue_started':
          case 'dialogue_ended':
          case 'dialogue_paused':
          case 'dialogue_resumed':
          case 'interjection_added':
            spectator.onDialogueEvent(event);
            break;
          case 'error':
            spectator.onError(event.data);
            break;
        }
      } catch (error) {
        console.error(`Error in spectator ${spectator.id}:`, error);
      }
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current dialogue state
   */
  getState(): {
    isActive: boolean;
    isPaused: boolean;
    turn: number;
    currentAgentIndex: number;
    totalMessages: number;
    pendingInterjections: number;
    spectators: number;
    synthesisStrategy: string;
  } {
    return {
      isActive: this.isActive,
      isPaused: this.isPaused,
      turn: this.turn,
      currentAgentIndex: this.currentAgentIndex,
      totalMessages: this.messageHistory.length,
      pendingInterjections: this.interjections.length,
      spectators: this.spectators.length,
      synthesisStrategy: this.config.synthesisStrategy || 'recent'
    };
  }
} 