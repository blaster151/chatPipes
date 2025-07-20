import { EventEmitter } from 'events';
import { ConvoThread } from './ConvoThread';
import { Environment } from './Environment';
import { World } from './World';
import { CrossTalkManager, CrossTalkEvent } from './CrossTalkManager';
import { DualConversationManager, InnerThought, DualExchange } from './DualConversationManager';
import { MonitorAgent } from './MonitorAgent';

export interface EntanglementConfig {
  enabled: boolean;
  crossTalkProbability: number; // 0-1 chance of cross-talk between conversations
  thoughtDiffusionProbability: number; // 0-1 chance of thoughts diffusing to other conversations
  environmentalDiffusion: boolean; // whether thoughts affect environment mood
  overhearingRange: number; // how far conversations can be overheard
  emotionalContagion: boolean; // whether emotions spread between conversations
  tensionPropagation: boolean; // whether tension spreads through environment
  trustDiffusion: boolean; // whether trust/suspicion spreads
  maxEntanglementDepth: number; // maximum layers of entanglement
  diffusionDecay: number; // how quickly effects decay (0-1)
}

export interface EntanglementEvent {
  id: string;
  type: 'cross_talk' | 'thought_diffusion' | 'emotional_contagion' | 'tension_propagation' | 'trust_diffusion' | 'environmental_mood_shift';
  sourceThreadId: string;
  targetThreadId?: string;
  environmentId: string;
  sourceAgentId: string;
  targetAgentId?: string;
  content: string;
  intensity: number; // 0-1
  metadata: {
    originalThought?: InnerThought;
    emotionalState?: string;
    tensionLevel?: number;
    trustChange?: number;
    environmentalImpact?: string;
    diffusionPath?: string[];
  };
  timestamp: Date;
}

export interface EnvironmentalMood {
  environmentId: string;
  overallMood: string;
  tensionLevel: number; // 0-1
  trustLevel: number; // 0-1
  energyLevel: number; // 0-1
  curiosityLevel: number; // 0-1
  suspicionLevel: number; // 0-1
  lastUpdated: Date;
  contributingFactors: string[];
}

export interface EntanglementChain {
  id: string;
  events: EntanglementEvent[];
  depth: number;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  impact: {
    threadsAffected: string[];
    agentsAffected: string[];
    environmentalChanges: string[];
    totalIntensity: number;
  };
}

export class MultiConvoEntanglement extends EventEmitter {
  private config: EntanglementConfig;
  private world?: World;
  private crossTalkManager?: CrossTalkManager;
  private monitorAgent?: MonitorAgent;
  private environmentalMoods: Map<string, EnvironmentalMood> = new Map();
  private entanglementChains: Map<string, EntanglementChain> = new Map();
  private activeEntanglements: Set<string> = new Set();
  private diffusionHistory: EntanglementEvent[] = [];

  constructor(config: Partial<EntanglementConfig> = {}) {
    super();
    this.setMaxListeners(200);
    
    this.config = {
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
    };
  }

  /**
   * Initialize entanglement system with world
   */
  initialize(world: World, crossTalkManager: CrossTalkManager, monitorAgent?: MonitorAgent): void {
    this.world = world;
    this.crossTalkManager = crossTalkManager;
    this.monitorAgent = monitorAgent;

    // Listen to world events
    world.on('thread_exchange', (data) => {
      this.handleThreadExchange(data);
    });

    world.on('cross_talk', (data) => {
      this.handleCrossTalk(data);
    });

    world.on('environment_ambient_event', (data) => {
      this.handleEnvironmentalEvent(data);
    });

    // Listen to cross-talk events
    crossTalkManager.on('cross_talk', (event) => {
      this.handleCrossTalkEvent(event);
    });

    // Listen to monitor agent events
    if (monitorAgent) {
      monitorAgent.on('interjection_suggested', (data) => {
        this.handleMonitorInterjection(data);
      });

      monitorAgent.on('emotional_analysis_updated', (data) => {
        this.handleEmotionalAnalysis(data);
      });
    }

    this.emit('entanglement_initialized', {
      config: this.config,
      timestamp: new Date()
    });
  }

