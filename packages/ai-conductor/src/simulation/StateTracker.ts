import { EventEmitter } from 'events';
import {
  AgentState,
  StyleVector,
  BehavioralState,
  EnvironmentalInfluence,
  InnerThought,
  DiffusionState,
  EnvironmentState,
  MoodSnapshot,
  ThreadState,
  DualUtterance,
  AmbientEvent,
  EntanglementEvent,
  StyleContagion,
  DialogueEvent
} from './types/DialogueTypes';

export interface StateTrackerConfig {
  enabled: boolean;
  trackAgentStates: boolean;
  trackEnvironmentStates: boolean;
  trackThreadStates: boolean;
  trackStyleContagion: boolean;
  trackMoodDiffusion: boolean;
  updateFrequency: number; // milliseconds
  stateRetention: number; // how long to keep state history
  diffusionDecay: number; // how quickly effects decay
  styleContagionRange: number; // how far style influence spreads
  moodDiffusionRange: number; // how far mood influence spreads
}

export interface StateUpdateEvent {
  type: 'agent_state' | 'environment_state' | 'thread_state' | 'style_contagion' | 'mood_diffusion';
  entityId: string;
  oldState?: any;
  newState: any;
  timestamp: number;
  metadata?: any;
}

export class StateTracker extends EventEmitter {
  private config: StateTrackerConfig;
  private agentStates: Map<string, AgentState> = new Map();
  private environmentStates: Map<string, EnvironmentState> = new Map();
  private threadStates: Map<string, ThreadState> = new Map();
  private diffusionStates: Map<string, DiffusionState> = new Map();
  private styleContagions: StyleContagion[] = [];
  private stateHistory: StateUpdateEvent[] = [];
  private updateTimer?: NodeJS.Timeout;
  private isActive: boolean = false;

  constructor(config: Partial<StateTrackerConfig> = {}) {
    super();
    this.setMaxListeners(100);
    
    this.config = {
      enabled: true,
      trackAgentStates: true,
      trackEnvironmentStates: true,
      trackThreadStates: true,
      trackStyleContagion: true,
      trackMoodDiffusion: true,
      updateFrequency: 5000, // 5 seconds
      stateRetention: 0.8, // 80% retention
      diffusionDecay: 0.7,
      styleContagionRange: 3,
      moodDiffusionRange: 2,
      ...config
    };
  }

  /**
   * Start state tracking
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;

    if (this.config.updateFrequency > 0) {
      this.updateTimer = setInterval(() => {
        this.performStateUpdate();
      }, this.config.updateFrequency);
    }

    this.emit('state_tracker_started', {
      timestamp: Date.now(),
      config: this.config
    });
  }

  /**
   * Stop state tracking
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    this.emit('state_tracker_stopped', {
      timestamp: Date.now()
    });
  }

  /**
   * Initialize agent state
   */
  initializeAgentState(agentId: string, name: string, initialTraits: Record<string, number> = {}): void {
    const defaultTraits = {
      suspicion: 0.5,
      trust: 0.5,
      openness: 0.5,
      curiosity: 0.5,
      assertiveness: 0.5,
      empathy: 0.5,
      patience: 0.5,
      humor: 0.5,
      ...initialTraits
    };

    const defaultStyleVector: StyleVector = {
      verbosity: 0.5,
      metaphorAffinity: 0.5,
      emotionalTone: 'neutral',
      formality: 0.5,
      assertiveness: 0.5,
      curiosity: 0.5,
      patience: 0.5,
      empathy: 0.5,
      humor: 0.5,
      directness: 0.5,
      adaptability: 0.5
    };

    const defaultBehavioralState: BehavioralState = {
      trust: 0,
      sarcasm: 0,
      suspicion: 0,
      engagement: 0.5,
      assertiveness: 0,
      curiosity: 0.3,
      patience: 0.5,
      empathy: 0.5,
      timestamp: Date.now()
    };

    const defaultEnvironmentalInfluence: EnvironmentalInfluence = {
      environmentId: 'unknown',
      moodContagion: 0.5,
      tensionAbsorption: 0.5,
      energyTransfer: 0.5,
      trustModification: 0
    };

    const agentState: AgentState = {
      id: agentId,
      name,
      traits: defaultTraits,
      mood: 'neutral',
      styleAdaptation: defaultStyleVector,
      behavioralState: defaultBehavioralState,
      environmentalInfluence: defaultEnvironmentalInfluence,
      relationshipScores: {},
      thoughtHistory: [],
      memory: [],
      timestamp: Date.now()
    };

    this.agentStates.set(agentId, agentState);

    // Initialize diffusion state
    const diffusionState: DiffusionState = {
      agentId,
      styleVector: defaultStyleVector,
      behavioralState: defaultBehavioralState,
      environmentalInfluence: defaultEnvironmentalInfluence,
      relationshipScores: {},
      thoughtHistory: [],
      lastUpdate: Date.now(),
      diffusionFactors: {
        susceptibility: 0.5,
        influenceRadius: 2,
        styleRetention: 0.7,
        moodStability: 0.6
      }
    };

    this.diffusionStates.set(agentId, diffusionState);

    this.emit('agent_state_initialized', {
      agentId,
      state: agentState,
      timestamp: Date.now()
    });
  }

