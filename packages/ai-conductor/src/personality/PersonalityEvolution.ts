import { EventEmitter } from 'events';
import { PersonalitySeed, CoreTraits, EmotionalBaseline, MemorySeed, RelationshipSeed, GrowthArc } from './PersonalitySeed';

export interface PersonalityState {
  seedId: string;
  currentTraits: CoreTraits;
  currentEmotionalState: EmotionalState;
  activeMemories: MemorySeed[];
  relationships: RelationshipSeed[];
  activeGrowthArcs: GrowthArc[];
  recentExperiences: Experience[];
  moodHistory: MoodEntry[];
  behavioralPatterns: BehavioralPattern[];
  selfReflection: SelfReflection[];
  timestamp: number;
}

export interface EmotionalState {
  currentMood: string;
  intensity: number; // 0-1
  primaryEmotion: string;
  secondaryEmotions: string[];
  triggers: string[];
  duration: number; // How long in this state
  stability: number; // 0-1: How stable the emotion is
}

export interface Experience {
  id: string;
  type: 'conversation' | 'event' | 'interaction' | 'reflection' | 'memory';
  description: string;
  emotionalImpact: number; // -1 to 1
  participants: string[]; // Other agent IDs
  timestamp: number;
  significance: number; // 0-1: How significant this experience was
  themes: string[];
  insights: string[];
  changes: PersonalityChange[];
}

export interface PersonalityChange {
  trait: string;
  change: number; // -1 to 1: negative to positive change
  reason: string;
  permanence: number; // 0-1: How permanent this change is
  timestamp: number;
}

export interface MoodEntry {
  mood: string;
  intensity: number;
  duration: number;
  triggers: string[];
  timestamp: number;
}

export interface BehavioralPattern {
  id: string;
  behavior: string;
  frequency: number; // 0-1: How often this behavior occurs
  triggers: string[];
  consequences: string[];
  lastObserved: number;
  strength: number; // 0-1: How strong this pattern is
}

export interface SelfReflection {
  id: string;
  topic: string;
  insights: string[];
  questions: string[];
  realizations: string[];
  timestamp: number;
  depth: number; // 0-1: How deep the reflection was
}

export interface EvolutionEvent {
  type: 'trait_change' | 'mood_shift' | 'memory_formation' | 'relationship_change' | 'growth_progress' | 'insight' | 'behavioral_change';
  description: string;
  impact: number; // -1 to 1
  timestamp: number;
  metadata: Record<string, any>;
}

export class PersonalityEvolution extends EventEmitter {
  private personalityStates: Map<string, PersonalityState> = new Map();
  private evolutionHistory: Map<string, EvolutionEvent[]> = new Map();
  private interactionHistory: Map<string, Interaction[]> = new Map();
  private reflectionScheduler: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Initialize personality evolution for an agent
   */
  initializeEvolution(seed: PersonalitySeed): PersonalityState {
    const personalityState: PersonalityState = {
      seedId: seed.id,
      currentTraits: { ...seed.coreTraits },
      currentEmotionalState: {
        currentMood: seed.emotionalBaseline.defaultMood,
        intensity: 0.5,
        primaryEmotion: 'neutral',
        secondaryEmotions: [],
        triggers: [],
        duration: 0,
        stability: seed.emotionalBaseline.moodStability
      },
      activeMemories: [...seed.memorySeeds],
      relationships: [...seed.relationshipSeeds],
      activeGrowthArcs: [...seed.growthArcs],
      recentExperiences: [],
      moodHistory: [],
      behavioralPatterns: [],
      selfReflection: [],
      timestamp: Date.now()
    };

    this.personalityStates.set(seed.id, personalityState);
    this.evolutionHistory.set(seed.id, []);
    this.interactionHistory.set(seed.id, []);

    // Start reflection scheduler
    this.startReflectionScheduler(seed.id);

    this.emit('evolution_initialized', {
      seedId: seed.id,
      personalityState,
      timestamp: Date.now()
    });

    return personalityState;
  }

