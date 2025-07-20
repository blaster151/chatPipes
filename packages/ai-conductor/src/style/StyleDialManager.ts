import { EventEmitter } from 'events';
import { StyleVector, AgentState } from '../simulation/types/DialogueTypes';
import { SharedMemoryManager } from '../memory/SharedMemoryManager';
import { SurrealVibeManager } from '../surreal/SurrealVibeManager';

export interface StyleDial {
  name: string;
  value: number; // 0-1: Current value
  min: number; // Minimum value
  max: number; // Maximum value
  default: number; // Default value
  description: string;
  category: 'verbosity' | 'personality' | 'surreal' | 'interaction' | 'creativity';
}

export interface StyleProfile {
  agentId: string;
  dials: Map<string, StyleDial>;
  baseStyle: StyleVector;
  adaptationRate: number; // 0-1: How quickly style adapts
  jitterAmount: number; // 0-1: Amount of random variation
  lastAdaptation: number;
  adaptationHistory: Array<{
    timestamp: number;
    dial: string;
    oldValue: number;
    newValue: number;
    reason: string;
  }>;
}

export interface AmbientRandomizer {
  type: 'jitter' | 'drift' | 'surge' | 'convergence' | 'divergence';
  intensity: number; // 0-1: How strong the effect is
  duration: number; // How long the effect lasts
  affectedDials: string[];
  description: string;
}

export interface StyleDialConfig {
  adaptationInterval: number; // How often to adapt styles
  jitterFrequency: number; // 0-1: How often to apply jitter
  convergenceThreshold: number; // 0-1: When styles start converging
  divergenceThreshold: number; // 0-1: When styles start diverging
  maxAdaptationRate: number; // Maximum adaptation rate
  ambientRandomizerChance: number; // 0-1: Chance of ambient randomizer
}

export class StyleDialManager extends EventEmitter {
  private memoryManager: SharedMemoryManager;
  private surrealVibeManager: SurrealVibeManager;
  private config: StyleDialConfig;
  private styleProfiles: Map<string, StyleProfile> = new Map();
  private ambientRandomizers: AmbientRandomizer[] = [];
  private adaptationTimer?: NodeJS.Timeout;
  private jitterTimer?: NodeJS.Timeout;

  constructor(
    memoryManager: SharedMemoryManager,
    surrealVibeManager: SurrealVibeManager,
    config: Partial<StyleDialConfig> = {}
  ) {
    super();
    this.setMaxListeners(100);
    
    this.memoryManager = memoryManager;
    this.surrealVibeManager = surrealVibeManager;
    
    this.config = {
      adaptationInterval: 60 * 1000, // 1 minute
      jitterFrequency: 0.3, // 30% chance per interval
      convergenceThreshold: 0.7,
      divergenceThreshold: 0.3,
      maxAdaptationRate: 0.2,
      ambientRandomizerChance: 0.1,
      ...config
    };

    this.startTimers();
  }

  /**
   * Register an agent with style dials
   */
  registerAgent(agentId: string, baseStyle: StyleVector): void {
    const dials = this.createDefaultDials();
    
    const profile: StyleProfile = {
      agentId,
      dials,
      baseStyle,
      adaptationRate: 0.1,
      jitterAmount: 0.05,
      lastAdaptation: Date.now(),
      adaptationHistory: []
    };

    this.styleProfiles.set(agentId, profile);

    this.emit('agent_registered', {
      agentId,
      profile,
      timestamp: Date.now()
    });
  }

