import { EventEmitter } from 'events';
import { AgentSession, DialogueExchange, Interjection } from '@chatpipes/ai-conductor';
import { Environment, AmbientEvent } from './Environment';
import { CrossTalkManager, CrossTalkEvent, SubscriptionMode } from './CrossTalkManager';
import { DualConversationManager, DualExchange, InnerThoughtConfig } from './DualConversationManager';

export interface ConvoThreadOptions {
  id: string;
  name?: string;
  participants: AgentSession[];
  pipingMode?: 'roundRobin' | 'turnTaking' | 'freeform' | 'moderated';
  environment?: Environment;
  interjectionRules?: InterjectionRule[];
  maxRounds?: number;
  turnDelay?: number;
  autoStart?: boolean;
  enableEavesdropping?: boolean;
  eavesdroppingRange?: number; // how far conversations can be overheard
  subscriptionMode?: SubscriptionMode; // New: subscription mode for cross-talk
  crossTalkManager?: CrossTalkManager; // New: reference to cross-talk manager
  enableDualConversation?: boolean; // New: enable dual conversation
  dualConversationConfig?: Partial<InnerThoughtConfig>; // New: dual conversation configuration
}

export interface InterjectionRule {
  condition: (exchange: DialogueExchange, state: any) => boolean;
  interjection: string | ((state: any) => string);
  priority: number;
  cooldownMs?: number;
  lastUsed?: Date;
}

export interface Transcript {
  id: string;
  round: number;
  from: string;
  to: string;
  prompt: string;
  response: string;
  timestamp: Date;
  ambientEvents: AmbientEvent[];
  interjections: Interjection[];
  metadata?: any;
  speakerId?: string; // New: speaker ID for dual conversation
  spoken?: string; // New: spoken dialogue
  unspoken?: InnerThought; // New: unspoken thought
}

export interface ConvoThreadState {
  isActive: boolean;
  isPaused: boolean;
  currentRound: number;
  currentSpeaker: number;
  participants: string[];
  environmentId?: string;
  startTime?: Date;
  lastActivity?: Date;
  totalExchanges: number;
  ambientEventCount: number;
  interjectionCount: number;
}

export class ConvoThread extends EventEmitter {
  public readonly id: string;
  public readonly name: string;
  public readonly participants: AgentSession[];
  public readonly environment?: Environment;
  
  private options: ConvoThreadOptions;
  private state: ConvoThreadState;
  private transcript: Transcript[] = [];
  private ambientEvents: AmbientEvent[] = [];
  private interjectionRules: InterjectionRule[];
  private currentSpeaker: number = 0;
  private isProcessing: boolean = false;
  private turnTimer?: NodeJS.Timeout;
  private crossTalkManager?: CrossTalkManager;
  private subscriptionMode: SubscriptionMode;
  private dualConversationManager?: DualConversationManager;
  private enableDualConversation: boolean;