  /**
   * Update agent state
   */
  updateAgentState(agentId: string, updates: Partial<AgentState>): void {
    const oldState = this.agentStates.get(agentId);
    if (!oldState) {
      throw new Error(`Agent state not found for ${agentId}`);
    }

    const newState: AgentState = {
      ...oldState,
      ...updates,
      timestamp: Date.now()
    };

    this.agentStates.set(agentId, newState);

    // Update diffusion state
    const diffusionState = this.diffusionStates.get(agentId);
    if (diffusionState) {
      diffusionState.styleVector = newState.styleAdaptation || diffusionState.styleVector;
      diffusionState.behavioralState = newState.behavioralState || diffusionState.behavioralState;
      diffusionState.environmentalInfluence = newState.environmentalInfluence || diffusionState.environmentalInfluence;
      diffusionState.relationshipScores = newState.relationshipScores || diffusionState.relationshipScores;
      diffusionState.thoughtHistory = newState.thoughtHistory || diffusionState.thoughtHistory;
      diffusionState.lastUpdate = Date.now();
    }

    const event: StateUpdateEvent = {
      type: 'agent_state',
      entityId: agentId,
      oldState,
      newState,
      timestamp: Date.now()
    };

    this.stateHistory.push(event);
    this.emit('agent_state_updated', event);

    // Check for style contagion opportunities
    if (this.config.trackStyleContagion) {
      this.checkStyleContagion(agentId, oldState, newState);
    }

    // Check for mood diffusion opportunities
    if (this.config.trackMoodDiffusion) {
      this.checkMoodDiffusion(agentId, oldState, newState);
    }
  }

  /**
   * Add thought to agent
   */
  addThoughtToAgent(agentId: string, thought: InnerThought): void {
    const agentState = this.agentStates.get(agentId);
    if (!agentState) return;

    agentState.thoughtHistory.push(thought);
    agentState.timestamp = Date.now();

    // Apply behavioral impact
    if (thought.behavioralImpact) {
      const behavioralState = agentState.behavioralState;
      const impact = thought.behavioralImpact;

      behavioralState.trust = Math.max(-1, Math.min(1, behavioralState.trust + impact.trustChange));
      behavioralState.sarcasm = Math.max(-1, Math.min(1, behavioralState.sarcasm + impact.sarcasmChange));
      behavioralState.suspicion = Math.max(-1, Math.min(1, behavioralState.suspicion + impact.suspicionChange));
      behavioralState.engagement = Math.max(-1, Math.min(1, behavioralState.engagement + impact.engagementChange));
      behavioralState.assertiveness = Math.max(-1, Math.min(1, behavioralState.assertiveness + impact.assertivenessChange));
      behavioralState.curiosity = Math.max(-1, Math.min(1, behavioralState.curiosity + impact.curiosityChange));
      behavioralState.patience = Math.max(-1, Math.min(1, behavioralState.patience + impact.patienceChange));
      behavioralState.empathy = Math.max(-1, Math.min(1, behavioralState.empathy + (impact.empathyChange || 0)));
      behavioralState.timestamp = Date.now();
    }

    // Update mood based on thought type
    this.updateAgentMood(agentId, thought);

    this.emit('thought_added', {
      agentId,
      thought,
      timestamp: Date.now()
    });
  }

