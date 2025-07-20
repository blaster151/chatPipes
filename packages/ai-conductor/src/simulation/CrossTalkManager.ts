import { EventEmitter } from 'events';
import { ConvoThread, Transcript } from './ConvoThread';
import { Environment } from './Environment';
import { AgentSession } from '../core/AgentSession';

export type SubscriptionMode = 'flattened' | 'unflattened' | 'both' | 'none';

export interface CrossTalkConfig {
  enabled: boolean;
  subscriptionMode: SubscriptionMode;
  eavesdroppingRange: number; // how far conversations can be overheard
  eavesdroppingChance: number; // 0-1 probability of eavesdropping
  maxOverheardExchanges: number; // max exchanges to include in eavesdropping
  includeAmbientContext: boolean; // whether to include ambient events
  crossTalkCooldown: number; // milliseconds between cross-talk events
  enableInterruption: boolean; // whether agents can interrupt overheard conversations
}

export interface OverheardExchange {
  speaker: string;
  text: string;
  timestamp: Date;
  round: number;
  ambientEvents?: string[];
}

export interface CrossTalkEvent {
  id: string;
  sourceThreadId: string;
  targetThreadId: string;
  environmentId: string;
  mode: SubscriptionMode;
  content: string | OverheardExchange[];
  intensity: number;
  timestamp: Date;
  metadata?: {
    distance: number;
    noiseLevel: number;
    crowdDensity: number;
    speakerCount: number;
  };
}

export interface EavesdroppingContext {
  threadId: string;
  environmentId: string;
  recentExchanges: OverheardExchange[];
  ambientContext: string[];
  noiseLevel: number;
  crowdDensity: number;
  timestamp: Date;
}

export class CrossTalkManager extends EventEmitter {
  private config: CrossTalkConfig;
  private activeSubscriptions: Map<string, Set<string>> = new Map(); // threadId -> Set of subscribed threadIds
  private eavesdroppingHistory: Map<string, EavesdroppingContext[]> = new Map(); // threadId -> history
  private lastCrossTalkTime: Map<string, number> = new Map(); // threadId -> last cross-talk timestamp
  private environmentThreads: Map<string, Set<string>> = new Map(); // environmentId -> Set of threadIds

  constructor(config: Partial<CrossTalkConfig> = {}) {
    super();
    this.setMaxListeners(100);
    
    this.config = {
      enabled: true,
      subscriptionMode: 'flattened',
      eavesdroppingRange: 3,
      eavesdroppingChance: 0.3,
      maxOverheardExchanges: 3,
      includeAmbientContext: true,
      crossTalkCooldown: 30000,
      enableInterruption: false,
      ...config
    };
  }

  /**
   * Register a conversation thread with an environment
   */
  registerThread(threadId: string, environmentId: string): void {
    if (!this.environmentThreads.has(environmentId)) {
      this.environmentThreads.set(environmentId, new Set());
    }
    this.environmentThreads.get(environmentId)!.add(threadId);

    // Initialize eavesdropping history
    if (!this.eavesdroppingHistory.has(threadId)) {
      this.eavesdroppingHistory.set(threadId, []);
    }

    this.emit('thread_registered', {
      threadId,
      environmentId,
      timestamp: new Date()
    });
  }

  /**
   * Unregister a conversation thread
   */
  unregisterThread(threadId: string): void {
    // Remove from all environment mappings
    for (const [envId, threads] of this.environmentThreads.entries()) {
      threads.delete(threadId);
    }

    // Remove from active subscriptions
    this.activeSubscriptions.delete(threadId);
    this.eavesdroppingHistory.delete(threadId);
    this.lastCrossTalkTime.delete(threadId);

    this.emit('thread_unregistered', {
      threadId,
      timestamp: new Date()
    });
  }

  /**
   * Subscribe one thread to another's conversations
   */
  subscribeToThread(subscriberId: string, targetId: string): void {
    if (!this.activeSubscriptions.has(subscriberId)) {
      this.activeSubscriptions.set(subscriberId, new Set());
    }
    this.activeSubscriptions.get(subscriberId)!.add(targetId);

    this.emit('subscription_created', {
      subscriberId,
      targetId,
      timestamp: new Date()
    });
  }

  /**
   * Unsubscribe from a thread
   */
  unsubscribeFromThread(subscriberId: string, targetId: string): void {
    const subscriptions = this.activeSubscriptions.get(subscriberId);
    if (subscriptions) {
      subscriptions.delete(targetId);
    }

    this.emit('subscription_removed', {
      subscriberId,
      targetId,
      timestamp: new Date()
    });
  }

