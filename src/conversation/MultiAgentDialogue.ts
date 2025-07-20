import { BrowserAgentSession } from '../core/BrowserAgentSession';
import { EventEmitter } from 'events';

export interface AgentInfo {
  id: string;
  name: string;
  session: BrowserAgentSession;
  isActive: boolean;
}

export interface TurnContext {
  agentId: string;
  agentName: string;
  round: number;
  turn: number;
  previousMessages: Array<{
    agentId: string;
    agentName: string;
    message: string;
    timestamp: Date;
  }>;
  synthesizedContext: string;
}

export interface TurnEvent {
  type: 'turn_start' | 'turn_end' | 'context_synthesized' | 'agent_skipped';
  agentId: string;
  agentName: string;
  round: number;
  turn: number;
  message?: string;
  context?: string;
  timestamp: Date;
}

export interface MultiAgentConfig {
  maxRounds?: number;
  turnDelay?: number;
  enableStreaming?: boolean;
  contextWindow?: number; // How many previous messages to include in context
  synthesisStrategy?: 'all' | 'recent' | 'weighted'; // How to synthesize context
  skipInactiveAgents?: boolean;
  allowInterruptions?: boolean;
}

export class MultiAgentDialogue extends EventEmitter {
  private agents: AgentInfo[] = [];
  private history: Array<{
    agentId: string;
    agentName: string;
    message: string;
    round: number;
    turn: number;
    timestamp: Date;
  }> = [];
  private round: number = 0;
  private turn: number = 0;
  private config: MultiAgentConfig;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentAgentIndex: number = 0;

  constructor(agents: Array<{ id: string; name: string; session: BrowserAgentSession }>, config: MultiAgentConfig = {}) {
    super();
    
    this.agents = agents.map(agent => ({
      ...agent,
      isActive: true
    }));
    
    this.config = {
      maxRounds: 10,
      turnDelay: 1000,
      enableStreaming: true,
      contextWindow: 5,
      synthesisStrategy: 'recent',
      skipInactiveAgents: true,
      allowInterruptions: false,
      ...config
    };
  }

  /**
   * Get the next agent in round-robin order
   */
  private getNextAgent(): AgentInfo | null {
    if (this.agents.length === 0) return null;

    let attempts = 0;
    const maxAttempts = this.agents.length;

    while (attempts < maxAttempts) {
      const agent = this.agents[this.currentAgentIndex];
      
      if (agent.isActive || !this.config.skipInactiveAgents) {
        return agent;
      }

      this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length;
      attempts++;
    }

    return null; // No active agents found
  }

  /**
   * Synthesize context from previous messages
   */
  private synthesizeContext(agentId: string): string {
    const contextWindow = this.config.contextWindow || 5;
    const recentMessages = this.history
      .slice(-contextWindow)
      .filter(msg => msg.agentId !== agentId); // Exclude messages from current agent

    if (recentMessages.length === 0) {
      return "Start the conversation.";
    }

    const strategy = this.config.synthesisStrategy || 'recent';

    switch (strategy) {
      case 'all':
        return this.synthesizeAllContext(recentMessages);
      
      case 'recent':
        return this.synthesizeRecentContext(recentMessages);
      
      case 'weighted':
        return this.synthesizeWeightedContext(recentMessages);
      
      default:
        return this.synthesizeRecentContext(recentMessages);
    }
  }

  /**
   * Synthesize context using all messages
   */
  private synthesizeAllContext(messages: Array<{ agentId: string; agentName: string; message: string }>): string {
    const contextParts = messages.map(msg => `${msg.agentName}: ${msg.message}`);
    return `In reply to what was just said:\n${contextParts.join('\n')}`;
  }

  /**
   * Synthesize context using only the most recent messages
   */
  private synthesizeRecentContext(messages: Array<{ agentId: string; agentName: string; message: string }>): string {
    if (messages.length === 0) return "Start the conversation.";

    const lastMessage = messages[messages.length - 1];
    const otherMessages = messages.slice(0, -1);

    if (otherMessages.length === 0) {
      return `Respond to ${lastMessage.agentName}: "${lastMessage.message}"`;
    }

    const otherAgents = otherMessages.map(msg => msg.agentName).join(' and ');
    return `In reply to what ${otherAgents} and ${lastMessage.agentName} just said:\n${messages.map(msg => `${msg.agentName}: ${msg.message}`).join('\n')}`;
  }

