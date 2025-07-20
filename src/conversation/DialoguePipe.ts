import { BrowserAgentSession } from '../core/BrowserAgentSession';
import { EventEmitter } from 'events';

export interface Interjection {
  id: string;
  type: 'side_question' | 'correction' | 'direction' | 'pause' | 'resume';
  text: string;
  target?: 'A' | 'B' | 'both';
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface TurnEvent {
  type: 'turn_start' | 'turn_end' | 'interjection' | 'pause' | 'resume';
  agent: 'A' | 'B';
  message?: string;
  interjection?: Interjection;
  timestamp: Date;
  round: number;
}

export interface DialogueConfig {
  maxRounds?: number;
  turnDelay?: number;
  autoStart?: boolean;
  enableStreaming?: boolean;
  interjectionPattern?: RegExp;
}

export class DialoguePipe extends EventEmitter {
  private agentA: BrowserAgentSession;
  private agentB: BrowserAgentSession;
  private config: DialogueConfig;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentTurn: 'A' | 'B';
  private round: number = 0;
  private interjections: Interjection[] = [];
  private conversationHistory: Array<{
    agent: 'A' | 'B';
    message: string;
    timestamp: Date;
    round: number;
    interjection?: Interjection;
  }> = [];

  constructor(
    agentA: BrowserAgentSession,
    agentB: BrowserAgentSession,
    config: DialogueConfig = {}
  ) {
    super();
    this.agentA = agentA;
    this.agentB = agentB;
    this.config = {
      maxRounds: 10,
      turnDelay: 1000,
      autoStart: false,
      enableStreaming: true,
      interjectionPattern: /Side question – (.+)/i,
      ...config
    };
    this.currentTurn = 'A'; // Default starting agent
  }

  /**
   * Set which agent starts the conversation
   */
  setWhoStarts(agent: 'A' | 'B'): void {
    this.currentTurn = agent;
    this.emit('turn_change', { agent, timestamp: new Date() });
  }

  /**
   * Add an interjection to modify the next message
   */
  addInterjection(interjection: Interjection): void {
    this.interjections.push(interjection);
    
    const turnEvent: TurnEvent = {
      type: 'interjection',
      agent: this.currentTurn,
      interjection,
      timestamp: new Date(),
      round: this.round
    };
    
    this.emit('interjection_added', turnEvent);
    this.emit('turn_event', turnEvent);
  }

  /**
   * Pause the dialogue
   */
  pause(): void {
    this.isPaused = true;
    
    const turnEvent: TurnEvent = {
      type: 'pause',
      agent: this.currentTurn,
      timestamp: new Date(),
      round: this.round
    };
    
    this.emit('dialogue_paused', turnEvent);
    this.emit('turn_event', turnEvent);
  }

  /**
   * Resume the dialogue
   */
  resume(): void {
    this.isPaused = false;
    
    const turnEvent: TurnEvent = {
      type: 'resume',
      agent: this.currentTurn,
      timestamp: new Date(),
      round: this.round
    };
    
    this.emit('dialogue_resumed', turnEvent);
    this.emit('turn_event', turnEvent);
  }

  /**
   * Run one complete turn (A → B or B → A)
   */
  async runOnce(): Promise<void> {
    if (this.isPaused) {
      throw new Error('Dialogue is paused. Call resume() first.');
    }

    const currentAgent = this.currentTurn === 'A' ? this.agentA : this.agentB;
    const nextAgent = this.currentTurn === 'A' ? this.agentB : this.agentA;
    
    // Get the last message from the other agent
    const lastMessage = this.getLastMessageFromOtherAgent();
    
    if (!lastMessage && this.round > 0) {
      throw new Error('No message to respond to');
    }

    // Check for applicable interjections
    const applicableInterjections = this.getApplicableInterjections();
    let prompt = lastMessage || 'Start the conversation.';

    // Apply interjections to the prompt
    if (applicableInterjections.length > 0) {
      prompt = this.applyInterjectionsToPrompt(prompt, applicableInterjections);
      this.clearProcessedInterjections(applicableInterjections);
    }

    // Emit turn start event
    const turnStartEvent: TurnEvent = {
      type: 'turn_start',
      agent: this.currentTurn,
      timestamp: new Date(),
      round: this.round
    };
    this.emit('turn_start', turnStartEvent);
    this.emit('turn_event', turnStartEvent);

    try {
      // Send prompt and get response
      const response = await this.sendPromptWithStreaming(currentAgent, prompt);
      
      // Record the conversation
      this.conversationHistory.push({
        agent: this.currentTurn,
        message: response,
        timestamp: new Date(),
        round: this.round,
        interjection: applicableInterjections.length > 0 ? applicableInterjections[0] : undefined
      });

      // Emit turn end event
      const turnEndEvent: TurnEvent = {
        type: 'turn_end',
        agent: this.currentTurn,
        message: response,
        timestamp: new Date(),
        round: this.round
      };
      this.emit('turn_end', turnEndEvent);
      this.emit('turn_event', turnEndEvent);

      // Switch turns
      this.currentTurn = this.currentTurn === 'A' ? 'B' : 'A';
      this.round++;

      // Apply delay between turns
      if (this.config.turnDelay) {
        await new Promise(resolve => setTimeout(resolve, this.config.turnDelay));
      }

    } catch (error) {
      this.emit('error', {
        agent: this.currentTurn,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        round: this.round
      });
      throw error;
    }
  }