  /**
   * Simulate eavesdropping between threads in the same environment
   */
  simulateEavesdrop(
    environmentId: string, 
    sourceThreadId: string, 
    targetThreadId: string,
    force: boolean = false
  ): CrossTalkEvent | null {
    if (!this.config.enabled) return null;

    // Check cooldown
    const lastTime = this.lastCrossTalkTime.get(sourceThreadId) || 0;
    const now = Date.now();
    if (!force && (now - lastTime) < this.config.crossTalkCooldown) {
      return null;
    }

    // Check if threads are in the same environment
    const envThreads = this.environmentThreads.get(environmentId);
    if (!envThreads || !envThreads.has(sourceThreadId) || !envThreads.has(targetThreadId)) {
      return null;
    }

    // Calculate eavesdropping probability
    const baseChance = this.config.eavesdroppingChance;
    const distance = this.calculateDistance(sourceThreadId, targetThreadId);
    const distanceFactor = Math.max(0, 1 - (distance / this.config.eavesdroppingRange));
    const finalChance = baseChance * distanceFactor;

    if (!force && Math.random() > finalChance) {
      return null;
    }

    // Get recent exchanges from source thread
    const sourceContext = this.getEavesdroppingContext(sourceThreadId, environmentId);
    if (!sourceContext || sourceContext.recentExchanges.length === 0) {
      return null;
    }

    // Create cross-talk event based on subscription mode
    const crossTalkEvent = this.createCrossTalkEvent(
      sourceThreadId,
      targetThreadId,
      environmentId,
      sourceContext
    );

    // Update last cross-talk time
    this.lastCrossTalkTime.set(sourceThreadId, now);

    // Store in eavesdropping history
    this.storeEavesdroppingContext(targetThreadId, sourceContext);

    // Emit event
    this.emit('cross_talk', crossTalkEvent);

    return crossTalkEvent;
  }

  /**
   * Get eavesdropping context for a thread
   */
  private getEavesdroppingContext(threadId: string, environmentId: string): EavesdroppingContext | null {
    // This would typically get data from the actual thread
    // For now, we'll create a mock context
    const recentExchanges: OverheardExchange[] = [
      {
        speaker: 'Alice',
        text: 'I told you to wear a jacket.',
        timestamp: new Date(Date.now() - 5000),
        round: 1
      },
      {
        speaker: 'Bob',
        text: "It's too cold.",
        timestamp: new Date(Date.now() - 3000),
        round: 1
      },
      {
        speaker: 'Alice',
        text: 'Well, you should have listened to me.',
        timestamp: new Date(Date.now() - 1000),
        round: 2
      }
    ];

    return {
      threadId,
      environmentId,
      recentExchanges: recentExchanges.slice(-this.config.maxOverheardExchanges),
      ambientContext: this.config.includeAmbientContext ? [
        'The espresso machine hisses.',
        'A couple laughs softly.'
      ] : [],
      noiseLevel: 0.4,
      crowdDensity: 0.6,
      timestamp: new Date()
    };
  }