  /**
   * Synthesize context with weighted importance (more recent = higher weight)
   */
  private synthesizeWeightedContext(messages: Array<{ agentId: string; agentName: string; message: string }>): string {
    if (messages.length === 0) return "Start the conversation.";

    const weightedMessages = messages.map((msg, index) => ({
      ...msg,
      weight: index + 1 // More recent messages have higher weight
    }));

    // Group by agent and create weighted summaries
    const agentSummaries = new Map<string, { name: string; messages: string[]; totalWeight: number }>();
    
    weightedMessages.forEach(msg => {
      if (!agentSummaries.has(msg.agentId)) {
        agentSummaries.set(msg.agentId, { name: msg.agentName, messages: [], totalWeight: 0 });
      }
      const summary = agentSummaries.get(msg.agentId)!;
      summary.messages.push(msg.message);
      summary.totalWeight += msg.weight;
    });

    const contextParts = Array.from(agentSummaries.values()).map(summary => {
      const latestMessage = summary.messages[summary.messages.length - 1];
      return `${summary.name} (${summary.messages.length} messages): "${latestMessage}"`;
    });

    return `Responding to the conversation:\n${contextParts.join('\n')}`;
  }

  /**
   * Execute the next turn in the round-robin
   */
  async nextTurn(): Promise<void> {
    if (this.isPaused) {
      throw new Error('Dialogue is paused. Call resume() first.');
    }

    const agent = this.getNextAgent();
    if (!agent) {
      throw new Error('No active agents available for next turn.');
    }

    // Create turn context
    const turnContext: TurnContext = {
      agentId: agent.id,
      agentName: agent.name,
      round: this.round,
      turn: this.turn,
      previousMessages: this.history.slice(-(this.config.contextWindow || 5)).map(msg => ({
        agentId: msg.agentId,
        agentName: msg.agentName,
        message: msg.message,
        timestamp: msg.timestamp
      })),
      synthesizedContext: this.synthesizeContext(agent.id)
    };

    // Emit turn start event
    const turnStartEvent: TurnEvent = {
      type: 'turn_start',
      agentId: agent.id,
      agentName: agent.name,
      round: this.round,
      turn: this.turn,
      timestamp: new Date()
    };
    this.emit('turn_start', turnStartEvent);

    // Emit context synthesized event
    const contextEvent: TurnEvent = {
      type: 'context_synthesized',
      agentId: agent.id,
      agentName: agent.name,
      round: this.round,
      turn: this.turn,
      context: turnContext.synthesizedContext,
      timestamp: new Date()
    };
    this.emit('context_synthesized', contextEvent);

    try {
      // Send prompt with synthesized context
      const response = await this.sendPromptWithStreaming(agent.session, turnContext.synthesizedContext);

      // Record the message
      this.history.push({
        agentId: agent.id,
        agentName: agent.name,
        message: response,
        round: this.round,
        turn: this.turn,
        timestamp: new Date()
      });

      // Emit turn end event
      const turnEndEvent: TurnEvent = {
        type: 'turn_end',
        agentId: agent.id,
        agentName: agent.name,
        round: this.round,
        turn: this.turn,
        message: response,
        timestamp: new Date()
      };
      this.emit('turn_end', turnEndEvent);

      // Move to next agent
      this.currentAgentIndex = (this.currentAgentIndex + 1) % this.agents.length;
      this.turn++;

      // Check if we've completed a full round
      if (this.currentAgentIndex === 0) {
        this.round++;
      }

      // Apply delay between turns
      if (this.config.turnDelay) {
        await new Promise(resolve => setTimeout(resolve, this.config.turnDelay));
      }

    } catch (error) {
      this.emit('error', {
        agentId: agent.id,
        agentName: agent.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        round: this.round,
        turn: this.turn
      });
      throw error;
    }
  }

