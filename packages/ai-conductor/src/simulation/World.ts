import { EventEmitter } from 'events';
import { Environment, AmbientEvent } from './Environment';
import { ConvoThread } from './ConvoThread';
import { AgentSession } from '../core/AgentSession';
import { CrossTalkManager, CrossTalkConfig, SubscriptionMode } from './CrossTalkManager';
import { MonitorAgent, MonitorAgentConfig, NarrativeSuggestion, EmotionalAnalysis } from './MonitorAgent';
import { MultiConvoEntanglement, EntanglementConfig, EntanglementEvent, EnvironmentalMood } from './MultiConvoEntanglement';

export interface WorldConfig {
  id: string;
  name: string;
  description: string;
  globalClockSpeed?: number; // milliseconds per tick
  enableCrossTalk?: boolean;
  crossTalkRange?: number;
  maxEnvironments?: number;
  maxConvoThreads?: number;
  enableGlobalEvents?: boolean;
  globalEventFrequency?: number;
  crossTalkConfig?: Partial<CrossTalkConfig>; // New: cross-talk configuration
  defaultSubscriptionMode?: SubscriptionMode; // New: default subscription mode
  enableMonitorAgent?: boolean; // New: enable monitor agent
  monitorAgentConfig?: Partial<MonitorAgentConfig>; // New: monitor agent configuration
  enableMultiConvoEntanglement?: boolean; // New: enable multi-conversation entanglement
  entanglementConfig?: Partial<EntanglementConfig>; // New: entanglement configuration
}

export interface GlobalEvent {
  id: string;
  type: 'world' | 'crossTalk' | 'ambient' | 'narrative';
  description: string;
  affects: string[]; // environment IDs or 'all'
  intensity: number;
  timestamp: Date;
  metadata?: any;
}

export interface CrossTalkEvent {
  id: string;
  sourceThreadId: string;
  targetThreadId: string;
  environmentId: string;
  message: string;
  intensity: number;
  timestamp: Date;
}

export interface WorldState {
  time: {
    worldTime: Date;
    tick: number;
    day: number;
    hour: number;
    minute: number;
  };
  globalMood: string;
  activityLevel: number;
  crossTalkCount: number;
  activeEnvironments: number;
  activeConvoThreads: number;
  recentEvents: GlobalEvent[];
}

export class World extends EventEmitter {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  
  private config: WorldConfig;
  private environments: Map<string, Environment> = new Map();
  private convoThreads: Map<string, ConvoThread> = new Map();
  private state: WorldState;
  private globalClock?: NodeJS.Timeout;
  private isActive: boolean = false;
  private tick: number = 0;
  private globalEvents: GlobalEvent[] = [];
  private crossTalkEvents: CrossTalkEvent[] = [];
  private crossTalkManager: CrossTalkManager;
  private monitorAgent?: MonitorAgent;
  private multiConvoEntanglement?: MultiConvoEntanglement;