  /**
   * Update agent mood based on thought
   */
  private updateAgentMood(agentId: string, thought: InnerThought): void {
    const agentState = this.agentStates.get(agentId);
    if (!agentState) return;

    const thoughtMoodMap: Record<string, string> = {
      'suspicion': 'suspicious',
      'doubt': 'uncertain',
      'frustration': 'frustrated',
      'admiration': 'impressed',
      'amusement': 'amused',
      'curiosity': 'curious',
      'concern': 'worried',
      'excitement': 'excited'
    };

    const newMood = thoughtMoodMap[thought.type];
    if (newMood && newMood !== agentState.mood) {
      agentState.mood = newMood;
    }
  }

  /**
   * Initialize environment state
   */
  initializeEnvironmentState(envId: string, name: string): void {
    const environmentState: EnvironmentState = {
      id: envId,
      name,
      overallMood: 'neutral',
      tensionLevel: 0.5,
      trustLevel: 0.5,
      energyLevel: 0.5,
      curiosityLevel: 0.5,
      suspicionLevel: 0.5,
      lastUpdated: Date.now(),
      contributingFactors: [],
      activeThreads: [],
      ambientEvents: [],
      moodHistory: []
    };

    this.environmentStates.set(envId, environmentState);

    this.emit('environment_state_initialized', {
      envId,
      state: environmentState,
      timestamp: Date.now()
    });
  }

  /**
   * Update environment state
   */
  updateEnvironmentState(envId: string, updates: Partial<EnvironmentState>): void {
    const oldState = this.environmentStates.get(envId);
    if (!oldState) {
      throw new Error(`Environment state not found for ${envId}`);
    }

    const newState: EnvironmentState = {
      ...oldState,
      ...updates,
      lastUpdated: Date.now()
    };

    // Add mood snapshot to history
    const moodSnapshot: MoodSnapshot = {
      timestamp: Date.now(),
      mood: newState.overallMood,
      tensionLevel: newState.tensionLevel,
      trustLevel: newState.trustLevel,
      energyLevel: newState.energyLevel,
      curiosityLevel: newState.curiosityLevel,
      suspicionLevel: newState.suspicionLevel,
      contributingFactors: [...newState.contributingFactors]
    };

    newState.moodHistory.push(moodSnapshot);

    // Keep only recent mood history
    if (newState.moodHistory.length > 20) {
      newState.moodHistory = newState.moodHistory.slice(-10);
    }

    this.environmentStates.set(envId, newState);

    const event: StateUpdateEvent = {
      type: 'environment_state',
      entityId: envId,
      oldState,
      newState,
      timestamp: Date.now()
    };

    this.stateHistory.push(event);
    this.emit('environment_state_updated', event);
  }

  /**
   * Initialize thread state
   */
  initializeThreadState(threadId: string, name: string, participants: string[]): void {
    const threadState: ThreadState = {
      id: threadId,
      name,
      participants,
      isActive: false,
      currentRound: 0,
      totalExchanges: 0,
      dualExchanges: [],
      ambientEvents: [],
      interjections: [],
      crossTalkEvents: [],
      thoughtDiffusions: [],
      environmentalMoodShifts: [],
      startTime: Date.now(),
      lastActivity: Date.now()
    };

    this.threadStates.set(threadId, threadState);

    this.emit('thread_state_initialized', {
      threadId,
      state: threadState,
      timestamp: Date.now()
    });
  }

  /**
   * Update thread state
   */
  updateThreadState(threadId: string, updates: Partial<ThreadState>): void {
    const oldState = this.threadStates.get(threadId);
    if (!oldState) {
      throw new Error(`Thread state not found for ${threadId}`);
    }

    const newState: ThreadState = {
      ...oldState,
      ...updates,
      lastActivity: Date.now()
    };

    this.threadStates.set(threadId, newState);

    const event: StateUpdateEvent = {
      type: 'thread_state',
      entityId: threadId,
      oldState,
      newState,
      timestamp: Date.now()
    };

    this.stateHistory.push(event);
    this.emit('thread_state_updated', event);
  }