  constructor(options: ConvoThreadOptions) {
    super();
    this.setMaxListeners(100);
    
    this.id = options.id;
    this.name = options.name || `Conversation ${options.id}`;
    this.participants = options.participants;
    this.environment = options.environment;
    this.crossTalkManager = options.crossTalkManager;
    this.subscriptionMode = options.subscriptionMode || 'flattened';
    this.enableDualConversation = options.enableDualConversation || false;
    
    this.options = {
      pipingMode: 'roundRobin',
      maxRounds: 10,
      turnDelay: 2000,
      autoStart: false,
      enableEavesdropping: true,
      eavesdroppingRange: 5,
      ...options
    };
    
    this.interjectionRules = options.interjectionRules || [];
    
    this.state = {
      isActive: false,
      isPaused: false,
      currentRound: 0,
      currentSpeaker: 0,
      participants: this.participants.map(p => p.id),
      environmentId: this.environment?.id,
      totalExchanges: 0,
      ambientEventCount: 0,
      interjectionCount: 0
    };

    // Initialize dual conversation manager if enabled
    if (this.enableDualConversation) {
      this.dualConversationManager = new DualConversationManager({
        enabled: true,
        probability: 0.3,
        maxThoughtsPerExchange: 1,
        thoughtTypes: ['observation', 'judgment', 'suspicion', 'admiration', 'doubt'],
        behavioralImpact: true,
        memoryRetention: 0.8,
        thoughtIntensity: 0.6,
        ...options.dualConversationConfig
      });

      // Forward dual conversation events
      this.dualConversationManager.on('dual_exchange_generated', (data) => {
        this.emit('dual_exchange', {
          threadId: this.id,
          exchange: data.exchange,
          timestamp: data.timestamp
        });
      });

      this.dualConversationManager.on('behavioral_state_updated', (data) => {
        this.emit('behavioral_state_updated', {
          threadId: this.id,
          agentId: data.agentId,
          thought: data.thought,
          newState: data.newState,
          timestamp: data.timestamp
        });
      });
    }

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for participants and environment
   */
  private setupEventListeners(): void {
    // Listen to participant events
    this.participants.forEach(participant => {
      participant.on('response_received', (data) => {
        this.handleParticipantResponse(participant, data);
      });

      participant.on('request_error', (data) => {
        this.emit('participant_error', {
          participantId: participant.id,
          error: data.error,
          timestamp: new Date()
        });
      });
    });

    // Listen to environment events
    if (this.environment) {
      this.environment.on('ambient_event', (data) => {
        this.handleAmbientEvent(data.event);
      });

      this.environment.on('state_updated', (data) => {
        this.emit('environment_state_changed', {
          environmentId: this.environment!.id,
          state: data.state,
          timestamp: new Date()
        });
      });
    }

    // Listen to cross-talk events if manager is available
    if (this.crossTalkManager) {
      this.crossTalkManager.on('cross_talk', (crossTalkEvent: CrossTalkEvent) => {
        if (crossTalkEvent.targetThreadId === this.id) {
          this.handleCrossTalkEvent(crossTalkEvent);
        }
      });
    }
  }

  /**
   * Handle cross-talk event
   */
  private handleCrossTalkEvent(crossTalkEvent: CrossTalkEvent): void {
    this.emit('cross_talk_received', {
      threadId: this.id,
      event: crossTalkEvent,
      timestamp: new Date()
    });

    // Inject cross-talk into current speaker if conversation is active
    if (this.state.isActive && !this.state.isPaused) {
      const currentParticipant = this.participants[this.currentSpeaker];
      this.crossTalkManager?.injectCrossTalk(currentParticipant, crossTalkEvent);
    }

    // Emit cross-talk event for all participants
    this.participants.forEach(participant => {
      participant.emit('cross_talk', {
        threadId: this.id,
        event: crossTalkEvent,
        timestamp: new Date()
      });
    });
  }

  /**
   * Start the conversation thread
   */
  async start(): Promise<void> {
    if (this.state.isActive) {
      throw new Error('Conversation thread is already active');
    }

    this.state.isActive = true;
    this.state.startTime = new Date();
    this.state.currentRound = 0;
    this.state.currentSpeaker = 0;

    // Register with cross-talk manager if available
    if (this.crossTalkManager && this.environment) {
      this.crossTalkManager.registerThread(this.id, this.environment.id);
    }

    this.emit('conversation_started', {
      threadId: this.id,
      participants: this.state.participants,
      environmentId: this.environment?.id,
      timestamp: new Date()
    });

    // Connect to environment if available
    if (this.environment) {
      this.environment.connect(this);
    }

    // Start the conversation loop
    await this.processNextTurn();
  }

  /**
   * Pause the conversation
   */
  pause(): void {
    if (!this.state.isActive || this.state.isPaused) return;

    this.state.isPaused = true;
    
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = undefined;
    }

    this.emit('conversation_paused', {
      threadId: this.id,
      timestamp: new Date()
    });
  }

  /**
   * Resume the conversation
   */
  async resume(): Promise<void> {
    if (!this.state.isActive || !this.state.isPaused) return;

    this.state.isPaused = false;

    this.emit('conversation_resumed', {
      threadId: this.id,
      timestamp: new Date()
    });

    await this.processNextTurn();
  }

  /**
   * Stop the conversation
   */
  async stop(): Promise<void> {
    if (!this.state.isActive) return;

    this.state.isActive = false;
    this.state.isPaused = false;

    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = undefined;
    }

    // Unregister from cross-talk manager
    if (this.crossTalkManager) {
      this.crossTalkManager.unregisterThread(this.id);
    }

    // Disconnect from environment
    if (this.environment) {
      this.environment.disconnect(this);
    }

