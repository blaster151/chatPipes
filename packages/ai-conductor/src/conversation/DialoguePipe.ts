import { EventEmitter } from 'events';
import { 
  Interjection, 
  Spectator, 
  PersonaConfig,
  PlatformConfig,
  BrowserAgentConfig 
} from '@chatpipes/types';
import { AgentSession } from '../core/AgentSession';
import { InterjectionManager } from '../core/InterjectionManager';
import { SessionManager } from '../core/SessionManager';
import { ObservabilityManager } from '../core/ObservabilityManager';

export interface DialoguePipeOptions {
  agentA: AgentSession;
  agentB: AgentSession;
  startWith: 'A' | 'B';
  autoStart?: boolean;
  interjections?: Interjection[];
  maxRounds?: number;
  turnDelay?: number;
  enableStreaming?: boolean;
  sessionManager?: SessionManager;
  sessionName?: string;
}

export interface Exchange {
  id: string;
  from: string;
  to: string;
  prompt: string;
  response: string;
  round: number;
  timestamp: Date;
  interjectionId?: string;
}

export interface Transcript {
  exchanges: Exchange[];
  interjections: Interjection[];
  metadata: {
    startTime: Date;
    endTime?: Date;
    totalRounds: number;
    totalExchanges: number;
  };
}

export class DialoguePipe extends EventEmitter {
  private interjectionManager: InterjectionManager;
  private sessionManager?: SessionManager;
  private observabilityManager: ObservabilityManager;
  private isRunning = false;
  private isPaused = false;
  private currentRound = 0;
  private exchanges: Exchange[] = [];
  private spectators: Spectator[] = [];
  private sessionId?: string;

  constructor(private options: DialoguePipeOptions) {
    super();
    this.setMaxListeners(100);
    
    this.interjectionManager = new InterjectionManager();
    this.sessionManager = options.sessionManager;
    
    // Initialize observability manager
    this.observabilityManager = new ObservabilityManager({
      enableReplay: true,
      maxHistorySize: 10000,
      persistToFile: options.sessionManager ? true : false,
      autoSaveInterval: 30000,
      enableLiveStreaming: true
    });
    
    // Forward observability events
    this.observabilityManager.on('exchange', (exchange) => {
      this.emit('exchange', exchange);
    });
    
    this.observabilityManager.on('replay_exchange', (event) => {
      this.emit('replay_exchange', event);
    });
    
    // Initialize session if manager provided
    if (this.sessionManager && options.sessionName) {
      this.initializeSession();
    }
    
    // Add initial interjections
    if (options.interjections) {
      options.interjections.forEach(interjection => {
        this.interjectionManager.addInterjection(interjection, 'both');
      });
    }
    
    // Auto-start if requested
    if (options.autoStart) {
      this.start();
    }
  }

  /**
   * Start the dialogue
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Dialogue is already running');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.currentRound = 0;

    // Initialize agents if needed
    await this.ensureAgentsInitialized();

    // Start dialogue loop
    this.runDialogueLoop();
  }

  /**
   * Pause the dialogue
   */
  pause(): void {
    if (!this.isRunning) {
      throw new Error('Dialogue is not running');
    }

    this.isPaused = true;
    this.emit('paused');
  }

  /**
   * Resume the dialogue
   */
  resume(): void {
    if (!this.isRunning) {
      throw new Error('Dialogue is not running');
    }

    this.isPaused = false;
    this.emit('resumed');
  }