  /**
   * Create cross-talk event based on subscription mode
   */
  private createCrossTalkEvent(
    sourceThreadId: string,
    targetThreadId: string,
    environmentId: string,
    context: EavesdroppingContext
  ): CrossTalkEvent {
    const mode = this.config.subscriptionMode;
    let content: string | OverheardExchange[];

    switch (mode) {
      case 'flattened':
        content = this.createFlattenedContent(context);
        break;
      case 'unflattened':
        content = context.recentExchanges;
        break;
      case 'both':
        content = {
          flattened: this.createFlattenedContent(context),
          unflattened: context.recentExchanges
        } as any;
        break;
      default:
        content = this.createFlattenedContent(context);
    }

    return {
      id: `crosstalk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceThreadId,
      targetThreadId,
      environmentId,
      mode,
      content,
      intensity: this.calculateIntensity(context),
      timestamp: new Date(),
      metadata: {
        distance: this.calculateDistance(sourceThreadId, targetThreadId),
        noiseLevel: context.noiseLevel,
        crowdDensity: context.crowdDensity,
        speakerCount: context.recentExchanges.length
      }
    };
  }

  /**
   * Create flattened content for eavesdropping
   */
  private createFlattenedContent(context: EavesdroppingContext): string {
    const exchanges = context.recentExchanges.map(ex => 
      `[${ex.speaker}] ${ex.text}`
    ).join(' ');

    let content = `A nearby table is having this exchange: ${exchanges}`;

    if (this.config.includeAmbientContext && context.ambientContext.length > 0) {
      content += ` (Background: ${context.ambientContext.join(', ')})`;
    }

    return content;
  }

  /**
   * Calculate eavesdropping intensity
   */
  private calculateIntensity(context: EavesdroppingContext): number {
    const baseIntensity = 0.3;
    const noiseFactor = 1 - context.noiseLevel; // Lower noise = higher intensity
    const crowdFactor = context.crowdDensity; // Higher crowd = higher intensity
    const exchangeFactor = Math.min(1, context.recentExchanges.length / 3);

    return Math.min(1, baseIntensity + (noiseFactor * 0.3) + (crowdFactor * 0.2) + (exchangeFactor * 0.2));
  }

  /**
   * Calculate distance between threads (simplified)
   */
  private calculateDistance(threadId1: string, threadId2: string): number {
    // Simplified distance calculation - in reality this would be based on spatial positioning
    return Math.random() * this.config.eavesdroppingRange;
  }

  /**
   * Store eavesdropping context in history
   */
  private storeEavesdroppingContext(threadId: string, context: EavesdroppingContext): void {
    const history = this.eavesdroppingHistory.get(threadId) || [];
    history.push(context);

    // Keep only recent history
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    this.eavesdroppingHistory.set(threadId, history);
  }

  /**
   * Inject cross-talk into an agent session
   */
  injectCrossTalk(agentSession: AgentSession, crossTalkEvent: CrossTalkEvent): void {
    const injection = this.createInjection(crossTalkEvent);
    
    if (injection) {
      agentSession.addInterjection({
        id: `crosstalk-${crossTalkEvent.id}`,
        interjection: injection,
        targetAgentId: agentSession.getAdapter().getStats().browserStats?.identityId || 'unknown',
        timestamp: crossTalkEvent.timestamp
      });
    }
  }

  /**
   * Create injection text based on cross-talk event
   */
  private createInjection(crossTalkEvent: CrossTalkEvent): string | null {
    switch (crossTalkEvent.mode) {
      case 'flattened':
        return typeof crossTalkEvent.content === 'string' 
          ? `(Overheard: ${crossTalkEvent.content})`
          : null;

      case 'unflattened':
        if (Array.isArray(crossTalkEvent.content)) {
          const exchanges = crossTalkEvent.content as OverheardExchange[];
          const formatted = exchanges.map(ex => 
            `${ex.speaker} says '${ex.text}'`
          ).join(', then ');
          return `(Nearby, you overhear: ${formatted})`;
        }
        return null;

      case 'both':
        const both = crossTalkEvent.content as any;
        return `(Overheard: ${both.flattened}) (Details: ${both.unflattened.map((ex: OverheardExchange) => 
          `${ex.speaker}: "${ex.text}"`
        ).join(', ')})`;

      default:
        return null;
    }
  }

  /**
   * Get eavesdropping history for a thread
   */
  getEavesdroppingHistory(threadId: string, limit: number = 10): EavesdroppingContext[] {
    const history = this.eavesdroppingHistory.get(threadId) || [];
    return history.slice(-limit);
  }

  /**
   * Get active subscriptions for a thread
   */
  getActiveSubscriptions(threadId: string): string[] {
    const subscriptions = this.activeSubscriptions.get(threadId);
    return subscriptions ? Array.from(subscriptions) : [];
  }

  /**
   * Get threads in an environment
   */
  getThreadsInEnvironment(environmentId: string): string[] {
    const threads = this.environmentThreads.get(environmentId);
    return threads ? Array.from(threads) : [];
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CrossTalkConfig>): void {
    this.config = { ...this.config, ...updates };
    
    this.emit('config_updated', {
      config: this.config,
      timestamp: new Date()
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): CrossTalkConfig {
    return { ...this.config };
  }

  /**
   * Get cross-talk statistics
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      subscriptionMode: this.config.subscriptionMode,
      activeSubscriptions: Array.from(this.activeSubscriptions.entries()).reduce((acc, [threadId, subscriptions]) => {
        acc[threadId] = Array.from(subscriptions);
        return acc;
      }, {} as Record<string, string[]>),
      environmentThreads: Array.from(this.environmentThreads.entries()).reduce((acc, [envId, threads]) => {
        acc[envId] = Array.from(threads);
        return acc;
      }, {} as Record<string, string[]>),
      eavesdroppingHistoryCount: Array.from(this.eavesdroppingHistory.entries()).reduce((acc, [threadId, history]) => {
        acc[threadId] = history.length;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.activeSubscriptions.clear();
    this.eavesdroppingHistory.clear();
    this.lastCrossTalkTime.clear();
    this.environmentThreads.clear();
    this.removeAllListeners();
  }
} 