  /**
   * Create default style dials
   */
  private createDefaultDials(): Map<string, StyleDial> {
    const dials = new Map<string, StyleDial>();
    
    // Verbosity dials
    dials.set('verbosity', {
      name: 'verbosity',
      value: 0.5,
      min: 0.1,
      max: 0.9,
      default: 0.5,
      description: 'How verbose the agent is in responses',
      category: 'verbosity'
    });

    dials.set('metaphorAffinity', {
      name: 'metaphorAffinity',
      value: 0.7,
      min: 0.2,
      max: 0.95,
      default: 0.7,
      description: 'How likely the agent is to use metaphors',
      category: 'personality'
    });

    dials.set('surrealism', {
      name: 'surrealism',
      value: 0.6,
      min: 0.1,
      max: 0.9,
      default: 0.6,
      description: 'How surreal the agent\'s responses are',
      category: 'surreal'
    });

    dials.set('absurdity', {
      name: 'absurdity',
      value: 0.5,
      min: 0.1,
      max: 0.8,
      default: 0.5,
      description: 'How absurd the agent\'s responses are',
      category: 'surreal'
    });

    dials.set('callbackLikelihood', {
      name: 'callbackLikelihood',
      value: 0.6,
      min: 0.2,
      max: 0.9,
      default: 0.6,
      description: 'How likely the agent is to make callbacks',
      category: 'interaction'
    });

    dials.set('creativity', {
      name: 'creativity',
      value: 0.7,
      min: 0.3,
      max: 0.95,
      default: 0.7,
      description: 'How creative the agent\'s responses are',
      category: 'creativity'
    });

    dials.set('formality', {
      name: 'formality',
      value: 0.4,
      min: 0.1,
      max: 0.8,
      default: 0.4,
      description: 'How formal the agent\'s language is',
      category: 'personality'
    });

    dials.set('emotionalIntensity', {
      name: 'emotionalIntensity',
      value: 0.5,
      min: 0.1,
      max: 0.9,
      default: 0.5,
      description: 'How emotionally intense the agent\'s responses are',
      category: 'personality'
    });

    dials.set('quirkiness', {
      name: 'quirkiness',
      value: 0.6,
      min: 0.2,
      max: 0.9,
      default: 0.6,
      description: 'How quirky or unusual the agent\'s responses are',
      category: 'personality'
    });

    dials.set('adaptability', {
      name: 'adaptability',
      value: 0.5,
      min: 0.1,
      max: 0.8,
      default: 0.5,
      description: 'How quickly the agent adapts to conversation style',
      category: 'interaction'
    });

    return dials;
  }

  /**
   * Get current style vector for an agent
   */
  getStyleVector(agentId: string): StyleVector {
    const profile = this.styleProfiles.get(agentId);
    if (!profile) {
      return this.surrealVibeManager.getGlobalStyleVector();
    }

    const dials = profile.dials;
    
    return {
      verbosity: dials.get('verbosity')?.value || 0.5,
      metaphorAffinity: dials.get('metaphorAffinity')?.value || 0.7,
      emotionalTone: this.getEmotionalTone(dials.get('emotionalIntensity')?.value || 0.5),
      formality: dials.get('formality')?.value || 0.4,
      creativity: dials.get('creativity')?.value || 0.7,
      absurdity: dials.get('absurdity')?.value || 0.5,
      surrealism: dials.get('surrealism')?.value || 0.6
    };
  }

  /**
   * Get emotional tone from intensity
   */
  private getEmotionalTone(intensity: number): string {
    if (intensity > 0.7) return 'passionate';
    if (intensity > 0.5) return 'engaged';
    if (intensity > 0.3) return 'neutral';
    return 'reserved';
  }

  /**
   * Adapt style based on conversation context
   */
  adaptStyle(agentId: string, context: {
    participants: string[];
    currentTopic: string;
    emotionalTone: string;
    recentMemories: SharedMemory[];
    activeThemes: string[];
  }): void {
    const profile = this.styleProfiles.get(agentId);
    if (!profile) return;

    const now = Date.now();
    const timeSinceLastAdaptation = now - profile.lastAdaptation;
    
    if (timeSinceLastAdaptation < this.config.adaptationInterval) {
      return; // Too soon to adapt
    }

    // Analyze context for adaptation opportunities
    const adaptations = this.analyzeAdaptationOpportunities(profile, context);
    
    adaptations.forEach(adaptation => {
      const dial = profile.dials.get(adaptation.dial);
      if (dial) {
        const oldValue = dial.value;
        const newValue = Math.max(dial.min, Math.min(dial.max, 
          dial.value + adaptation.change * profile.adaptationRate));
        
        dial.value = newValue;
        
        profile.adaptationHistory.push({
          timestamp: now,
          dial: adaptation.dial,
          oldValue,
          newValue,
          reason: adaptation.reason
        });
      }
    });

    profile.lastAdaptation = now;

    this.emit('style_adapted', {
      agentId,
      adaptations,
      profile,
      timestamp: now
    });
  }