  constructor(config: WorldConfig) {
    super();
    this.setMaxListeners(200);
    
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.config = {
      globalClockSpeed: 1000, // 1 second per tick
      enableCrossTalk: true,
      crossTalkRange: 3,
      maxEnvironments: 10,
      maxConvoThreads: 50,
      enableGlobalEvents: true,
      globalEventFrequency: 30000, // 30 seconds
      defaultSubscriptionMode: 'flattened',
      enableMonitorAgent: false,
      enableMultiConvoEntanglement: false,
      ...config
    };

    // Initialize cross-talk manager
    this.crossTalkManager = new CrossTalkManager({
      enabled: this.config.enableCrossTalk !== false,
      subscriptionMode: this.config.defaultSubscriptionMode || 'flattened',
      eavesdroppingRange: this.config.crossTalkRange || 3,
      eavesdroppingChance: 0.3,
      maxOverheardExchanges: 3,
      includeAmbientContext: true,
      crossTalkCooldown: 30000,
      enableInterruption: false,
      ...config.crossTalkConfig
    });

    // Initialize monitor agent if enabled
    if (this.config.enableMonitorAgent) {
      this.monitorAgent = new MonitorAgent({
        id: `monitor-${this.id}`,
        name: `${this.name} Monitor`,
        description: `AI monitor agent for ${this.name}`,
        llmProvider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        capabilities: {
          canGenerateInterjections: true,
          canDecideCrossTalk: true,
          canNarrateAmbient: true,
          canControlNarrative: true,
          canAnalyzeEmotions: true,
          canPredictOutcomes: true,
          canSuggestEvents: true,
          maxConcurrentThreads: 10,
          maxInterjectionsPerMinute: 5
        },
        updateFrequency: 30000, // 30 seconds
        enableRealTimeMonitoring: true,
        enableNarrativeControl: true,
        enableInterjectionGeneration: true,
        enableCrossTalkDecision: true,
        enableAmbientNarration: true,
        ...config.monitorAgentConfig
      });

      // Forward monitor agent events
      this.monitorAgent.on('interjection_suggested', (data) => {
        this.emit('monitor_interjection_suggested', {
          worldId: this.id,
          ...data
        });
      });

      this.monitorAgent.on('narrative_suggestion_generated', (data) => {
        this.emit('monitor_narrative_suggestion', {
          worldId: this.id,
          ...data
        });
      });

      this.monitorAgent.on('emotional_analysis_updated', (data) => {
        this.emit('monitor_emotional_analysis', {
          worldId: this.id,
          ...data
        });
      });

      this.monitorAgent.on('cross_talk_decided', (data) => {
        this.emit('monitor_cross_talk_decided', {
          worldId: this.id,
          ...data
        });
      });

      this.monitorAgent.on('ambient_narration_generated', (data) => {
        this.emit('monitor_ambient_narration', {
          worldId: this.id,
          ...data
        });
      });
    }

    // Initialize multi-conversation entanglement if enabled
    if (this.config.enableMultiConvoEntanglement) {
      this.multiConvoEntanglement = new MultiConvoEntanglement({
        enabled: true,
        crossTalkProbability: 0.3,
        thoughtDiffusionProbability: 0.4,
        environmentalDiffusion: true,
        overhearingRange: 3,
        emotionalContagion: true,
        tensionPropagation: true,
        trustDiffusion: true,
        maxEntanglementDepth: 3,
        diffusionDecay: 0.7,
        ...config.entanglementConfig
      });

      // Forward entanglement events
      this.multiConvoEntanglement.on('entanglement_event', (data) => {
        this.emit('entanglement_event', {
          worldId: this.id,
          ...data
        });
      });

      this.multiConvoEntanglement.on('thought_diffusion_applied', (data) => {
        this.emit('thought_diffusion_applied', {
          worldId: this.id,
          ...data
        });
      });
    }

    // Forward cross-talk events
    this.crossTalkManager.on('cross_talk', (event) => {
      this.emit('cross_talk', {
        worldId: this.id,
        event,
        timestamp: new Date()
      });
    });

    this.crossTalkManager.on('subscription_created', (data) => {
      this.emit('subscription_created', {
        worldId: this.id,
        ...data
      });
    });

    this.crossTalkManager.on('subscription_removed', (data) => {
      this.emit('subscription_removed', {
        worldId: this.id,
        ...data
      });
    });

    this.state = {
      time: {
        worldTime: new Date(),
        tick: 0,
        day: 1,
        hour: 9,
        minute: 0
      },
      globalMood: 'neutral',
      activityLevel: 0,
      crossTalkCount: 0,
      activeEnvironments: 0,
      activeConvoThreads: 0,
      recentEvents: []
    };
  }