  /**
   * Handle thread exchange and check for entanglement opportunities
   */
  private async handleThreadExchange(data: { threadId: string; exchange: any }): Promise<void> {
    if (!this.config.enabled) return;

    const { threadId, exchange } = data;
    
    // Check for thought diffusion if exchange has unspoken thought
    if (exchange.unspoken) {
      await this.processThoughtDiffusion(threadId, exchange);
    }

    // Check for emotional contagion
    if (this.config.emotionalContagion) {
      await this.processEmotionalContagion(threadId, exchange);
    }

    // Check for tension propagation
    if (this.config.tensionPropagation) {
      await this.processTensionPropagation(threadId, exchange);
    }

    // Update environmental mood
    if (this.config.environmentalDiffusion) {
      await this.updateEnvironmentalMood(threadId, exchange);
    }
  }

  /**
   * Process thought diffusion between conversations
   */
  private async processThoughtDiffusion(sourceThreadId: string, exchange: any): Promise<void> {
    if (!this.world || !exchange.unspoken) return;

    const sourceThought = exchange.unspoken as InnerThought;
    const sourceAgentId = exchange.speakerId;
    const environmentId = this.getThreadEnvironment(sourceThreadId);

    if (!environmentId) return;

    // Find other threads in the same environment
    const otherThreads = this.getThreadsInEnvironment(environmentId).filter(id => id !== sourceThreadId);

    for (const targetThreadId of otherThreads) {
      // Check if thought should diffuse
      if (Math.random() < this.config.thoughtDiffusionProbability) {
        const diffusionEvent = await this.createThoughtDiffusionEvent(
          sourceThreadId,
          targetThreadId,
          sourceAgentId,
          sourceThought,
          environmentId
        );

        if (diffusionEvent) {
          this.emitEntanglementEvent(diffusionEvent);
          await this.applyThoughtDiffusion(diffusionEvent);
        }
      }
    }
  }