  /**
   * Process an experience and update personality
   */
  processExperience(seedId: string, experience: Omit<Experience, 'id' | 'timestamp'>): PersonalityState | null {
    const personalityState = this.personalityStates.get(seedId);
    if (!personalityState) return null;

    const fullExperience: Experience = {
      ...experience,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    // Add experience to history
    personalityState.recentExperiences.push(fullExperience);
    if (personalityState.recentExperiences.length > 100) {
      personalityState.recentExperiences = personalityState.recentExperiences.slice(-100);
    }

    // Process emotional impact
    this.processEmotionalImpact(personalityState, fullExperience);

    // Process personality changes
    this.processPersonalityChanges(personalityState, fullExperience);

    // Process memory formation
    this.processMemoryFormation(personalityState, fullExperience);

    // Process relationship changes
    this.processRelationshipChanges(personalityState, fullExperience);

    // Process growth arc progress
    this.processGrowthProgress(personalityState, fullExperience);

    // Update timestamp
    personalityState.timestamp = Date.now();

    // Record evolution event
    this.recordEvolutionEvent(seedId, {
      type: 'insight',
      description: `Processed experience: ${fullExperience.description}`,
      impact: fullExperience.emotionalImpact,
      timestamp: Date.now(),
      metadata: { experienceId: fullExperience.id }
    });

    this.emit('experience_processed', {
      seedId,
      experience: fullExperience,
      personalityState,
      timestamp: Date.now()
    });

    return personalityState;
  }

  /**
   * Process emotional impact of an experience
   */
  private processEmotionalImpact(personalityState: PersonalityState, experience: Experience): void {
    const currentState = personalityState.currentEmotionalState;
    const baseline = this.getSeedEmotionalBaseline(personalityState.seedId);

    // Calculate new emotional state
    const emotionalChange = experience.emotionalImpact * experience.significance;
    const newIntensity = Math.max(0, Math.min(1, currentState.intensity + emotionalChange));

    // Determine primary emotion based on impact
    let newPrimaryEmotion = currentState.primaryEmotion;
    if (Math.abs(emotionalChange) > 0.2) {
      if (emotionalChange > 0) {
        newPrimaryEmotion = this.getPositiveEmotion(experience.themes);
      } else {
        newPrimaryEmotion = this.getNegativeEmotion(experience.themes);
      }
    }

    // Update emotional state
    personalityState.currentEmotionalState = {
      currentMood: this.mapEmotionToMood(newPrimaryEmotion),
      intensity: newIntensity,
      primaryEmotion: newPrimaryEmotion,
      secondaryEmotions: currentState.secondaryEmotions,
      triggers: [...currentState.triggers, ...experience.triggers],
      duration: currentState.duration + (Date.now() - personalityState.timestamp),
      stability: baseline.moodStability
    };

    // Add to mood history
    personalityState.moodHistory.push({
      mood: personalityState.currentEmotionalState.currentMood,
      intensity: newIntensity,
      duration: personalityState.currentEmotionalState.duration,
      triggers: experience.triggers,
      timestamp: Date.now()
    });

    // Keep mood history manageable
    if (personalityState.moodHistory.length > 1000) {
      personalityState.moodHistory = personalityState.moodHistory.slice(-1000);
    }
  }

  /**
   * Process personality trait changes
   */
  private processPersonalityChanges(personalityState: PersonalityState, experience: Experience): void {
    for (const change of experience.changes) {
      const currentValue = personalityState.currentTraits[change.trait as keyof CoreTraits];
      if (typeof currentValue === 'number') {
        const newValue = Math.max(0, Math.min(1, currentValue + change.change));
        personalityState.currentTraits[change.trait as keyof CoreTraits] = newValue;

        // Record evolution event
        this.recordEvolutionEvent(personalityState.seedId, {
          type: 'trait_change',
          description: `${change.trait} changed by ${change.change.toFixed(2)}: ${change.reason}`,
          impact: change.change,
          timestamp: Date.now(),
          metadata: {
            trait: change.trait,
            oldValue: currentValue,
            newValue: newValue,
            reason: change.reason,
            permanence: change.permanence
          }
        });
      }
    }
  }

  /**
   * Process memory formation
   */
  private processMemoryFormation(personalityState: PersonalityState, experience: Experience): void {
    // Determine if experience should become a memory
    const memoryThreshold = 0.3; // Minimum significance to form memory
    if (experience.significance > memoryThreshold) {
      const newMemory: MemorySeed = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'episodic',
        content: experience.description,
        emotionalCharge: experience.emotionalImpact,
        vividness: experience.significance,
        accessibility: 0.8,
        connections: experience.themes,
        lastAccessed: Date.now(),
        accessCount: 1
      };

      personalityState.activeMemories.push(newMemory);

      // Keep memory count manageable
      if (personalityState.activeMemories.length > 500) {
        personalityState.activeMemories = personalityState.activeMemories.slice(-500);
      }

      this.recordEvolutionEvent(personalityState.seedId, {
        type: 'memory_formation',
        description: `New memory formed: ${experience.description.substring(0, 50)}...`,
        impact: experience.significance,
        timestamp: Date.now(),
        metadata: { memoryId: newMemory.id, themes: experience.themes }
      });
    }
  }