  /**
   * Analyze adaptation opportunities
   */
  private analyzeAdaptationOpportunities(
    profile: StyleProfile, 
    context: any
  ): Array<{ dial: string; change: number; reason: string }> {
    const adaptations: Array<{ dial: string; change: number; reason: string }> = [];
    
    // Adapt based on conversation topic
    if (context.currentTopic.toLowerCase().includes('philosophy') || 
        context.currentTopic.toLowerCase().includes('consciousness')) {
      adaptations.push({
        dial: 'surrealism',
        change: 0.1,
        reason: 'Philosophical topic detected'
      });
      adaptations.push({
        dial: 'metaphorAffinity',
        change: 0.15,
        reason: 'Philosophical topic detected'
      });
    }

    // Adapt based on emotional tone
    if (context.emotionalTone === 'surreal' || context.emotionalTone === 'absurd') {
      adaptations.push({
        dial: 'absurdity',
        change: 0.1,
        reason: 'Surreal emotional tone detected'
      });
      adaptations.push({
        dial: 'creativity',
        change: 0.1,
        reason: 'Surreal emotional tone detected'
      });
    }

    // Adapt based on active themes
    if (context.activeThemes.some(theme => theme.includes('quantum') || theme.includes('surreal'))) {
      adaptations.push({
        dial: 'surrealism',
        change: 0.1,
        reason: 'Surreal themes active'
      });
    }

    // Adapt based on recent memories
    const recentSurrealMemories = context.recentMemories.filter(
      memory => memory.tags.some(tag => ['surreal', 'absurd'].includes(tag))
    );
    
    if (recentSurrealMemories.length > 0) {
      adaptations.push({
        dial: 'callbackLikelihood',
        change: 0.1,
        reason: 'Surreal memories detected'
      });
    }

    // Adapt based on other participants
    const otherProfiles = Array.from(this.styleProfiles.values())
      .filter(p => p.agentId !== profile.agentId && 
                   context.participants.includes(p.agentId));
    
    if (otherProfiles.length > 0) {
      const avgSurrealism = otherProfiles.reduce((sum, p) => 
        sum + (p.dials.get('surrealism')?.value || 0), 0) / otherProfiles.length;
      
      if (avgSurrealism > 0.7) {
        adaptations.push({
          dial: 'surrealism',
          change: 0.05,
          reason: 'Other participants are highly surreal'
        });
      }
    }

    return adaptations;
  }