  /**
   * Start the world simulation
   */
  async start(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;
    this.tick = 0;

    // Start global clock
    this.globalClock = setInterval(() => {
      this.tick();
    }, this.config.globalClockSpeed);

    // Start all environments
    for (const environment of this.environments.values()) {
      if (!environment.isActive()) {
        environment.startAmbientLoop();
      }
    }

    // Start global events if enabled
    if (this.config.enableGlobalEvents) {
      this.startGlobalEvents();
    }

    // Initialize and start monitor agent if enabled
    if (this.monitorAgent && this.config.enableMonitorAgent) {
      await this.monitorAgent.init();
      this.monitorAgent.attachToWorld(this, this.crossTalkManager);
      await this.monitorAgent.start();
    }

    // Initialize multi-conversation entanglement if enabled
    if (this.multiConvoEntanglement && this.config.enableMultiConvoEntanglement) {
      this.multiConvoEntanglement.initialize(this, this.crossTalkManager, this.monitorAgent);
    }

    this.emit('world_started', {
      worldId: this.id,
      timestamp: new Date(),
      state: this.state
    });
  }

  /**
   * Stop the world simulation
   */
  async stop(): Promise<void> {
    if (!this.isActive) return;

    this.isActive = false;

    // Stop global clock
    if (this.globalClock) {
      clearInterval(this.globalClock);
      this.globalClock = undefined;
    }

    // Stop all environments
    for (const environment of this.environments.values()) {
      if (environment.isActive()) {
        environment.stopAmbientLoop();
      }
    }

    // Stop monitor agent
    if (this.monitorAgent) {
      await this.monitorAgent.stop();
    }

    this.emit('world_stopped', {
      worldId: this.id,
      timestamp: new Date()
    });
  }

  /**
   * Process one tick of the world
   */
  private tick(): void {
    this.tick++;
    this.updateWorldTime();

    // Update world state
    this.updateWorldState();

    // Process cross-talk if enabled
    if (this.config.enableCrossTalk) {
      this.processCrossTalk();
    }

    // Emit tick event
    this.emit('world_tick', {
      worldId: this.id,
      tick: this.tick,
      time: this.state.time,
      timestamp: new Date()
    });
  }

  /**
   * Update world time
   */
  private updateWorldTime(): void {
    const now = new Date();
    this.state.time.worldTime = now;
    this.state.time.hour = now.getHours();
    this.state.time.minute = now.getMinutes();
    this.state.time.day = Math.floor(now.getTime() / (24 * 60 * 60 * 1000)) + 1;
  }

