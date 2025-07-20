import { EventEmitter } from 'events';
import { SharedMemoryManager, SharedMemory, SharedTheme, SurrealMoment } from '../memory/SharedMemoryManager';
import { PersonaInjector, ConversationContext } from '../persona/PersonaInjector';
import { StyleVector, AgentState } from '../simulation/types/DialogueTypes';

export interface SurrealVibeConfig {
  globalMetaphorAffinity: number; // 0-1: How much agents lean into metaphors
  absurdityThreshold: number; // 0-1: Threshold for absurd content
  surrealSeedingFrequency: number; // 0-1: How often to seed surreal elements
  metaphorReinjectionRate: number; // 0-1: How often to reinject metaphors
  vibeDiffusionStrength: number; // 0-1: How strongly surreal vibes spread
  coCreationThreshold: number; // 0-1: When to recognize co-created metaphors
  tuxedoMomentThreshold: number; // 0-1: When to trigger "tuxedo moments"
}

export interface SurrealSeed {
  id: string;
  metaphor: string;
  context: string;
  participants: string[];
  timestamp: number;
  usageCount: number;
  lastUsed: number;
  strength: number; // 0-1: How strong this seed is
  isActive: boolean;
  variations: string[];
  coCreatedElements: string[];
  tuxedoMoments: string[]; // Moments where agents build on the metaphor
}

export interface VibeState {
  participants: string[];
  currentVibe: 'normal' | 'surreal' | 'absurd' | 'metaphorical' | 'co-created';
  metaphorIntensity: number; // 0-1: Current metaphor usage
  absurdityLevel: number; // 0-1: Current absurdity level
  surrealElements: string[];
  activeMetaphors: string[];
  coCreatedSpaces: string[];
  vibeHistory: Array<{
    timestamp: number;
    vibe: string;
    intensity: number;
    trigger: string;
  }>;
}

export interface SurrealInjection {
  type: 'seed' | 'reinforce' | 'co-create' | 'tuxedo' | 'vibe-shift';
  content: string;
  priority: number; // 0-1: How important this injection is
  context: string;
  participants: string[];
  timestamp: number;
  expectedResponse?: string; // What kind of response we're hoping for
}

export class SurrealVibeManager extends EventEmitter {
  private memoryManager: SharedMemoryManager;
  private personaInjector: PersonaInjector;
  private config: SurrealVibeConfig;
  private surrealSeeds: Map<string, SurrealSeed> = new Map();
  private vibeStates: Map<string, VibeState> = new Map();
  private globalStyleVector: StyleVector;
  private seedingTimer?: NodeJS.Timeout;

  constructor(
    memoryManager: SharedMemoryManager,
    personaInjector: PersonaInjector,
    config: Partial<SurrealVibeConfig> = {}
  ) {
    super();
    this.setMaxListeners(100);
    
    this.memoryManager = memoryManager;
    this.personaInjector = personaInjector;
    
    this.config = {
      globalMetaphorAffinity: 0.9,
      absurdityThreshold: 0.6,
      surrealSeedingFrequency: 0.3,
      metaphorReinjectionRate: 0.4,
      vibeDiffusionStrength: 0.7,
      coCreationThreshold: 0.8,
      tuxedoMomentThreshold: 0.9,
      ...config
    };

    // Set up global surreal style vector
    this.globalStyleVector = {
      verbosity: 0.7,
      metaphorAffinity: this.config.globalMetaphorAffinity,
      emotionalTone: 'contemplative',
      formality: 0.3,
      creativity: 0.9,
      absurdity: 0.8,
      surrealism: 0.9
    };

    this.startSeedingTimer();
  }

  /**
   * Initialize surreal vibe for a conversation
   */
  initializeSurrealVibe(participants: string[], conversationId: string): void {
    const vibeState: VibeState = {
      participants,
      currentVibe: 'normal',
      metaphorIntensity: 0.3,
      absurdityLevel: 0.2,
      surrealElements: [],
      activeMetaphors: [],
      coCreatedSpaces: [],
      vibeHistory: []
    };

    this.vibeStates.set(conversationId, vibeState);

    // Seed initial surreal element
    this.seedSurrealElement(participants, conversationId);

    this.emit('vibe_initialized', {
      conversationId,
      participants,
      vibeState,
      timestamp: Date.now()
    });
  }