  /**
   * Stop the dialogue
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.emit('stopped');
  }

  /**
   * Add interjection
   */
  interject(text: string, options?: {
    target?: 'A' | 'B' | 'both';
    priority?: 'low' | 'medium' | 'high';
    type?: 'side_question' | 'correction' | 'direction' | 'pause' | 'resume';
  }): void {
    const interjection: Interjection = {
      id: `interjection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: options?.type || 'side_question',
      text,
      target: options?.target || 'both',
      priority: options?.priority || 'medium',
      timestamp: new Date()
    };

    this.interjectionManager.addInterjection(interjection, 'both');
    this.emit('interjection', { interjection });
  }

  /**
   * Get transcript
   */
  getTranscript(): Transcript {
    return {
      exchanges: [...this.exchanges],
      interjections: this.interjectionManager.getAllInterjections().map(item => item.interjection),
      metadata: {
        startTime: this.exchanges[0]?.timestamp || new Date(),
        endTime: this.isRunning ? undefined : this.exchanges[this.exchanges.length - 1]?.timestamp,
        totalRounds: this.currentRound,
        totalExchanges: this.exchanges.length
      }
    };
  }

  /**
   * Add spectator
   */
  addSpectator(spectator: Spectator): void {
    this.spectators.push(spectator);
  }

  /**
   * Remove spectator
   */
  removeSpectator(spectatorId: string): void {
    this.spectators = this.spectators.filter(s => s.id !== spectatorId);
  }

  /**
   * Ensure agents are initialized
   */
  private async ensureAgentsInitialized(): Promise<void> {
    const agentAStats = this.options.agentA.getStats();
    const agentBStats = this.options.agentB.getStats();

    if (!agentAStats.isInitialized) {
      await this.options.agentA.init();
    }

    if (!agentBStats.isInitialized) {
      await this.options.agentB.init();
    }
  }

  /**
   * Run the main dialogue loop
   */
  private async runDialogueLoop(): Promise<void> {
    const maxRounds = this.options.maxRounds || 10;
    const turnDelay = this.options.turnDelay || 2000;

    while (this.isRunning && this.currentRound < maxRounds) {
      if (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      this.currentRound++;

      try {
        // Determine who goes first this round
        const firstAgent = this.currentRound === 1 ? this.options.startWith : 
          (this.currentRound % 2 === 1 ? 'A' : 'B');
        
        const secondAgent = firstAgent === 'A' ? 'B' : 'A';

        // First exchange
        await this.performExchange(firstAgent, secondAgent);

        // Second exchange
        await this.performExchange(secondAgent, firstAgent);

        // Delay between rounds
        if (this.isRunning && this.currentRound < maxRounds) {
          await new Promise(resolve => setTimeout(resolve, turnDelay));
        }

      } catch (error) {
        this.emit('error', { error, round: this.currentRound });
        break;
      }
    }

    this.isRunning = false;
    this.emit('completed', { totalRounds: this.currentRound });
  }

  /**
   * Perform a single exchange between two agents
   */
  private async performExchange(fromAgent: 'A' | 'B', toAgent: 'A' | 'B'): Promise<void> {
    const fromSession = fromAgent === 'A' ? this.options.agentA : this.options.agentB;
    const toSession = toAgent === 'A' ? this.options.agentA : this.options.agentB;

    // Create prompt
    const prompt = this.createPrompt(fromAgent, toAgent);

    // Check for interjections
    const pendingInterjection = this.interjectionManager.getNextInterjection(toSession.getStats().browserStats?.identityId || 'unknown');
    
    let finalPrompt = prompt;
    let appliedInterjectionId: string | null = null;

    if (pendingInterjection) {
      finalPrompt = this.interjectionManager.applyInterjection(prompt, pendingInterjection.interjection);
      appliedInterjectionId = pendingInterjection.id;
      this.interjectionManager.markApplied(pendingInterjection.id);
    }

    // Emit turn start event
    this.emitTurnEvent('turn_start', {
      round: this.currentRound,
      agentName: `${fromAgent} → ${toAgent}`,
      timestamp: new Date()
    });

    // Send prompt and get response
    const response = await toSession.sendPrompt(finalPrompt);

    // Create exchange record
    const exchange: Exchange = {
      id: `exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: fromAgent,
      to: toAgent,
      prompt: finalPrompt,
      response,
      round: this.currentRound,
      timestamp: new Date(),
      interjectionId: appliedInterjectionId
    };

    // Record exchange in observability manager
    this.observabilityManager.recordExchange(exchange);

    // Record exchange in session manager
    if (this.sessionManager && this.sessionId) {
      this.sessionManager.recordExchange({
        id: exchange.id,
        from: fromAgent,
        to: toAgent,
        prompt: finalPrompt,
        response,
        round: this.currentRound,
        timestamp: exchange.timestamp,
        metadata: {
          duration: 0,
          tokens: 0,
          platform: toAgent,
          model: 'unknown',
          interjectionId: appliedInterjectionId
        }
      });
    }

    // Emit turn end event
    this.emitTurnEvent('turn_end', {
      round: this.currentRound,
      agentName: `${fromAgent} → ${toAgent}`,
      message: response,
      timestamp: new Date()
    });
  }

  /**
   * Create prompt for exchange
   */
  private createPrompt(fromAgent: 'A' | 'B', toAgent: 'A' | 'B'): string {
    // Get recent context
    const recentExchanges = this.exchanges.slice(-3);
    
    if (recentExchanges.length === 0) {
      return "Hello! Let's start a conversation. What would you like to discuss?";
    }

    const context = recentExchanges
      .map(exchange => `${exchange.from}: ${exchange.response}`)
      .join('\n');

    return `Based on this conversation context:\n\n${context}\n\nPlease continue the conversation naturally.`;
  }