  /**
   * Run the dialogue loop until stopped or max rounds reached
   */
  async runLoopUntilStopped(): Promise<void> {
    this.isRunning = true;
    this.emit('dialogue_started', { timestamp: new Date() });

    try {
      while (this.isRunning && this.round < (this.config.maxRounds || 10)) {
        if (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        await this.runOnce();
      }

      if (this.round >= (this.config.maxRounds || 10)) {
        this.emit('dialogue_completed', { 
          reason: 'max_rounds_reached',
          rounds: this.round,
          timestamp: new Date() 
        });
      }

    } catch (error) {
      this.emit('dialogue_error', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      throw error;
    } finally {
      this.isRunning = false;
      this.emit('dialogue_stopped', { timestamp: new Date() });
    }
  }

  /**
   * Stop the dialogue loop
   */
  stop(): void {
    this.isRunning = false;
    this.emit('dialogue_stopping', { timestamp: new Date() });
  }

  /**
   * Send prompt with streaming support
   */
  private async sendPromptWithStreaming(agent: BrowserAgentSession, prompt: string): Promise<string> {
    if (this.config.enableStreaming) {
      // Emit streaming start
      this.emit('streaming_start', {
        agent: this.currentTurn,
        prompt,
        timestamp: new Date()
      });

      // For now, we'll simulate streaming by emitting chunks
      // In a real implementation, this would integrate with the actual streaming API
      const response = await agent.sendPrompt(prompt);
      
      // Simulate streaming by emitting chunks
      const chunks = this.chunkResponse(response, 50);
      for (const chunk of chunks) {
        this.emit('streaming_chunk', {
          agent: this.currentTurn,
          chunk,
          timestamp: new Date()
        });
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
      }

      this.emit('streaming_end', {
        agent: this.currentTurn,
        response,
        timestamp: new Date()
      });

      return response;
    } else {
      return await agent.sendPrompt(prompt);
    }
  }

  /**
   * Get the last message from the other agent
   */
  private getLastMessageFromOtherAgent(): string | null {
    const otherAgent = this.currentTurn === 'A' ? 'B' : 'A';
    const lastMessage = this.conversationHistory
      .filter(entry => entry.agent === otherAgent)
      .pop();
    
    return lastMessage?.message || null;
  }

  /**
   * Get applicable interjections for the current turn
   */
  private getApplicableInterjections(): Interjection[] {
    return this.interjections.filter(interjection => {
      if (interjection.target && interjection.target !== 'both') {
        const targetAgent = interjection.target === 'A' ? 'A' : 'B';
        return targetAgent === this.currentTurn;
      }
      return true; // 'both' or no specific target
    }).sort((a, b) => {
      // Sort by priority (high first) and then by timestamp
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  /**
   * Apply interjections to the prompt
   */
  private applyInterjectionsToPrompt(basePrompt: string, interjections: Interjection[]): string {
    if (interjections.length === 0) return basePrompt;

    const primaryInterjection = interjections[0];
    
    switch (primaryInterjection.type) {
      case 'side_question':
        return `${basePrompt}\n\nSide question – ${primaryInterjection.text}`;
      
      case 'correction':
        return `${basePrompt}\n\nCorrection: ${primaryInterjection.text}`;
      
      case 'direction':
        return `${basePrompt}\n\nDirection: ${primaryInterjection.text}`;
      
      default:
        return basePrompt;
    }
  }

  /**
   * Clear processed interjections
   */
  private clearProcessedInterjections(processedInterjections: Interjection[]): void {
    const processedIds = new Set(processedInterjections.map(i => i.id));
    this.interjections = this.interjections.filter(i => !processedIds.has(i.id));
  }

  /**
   * Split response into chunks for streaming simulation
   */
  private chunkResponse(response: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < response.length; i += chunkSize) {
      chunks.push(response.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Array<{
    agent: 'A' | 'B';
    message: string;
    timestamp: Date;
    round: number;
    interjection?: Interjection;
  }> {
    return [...this.conversationHistory];
  }

  /**
   * Get pending interjections
   */
  getPendingInterjections(): Interjection[] {
    return [...this.interjections];
  }

  /**
   * Get current state
   */
  getState(): {
    isRunning: boolean;
    isPaused: boolean;
    currentTurn: 'A' | 'B';
    round: number;
    maxRounds: number;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentTurn: this.currentTurn,
      round: this.round,
      maxRounds: this.config.maxRounds || 10
    };
  }

  /**
   * Export dialogue state for persistence
   */
  exportState(): {
    config: DialogueConfig;
    conversationHistory: Array<{
      agent: 'A' | 'B';
      message: string;
      timestamp: Date;
      round: number;
      interjection?: Interjection;
    }>;
    currentTurn: 'A' | 'B';
    round: number;
  } {
    return {
      config: this.config,
      conversationHistory: this.conversationHistory,
      currentTurn: this.currentTurn,
      round: this.round
    };
  }

  /**
   * Import dialogue state from persistence
   */
  importState(state: {
    config: DialogueConfig;
    conversationHistory: Array<{
      agent: 'A' | 'B';
      message: string;
      timestamp: Date;
      round: number;
      interjection?: Interjection;
    }>;
    currentTurn: 'A' | 'B';
    round: number;
  }): void {
    this.config = { ...this.config, ...state.config };
    this.conversationHistory = state.conversationHistory.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));
    this.currentTurn = state.currentTurn;
    this.round = state.round;
  }

  /**
   * Close the dialogue and cleanup
   */
  async close(): Promise<void> {
    this.stop();
    await this.agentA.close();
    await this.agentB.close();
    this.emit('dialogue_closed', { timestamp: new Date() });
  }
} 