  /**
   * Apply jitter to prevent convergence
   */
  applyJitter(agentId: string): void {
    const profile = this.styleProfiles.get(agentId);
    if (!profile) return;

    if (Math.random() > this.config.jitterFrequency) {
      return; // Skip jitter this time
    }

    const jitteredDials: string[] = [];
    
    profile.dials.forEach((dial, name) => {
      if (Math.random() < 0.3) { // 30% chance per dial
        const jitter = (Math.random() - 0.5) * 2 * profile.jitterAmount;
        const oldValue = dial.value;
        const newValue = Math.max(dial.min, Math.min(dial.max, dial.value + jitter));
        
        dial.value = newValue;
        jitteredDials.push(name);
        
        profile.adaptationHistory.push({
          timestamp: Date.now(),
          dial: name,
          oldValue,
          newValue,
          reason: 'jitter'
        });
      }
    });

    if (jitteredDials.length > 0) {
      this.emit('jitter_applied', {
        agentId,
        jitteredDials,
        profile,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Create ambient randomizer
   */
  createAmbientRandomizer(): void {
    if (Math.random() > this.config.ambientRandomizerChance) {
      return; // Skip randomizer this time
    }

    const randomizerTypes: Array<{ type: AmbientRandomizer['type']; description: string }> = [
      {
        type: 'jitter',
        description: 'Increased random variation in all style dials'
      },
      {
        type: 'drift',
        description: 'Gradual shift toward more surreal styles'
      },
      {
        type: 'surge',
        description: 'Temporary boost in creativity and metaphor affinity'
      },
      {
        type: 'convergence',
        description: 'Styles start to converge toward common patterns'
      },
      {
        type: 'divergence',
        description: 'Styles start to diverge for variety'
      }
    ];

    const selectedType = randomizerTypes[Math.floor(Math.random() * randomizerTypes.length)];
    
    const randomizer: AmbientRandomizer = {
      type: selectedType.type,
      intensity: 0.3 + Math.random() * 0.4, // 0.3 to 0.7
      duration: 2 * 60 * 1000 + Math.random() * 3 * 60 * 1000, // 2-5 minutes
      affectedDials: this.getAffectedDials(selectedType.type),
      description: selectedType.description
    };

    this.ambientRandomizers.push(randomizer);

    this.emit('ambient_randomizer_created', {
      randomizer,
      timestamp: Date.now()
    });
  }

  /**
   * Get affected dials for randomizer type
   */
  private getAffectedDials(type: AmbientRandomizer['type']): string[] {
    switch (type) {
      case 'jitter':
        return ['verbosity', 'metaphorAffinity', 'surrealism', 'absurdity', 'creativity'];
      case 'drift':
        return ['surrealism', 'absurdity', 'metaphorAffinity'];
      case 'surge':
        return ['creativity', 'metaphorAffinity', 'quirkiness'];
      case 'convergence':
        return ['adaptability', 'callbackLikelihood'];
      case 'divergence':
        return ['quirkiness', 'creativity', 'absurdity'];
      default:
        return [];
    }
  }

  /**
   * Apply ambient randomizers
   */
  private applyAmbientRandomizers(): void {
    const now = Date.now();
    
    // Remove expired randomizers
    this.ambientRandomizers = this.ambientRandomizers.filter(r => 
      now - r.timestamp < r.duration
    );

    // Apply active randomizers
    this.ambientRandomizers.forEach(randomizer => {
      this.styleProfiles.forEach(profile => {
        randomizer.affectedDials.forEach(dialName => {
          const dial = profile.dials.get(dialName);
          if (dial) {
            const effect = this.calculateRandomizerEffect(randomizer, dial);
            const oldValue = dial.value;
            const newValue = Math.max(dial.min, Math.min(dial.max, dial.value + effect));
            
            dial.value = newValue;
            
            profile.adaptationHistory.push({
              timestamp: now,
              dial: dialName,
              oldValue,
              newValue,
              reason: `ambient_${randomizer.type}`
            });
          }
        });
      });
    });
  }

  /**
   * Calculate randomizer effect
   */
  private calculateRandomizerEffect(randomizer: AmbientRandomizer, dial: StyleDial): number {
    const baseEffect = randomizer.intensity * 0.1; // Base effect size
    
    switch (randomizer.type) {
      case 'jitter':
        return (Math.random() - 0.5) * 2 * baseEffect;
      case 'drift':
        return baseEffect; // Positive drift
      case 'surge':
        return baseEffect * 1.5; // Stronger positive effect
      case 'convergence':
        return baseEffect * 0.5; // Subtle convergence
      case 'divergence':
        return (Math.random() - 0.5) * baseEffect; // Random divergence
      default:
        return 0;
    }
  }

  /**
   * Start timers
   */
  private startTimers(): void {
    this.adaptationTimer = setInterval(() => {
      this.applyAmbientRandomizers();
      this.createAmbientRandomizer();
    }, this.config.adaptationInterval);

    this.jitterTimer = setInterval(() => {
      this.styleProfiles.forEach(profile => {
        this.applyJitter(profile.agentId);
      });
    }, this.config.adaptationInterval * 2);
  }

  /**
   * Get style profile
   */
  getStyleProfile(agentId: string): StyleProfile | undefined {
    return this.styleProfiles.get(agentId);
  }

  /**
   * Get all style profiles
   */
  getAllStyleProfiles(): StyleProfile[] {
    return Array.from(this.styleProfiles.values());
  }

  /**
   * Get active ambient randomizers
   */
  getActiveRandomizers(): AmbientRandomizer[] {
    const now = Date.now();
    return this.ambientRandomizers.filter(r => 
      now - r.timestamp < r.duration
    );
  }

  /**
   * Get style statistics
   */
  getStats() {
    const profiles = Array.from(this.styleProfiles.values());
    
    return {
      totalAgents: profiles.length,
      averageAdaptationRate: profiles.reduce((sum, p) => sum + p.adaptationRate, 0) / profiles.length || 0,
      averageJitterAmount: profiles.reduce((sum, p) => sum + p.jitterAmount, 0) / profiles.length || 0,
      totalAdaptations: profiles.reduce((sum, p) => sum + p.adaptationHistory.length, 0),
      activeRandomizers: this.getActiveRandomizers().length,
      dialCategories: {
        verbosity: profiles.reduce((sum, p) => sum + (p.dials.get('verbosity')?.value || 0), 0) / profiles.length || 0,
        surrealism: profiles.reduce((sum, p) => sum + (p.dials.get('surrealism')?.value || 0), 0) / profiles.length || 0,
        creativity: profiles.reduce((sum, p) => sum + (p.dials.get('creativity')?.value || 0), 0) / profiles.length || 0,
        callbackLikelihood: profiles.reduce((sum, p) => sum + (p.dials.get('callbackLikelihood')?.value || 0), 0) / profiles.length || 0
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.adaptationTimer) {
      clearInterval(this.adaptationTimer);
    }
    if (this.jitterTimer) {
      clearInterval(this.jitterTimer);
    }
    
    this.styleProfiles.clear();
    this.ambientRandomizers = [];
    
    this.removeAllListeners();
  }
} 