  /**
   * Emit turn events to spectators
   */
  private emitTurnEvent(type: 'turn_start' | 'turn_end', data: any): void {
    this.spectators.forEach(spectator => {
      if (spectator.onTurnEvent) {
        spectator.onTurnEvent({
          type,
          ...data
        });
      }
    });
  }

  /**
   * Emit dialogue events to spectators
   */
  private emitDialogueEvent(type: string, data: any): void {
    this.spectators.forEach(spectator => {
      if (spectator.onDialogueEvent) {
        spectator.onDialogueEvent({
          type,
          timestamp: new Date(),
          data
        });
      }
    });
  }

  /**
   * Initialize session in session manager
   */
  private initializeSession(): void {
    if (!this.sessionManager || !this.options.sessionName) return;

    const session = this.sessionManager.createSession(
      this.options.sessionName,
      'pipe',
      [
        { id: 'A', name: 'Agent A', platform: 'unknown', isActive: true },
        { id: 'B', name: 'Agent B', platform: 'unknown', isActive: true }
      ],
      {
        maxRounds: this.options.maxRounds,
        turnDelay: this.options.turnDelay,
        enableStreaming: this.options.enableStreaming
      }
    );

    this.sessionId = session.id;
  }

  /**
   * Type-safe event listeners
   */
  on(event: 'exchange', listener: (data: Exchange) => void): this;
  on(event: 'interjection', listener: (data: { interjection: Interjection }) => void): this;
  on(event: 'error', listener: (data: { error: Error; round?: number }) => void): this;
  on(event: 'paused', listener: () => void): this;
  on(event: 'resumed', listener: () => void): this;
  on(event: 'stopped', listener: () => void): this;
  on(event: 'completed', listener: (data: { totalRounds: number }) => void): this;
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * Type-safe event emitters
   */
  emit(event: 'exchange', data: Exchange): boolean;
  emit(event: 'interjection', data: { interjection: Interjection }): boolean;
  emit(event: 'error', data: { error: Error; round?: number }): boolean;
  emit(event: 'paused'): boolean;
  emit(event: 'resumed'): boolean;
  emit(event: 'stopped'): boolean;
  emit(event: 'completed', data: { totalRounds: number }): boolean;
  emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Create replay session from current dialogue
   */
  createReplaySession(options?: ReplayOptions): string {
    const exchanges = this.observabilityManager.getAllExchanges();
    return this.observabilityManager.createReplaySession(exchanges, {
      sessionName: this.options.sessionName || 'Dialogue Replay',
      ...options
    });
  }

  /**
   * Start replay session
   */
  async startReplay(sessionId: string): Promise<void> {
    await this.observabilityManager.startReplay(sessionId);
  }

  /**
   * Pause replay
   */
  pauseReplay(sessionId: string): void {
    this.observabilityManager.pauseReplay(sessionId);
  }

  /**
   * Resume replay
   */
  resumeReplay(sessionId: string): void {
    this.observabilityManager.resumeReplay(sessionId);
  }

  /**
   * Stop replay
   */
  stopReplay(sessionId: string): void {
    this.observabilityManager.stopReplay(sessionId);
  }

  /**
   * Jump to specific exchange in replay
   */
  jumpToExchange(sessionId: string, index: number): void {
    this.observabilityManager.jumpToExchange(sessionId, index);
  }

  /**
   * Get replay state
   */
  getReplayState(sessionId: string): ReplayState | null {
    return this.observabilityManager.getReplayState(sessionId);
  }

  /**
   * Get all exchanges
   */
  getAllExchanges(): DialogueExchange[] {
    return this.observabilityManager.getAllExchanges();
  }

  /**
   * Get exchanges by filter
   */
  getExchangesByFilter(filter: {
    agentId?: string;
    round?: number;
    startTime?: Date;
    endTime?: Date;
    hasInterjection?: boolean;
  }): DialogueExchange[] {
    return this.observabilityManager.getExchangesByFilter(filter);
  }

  /**
   * Export replay session
   */
  exportReplaySession(sessionId: string): string {
    return this.observabilityManager.exportReplaySession(sessionId);
  }

  /**
   * Import replay session
   */
  importReplaySession(jsonData: string): string {
    return this.observabilityManager.importReplaySession(jsonData);
  }

  /**
   * Get observability statistics
   */
  getObservabilityStats() {
    return this.observabilityManager.getStats();
  }
} 