  /**
   * Update world state based on current conditions
   */
  private updateWorldState(): void {
    // Calculate activity level based on active conversations
    this.state.activityLevel = Math.min(1, this.state.activeConvoThreads / 10);

    // Update global mood based on environment states
    const environmentMoods = Array.from(this.environments.values())
      .map(env => env.getState().atmosphere?.mood)
      .filter(mood => mood);

    if (environmentMoods.length > 0) {
      const moodCounts = environmentMoods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantMood = Object.entries(moodCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
      
      this.state.globalMood = dominantMood;
    }

    // Update active counts
    this.state.activeEnvironments = Array.from(this.environments.values())
      .filter(env => env.isActive()).length;
    
    this.state.activeConvoThreads = Array.from(this.convoThreads.values())
      .filter(thread => thread.getState().isActive).length;
  }

  /**
   * Start global events system
   */
  private startGlobalEvents(): void {
    setInterval(() => {
      this.generateGlobalEvent();
    }, this.config.globalEventFrequency);
  }

  /**
   * Generate a global event
   */
  private generateGlobalEvent(): void {
    const eventTypes = ['world', 'ambient', 'narrative'];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const event: GlobalEvent = {
      id: `global-event-${Date.now()}`,
      type: type as any,
      description: this.generateGlobalEventDescription(type),
      affects: ['all'],
      intensity: Math.random() * 0.5 + 0.1, // 0.1 to 0.6
      timestamp: new Date(),
      metadata: {
        worldTick: this.tick
      }
    };

    this.globalEvents.push(event);
    this.state.recentEvents.push(event);

    // Keep only recent events
    if (this.globalEvents.length > 100) {
      this.globalEvents = this.globalEvents.slice(-50);
    }
    if (this.state.recentEvents.length > 20) {
      this.state.recentEvents = this.state.recentEvents.slice(-20);
    }

    // Emit to all environments
    for (const environment of this.environments.values()) {
      environment.emitEvent({
        id: event.id,
        type: 'environmental',
        description: event.description,
        intensity: event.intensity,
        duration: 5000,
        affects: ['mood', 'social'],
        timestamp: event.timestamp
      });
    }

    this.emit('global_event', {
      worldId: this.id,
      event,
      timestamp: new Date()
    });
  }

  /**
   * Generate global event description
   */
  private generateGlobalEventDescription(type: string): string {
    const descriptions = {
      world: [
        'A gentle breeze swept through the world.',
        'The ambient lighting shifted subtly.',
        'A distant sound echoed across the landscape.',
        'The atmosphere became more charged with energy.'
      ],
      ambient: [
        'Background noise levels increased slightly.',
        'The overall mood of the world shifted.',
        'A collective awareness seemed to ripple through conversations.',
        'The environment felt more alive and dynamic.'
      ],
      narrative: [
        'A story thread emerged from the collective conversation.',
        'The narrative direction of the world became clearer.',
        'A shared theme began to emerge across discussions.',
        'The world\'s story took an unexpected turn.'
      ]
    };

    const typeDescriptions = descriptions[type as keyof typeof descriptions] || descriptions.world;
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  }

  /**
   * Process cross-talk between conversations
   */
  private processCrossTalk(): void {
    if (!this.config.enableCrossTalk) return;

    const activeThreads = Array.from(this.convoThreads.values())
      .filter(thread => thread.getState().isActive);

    for (let i = 0; i < activeThreads.length; i++) {
      for (let j = i + 1; j < activeThreads.length; j++) {
        const threadA = activeThreads[i];
        const threadB = activeThreads[j];

        // Check if threads are in the same environment
        if (threadA.getState().environmentId === threadB.getState().environmentId) {
          this.simulateEavesdrop(
            threadA.getState().environmentId!,
            threadA.id,
            threadB.id
          );
        }
      }
    }
  }

  /**
   * Simulate eavesdropping between conversations
   */
  simulateEavesdrop(environmentId: string, sourceThreadId: string, targetThreadId: string): void {
    const crossTalkEvent = this.crossTalkManager.simulateEavesdrop(
      environmentId,
      sourceThreadId,
      targetThreadId
    );

    if (crossTalkEvent) {
      this.state.crossTalkCount++;
      this.crossTalkEvents.push(crossTalkEvent);

      // Emit cross-talk event
      this.emit('cross_talk', {
        worldId: this.id,
        event: crossTalkEvent,
        timestamp: new Date()
      });

      // Keep only recent cross-talk events
      if (this.crossTalkEvents.length > 100) {
        this.crossTalkEvents = this.crossTalkEvents.slice(-50);
      }
    }
  }

  /**
   * Register an environment
   */
  registerEnvironment(environment: Environment): void {
    if (this.environments.size >= (this.config.maxEnvironments || 10)) {
      throw new Error('Maximum number of environments reached');
    }

    this.environments.set(environment.id, environment);

    // Forward environment events
    environment.on('ambient_event', (data) => {
      this.emit('environment_ambient_event', {
        worldId: this.id,
        environmentId: environment.id,
        event: data.event,
        timestamp: new Date()
      });
    });

    // Register environment with monitor agent if available
    if (this.monitorAgent) {
      this.monitorAgent.monitorEnvironment(environment);
    }

    this.emit('environment_registered', {
      worldId: this.id,
      environmentId: environment.id,
      timestamp: new Date()
    });
  }

  /**
   * Unregister an environment
   */
  unregisterEnvironment(environmentId: string): void {
    const environment = this.environments.get(environmentId);
    if (environment) {
      environment.destroy();
      this.environments.delete(environmentId);

      this.emit('environment_unregistered', {
        worldId: this.id,
        environmentId,
        timestamp: new Date()
      });
    }
  }

  /**
   * Register a conversation thread
   */
  registerConvoThread(thread: ConvoThread): void {
    if (this.convoThreads.size >= (this.config.maxConvoThreads || 50)) {
      throw new Error('Maximum number of conversation threads reached');
    }

    this.convoThreads.set(thread.id, thread);

    // Forward thread events
    thread.on('exchange', (data) => {
      this.emit('thread_exchange', {
        worldId: this.id,
        threadId: thread.id,
        exchange: data,
        timestamp: new Date()
      });
    });

    thread.on('conversation_started', (data) => {
      this.emit('thread_started', {
        worldId: this.id,
        threadId: thread.id,
        timestamp: new Date()
      });
    });

    thread.on('conversation_stopped', (data) => {
      this.emit('thread_stopped', {
        worldId: this.id,
        threadId: thread.id,
        timestamp: new Date()
      });
    });

    thread.on('cross_talk_received', (data) => {
      this.emit('thread_cross_talk_received', {
        worldId: this.id,
        threadId: thread.id,
        event: data.event,
        timestamp: new Date()
      });
    });

    thread.on('subscription_mode_changed', (data) => {
      this.emit('thread_subscription_mode_changed', {
        worldId: this.id,
        threadId: thread.id,
        mode: data.mode,
        timestamp: new Date()
      });
    });

    // Register thread with monitor agent if available
    if (this.monitorAgent) {
      this.monitorAgent.monitorThread(thread);
    }

    this.emit('thread_registered', {
      worldId: this.id,
      threadId: thread.id,
      timestamp: new Date()
    });
  }

  /**
   * Unregister a conversation thread
   */
  unregisterConvoThread(threadId: string): void {
    const thread = this.convoThreads.get(threadId);
    if (thread) {
      thread.destroy();
      this.convoThreads.delete(threadId);

      this.emit('thread_unregistered', {
        worldId: this.id,
        threadId,
        timestamp: new Date()
      });
    }
  }

  /**
   * Connect a conversation thread to an environment
   */
  connectConvoToEnv(threadId: string, environmentId: string): void {
    const thread = this.convoThreads.get(threadId);
    const environment = this.environments.get(environmentId);

    if (!thread || !environment) {
      throw new Error('Thread or environment not found');
    }

    environment.connect(thread);

    this.emit('thread_environment_connected', {
      worldId: this.id,
      threadId,
      environmentId,
      timestamp: new Date()
    });
  }

  /**
   * Subscribe one thread to another
   */
  subscribeThreadToThread(subscriberId: string, targetId: string): void {
    this.crossTalkManager.subscribeToThread(subscriberId, targetId);
  }

  /**
   * Unsubscribe one thread from another
   */
  unsubscribeThreadFromThread(subscriberId: string, targetId: string): void {
    this.crossTalkManager.unsubscribeFromThread(subscriberId, targetId);
  }

  /**
   * Get active subscriptions for a thread
   */
  getThreadSubscriptions(threadId: string): string[] {
    return this.crossTalkManager.getActiveSubscriptions(threadId);
  }

  /**
   * Get eavesdropping history for a thread
   */
  getThreadEavesdroppingHistory(threadId: string, limit: number = 10) {
    return this.crossTalkManager.getEavesdroppingHistory(threadId, limit);
  }

  /**
   * Update cross-talk configuration
   */
  updateCrossTalkConfig(updates: Partial<CrossTalkConfig>): void {
    this.crossTalkManager.updateConfig(updates);
  }

  /**
   * Get cross-talk configuration
   */
  getCrossTalkConfig() {
    return this.crossTalkManager.getConfig();
  }

  /**
   * Get cross-talk statistics
   */
  getCrossTalkStats() {
    return this.crossTalkManager.getStats();
  }

  /**
   * Get monitor agent
   */
  getMonitorAgent(): MonitorAgent | undefined {
    return this.monitorAgent;
  }

  /**
   * Enable monitor agent
   */
  async enableMonitorAgent(config?: Partial<MonitorAgentConfig>): Promise<void> {
    if (this.monitorAgent) {
      throw new Error('Monitor agent already exists');
    }

    this.monitorAgent = new MonitorAgent({
      id: `monitor-${this.id}`,
      name: `${this.name} Monitor`,
      description: `AI monitor agent for ${this.name}`,
      llmProvider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      capabilities: {
        canGenerateInterjections: true,
        canDecideCrossTalk: true,
        canNarrateAmbient: true,
        canControlNarrative: true,
        canAnalyzeEmotions: true,
        canPredictOutcomes: true,
        canSuggestEvents: true,
        maxConcurrentThreads: 10,
        maxInterjectionsPerMinute: 5
      },
      updateFrequency: 30000,
      enableRealTimeMonitoring: true,
      enableNarrativeControl: true,
      enableInterjectionGeneration: true,
      enableCrossTalkDecision: true,
      enableAmbientNarration: true,
      ...config
    });

    // Forward monitor agent events
    this.monitorAgent.on('interjection_suggested', (data) => {
      this.emit('monitor_interjection_suggested', {
        worldId: this.id,
        ...data
      });
    });

    this.monitorAgent.on('narrative_suggestion_generated', (data) => {
      this.emit('monitor_narrative_suggestion', {
        worldId: this.id,
        ...data
      });
    });

    this.monitorAgent.on('emotional_analysis_updated', (data) => {
      this.emit('monitor_emotional_analysis', {
        worldId: this.id,
        ...data
      });
    });

    this.monitorAgent.on('cross_talk_decided', (data) => {
      this.emit('monitor_cross_talk_decided', {
        worldId: this.id,
        ...data
      });
    });

    this.monitorAgent.on('ambient_narration_generated', (data) => {
      this.emit('monitor_ambient_narration', {
        worldId: this.id,
        ...data
      });
    });

    // Initialize and start monitor agent
    await this.monitorAgent.init();
    this.monitorAgent.attachToWorld(this, this.crossTalkManager);

    // Register existing threads and environments
    for (const thread of this.convoThreads.values()) {
      this.monitorAgent.monitorThread(thread);
    }

    for (const environment of this.environments.values()) {
      this.monitorAgent.monitorEnvironment(environment);
    }

    if (this.isActive) {
      await this.monitorAgent.start();
    }

    this.emit('monitor_agent_enabled', {
      worldId: this.id,
      monitorId: this.monitorAgent.id,
      timestamp: new Date()
    });
  }

  /**
   * Disable monitor agent
   */
  async disableMonitorAgent(): Promise<void> {
    if (!this.monitorAgent) {
      throw new Error('No monitor agent to disable');
    }

    await this.monitorAgent.destroy();
    this.monitorAgent = undefined;

    this.emit('monitor_agent_disabled', {
      worldId: this.id,
      timestamp: new Date()
    });
  }

  /**
   * Get narrative suggestions from monitor agent
   */
  getNarrativeSuggestions(limit: number = 50): NarrativeSuggestion[] {
    return this.monitorAgent?.getNarrativeSuggestions(limit) || [];
  }

  /**
   * Get emotional analyses from monitor agent
   */
  getEmotionalAnalyses(): Map<string, EmotionalAnalysis> {
    return this.monitorAgent?.getEmotionalAnalyses() || new Map();
  }

  /**
   * Get narrative state from monitor agent
   */
  getNarrativeState() {
    return this.monitorAgent?.getNarrativeState();
  }

  /**
   * Get monitor agent statistics
   */
  getMonitorStats() {
    return this.monitorAgent?.getStats();
  }

  /**
   * Get multi-conversation entanglement manager
   */
  getMultiConvoEntanglement(): MultiConvoEntanglement | undefined {
    return this.multiConvoEntanglement;
  }

  /**
   * Enable multi-conversation entanglement
   */
  async enableMultiConvoEntanglement(config?: Partial<EntanglementConfig>): Promise<void> {
    if (this.multiConvoEntanglement) {
      throw new Error('Multi-conversation entanglement already exists');
    }

    this.multiConvoEntanglement = new MultiConvoEntanglement({
      enabled: true,
      crossTalkProbability: 0.3,
      thoughtDiffusionProbability: 0.4,
      environmentalDiffusion: true,
      overhearingRange: 3,
      emotionalContagion: true,
      tensionPropagation: true,
      trustDiffusion: true,
      maxEntanglementDepth: 3,
      diffusionDecay: 0.7,
      ...config
    });

    // Forward entanglement events
    this.multiConvoEntanglement.on('entanglement_event', (data) => {
      this.emit('entanglement_event', {
        worldId: this.id,
        ...data
      });
    });

    this.multiConvoEntanglement.on('thought_diffusion_applied', (data) => {
      this.emit('thought_diffusion_applied', {
        worldId: this.id,
        ...data
      });
    });

    // Initialize if world is active
    if (this.isActive) {
      this.multiConvoEntanglement.initialize(this, this.crossTalkManager, this.monitorAgent);
    }

    this.emit('multi_convo_entanglement_enabled', {
      worldId: this.id,
      timestamp: new Date()
    });
  }

  /**
   * Disable multi-conversation entanglement
   */
  async disableMultiConvoEntanglement(): Promise<void> {
    if (!this.multiConvoEntanglement) {
      throw new Error('No multi-conversation entanglement to disable');
    }

    this.multiConvoEntanglement.destroy();
    this.multiConvoEntanglement = undefined;

    this.emit('multi_convo_entanglement_disabled', {
      worldId: this.id,
      timestamp: new Date()
    });
  }

  /**
   * Get environmental mood
   */
  getEnvironmentalMood(environmentId: string): EnvironmentalMood | undefined {
    return this.multiConvoEntanglement?.getEnvironmentalMood(environmentId);
  }

  /**
   * Get all environmental moods
   */
  getAllEnvironmentalMoods(): Map<string, EnvironmentalMood> {
    return this.multiConvoEntanglement?.getAllEnvironmentalMoods() || new Map();
  }

  /**
   * Get entanglement history
   */
  getEntanglementHistory(limit: number = 50): EntanglementEvent[] {
    return this.multiConvoEntanglement?.getEntanglementHistory(limit) || [];
  }

  /**
   * Get active entanglement chains
   */
  getActiveEntanglementChains() {
    return this.multiConvoEntanglement?.getActiveEntanglementChains() || [];
  }

  /**
   * Get entanglement statistics
   */
  getEntanglementStats() {
    return this.multiConvoEntanglement?.getStats();
  }

  /**
   * Get world state
   */
  getState(): WorldState {
    return { ...this.state };
  }

  /**
   * Get all environments
   */
  getEnvironments(): Environment[] {
    return Array.from(this.environments.values());
  }

  /**
   * Get all conversation threads
   */
  getConvoThreads(): ConvoThread[] {
    return Array.from(this.convoThreads.values());
  }

  /**
   * Get global events
   */
  getGlobalEvents(limit: number = 50): GlobalEvent[] {
    return this.globalEvents.slice(-limit);
  }

  /**
   * Get cross-talk events
   */
  getCrossTalkEvents(limit: number = 50): CrossTalkEvent[] {
    return this.crossTalkEvents.slice(-limit);
  }

  /**
   * Get world statistics
   */
  getStats() {
    const baseStats = {
      id: this.id,
      name: this.name,
      isActive: this.isActive,
      tick: this.tick,
      state: this.state,
      environmentCount: this.environments.size,
      threadCount: this.convoThreads.size,
      globalEventCount: this.globalEvents.length,
      crossTalkEventCount: this.crossTalkEvents.length,
      crossTalkStats: this.crossTalkManager.getStats(),
      monitorAgentStats: this.monitorAgent?.getStats()
    };

    if (this.multiConvoEntanglement) {
      return {
        ...baseStats,
        entanglementStats: this.getEntanglementStats()
      };
    }

    return baseStats;
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.stop();
    
    // Destroy all environments
    for (const environment of this.environments.values()) {
      environment.destroy();
    }
    this.environments.clear();

    // Destroy all threads
    for (const thread of this.convoThreads.values()) {
      thread.destroy();
    }
    this.convoThreads.clear();

    // Destroy cross-talk manager
    this.crossTalkManager.destroy();

    // Destroy monitor agent
    if (this.monitorAgent) {
      await this.monitorAgent.destroy();
    }

    // Destroy multi-conversation entanglement
    if (this.multiConvoEntanglement) {
      this.multiConvoEntanglement.destroy();
    }

    this.globalEvents = [];
    this.crossTalkEvents = [];
    this.removeAllListeners();
  }
} 