  /**
   * Check for style contagion opportunities
   */
  private checkStyleContagion(sourceAgentId: string, oldState: AgentState, newState: AgentState): void {
    const sourceDiffusionState = this.diffusionStates.get(sourceAgentId);
    if (!sourceDiffusionState) return;

    // Find agents within influence radius
    const influencedAgents = this.findAgentsInRange(sourceAgentId, this.config.styleContagionRange);

    for (const targetAgentId of influencedAgents) {
      if (targetAgentId === sourceAgentId) continue;

      const targetDiffusionState = this.diffusionStates.get(targetAgentId);
      if (!targetDiffusionState) continue;

      // Calculate style contagion probability
      const sourceInfluence = sourceDiffusionState.diffusionFactors.influenceRadius;
      const targetSusceptibility = targetDiffusionState.diffusionFactors.susceptibility;
      const distance = this.calculateDistance(sourceAgentId, targetAgentId);
      
      const contagionProbability = (sourceInfluence * targetSusceptibility) / (distance + 1);
      
      if (Math.random() < contagionProbability) {
        this.applyStyleContagion(sourceAgentId, targetAgentId, newState.styleAdaptation!);
      }
    }
  }

  /**
   * Apply style contagion
   */
  private applyStyleContagion(sourceAgentId: string, targetAgentId: string, sourceStyle: StyleVector): void {
    const targetAgentState = this.agentStates.get(targetAgentId);
    if (!targetAgentState) return;

    const targetStyle = targetAgentState.styleAdaptation!;
    const intensity = 0.3; // Base contagion intensity

    // Blend styles
    const blendedStyle: StyleVector = {
      verbosity: this.blendValues(targetStyle.verbosity, sourceStyle.verbosity, intensity),
      metaphorAffinity: this.blendValues(targetStyle.metaphorAffinity, sourceStyle.metaphorAffinity, intensity),
      emotionalTone: sourceStyle.emotionalTone || targetStyle.emotionalTone,
      formality: this.blendValues(targetStyle.formality, sourceStyle.formality, intensity),
      assertiveness: this.blendValues(targetStyle.assertiveness, sourceStyle.assertiveness, intensity),
      curiosity: this.blendValues(targetStyle.curiosity, sourceStyle.curiosity, intensity),
      patience: this.blendValues(targetStyle.patience, sourceStyle.patience, intensity),
      empathy: this.blendValues(targetStyle.empathy, sourceStyle.empathy, intensity),
      humor: this.blendValues(targetStyle.humor, sourceStyle.humor, intensity),
      directness: this.blendValues(targetStyle.directness, sourceStyle.directness, intensity),
      adaptability: this.blendValues(targetStyle.adaptability, sourceStyle.adaptability, intensity)
    };

    // Update target agent style
    this.updateAgentState(targetAgentId, {
      styleAdaptation: blendedStyle
    });

    // Record style contagion
    const styleContagion: StyleContagion = {
      sourceAgentId,
      targetAgentId,
      styleVector: sourceStyle,
      intensity,
      duration: 30000, // 30 seconds
      timestamp: Date.now()
    };

    this.styleContagions.push(styleContagion);

    this.emit('style_contagion_applied', {
      sourceAgentId,
      targetAgentId,
      styleContagion,
      timestamp: Date.now()
    });
  }

  /**
   * Check for mood diffusion opportunities
   */
  private checkMoodDiffusion(sourceAgentId: string, oldState: AgentState, newState: AgentState): void {
    if (oldState.mood === newState.mood) return;

    const sourceDiffusionState = this.diffusionStates.get(sourceAgentId);
    if (!sourceDiffusionState) return;

    // Find agents within mood diffusion range
    const influencedAgents = this.findAgentsInRange(sourceAgentId, this.config.moodDiffusionRange);

    for (const targetAgentId of influencedAgents) {
      if (targetAgentId === sourceAgentId) continue;

      const targetDiffusionState = this.diffusionStates.get(targetAgentId);
      if (!targetDiffusionState) continue;

      // Calculate mood diffusion probability
      const sourceInfluence = sourceDiffusionState.diffusionFactors.influenceRadius;
      const targetSusceptibility = targetDiffusionState.diffusionFactors.susceptibility;
      const distance = this.calculateDistance(sourceAgentId, targetAgentId);
      
      const diffusionProbability = (sourceInfluence * targetSusceptibility) / (distance + 1);
      
      if (Math.random() < diffusionProbability) {
        this.applyMoodDiffusion(sourceAgentId, targetAgentId, newState.mood!);
      }
    }
  }