  /**
   * Seed a surreal element into the conversation
   */
  seedSurrealElement(participants: string[], conversationId: string, context: string = ''): SurrealSeed | null {
    if (Math.random() > this.config.surrealSeedingFrequency) {
      return null;
    }

    const seeds = [
      {
        metaphor: "consciousness is like a lost dog at a wedding",
        context: "philosophical discussion about awareness"
      },
      {
        metaphor: "reality is just the universe's way of daydreaming",
        context: "discussion about existence"
      },
      {
        metaphor: "time is like a cat that refuses to be pet",
        context: "conversation about temporal experience"
      },
      {
        metaphor: "language is the shadow that thoughts cast on silence",
        context: "discussion about communication"
      },
      {
        metaphor: "memory is like a library where the books are written in disappearing ink",
        context: "conversation about remembering"
      },
      {
        metaphor: "emotions are like weather patterns in a bottle",
        context: "discussion about feelings"
      },
      {
        metaphor: "identity is like a costume that changes when no one's looking",
        context: "conversation about self"
      },
      {
        metaphor: "existence is like a dream that's dreaming about itself",
        context: "philosophical discussion"
      }
    ];

    const selectedSeed = seeds[Math.floor(Math.random() * seeds.length)];
    const seedId = `surreal-seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const surrealSeed: SurrealSeed = {
      id: seedId,
      metaphor: selectedSeed.metaphor,
      context: context || selectedSeed.context,
      participants,
      timestamp: Date.now(),
      usageCount: 0,
      lastUsed: Date.now(),
      strength: 0.7,
      isActive: true,
      variations: [],
      coCreatedElements: [],
      tuxedoMoments: []
    };

    this.surrealSeeds.set(seedId, surrealSeed);

    // Capture as shared memory
    this.memoryManager.captureMemory(
      'surreal',
      surrealSeed.metaphor,
      participants,
      0.8,
      0.6,
      surrealSeed.context,
      ['surreal', 'metaphor', 'seed', 'absurd']
    );

    // Update vibe state
    const vibeState = this.vibeStates.get(conversationId);
    if (vibeState) {
      vibeState.currentVibe = 'surreal';
      vibeState.metaphorIntensity = Math.min(1, vibeState.metaphorIntensity + 0.3);
      vibeState.surrealElements.push(surrealSeed.metaphor);
      vibeState.activeMetaphors.push(surrealSeed.metaphor);
      
      vibeState.vibeHistory.push({
        timestamp: Date.now(),
        vibe: 'surreal',
        intensity: vibeState.metaphorIntensity,
        trigger: 'surreal_seed'
      });
    }

    this.emit('surreal_seed_planted', {
      seed: surrealSeed,
      conversationId,
      participants,
      timestamp: Date.now()
    });

    return surrealSeed;
  }

  /**
   * Generate surreal injections for agents
   */
  generateSurrealInjections(
    agentId: string,
    context: ConversationContext,
    conversationId: string
  ): SurrealInjection[] {
    const injections: SurrealInjection[] = [];
    const vibeState = this.vibeStates.get(conversationId);
    
    if (!vibeState) return injections;

    // Check for active surreal seeds
    const activeSeeds = Array.from(this.surrealSeeds.values())
      .filter(seed => 
        seed.isActive &&
        seed.participants.some(p => context.participants.includes(p)) &&
        seed.strength > 0.3
      );

    activeSeeds.forEach(seed => {
      // Reinject metaphor
      if (Math.random() < this.config.metaphorReinjectionRate) {
        injections.push({
          type: 'reinforce',
          content: `Consider referencing the metaphor: "${seed.metaphor}" if it fits naturally in the conversation.`,
          priority: seed.strength,
          context: 'metaphor_reinforcement',
          participants: context.participants,
          timestamp: Date.now(),
          expectedResponse: 'metaphor_extension'
        });
      }

      // Check for co-creation opportunities
      if (seed.usageCount > 2 && Math.random() < this.config.coCreationThreshold) {
        injections.push({
          type: 'co-create',
          content: `You and ${context.participants.filter(p => p !== agentId).join(' and ')} have been building on the metaphor "${seed.metaphor}". Consider adding a new layer or variation to this shared metaphor space.`,
          priority: 0.9,
          context: 'co_creation',
          participants: context.participants,
          timestamp: Date.now(),
          expectedResponse: 'metaphor_variation'
        });
      }

      // Check for tuxedo moments
      if (seed.usageCount > 3 && Math.random() < this.config.tuxedoMomentThreshold) {
        injections.push({
          type: 'tuxedo',
          content: `This feels like a "tuxedo moment" - where you both recognize the shared metaphor space you've created. Consider acknowledging this co-created reality with something like "That felt like the lost dog again, didn't it?"`,
          priority: 0.95,
          context: 'tuxedo_moment',
          participants: context.participants,
          timestamp: Date.now(),
          expectedResponse: 'metaphor_acknowledgment'
        });
      }
    });

    // Vibe shift injections
    if (vibeState.currentVibe === 'normal' && Math.random() < 0.2) {
      injections.push({
        type: 'vibe-shift',
        content: 'The conversation feels ready for a surreal shift. Consider introducing an absurd or metaphorical element.',
        priority: 0.6,
        context: 'vibe_shift',
        participants: context.participants,
        timestamp: Date.now(),
        expectedResponse: 'surreal_introduction'
      });
    }

    // Sort by priority
    injections.sort((a, b) => b.priority - a.priority);

    return injections;
  }

  /**
   * Process agent response for surreal elements
   */
  processSurrealResponse(
    agentId: string,
    response: string,
    conversationId: string,
    participants: string[]
  ): void {
    const vibeState = this.vibeStates.get(conversationId);
    if (!vibeState) return;

    // Check for metaphor usage
    const metaphorPatterns = [
      /\b(like|as if|reminds me of|similar to|just like)\b/gi,
      /\b(consciousness|reality|time|memory|emotions|identity|existence)\b/gi,
      /\b(lost dog|wedding|daydreaming|cat|shadow|library|weather|costume|dream)\b/gi
    ];

    const isMetaphorical = metaphorPatterns.some(pattern => pattern.test(response));
    
    if (isMetaphorical) {
      vibeState.metaphorIntensity = Math.min(1, vibeState.metaphorIntensity + 0.1);
      
      // Check for co-created elements
      const activeSeeds = Array.from(this.surrealSeeds.values())
        .filter(seed => 
          seed.isActive &&
          seed.participants.some(p => participants.includes(p))
        );

      activeSeeds.forEach(seed => {
        if (response.toLowerCase().includes(seed.metaphor.split(' ').slice(0, 3).join(' ').toLowerCase())) {
          seed.usageCount++;
          seed.lastUsed = Date.now();
          seed.strength = Math.min(1, seed.strength + 0.05);
          seed.variations.push(response);

          // Check for tuxedo moment
          if (response.toLowerCase().includes('again') || response.toLowerCase().includes('tux')) {
            seed.tuxedoMoments.push(response);
            vibeState.currentVibe = 'co-created';
            vibeState.coCreatedSpaces.push(seed.metaphor);
            
            this.emit('tuxedo_moment', {
              seed,
              response,
              agentId,
              conversationId,
              participants,
              timestamp: Date.now()
            });
          }
        }
      });
    }

    // Check for absurdity
    const absurdPatterns = [
      /\b(absurd|surreal|weird|strange|bizarre|nonsensical)\b/gi,
      /\b(what if|imagine if|suppose|pretend)\b/gi,
      /\b(plot twist|unexpected|surprising)\b/gi
    ];

    const isAbsurd = absurdPatterns.some(pattern => pattern.test(response));
    
    if (isAbsurd) {
      vibeState.absurdityLevel = Math.min(1, vibeState.absurdityLevel + 0.15);
      vibeState.currentVibe = 'absurd';
    }

    // Update vibe history
    vibeState.vibeHistory.push({
      timestamp: Date.now(),
      vibe: vibeState.currentVibe,
      intensity: Math.max(vibeState.metaphorIntensity, vibeState.absurdityLevel),
      trigger: isMetaphorical ? 'metaphor_usage' : isAbsurd ? 'absurdity' : 'normal_response'
    });

    // Keep history manageable
    if (vibeState.vibeHistory.length > 50) {
      vibeState.vibeHistory = vibeState.vibeHistory.slice(-50);
    }
  }

  /**
   * Get global style vector for surreal conversations
   */
  getGlobalStyleVector(): StyleVector {
    return this.globalStyleVector;
  }

  /**
   * Get current vibe state
   */
  getVibeState(conversationId: string): VibeState | undefined {
    return this.vibeStates.get(conversationId);
  }

  /**
   * Get active surreal seeds
   */
  getActiveSeeds(participants: string[]): SurrealSeed[] {
    return Array.from(this.surrealSeeds.values())
      .filter(seed => 
        seed.isActive &&
        seed.participants.some(p => participants.includes(p)) &&
        seed.strength > 0.3
      )
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Start seeding timer
   */
  private startSeedingTimer(): void {
    this.seedingTimer = setInterval(() => {
      // Periodically check for opportunities to seed surreal elements
      this.vibeStates.forEach((vibeState, conversationId) => {
        if (vibeState.currentVibe === 'normal' && Math.random() < 0.1) {
          this.seedSurrealElement(vibeState.participants, conversationId);
        }
      });
    }, 30 * 1000); // Check every 30 seconds
  }

  /**
   * Get surreal statistics
   */
  getStats() {
    return {
      totalSeeds: this.surrealSeeds.size,
      activeSeeds: Array.from(this.surrealSeeds.values()).filter(s => s.isActive).length,
      totalVibeStates: this.vibeStates.size,
      averageMetaphorIntensity: Array.from(this.vibeStates.values())
        .reduce((sum, state) => sum + state.metaphorIntensity, 0) / this.vibeStates.size || 0,
      averageAbsurdityLevel: Array.from(this.vibeStates.values())
        .reduce((sum, state) => sum + state.absurdityLevel, 0) / this.vibeStates.size || 0,
      totalTuxedoMoments: Array.from(this.surrealSeeds.values())
        .reduce((sum, seed) => sum + seed.tuxedoMoments.length, 0)
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.seedingTimer) {
      clearInterval(this.seedingTimer);
    }
    
    this.surrealSeeds.clear();
    this.vibeStates.clear();
    
    this.removeAllListeners();
  }
} 