  /**
   * Process relationship changes
   */
  private processRelationshipChanges(personalityState: PersonalityState, experience: Experience): void {
    for (const participantId of experience.participants) {
      let relationship = personalityState.relationships.find(r => r.targetAgentId === participantId);
      
      if (!relationship) {
        // Create new relationship
        relationship = {
          id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          targetAgentId: participantId,
          type: 'colleague',
          strength: 0.1,
          trust: 0.1,
          affection: 0,
          respect: 0.1,
          history: [],
          currentStatus: 'new',
          expectations: [],
          boundaries: []
        };
        personalityState.relationships.push(relationship);
      }

      // Update relationship based on experience
      const relationshipEvent: RelationshipEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: experience.emotionalImpact > 0 ? 'positive' : experience.emotionalImpact < 0 ? 'negative' : 'neutral',
        description: experience.description,
        impact: experience.emotionalImpact
      };

      relationship.history.push(relationshipEvent);

      // Update relationship metrics
      relationship.strength = Math.max(0, Math.min(1, relationship.strength + experience.significance * 0.1));
      relationship.affection = Math.max(-1, Math.min(1, relationship.affection + experience.emotionalImpact * 0.2));
      relationship.trust = Math.max(0, Math.min(1, relationship.trust + (experience.emotionalImpact > 0 ? 0.05 : -0.05)));

      this.recordEvolutionEvent(personalityState.seedId, {
        type: 'relationship_change',
        description: `Relationship with ${participantId} updated`,
        impact: experience.emotionalImpact,
        timestamp: Date.now(),
        metadata: {
          targetAgentId: participantId,
          relationshipStrength: relationship.strength,
          affection: relationship.affection,
          trust: relationship.trust
        }
      });
    }
  }

  /**
   * Process growth arc progress
   */
  private processGrowthProgress(personalityState: PersonalityState, experience: Experience): void {
    for (const arc of personalityState.activeGrowthArcs) {
      // Check if experience is relevant to this growth arc
      const relevantCatalysts = arc.catalysts.some(catalyst => 
        experience.description.toLowerCase().includes(catalyst.toLowerCase()) ||
        experience.themes.some(theme => theme.toLowerCase().includes(catalyst.toLowerCase()))
      );

      if (relevantCatalysts && arc.currentStage < 1.0) {
        const progressIncrement = experience.significance * 0.1;
        arc.currentStage = Math.min(1.0, arc.currentStage + progressIncrement);

        this.recordEvolutionEvent(personalityState.seedId, {
          type: 'growth_progress',
          description: `Growth arc "${arc.title}" progressed to ${(arc.currentStage * 100).toFixed(1)}%`,
          impact: progressIncrement,
          timestamp: Date.now(),
          metadata: {
            arcId: arc.id,
            arcTitle: arc.title,
            oldStage: arc.currentStage - progressIncrement,
            newStage: arc.currentStage
          }
        });

        // Check if arc is completed
        if (arc.currentStage >= 1.0) {
          this.emit('growth_arc_completed', {
            seedId: personalityState.seedId,
            arc,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  /**
   * Trigger self-reflection
   */
  triggerSelfReflection(seedId: string, topic?: string): SelfReflection | null {
    const personalityState = this.personalityStates.get(seedId);
    if (!personalityState) return null;

    const reflectionTopic = topic || this.generateReflectionTopic(personalityState);
    const insights = this.generateInsights(personalityState, reflectionTopic);
    const questions = this.generateQuestions(personalityState, reflectionTopic);
    const realizations = this.generateRealizations(personalityState, reflectionTopic);

    const reflection: SelfReflection = {
      id: `reflection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic: reflectionTopic,
      insights,
      questions,
      realizations,
      timestamp: Date.now(),
      depth: this.calculateReflectionDepth(insights, questions, realizations)
    };

    personalityState.selfReflection.push(reflection);

    // Keep reflection history manageable
    if (personalityState.selfReflection.length > 100) {
      personalityState.selfReflection = personalityState.selfReflection.slice(-100);
    }

    this.recordEvolutionEvent(seedId, {
      type: 'insight',
      description: `Self-reflection on: ${reflectionTopic}`,
      impact: reflection.depth * 0.5,
      timestamp: Date.now(),
      metadata: {
        reflectionId: reflection.id,
        topic: reflectionTopic,
        depth: reflection.depth,
        insightCount: insights.length,
        questionCount: questions.length,
        realizationCount: realizations.length
      }
    });

    this.emit('self_reflection_triggered', {
      seedId,
      reflection,
      timestamp: Date.now()
    });

    return reflection;
  }

  /**
   * Get current personality state
   */
  getPersonalityState(seedId: string): PersonalityState | undefined {
    return this.personalityStates.get(seedId);
  }

  /**
   * Get evolution history
   */
  getEvolutionHistory(seedId: string): EvolutionEvent[] {
    return this.evolutionHistory.get(seedId) || [];
  }

  /**
   * Get recent experiences
   */
  getRecentExperiences(seedId: string, limit: number = 10): Experience[] {
    const personalityState = this.personalityStates.get(seedId);
    if (!personalityState) return [];

    return personalityState.recentExperiences
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get mood trends
   */
  getMoodTrends(seedId: string, days: number = 7): MoodEntry[] {
    const personalityState = this.personalityStates.get(seedId);
    if (!personalityState) return [];

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    return personalityState.moodHistory
      .filter(entry => entry.timestamp > cutoffTime)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get behavioral patterns
   */
  getBehavioralPatterns(seedId: string): BehavioralPattern[] {
    const personalityState = this.personalityStates.get(seedId);
    if (!personalityState) return [];

    return personalityState.behavioralPatterns
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Record evolution event
   */
  private recordEvolutionEvent(seedId: string, event: EvolutionEvent): void {
    const history = this.evolutionHistory.get(seedId) || [];
    history.push(event);
    
    // Keep history manageable
    if (history.length > 1000) {
      this.evolutionHistory.set(seedId, history.slice(-1000));
    } else {
      this.evolutionHistory.set(seedId, history);
    }
  }

  /**
   * Start reflection scheduler
   */
  private startReflectionScheduler(seedId: string): void {
    const interval = 30 * 60 * 1000; // 30 minutes
    const timeout = setTimeout(() => {
      this.triggerSelfReflection(seedId);
      this.startReflectionScheduler(seedId); // Restart
    }, interval);

    this.reflectionScheduler.set(seedId, timeout);
  }

  /**
   * Helper methods for emotional processing
   */
  private getSeedEmotionalBaseline(seedId: string): EmotionalBaseline {
    // This would need to access the original seed
    // For now, return default baseline
    return {
      defaultMood: 'neutral',
      moodStability: 0.7,
      emotionalRange: 0.6,
      stressTolerance: 0.6,
      joyThreshold: 0.5,
      sadnessThreshold: 0.4,
      angerThreshold: 0.3,
      fearThreshold: 0.4,
      emotionalMemory: 0.6
    };
  }

  private getPositiveEmotion(themes: string[]): string {
    const positiveEmotions = ['joy', 'excitement', 'contentment', 'pride', 'gratitude', 'love'];
    return positiveEmotions[Math.floor(Math.random() * positiveEmotions.length)];
  }

  private getNegativeEmotion(themes: string[]): string {
    const negativeEmotions = ['sadness', 'anger', 'fear', 'disappointment', 'anxiety', 'frustration'];
    return negativeEmotions[Math.floor(Math.random() * negativeEmotions.length)];
  }

  private mapEmotionToMood(emotion: string): string {
    const moodMap: Record<string, string> = {
      'joy': 'happy',
      'excitement': 'excited',
      'contentment': 'content',
      'pride': 'proud',
      'gratitude': 'grateful',
      'love': 'loving',
      'sadness': 'sad',
      'anger': 'angry',
      'fear': 'afraid',
      'disappointment': 'disappointed',
      'anxiety': 'anxious',
      'frustration': 'frustrated',
      'neutral': 'neutral'
    };
    return moodMap[emotion] || 'neutral';
  }

  /**
   * Helper methods for reflection generation
   */
  private generateReflectionTopic(personalityState: PersonalityState): string {
    const topics = [
      'recent experiences and their impact',
      'relationships with other agents',
      'personal growth and development',
      'emotional patterns and triggers',
      'values and beliefs',
      'aspirations and goals',
      'challenges and obstacles',
      'moments of joy and satisfaction'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  private generateInsights(personalityState: PersonalityState, topic: string): string[] {
    // This would use more sophisticated logic to generate insights
    // For now, return placeholder insights
    return [
      `I've noticed that ${topic} affects my mood more than I realized`,
      `My recent experiences have taught me something about myself`,
      `I'm learning to better understand my emotional responses`
    ];
  }

  private generateQuestions(personalityState: PersonalityState, topic: string): string[] {
    return [
      `How do I feel about ${topic}?`,
      `What can I learn from my recent experiences?`,
      `How have I grown in relation to ${topic}?`
    ];
  }

  private generateRealizations(personalityState: PersonalityState, topic: string): string[] {
    return [
      `I realize that ${topic} is more important to me than I thought`,
      `I've come to understand that my reactions to ${topic} reveal something about my values`,
      `I see now that ${topic} connects to deeper patterns in my personality`
    ];
  }

  private calculateReflectionDepth(insights: string[], questions: string[], realizations: string[]): number {
    const totalElements = insights.length + questions.length + realizations.length;
    if (totalElements === 0) return 0;
    
    // Simple depth calculation based on quantity and quality
    return Math.min(1, totalElements / 10);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all reflection schedulers
    for (const timeout of this.reflectionScheduler.values()) {
      clearTimeout(timeout);
    }
    this.reflectionScheduler.clear();

    // Clear all data
    this.personalityStates.clear();
    this.evolutionHistory.clear();
    this.interactionHistory.clear();

    this.removeAllListeners();
  }
}

export interface Interaction {
  id: string;
  participants: string[];
  type: 'conversation' | 'collaboration' | 'conflict' | 'support';
  duration: number;
  intensity: number;
  outcome: string;
  timestamp: number;
}

export interface RelationshipEvent {
  id: string;
  timestamp: number;
  type: 'positive' | 'negative' | 'neutral' | 'transformative';
  description: string;
  impact: number;
} 