    this.emit('conversation_stopped', {
      threadId: this.id,
      timestamp: new Date()
    });
  }

  /**
   * Process the next turn in the conversation
   */
  private async processNextTurn(): Promise<void> {
    if (!this.state.isActive || this.state.isPaused) return;

    // Check if we've reached max rounds
    if (this.options.maxRounds && this.state.currentRound >= this.options.maxRounds) {
      await this.stop();
      return;
    }

    this.state.currentRound++;
    this.state.lastActivity = new Date();

    const currentParticipant = this.participants[this.currentSpeaker];
    const nextParticipant = this.participants[(this.currentSpeaker + 1) % this.participants.length];

    this.emit('turn_started', {
      threadId: this.id,
      round: this.state.currentRound,
      currentSpeaker: currentParticipant.id,
      nextSpeaker: nextParticipant.id,
      timestamp: new Date()
    });

    // Create prompt based on piping mode
    const prompt = this.createPrompt(currentParticipant, nextParticipant);

    // Check for interjection rules
    const interjection = this.checkInterjectionRules(prompt);

    let finalPrompt = prompt;
    if (interjection) {
      finalPrompt = `${prompt}\n\n${interjection}`;
      this.state.interjectionCount++;
      
      this.emit('interjection_applied', {
        threadId: this.id,
        interjection,
        timestamp: new Date()
      });
    }

    // Send prompt to next participant
    try {
      const response = await nextParticipant.sendPrompt(finalPrompt);

      // Record exchange
      const exchange: DialogueExchange = {
        id: `exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: currentParticipant.id,
        to: nextParticipant.id,
        prompt: finalPrompt,
        response,
        round: this.state.currentRound,
        timestamp: new Date(),
        metadata: {
          ambientEvents: this.ambientEvents.slice(-5), // Last 5 ambient events
          interjection: interjection || null
        }
      };

      // Add to transcript
      const transcriptEntry: Transcript = {
        id: exchange.id,
        round: this.state.currentRound,
        from: currentParticipant.id,
        to: nextParticipant.id,
        prompt: finalPrompt,
        response,
        timestamp: exchange.timestamp,
        ambientEvents: this.ambientEvents.slice(-5),
        interjections: interjection ? [{ id: 'rule-interjection', interjection, timestamp: new Date() }] : [],
        metadata: exchange.metadata
      };

      this.transcript.push(transcriptEntry);
      this.state.totalExchanges++;

      this.emit('exchange', exchange);
      this.emit('transcript_updated', {
        threadId: this.id,
        transcript: this.transcript,
        timestamp: new Date()
      });

      // Move to next speaker
      this.currentSpeaker = (this.currentSpeaker + 1) % this.participants.length;
      this.state.currentSpeaker = this.currentSpeaker;

      // Schedule next turn
      if (this.options.turnDelay) {
        this.turnTimer = setTimeout(() => {
          this.processNextTurn();
        }, this.options.turnDelay);
      } else {
        await this.processNextTurn();
      }

    } catch (error) {
      this.emit('turn_error', {
        threadId: this.id,
        round: this.state.currentRound,
        error,
        timestamp: new Date()
      });

      // Continue to next turn after error
      this.currentSpeaker = (this.currentSpeaker + 1) % this.participants.length;
      this.state.currentSpeaker = this.currentSpeaker;
      
      if (this.options.turnDelay) {
        this.turnTimer = setTimeout(() => {
          this.processNextTurn();
        }, this.options.turnDelay);
      } else {
        await this.processNextTurn();
      }
    }
  }

  /**
   * Handle participant response with dual conversation support
   */
  private async handleParticipantResponse(participant: AgentSession, data: any): Promise<void> {
    const exchange: Transcript = {
      id: data.id || `exchange-${Date.now()}`,
      speakerId: participant.id,
      response: data.response,
      timestamp: new Date(),
      round: this.state.currentRound
    };

    // Generate dual exchange if enabled
    if (this.dualConversationManager && this.enableDualConversation) {
      const dualExchange = await this.dualConversationManager.generateDualExchange(
        participant,
        data.response,
        {
          threadId: this.id,
          round: this.state.currentRound,
          participants: this.state.participants,
          recentExchanges: this.dualConversationManager.getConversationHistory(5),
          targetParticipant: this.getCurrentTargetParticipant()
        }
      );

      // Update exchange with dual conversation data
      exchange.spoken = dualExchange.spoken;
      exchange.unspoken = dualExchange.unspoken;
      exchange.metadata = dualExchange.metadata;
    }

    this.transcript.push(exchange);
    this.state.totalExchanges++;

    this.emit('exchange', {
      threadId: this.id,
      exchange,
      timestamp: new Date()
    });

    // Move to next speaker
    this.moveToNextSpeaker();
  }

  /**
   * Get current target participant for thoughts
   */
  private getCurrentTargetParticipant(): string | undefined {
    const currentSpeakerId = this.participants[this.currentSpeaker]?.id;
    const otherParticipants = this.state.participants.filter(id => id !== currentSpeakerId);
    return otherParticipants.length > 0 ? otherParticipants[0] : undefined;
  }

  /**
   * Get dual conversation manager
   */
  getDualConversationManager(): DualConversationManager | undefined {
    return this.dualConversationManager;
  }

  /**
   * Get agent memory
   */
  getAgentMemory(agentId: string) {
    return this.dualConversationManager?.getAgentMemory(agentId);
  }

  /**
   * Get agent behavioral state
   */
  getAgentBehavioralState(agentId: string) {
    return this.dualConversationManager?.getAgentBehavioralState(agentId);
  }

  /**
   * Get agent thoughts
   */
  getAgentThoughts(agentId: string, limit: number = 50) {
    return this.dualConversationManager?.getAgentThoughts(agentId, limit) || [];
  }

  /**
   * Get relationship score between two agents
   */
  getRelationshipScore(agentId: string, targetId: string): number {
    return this.dualConversationManager?.getRelationshipScore(agentId, targetId) || 0;
  }

  /**
   * Get dual conversation history
   */
  getDualConversationHistory(limit: number = 100): DualExchange[] {
    return this.dualConversationManager?.getConversationHistory(limit) || [];
  }

  /**
   * Update dual conversation configuration
   */
  updateDualConversationConfig(updates: Partial<InnerThoughtConfig>): void {
    this.dualConversationManager?.updateConfig(updates);
  }

  /**
   * Get dual conversation configuration
   */
  getDualConversationConfig() {
    return this.dualConversationManager?.getConfig();
  }

  /**
   * Get dual conversation statistics
   */
  getDualConversationStats() {
    return this.dualConversationManager?.getStats();
  }

  /**
   * Format transcript for display with dual conversation
   */
  getFormattedTranscript(): string {
    if (!this.enableDualConversation) {
      return this.transcript.map(ex => `[${ex.speakerId}] ${ex.response}`).join('\n');
    }

    return this.transcript.map(ex => {
      let formatted = `[${ex.speakerId}] ${ex.spoken || ex.response}`;
      
      if (ex.unspoken) {
        formatted += `\n*${ex.unspoken.content}*`;
      }
      
      return formatted;
    }).join('\n\n');
  }

  /**
   * Handle ambient event from environment
   */
  private handleAmbientEvent(event: AmbientEvent): void {
    this.ambientEvents.push(event);
    this.state.ambientEventCount++;

    // Keep only recent ambient events
    if (this.ambientEvents.length > 50) {
      this.ambientEvents = this.ambientEvents.slice(-50);
    }

    this.emit('ambient_event', {
      threadId: this.id,
      event,
      timestamp: new Date()
    });

    // Check if any interjection rules should trigger
    this.checkAmbientInterjectionRules(event);
  }

  /**
   * Create prompt for next turn
   */
  private createPrompt(from: AgentSession, to: AgentSession): string {
    const recentExchanges = this.transcript.slice(-3);
    const context = recentExchanges.map(ex => 
      `${ex.from}: ${ex.response}`
    ).join('\n');

    const ambientContext = this.ambientEvents.length > 0 
      ? `\n\nAmbient context: ${this.ambientEvents[this.ambientEvents.length - 1].description}`
      : '';

    return `You are in a conversation with ${from.id}. 

Recent context:
${context}

${ambientContext}

Please respond naturally to continue the conversation.`;
  }

  /**
   * Check interjection rules
   */
  private checkInterjectionRules(prompt: string): string | null {
    const now = new Date();
    
    for (const rule of this.interjectionRules) {
      // Check cooldown
      if (rule.cooldownMs && rule.lastUsed) {
        const timeSinceLastUse = now.getTime() - rule.lastUsed.getTime();
        if (timeSinceLastUse < rule.cooldownMs) continue;
      }

      // Check condition
      const lastExchange = this.transcript[this.transcript.length - 1];
      if (lastExchange && rule.condition(lastExchange, this.environment?.getState())) {
        rule.lastUsed = now;
        
        const interjection = typeof rule.interjection === 'function' 
          ? rule.interjection(this.environment?.getState() || {})
          : rule.interjection;
          
        return interjection;
      }
    }

    return null;
  }

  /**
   * Check ambient interjection rules
   */
  private checkAmbientInterjectionRules(event: AmbientEvent): void {
    // High-intensity events might trigger immediate interjections
    if (event.intensity > 0.8) {
      this.emit('high_intensity_event', {
        threadId: this.id,
        event,
        timestamp: new Date()
      });
    }
  }

  /**
   * Manually interject into the conversation
   */
  interject(text: string): void {
    this.emit('manual_interjection', {
      threadId: this.id,
      interjection: text,
      timestamp: new Date()
    });

    // Add to transcript
    const interjectionEntry: Transcript = {
      id: `interjection-${Date.now()}`,
      round: this.state.currentRound,
      from: 'system',
      to: 'all',
      prompt: '',
      response: text,
      timestamp: new Date(),
      ambientEvents: [],
      interjections: [{ id: 'manual-interjection', interjection: text, timestamp: new Date() }]
    };

    this.transcript.push(interjectionEntry);
    this.state.interjectionCount++;
  }

  /**
   * Get conversation transcript
   */
  getTranscript(): Transcript[] {
    return [...this.transcript];
  }

  /**
   * Get conversation state
   */
  getState(): ConvoThreadState {
    return { ...this.state };
  }

  /**
   * Get ambient events
   */
  getAmbientEvents(limit: number = 50): AmbientEvent[] {
    return this.ambientEvents.slice(-limit);
  }

  /**
   * Add interjection rule
   */
  addInterjectionRule(rule: InterjectionRule): void {
    this.interjectionRules.push(rule);
  }

  /**
   * Remove interjection rule
   */
  removeInterjectionRule(condition: (rule: InterjectionRule) => boolean): void {
    this.interjectionRules = this.interjectionRules.filter(rule => !condition(rule));
  }

  /**
   * Move to the next speaker
   */
  private moveToNextSpeaker(): void {
    this.currentSpeaker = (this.currentSpeaker + 1) % this.participants.length;
    this.state.currentSpeaker = this.currentSpeaker;
  }

  /**
   * Get conversation statistics
   */
  getStats() {
    const baseStats = {
      id: this.id,
      name: this.name,
      state: this.state,
      participantCount: this.participants.length,
      transcriptLength: this.transcript.length,
      ambientEventCount: this.ambientEvents.length,
      interjectionRuleCount: this.interjectionRules.length,
      environmentId: this.environment?.id,
      subscriptionMode: this.subscriptionMode,
      activeSubscriptions: this.getActiveSubscriptions(),
      eavesdroppingHistoryCount: this.getEavesdroppingHistory().length,
      enableDualConversation: this.enableDualConversation
    };

    if (this.enableDualConversation) {
      return {
        ...baseStats,
        dualConversationStats: this.getDualConversationStats()
      };
    }

    return baseStats;
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.stop();
    
    if (this.dualConversationManager) {
      this.dualConversationManager.destroy();
    }
    
    this.transcript = [];
    this.ambientEvents = [];
    this.interjectionRules = [];
    this.removeAllListeners();
  }

  /**
   * Subscribe to another conversation thread
   */
  subscribeToThread(targetThreadId: string): void {
    if (this.crossTalkManager) {
      this.crossTalkManager.subscribeToThread(this.id, targetThreadId);
    }
  }

  /**
   * Unsubscribe from a conversation thread
   */
  unsubscribeFromThread(targetThreadId: string): void {
    if (this.crossTalkManager) {
      this.crossTalkManager.unsubscribeFromThread(this.id, targetThreadId);
    }
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return this.crossTalkManager?.getActiveSubscriptions(this.id) || [];
  }

  /**
   * Get eavesdropping history
   */
  getEavesdroppingHistory(limit: number = 10) {
    return this.crossTalkManager?.getEavesdroppingHistory(this.id, limit) || [];
  }

  /**
   * Simulate eavesdropping from this thread to another
   */
  simulateEavesdrop(targetThreadId: string, force: boolean = false) {
    if (this.crossTalkManager && this.environment) {
      return this.crossTalkManager.simulateEavesdrop(
        this.environment.id,
        this.id,
        targetThreadId,
        force
      );
    }
    return null;
  }

  /**
   * Get subscription mode
   */
  getSubscriptionMode(): SubscriptionMode {
    return this.subscriptionMode;
  }

  /**
   * Set subscription mode
   */
  setSubscriptionMode(mode: SubscriptionMode): void {
    this.subscriptionMode = mode;
    
    this.emit('subscription_mode_changed', {
      threadId: this.id,
      mode,
      timestamp: new Date()
    });
  }
} 