  /**
   * Create thought diffusion event
   */
  private async createThoughtDiffusionEvent(
    sourceThreadId: string,
    targetThreadId: string,
    sourceAgentId: string,
    sourceThought: InnerThought,
    environmentId: string
  ): Promise<EntanglementEvent | null> {
    const targetThread = this.world?.getConvoThread(targetThreadId);
    if (!targetThread) return null;

    // Calculate diffusion intensity based on thought intensity and distance
    const intensity = sourceThought.intensity * this.config.diffusionDecay;

    // Create diffused thought content
    const diffusedContent = this.createDiffusedThoughtContent(sourceThought, sourceAgentId);

    const event: EntanglementEvent = {
      id: `diffusion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'thought_diffusion',
      sourceThreadId,
      targetThreadId,
      environmentId,
      sourceAgentId,
      content: diffusedContent,
      intensity,
      metadata: {
        originalThought: sourceThought,
        diffusionPath: [sourceThreadId, targetThreadId]
      },
      timestamp: new Date()
    };

    return event;
  }

  /**
   * Create diffused thought content
   */
  private createDiffusedThoughtContent(originalThought: InnerThought, sourceAgentId: string): string {
    const thoughtType = originalThought.type;
    const sourceName = sourceAgentId;

    switch (thoughtType) {
      case 'suspicion':
        return `I wonder what ${sourceName} is thinking. They seem suspicious.`;
      case 'judgment':
        return `${sourceName} seems to be making judgments. I should be careful.`;
      case 'admiration':
        return `${sourceName} appears to be impressed by something.`;
      case 'doubt':
        return `I sense some doubt from ${sourceName}.`;
      case 'curiosity':
        return `${sourceName} seems curious about something.`;
      case 'frustration':
        return `I can feel some tension from ${sourceName}.`;
      case 'amusement':
        return `${sourceName} seems to find something amusing.`;
      case 'concern':
        return `I sense concern from ${sourceName}.`;
      case 'excitement':
        return `${sourceName} seems excited about something.`;
      default:
        return `I notice something about ${sourceName}.`;
    }
  }

  /**
   * Apply thought diffusion to target thread
   */
  private async applyThoughtDiffusion(event: EntanglementEvent): Promise<void> {
    if (!event.targetThreadId || !event.targetAgentId) return;

    const targetThread = this.world?.getConvoThread(event.targetThreadId);
    if (!targetThread) return;

    // Create a new thought in the target agent based on the diffused content
    const diffusedThought: InnerThought = {
      id: `diffused-${event.id}`,
      speakerId: event.targetAgentId,
      targetId: event.sourceAgentId,
      content: event.content,
      type: this.mapThoughtType(event.metadata.originalThought?.type || 'observation'),
      intensity: event.intensity,
      timestamp: new Date(),
      context: `Diffused from ${event.sourceThreadId}`,
      behavioralImpact: {
        trustChange: event.metadata.originalThought?.behavioralImpact?.trustChange ? 
          event.metadata.originalThought.behavioralImpact.trustChange * 0.5 : 0,
        sarcasmChange: 0,
        suspicionChange: event.metadata.originalThought?.behavioralImpact?.suspicionChange ? 
          event.metadata.originalThought.behavioralImpact.suspicionChange * 0.5 : 0,
        engagementChange: 0.1,
        assertivenessChange: 0,
        curiosityChange: 0.1,
        patienceChange: 0
      }
    };

    // Apply the diffused thought to the target agent
    const dualManager = targetThread.getDualConversationManager();
    if (dualManager) {
      const memory = dualManager.getAgentMemory(event.targetAgentId);
      if (memory) {
        memory.thoughts.push(diffusedThought);
        if (diffusedThought.behavioralImpact) {
          // Apply behavioral impact
          const state = memory.behavioralState;
          const impact = diffusedThought.behavioralImpact;
          
          state.trust = Math.max(-1, Math.min(1, state.trust + impact.trustChange));
          state.suspicion = Math.max(-1, Math.min(1, state.suspicion + impact.suspicionChange));
          state.engagement = Math.max(-1, Math.min(1, state.engagement + impact.engagementChange));
          state.curiosity = Math.max(-1, Math.min(1, state.curiosity + impact.curiosityChange));
          
          state.timestamp = new Date();
          memory.lastUpdated = new Date();
        }
      }
    }

    this.emit('thought_diffusion_applied', {
      event,
      diffusedThought,
      timestamp: new Date()
    });
  }

  /**
   * Process emotional contagion between conversations
   */
  private async processEmotionalContagion(sourceThreadId: string, exchange: any): Promise<void> {
    if (!this.world) return;

    const environmentId = this.getThreadEnvironment(sourceThreadId);
    if (!environmentId) return;

    const emotionalState = exchange.metadata?.emotionalState || 'neutral';
    const otherThreads = this.getThreadsInEnvironment(environmentId).filter(id => id !== sourceThreadId);

    for (const targetThreadId of otherThreads) {
      if (Math.random() < this.config.thoughtDiffusionProbability * 0.5) {
        const event: EntanglementEvent = {
          id: `contagion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'emotional_contagion',
          sourceThreadId,
          targetThreadId,
          environmentId,
          sourceAgentId: exchange.speakerId,
          content: `The mood from ${sourceThreadId} is affecting the atmosphere.`,
          intensity: 0.3,
          metadata: {
            emotionalState,
            diffusionPath: [sourceThreadId, targetThreadId]
          },
          timestamp: new Date()
        };

        this.emitEntanglementEvent(event);
      }
    }
  }

  /**
   * Process tension propagation through environment
   */
  private async processTensionPropagation(sourceThreadId: string, exchange: any): Promise<void> {
    if (!this.world) return;

    const environmentId = this.getThreadEnvironment(sourceThreadId);
    if (!environmentId) return;

    // Check if exchange indicates tension
    const tensionIndicators = ['suspicion', 'frustration', 'doubt', 'judgment'];
    const thoughtType = exchange.unspoken?.type;
    
    if (thoughtType && tensionIndicators.includes(thoughtType)) {
      const event: EntanglementEvent = {
        id: `tension-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'tension_propagation',
        sourceThreadId,
        environmentId,
        sourceAgentId: exchange.speakerId,
        content: `Tension is spreading through the environment.`,
        intensity: exchange.unspoken?.intensity || 0.5,
        metadata: {
          tensionLevel: exchange.unspoken?.intensity || 0.5,
          diffusionPath: [sourceThreadId, environmentId]
        },
        timestamp: new Date()
      };

      this.emitEntanglementEvent(event);
      await this.updateEnvironmentalMood(sourceThreadId, exchange);
    }
  }

  /**
   * Update environmental mood based on conversations
   */
  private async updateEnvironmentalMood(sourceThreadId: string, exchange: any): Promise<void> {
    if (!this.world) return;

    const environmentId = this.getThreadEnvironment(sourceThreadId);
    if (!environmentId) return;

    let mood = this.environmentalMoods.get(environmentId);
    if (!mood) {
      mood = {
        environmentId,
        overallMood: 'neutral',
        tensionLevel: 0.5,
        trustLevel: 0.5,
        energyLevel: 0.5,
        curiosityLevel: 0.5,
        suspicionLevel: 0.5,
        lastUpdated: new Date(),
        contributingFactors: []
      };
      this.environmentalMoods.set(environmentId, mood);
    }

    // Update mood based on exchange
    const thoughtType = exchange.unspoken?.type;
    const intensity = exchange.unspoken?.intensity || 0.5;

    if (thoughtType) {
      switch (thoughtType) {
        case 'suspicion':
          mood.suspicionLevel = Math.min(1, mood.suspicionLevel + intensity * 0.1);
          mood.trustLevel = Math.max(0, mood.trustLevel - intensity * 0.1);
          mood.contributingFactors.push(`Suspicion from ${exchange.speakerId}`);
          break;
        case 'admiration':
          mood.trustLevel = Math.min(1, mood.trustLevel + intensity * 0.1);
          mood.energyLevel = Math.min(1, mood.energyLevel + intensity * 0.1);
          mood.contributingFactors.push(`Admiration from ${exchange.speakerId}`);
          break;
        case 'frustration':
          mood.tensionLevel = Math.min(1, mood.tensionLevel + intensity * 0.1);
          mood.energyLevel = Math.max(0, mood.energyLevel - intensity * 0.1);
          mood.contributingFactors.push(`Frustration from ${exchange.speakerId}`);
          break;
        case 'curiosity':
          mood.curiosityLevel = Math.min(1, mood.curiosityLevel + intensity * 0.1);
          mood.energyLevel = Math.min(1, mood.energyLevel + intensity * 0.05);
          mood.contributingFactors.push(`Curiosity from ${exchange.speakerId}`);
          break;
        case 'amusement':
          mood.energyLevel = Math.min(1, mood.energyLevel + intensity * 0.1);
          mood.tensionLevel = Math.max(0, mood.tensionLevel - intensity * 0.1);
          mood.contributingFactors.push(`Amusement from ${exchange.speakerId}`);
          break;
      }
    }

    // Update overall mood
    mood.overallMood = this.calculateOverallMood(mood);
    mood.lastUpdated = new Date();

    // Keep only recent contributing factors
    if (mood.contributingFactors.length > 10) {
      mood.contributingFactors = mood.contributingFactors.slice(-10);
    }

    const event: EntanglementEvent = {
      id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'environmental_mood_shift',
      sourceThreadId,
      environmentId,
      sourceAgentId: exchange.speakerId,
      content: `Environmental mood shifted to ${mood.overallMood}.`,
      intensity: intensity,
      metadata: {
        environmentalImpact: mood.overallMood,
        tensionLevel: mood.tensionLevel,
        trustLevel: mood.trustLevel
      },
      timestamp: new Date()
    };

    this.emitEntanglementEvent(event);
  }

  /**
   * Calculate overall mood from environmental factors
   */
  private calculateOverallMood(mood: EnvironmentalMood): string {
    const factors = [
      { value: mood.tensionLevel, weight: -0.3 },
      { value: mood.trustLevel, weight: 0.3 },
      { value: mood.energyLevel, weight: 0.2 },
      { value: mood.curiosityLevel, weight: 0.1 },
      { value: mood.suspicionLevel, weight: -0.2 }
    ];

    const weightedSum = factors.reduce((sum, factor) => 
      sum + (factor.value * factor.weight), 0
    );

    if (weightedSum > 0.3) return 'positive';
    if (weightedSum < -0.3) return 'negative';
    return 'neutral';
  }

  /**
   * Handle cross-talk events
   */
  private async handleCrossTalkEvent(event: CrossTalkEvent): Promise<void> {
    const entanglementEvent: EntanglementEvent = {
      id: `crosstalk-${event.id}`,
      type: 'cross_talk',
      sourceThreadId: event.sourceThreadId,
      targetThreadId: event.targetThreadId,
      environmentId: event.environmentId,
      sourceAgentId: 'unknown',
      content: `Cross-talk detected between ${event.sourceThreadId} and ${event.targetThreadId}`,
      intensity: event.intensity,
      metadata: {
        diffusionPath: [event.sourceThreadId, event.targetThreadId]
      },
      timestamp: new Date()
    };

    this.emitEntanglementEvent(entanglementEvent);
  }

  /**
   * Handle monitor agent interjections
   */
  private async handleMonitorInterjection(data: any): Promise<void> {
    if (!this.world) return;

    const event: EntanglementEvent = {
      id: `monitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'cross_talk',
      sourceThreadId: 'monitor',
      targetThreadId: data.suggestion.target,
      environmentId: 'global',
      sourceAgentId: 'monitor',
      content: `Monitor agent suggests: ${data.suggestion.content}`,
      intensity: data.suggestion.priority / 10,
      metadata: {
        diffusionPath: ['monitor', data.suggestion.target]
      },
      timestamp: new Date()
    };

    this.emitEntanglementEvent(event);
  }

  /**
   * Handle emotional analysis updates
   */
  private async handleEmotionalAnalysis(data: any): Promise<void> {
    if (!this.world) return;

    const event: EntanglementEvent = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'emotional_contagion',
      sourceThreadId: data.analysis.threadId,
      environmentId: 'global',
      sourceAgentId: 'monitor',
      content: `Emotional analysis: ${data.analysis.overallMood} mood detected`,
      intensity: data.analysis.tensionLevel,
      metadata: {
        emotionalState: data.analysis.overallMood,
        tensionLevel: data.analysis.tensionLevel
      },
      timestamp: new Date()
    };

    this.emitEntanglementEvent(event);
  }

  /**
   * Emit entanglement event and track chain
   */
  private emitEntanglementEvent(event: EntanglementEvent): void {
    this.diffusionHistory.push(event);
    
    // Keep only recent events
    if (this.diffusionHistory.length > 100) {
      this.diffusionHistory = this.diffusionHistory.slice(-50);
    }

    // Track entanglement chain
    this.trackEntanglementChain(event);

    this.emit('entanglement_event', {
      event,
      timestamp: new Date()
    });
  }

  /**
   * Track entanglement chain
   */
  private trackEntanglementChain(event: EntanglementEvent): void {
    const chainId = `chain-${Date.now()}`;
    const chain: EntanglementChain = {
      id: chainId,
      events: [event],
      depth: 1,
      startTime: new Date(),
      isActive: true,
      impact: {
        threadsAffected: [event.sourceThreadId],
        agentsAffected: [event.sourceAgentId],
        environmentalChanges: [],
        totalIntensity: event.intensity
      }
    };

    if (event.targetThreadId) {
      chain.impact.threadsAffected.push(event.targetThreadId);
    }
    if (event.targetAgentId) {
      chain.impact.agentsAffected.push(event.targetAgentId);
    }

    this.entanglementChains.set(chainId, chain);
    this.activeEntanglements.add(chainId);

    // Clean up old chains
    if (this.entanglementChains.size > 50) {
      const oldestChain = Array.from(this.entanglementChains.keys())[0];
      this.entanglementChains.delete(oldestChain);
      this.activeEntanglements.delete(oldestChain);
    }
  }

  /**
   * Helper methods
   */
  private getThreadEnvironment(threadId: string): string | undefined {
    const thread = this.world?.getConvoThread(threadId);
    return thread?.getState().environmentId;
  }

  private getThreadsInEnvironment(environmentId: string): string[] {
    return this.world?.getThreadsInEnvironment(environmentId) || [];
  }

  private mapThoughtType(originalType: string): string {
    const typeMap: { [key: string]: string } = {
      'suspicion': 'observation',
      'judgment': 'observation',
      'admiration': 'observation',
      'doubt': 'observation',
      'curiosity': 'curiosity',
      'frustration': 'observation',
      'amusement': 'observation',
      'concern': 'observation',
      'excitement': 'observation'
    };
    return typeMap[originalType] || 'observation';
  }

  /**
   * Get environmental mood
   */
  getEnvironmentalMood(environmentId: string): EnvironmentalMood | undefined {
    return this.environmentalMoods.get(environmentId);
  }

  /**
   * Get all environmental moods
   */
  getAllEnvironmentalMoods(): Map<string, EnvironmentalMood> {
    return new Map(this.environmentalMoods);
  }

  /**
   * Get entanglement history
   */
  getEntanglementHistory(limit: number = 50): EntanglementEvent[] {
    return this.diffusionHistory.slice(-limit);
  }

  /**
   * Get active entanglement chains
   */
  getActiveEntanglementChains(): EntanglementChain[] {
    return Array.from(this.entanglementChains.values())
      .filter(chain => chain.isActive);
  }

  /**
   * Get entanglement statistics
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      crossTalkProbability: this.config.crossTalkProbability,
      thoughtDiffusionProbability: this.config.thoughtDiffusionProbability,
      environmentalDiffusion: this.config.environmentalDiffusion,
      totalEvents: this.diffusionHistory.length,
      activeChains: this.activeEntanglements.size,
      environmentalMoods: this.environmentalMoods.size,
      maxEntanglementDepth: this.config.maxEntanglementDepth
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.environmentalMoods.clear();
    this.entanglementChains.clear();
    this.activeEntanglements.clear();
    this.diffusionHistory = [];
    this.removeAllListeners();
  }
} 