  /**
   * Send prompt with streaming support
   */
  private async sendPromptWithStreaming(agent: BrowserAgentSession, prompt: string): Promise<string> {
    if (this.config.enableStreaming) {
      // Emit streaming start
      this.emit('streaming_start', {
        prompt,
        timestamp: new Date()
      });

      // For now, we'll simulate streaming by emitting chunks
      const response = await agent.sendPrompt(prompt);
      
      // Simulate streaming by emitting chunks
      const chunks = this.chunkResponse(response, 50);
      for (const chunk of chunks) {
        this.emit('streaming_chunk', {
          chunk,
          timestamp: new Date()
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      this.emit('streaming_end', {
        response,
        timestamp: new Date()
      });

      return response;
    } else {
      return await agent.sendPrompt(prompt);
    }
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

        await this.nextTurn();
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
   * Pause the dialogue
   */
  pause(): void {
    this.isPaused = true;
    this.emit('dialogue_paused', { timestamp: new Date() });
  }

  /**
   * Resume the dialogue
   */
  resume(): void {
    this.isPaused = false;
    this.emit('dialogue_resumed', { timestamp: new Date() });
  }

  /**
   * Stop the dialogue loop
   */
  stop(): void {
    this.isRunning = false;
    this.emit('dialogue_stopping', { timestamp: new Date() });
  }

  /**
   * Set agent active/inactive status
   */
  setAgentActive(agentId: string, isActive: boolean): void {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
      agent.isActive = isActive;
      this.emit('agent_status_changed', {
        agentId,
        agentName: agent.name,
        isActive,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get current state
   */
  getState(): {
    isRunning: boolean;
    isPaused: boolean;
    round: number;
    turn: number;
    currentAgentIndex: number;
    maxRounds: number;
    agents: Array<{ id: string; name: string; isActive: boolean }>;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      round: this.round,
      turn: this.turn,
      currentAgentIndex: this.currentAgentIndex,
      maxRounds: this.config.maxRounds || 10,
      agents: this.agents.map(a => ({ id: a.id, name: a.name, isActive: a.isActive }))
    };
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{
    agentId: string;
    agentName: string;
    message: string;
    round: number;
    turn: number;
    timestamp: Date;
  }> {
    return [...this.history];
  }

  /**
   * Get agents
   */
  getAgents(): AgentInfo[] {
    return [...this.agents];
  }

  /**
   * Export dialogue state for persistence
   */
  exportState(): {
    config: MultiAgentConfig;
    history: Array<{
      agentId: string;
      agentName: string;
      message: string;
      round: number;
      turn: number;
      timestamp: Date;
    }>;
    round: number;
    turn: number;
    currentAgentIndex: number;
    agents: Array<{ id: string; name: string; isActive: boolean }>;
  } {
    return {
      config: this.config,
      history: this.history,
      round: this.round,
      turn: this.turn,
      currentAgentIndex: this.currentAgentIndex,
      agents: this.agents.map(a => ({ id: a.id, name: a.name, isActive: a.isActive }))
    };
  }

  /**
   * Import dialogue state from persistence
   */
  importState(state: {
    config: MultiAgentConfig;
    history: Array<{
      agentId: string;
      agentName: string;
      message: string;
      round: number;
      turn: number;
      timestamp: Date;
    }>;
    round: number;
    turn: number;
    currentAgentIndex: number;
    agents: Array<{ id: string; name: string; isActive: boolean }>;
  }): void {
    this.config = { ...this.config, ...state.config };
    this.history = state.history.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));
    this.round = state.round;
    this.turn = state.turn;
    this.currentAgentIndex = state.currentAgentIndex;
    
    // Update agent status
    state.agents.forEach(agentState => {
      const agent = this.agents.find(a => a.id === agentState.id);
      if (agent) {
        agent.isActive = agentState.isActive;
      }
    });
  }

  /**
   * Close the dialogue and cleanup
   */
  async close(): Promise<void> {
    this.stop();
    
    for (const agent of this.agents) {
      await agent.session.close();
    }
    
    this.emit('dialogue_closed', { timestamp: new Date() });
  }
} 