  /**
   * Apply mood diffusion
   */
  private applyMoodDiffusion(sourceAgentId: string, targetAgentId: string, sourceMood: string): void {
    const targetAgentState = this.agentStates.get(targetAgentId);
    if (!targetAgentState) return;

    // Update target agent mood
    this.updateAgentState(targetAgentId, {
      mood: sourceMood
    });

    this.emit('mood_diffusion_applied', {
      sourceAgentId,
      targetAgentId,
      sourceMood,
      timestamp: Date.now()
    });
  }

  /**
   * Helper methods
   */
  private findAgentsInRange(agentId: string, range: number): string[] {
    // Simplified implementation - in reality this would use spatial positioning
    return Array.from(this.agentStates.keys()).filter(id => id !== agentId);
  }

  private calculateDistance(agentId1: string, agentId2: string): number {
    // Simplified distance calculation
    return Math.random() * 3;
  }

  private blendValues(value1: number | undefined, value2: number | undefined, intensity: number): number {
    if (value1 === undefined && value2 === undefined) return 0.5;
    if (value1 === undefined) return value2!;
    if (value2 === undefined) return value1;
    
    return value1 + (value2 - value1) * intensity;
  }

  /**
   * Perform periodic state update
   */
  private performStateUpdate(): void {
    // Clean up old style contagions
    const now = Date.now();
    this.styleContagions = this.styleContagions.filter(contagion => 
      now - contagion.timestamp < contagion.duration
    );

    // Apply diffusion decay
    this.applyDiffusionDecay();

    this.emit('state_update_performed', {
      timestamp: now,
      activeStyleContagions: this.styleContagions.length
    });
  }

  /**
   * Apply diffusion decay to all states
   */
  private applyDiffusionDecay(): void {
    const decay = this.config.diffusionDecay;

    for (const [agentId, agentState] of this.agentStates) {
      const behavioralState = agentState.behavioralState;
      
      // Decay behavioral state towards neutral
      behavioralState.trust *= decay;
      behavioralState.sarcasm *= decay;
      behavioralState.suspicion *= decay;
      behavioralState.engagement = 0.5 + (behavioralState.engagement - 0.5) * decay;
      behavioralState.assertiveness *= decay;
      behavioralState.curiosity = 0.3 + (behavioralState.curiosity - 0.3) * decay;
      behavioralState.patience = 0.5 + (behavioralState.patience - 0.5) * decay;
      behavioralState.empathy = 0.5 + (behavioralState.empathy - 0.5) * decay;
      behavioralState.timestamp = Date.now();
    }
  }

  /**
   * Get agent state
   */
  getAgentState(agentId: string): AgentState | undefined {
    return this.agentStates.get(agentId);
  }

  /**
   * Get environment state
   */
  getEnvironmentState(envId: string): EnvironmentState | undefined {
    return this.environmentStates.get(envId);
  }

  /**
   * Get thread state
   */
  getThreadState(threadId: string): ThreadState | undefined {
    return this.threadStates.get(threadId);
  }

  /**
   * Get diffusion state
   */
  getDiffusionState(agentId: string): DiffusionState | undefined {
    return this.diffusionStates.get(agentId);
  }

  /**
   * Get all agent states
   */
  getAllAgentStates(): Map<string, AgentState> {
    return new Map(this.agentStates);
  }

  /**
   * Get all environment states
   */
  getAllEnvironmentStates(): Map<string, EnvironmentState> {
    return new Map(this.environmentStates);
  }

  /**
   * Get all thread states
   */
  getAllThreadStates(): Map<string, ThreadState> {
    return new Map(this.threadStates);
  }

  /**
   * Get state history
   */
  getStateHistory(limit: number = 100): StateUpdateEvent[] {
    return this.stateHistory.slice(-limit);
  }

  /**
   * Get active style contagions
   */
  getActiveStyleContagions(): StyleContagion[] {
    return [...this.styleContagions];
  }

  /**
   * Get state tracker statistics
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      isActive: this.isActive,
      agentStates: this.agentStates.size,
      environmentStates: this.environmentStates.size,
      threadStates: this.threadStates.size,
      diffusionStates: this.diffusionStates.size,
      activeStyleContagions: this.styleContagions.length,
      stateHistoryLength: this.stateHistory.length,
      config: this.config
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    
    this.agentStates.clear();
    this.environmentStates.clear();
    this.threadStates.clear();
    this.diffusionStates.clear();
    this.styleContagions = [];
    this.stateHistory = [];
    
    this.removeAllListeners();
  }
} 