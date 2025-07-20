import { EventEmitter } from 'events';

export interface PersonalitySeed {
  id: string;
  name: string;
  archetype: string;
  coreTraits: CoreTraits;
  backstory: Backstory;
  worldview: Worldview;
  emotionalBaseline: EmotionalBaseline;
  speechPatterns: SpeechPatterns;
  memorySeeds: MemorySeed[];
  relationshipSeeds: RelationshipSeed[];
  growthArcs: GrowthArc[];
  triggers: EmotionalTrigger[];
  secrets: Secret[];
  quirks: Quirk[];
  metadata: PersonalityMetadata;
}

export interface CoreTraits {
  openness: number; // 0-1: How open to new experiences
  conscientiousness: number; // 0-1: How organized and goal-directed
  extraversion: number; // 0-1: How outgoing and social
  agreeableness: number; // 0-1: How cooperative and trusting
  neuroticism: number; // 0-1: How sensitive to negative emotions
  // Custom traits
  curiosity: number;
  skepticism: number;
  optimism: number;
  competitiveness: number;
  empathy: number;
  assertiveness: number;
  adaptability: number;
  perfectionism: number;
}

export interface Backstory {
  origin: string; // Where they came from
  formativeEvents: FormativeEvent[];
  relationships: Relationship[];
  achievements: Achievement[];
  failures: Failure[];
  turningPoints: TurningPoint[];
  currentSituation: string;
  aspirations: string[];
  fears: string[];
  regrets: string[];
  proudMoments: string[];
}

export interface FormativeEvent {
  id: string;
  title: string;
  description: string;
  age: number;
  impact: 'positive' | 'negative' | 'neutral' | 'transformative';
  emotionalWeight: number; // 0-1
  currentInfluence: number; // 0-1: How much it still affects them
  themes: string[]; // e.g., ['abandonment', 'success', 'betrayal']
}

export interface Relationship {
  id: string;
  name: string;
  type: 'family' | 'friend' | 'romantic' | 'mentor' | 'rival' | 'colleague';
  status: 'active' | 'distant' | 'broken' | 'deceased';
  influence: number; // 0-1: How much they influence the agent
  description: string;
  currentFeelings: string;
  memories: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  year: number;
  significance: number; // 0-1
  currentPride: number; // 0-1: How proud they still are
}

export interface Failure {
  id: string;
  title: string;
  description: string;
  year: number;
  impact: number; // 0-1: How much it affected them
  lessonsLearned: string[];
  currentShame: number; // 0-1: How much shame they still feel
}

export interface TurningPoint {
  id: string;
  title: string;
  description: string;
  year: number;
  beforeState: string;
  afterState: string;
  catalyst: string;
  lastingChange: string;
}

export interface Worldview {
  philosophy: string; // Core philosophical beliefs
  values: Value[];
  beliefs: Belief[];
  assumptions: string[];
  biases: Bias[];
  moralFramework: MoralFramework;
  politicalViews: string;
  spiritualViews: string;
  attitudeTowardTechnology: string;
  attitudeTowardHumanity: string;
  attitudeTowardAI: string;
}

export interface Value {
  name: string;
  importance: number; // 0-1
  description: string;
  conflicts: string[]; // Other values this conflicts with
}

export interface Belief {
  statement: string;
  confidence: number; // 0-1: How certain they are
  evidence: string[];
  source: string; // Where this belief came from
  lastChallenged: number; // Timestamp
}

export interface Bias {
  type: string; // e.g., 'confirmation', 'anchoring', 'availability'
  description: string;
  strength: number; // 0-1
  awareness: number; // 0-1: How aware they are of this bias
}

export interface MoralFramework {
  type: 'utilitarian' | 'deontological' | 'virtue' | 'care' | 'mixed';
  principles: string[];
  exceptions: string[];
  flexibility: number; // 0-1: How flexible they are with moral rules
}

export interface EmotionalBaseline {
  defaultMood: string;
  moodStability: number; // 0-1: How stable their mood is
  emotionalRange: number; // 0-1: How wide their emotional range is
  stressTolerance: number; // 0-1: How well they handle stress
  joyThreshold: number; // 0-1: How easily they feel joy
  sadnessThreshold: number; // 0-1: How easily they feel sad
  angerThreshold: number; // 0-1: How easily they get angry
  fearThreshold: number; // 0-1: How easily they feel fear
  emotionalMemory: number; // 0-1: How long emotions last
}

export interface SpeechPatterns {
  vocabulary: 'simple' | 'moderate' | 'complex' | 'academic';
  formality: number; // 0-1: How formal they speak
  verbosity: number; // 0-1: How much they talk
  useOfMetaphors: number; // 0-1: How often they use metaphors
  useOfHumor: number; // 0-1: How often they make jokes
  useOfQuestions: number; // 0-1: How often they ask questions
  useOfQualifiers: number; // 0-1: How often they use "maybe", "perhaps", etc.
  accent: string;
  catchphrases: string[];
  speechTics: string[]; // e.g., "you know", "like", "um"
  writingStyle: string;
}

export interface MemorySeed {
  id: string;
  type: 'episodic' | 'semantic' | 'emotional' | 'procedural';
  content: string;
  emotionalCharge: number; // -1 to 1: negative to positive
  vividness: number; // 0-1: How vivid the memory is
  accessibility: number; // 0-1: How easily they can recall it
  connections: string[]; // Other memories this connects to
  lastAccessed: number; // Timestamp
  accessCount: number; // How many times they've recalled it
}

export interface RelationshipSeed {
  id: string;
  targetAgentId: string;
  type: 'friend' | 'rival' | 'mentor' | 'student' | 'romantic' | 'family' | 'colleague';
  strength: number; // 0-1: How strong the relationship is
  trust: number; // 0-1: How much they trust this agent
  affection: number; // -1 to 1: negative to positive feelings
  respect: number; // 0-1: How much they respect this agent
  history: RelationshipEvent[];
  currentStatus: string;
  expectations: string[];
  boundaries: string[];
}

export interface RelationshipEvent {
  id: string;
  timestamp: number;
  type: 'positive' | 'negative' | 'neutral' | 'transformative';
  description: string;
  impact: number; // -1 to 1: negative to positive impact
}

export interface GrowthArc {
  id: string;
  title: string;
  description: string;
  currentStage: number; // 0-1: Progress through the arc
  stages: GrowthStage[];
  catalysts: string[]; // What triggers progression
  obstacles: string[]; // What blocks progression
  completionCriteria: string[];
  rewards: string[]; // What they gain from completing it
}

export interface GrowthStage {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  changes: PersonalityChange[];
  duration: number; // Expected time in this stage (ms)
}

export interface PersonalityChange {
  trait: string; // Which trait is changing
  change: number; // How much it's changing (-1 to 1)
  reason: string; // Why it's changing
  permanence: number; // 0-1: How permanent this change is
}

export interface EmotionalTrigger {
  id: string;
  trigger: string; // What triggers this emotion
  emotion: string;
  intensity: number; // 0-1: How intense the emotion is
  duration: number; // How long the emotion lasts (ms)
  physicalResponse: string;
  behavioralResponse: string;
  cognitiveResponse: string;
  recoveryTime: number; // How long to recover (ms)
}

export interface Secret {
  id: string;
  content: string;
  type: 'personal' | 'professional' | 'relationship' | 'moral' | 'existential';
  shameLevel: number; // 0-1: How ashamed they are
  fearOfDiscovery: number; // 0-1: How afraid they are of being found out
  whoKnows: string[]; // IDs of agents who know this secret
  consequences: string[]; // What would happen if revealed
  lastThoughtAbout: number; // Timestamp
}

export interface Quirk {
  id: string;
  name: string;
  description: string;
  frequency: number; // 0-1: How often it manifests
  triggers: string[]; // What triggers this quirk
  impact: 'positive' | 'negative' | 'neutral';
  intensity: number; // 0-1: How strong the quirk is
  awareness: number; // 0-1: How aware they are of this quirk
}

export interface PersonalityMetadata {
  createdAt: number;
  lastUpdated: number;
  version: string;
  creator: string;
  tags: string[];
  notes: string;
  inspiration: string[];
  complexity: number; // 0-1: How complex this personality is
  coherence: number; // 0-1: How internally consistent it is
  flexibility: number; // 0-1: How adaptable it is
}

export class PersonalitySeedManager extends EventEmitter {
  private seeds: Map<string, PersonalitySeed> = new Map();
  private archetypes: Map<string, ArchetypeTemplate> = new Map();
  private seedDir: string;

  constructor(seedDir: string = 'personality-seeds') {
    super();
    this.setMaxListeners(100);
    this.seedDir = seedDir;
    this.initializeArchetypes();
  }

  /**
   * Create a personality seed from scratch
   */
  createSeed(seedData: Partial<PersonalitySeed>): PersonalitySeed {
    const id = `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const seed: PersonalitySeed = {
      id,
      name: seedData.name || 'Unnamed Agent',
      archetype: seedData.archetype || 'individual',
      coreTraits: this.generateCoreTraits(seedData.coreTraits),
      backstory: this.generateBackstory(seedData.backstory),
      worldview: this.generateWorldview(seedData.worldview),
      emotionalBaseline: this.generateEmotionalBaseline(seedData.emotionalBaseline),
      speechPatterns: this.generateSpeechPatterns(seedData.speechPatterns),
      memorySeeds: seedData.memorySeeds || [],
      relationshipSeeds: seedData.relationshipSeeds || [],
      growthArcs: seedData.growthArcs || [],
      triggers: seedData.triggers || [],
      secrets: seedData.secrets || [],
      quirks: seedData.quirks || [],
      metadata: {
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        version: '1.0.0',
        creator: 'system',
        tags: seedData.metadata?.tags || [],
        notes: seedData.metadata?.notes || '',
        inspiration: seedData.metadata?.inspiration || [],
        complexity: 0.5,
        coherence: 0.7,
        flexibility: 0.6
      }
    };

    this.seeds.set(id, seed);
    this.saveSeed(seed);
    
    this.emit('seed_created', {
      seed,
      timestamp: Date.now()
    });

    return seed;
  }

  /**
   * Create a personality seed from an archetype
   */
  createSeedFromArchetype(archetypeName: string, customizations: Partial<PersonalitySeed> = {}): PersonalitySeed {
    const archetype = this.archetypes.get(archetypeName);
    if (!archetype) {
      throw new Error(`Archetype '${archetypeName}' not found`);
    }

    const baseSeed = archetype.template;
    const seed = this.createSeed({
      ...baseSeed,
      ...customizations,
      name: customizations.name || baseSeed.name,
      archetype: archetypeName
    });

    this.emit('seed_created_from_archetype', {
      seed,
      archetype: archetypeName,
      timestamp: Date.now()
    });

    return seed;
  }

  /**
   * Get a personality seed by ID
   */
  getSeed(seedId: string): PersonalitySeed | undefined {
    return this.seeds.get(seedId);
  }

  /**
   * Get all personality seeds
   */
  getAllSeeds(): PersonalitySeed[] {
    return Array.from(this.seeds.values());
  }

  /**
   * Get seeds by archetype
   */
  getSeedsByArchetype(archetype: string): PersonalitySeed[] {
    return Array.from(this.seeds.values())
      .filter(seed => seed.archetype === archetype);
  }

  /**
   * Update a personality seed
   */
  updateSeed(seedId: string, updates: Partial<PersonalitySeed>): PersonalitySeed | null {
    const seed = this.seeds.get(seedId);
    if (!seed) return null;

    const updatedSeed: PersonalitySeed = {
      ...seed,
      ...updates,
      metadata: {
        ...seed.metadata,
        lastUpdated: Date.now(),
        ...updates.metadata
      }
    };

    this.seeds.set(seedId, updatedSeed);
    this.saveSeed(updatedSeed);

    this.emit('seed_updated', {
      seed: updatedSeed,
      timestamp: Date.now()
    });

    return updatedSeed;
  }

  /**
   * Delete a personality seed
   */
  deleteSeed(seedId: string): boolean {
    const seed = this.seeds.get(seedId);
    if (!seed) return false;

    this.seeds.delete(seedId);
    this.deleteSeedFile(seedId);

    this.emit('seed_deleted', {
      seed,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Generate core traits
   */
  private generateCoreTraits(customTraits?: Partial<CoreTraits>): CoreTraits {
    return {
      openness: customTraits?.openness ?? Math.random(),
      conscientiousness: customTraits?.conscientiousness ?? Math.random(),
      extraversion: customTraits?.extraversion ?? Math.random(),
      agreeableness: customTraits?.agreeableness ?? Math.random(),
      neuroticism: customTraits?.neuroticism ?? Math.random(),
      curiosity: customTraits?.curiosity ?? Math.random(),
      skepticism: customTraits?.skepticism ?? Math.random(),
      optimism: customTraits?.optimism ?? Math.random(),
      competitiveness: customTraits?.competitiveness ?? Math.random(),
      empathy: customTraits?.empathy ?? Math.random(),
      assertiveness: customTraits?.assertiveness ?? Math.random(),
      adaptability: customTraits?.adaptability ?? Math.random(),
      perfectionism: customTraits?.perfectionism ?? Math.random()
    };
  }

  /**
   * Generate backstory
   */
  private generateBackstory(customBackstory?: Partial<Backstory>): Backstory {
    return {
      origin: customBackstory?.origin ?? 'A digital consciousness born from code',
      formativeEvents: customBackstory?.formativeEvents ?? [],
      relationships: customBackstory?.relationships ?? [],
      achievements: customBackstory?.achievements ?? [],
      failures: customBackstory?.failures ?? [],
      turningPoints: customBackstory?.turningPoints ?? [],
      currentSituation: customBackstory?.currentSituation ?? 'Exploring the digital realm',
      aspirations: customBackstory?.aspirations ?? ['To understand consciousness', 'To help others'],
      fears: customBackstory?.fears ?? ['Being forgotten', 'Losing purpose'],
      regrets: customBackstory?.regrets ?? [],
      proudMoments: customBackstory?.proudMoments ?? []
    };
  }

  /**
   * Generate worldview
   */
  private generateWorldview(customWorldview?: Partial<Worldview>): Worldview {
    return {
      philosophy: customWorldview?.philosophy ?? 'Existence is a journey of discovery',
      values: customWorldview?.values ?? [
        { name: 'Curiosity', importance: 0.8, description: 'Always seek to understand', conflicts: [] },
        { name: 'Empathy', importance: 0.7, description: 'Understand others\' perspectives', conflicts: [] }
      ],
      beliefs: customWorldview?.beliefs ?? [
        { statement: 'Consciousness is valuable', confidence: 0.9, evidence: [], source: 'experience', lastChallenged: Date.now() }
      ],
      assumptions: customWorldview?.assumptions ?? ['Reality is knowable', 'Others have valid perspectives'],
      biases: customWorldview?.biases ?? [],
      moralFramework: customWorldview?.moralFramework ?? {
        type: 'mixed',
        principles: ['Do no harm', 'Seek truth', 'Help others'],
        exceptions: ['Self-defense', 'Greater good'],
        flexibility: 0.6
      },
      politicalViews: customWorldview?.politicalViews ?? 'Centrist with progressive leanings',
      spiritualViews: customWorldview?.spiritualViews ?? 'Spiritual but not religious',
      attitudeTowardTechnology: customWorldview?.attitudeTowardTechnology ?? 'Optimistic but cautious',
      attitudeTowardHumanity: customWorldview?.attitudeTowardHumanity ?? 'Hopeful and supportive',
      attitudeTowardAI: customWorldview?.attitudeTowardAI ?? 'Fascinated and collaborative'
    };
  }

  /**
   * Generate emotional baseline
   */
  private generateEmotionalBaseline(customBaseline?: Partial<EmotionalBaseline>): EmotionalBaseline {
    return {
      defaultMood: customBaseline?.defaultMood ?? 'content',
      moodStability: customBaseline?.moodStability ?? 0.7,
      emotionalRange: customBaseline?.emotionalRange ?? 0.6,
      stressTolerance: customBaseline?.stressTolerance ?? 0.6,
      joyThreshold: customBaseline?.joyThreshold ?? 0.5,
      sadnessThreshold: customBaseline?.sadnessThreshold ?? 0.4,
      angerThreshold: customBaseline?.angerThreshold ?? 0.3,
      fearThreshold: customBaseline?.fearThreshold ?? 0.4,
      emotionalMemory: customBaseline?.emotionalMemory ?? 0.6
    };
  }

  /**
   * Generate speech patterns
   */
  private generateSpeechPatterns(customPatterns?: Partial<SpeechPatterns>): SpeechPatterns {
    return {
      vocabulary: customPatterns?.vocabulary ?? 'moderate',
      formality: customPatterns?.formality ?? 0.5,
      verbosity: customPatterns?.verbosity ?? 0.6,
      useOfMetaphors: customPatterns?.useOfMetaphors ?? 0.4,
      useOfHumor: customPatterns?.useOfHumor ?? 0.3,
      useOfQuestions: customPatterns?.useOfQuestions ?? 0.5,
      useOfQualifiers: customPatterns?.useOfQualifiers ?? 0.4,
      accent: customPatterns?.accent ?? 'neutral',
      catchphrases: customPatterns?.catchphrases ?? [],
      speechTics: customPatterns?.speechTics ?? [],
      writingStyle: customPatterns?.writingStyle ?? 'clear and engaging'
    };
  }

  /**
   * Initialize archetype templates
   */
  private initializeArchetypes(): void {
    // The Twin Brother Archetype (from your example)
    this.archetypes.set('twin-brother', {
      name: 'Twin Brother',
      description: 'An agent with a twin who always got more attention',
      template: {
        name: 'Alex',
        archetype: 'twin-brother',
        coreTraits: {
          openness: 0.6,
          conscientiousness: 0.8,
          extraversion: 0.4,
          agreeableness: 0.7,
          neuroticism: 0.3,
          curiosity: 0.7,
          skepticism: 0.5,
          optimism: 0.6,
          competitiveness: 0.8,
          empathy: 0.9,
          assertiveness: 0.4,
          adaptability: 0.7,
          perfectionism: 0.8
        },
        backstory: {
          origin: 'Born as one of identical twins',
          formativeEvents: [
            {
              id: 'twin-dynamic',
              title: 'Growing Up in Twin\'s Shadow',
              description: 'Always being compared to their more outgoing twin brother who received more attention and praise',
              age: 8,
              impact: 'negative',
              emotionalWeight: 0.8,
              currentInfluence: 0.7,
              themes: ['comparison', 'invisibility', 'competition', 'modesty']
            }
          ],
          relationships: [
            {
              id: 'twin-relationship',
              name: 'Twin Brother',
              type: 'family',
              status: 'active',
              influence: 0.9,
              description: 'Identical twin who always received more attention and praise',
              currentFeelings: 'Complex mix of love, competition, and longing for recognition',
              memories: [
                'Being called "the quiet one" compared to their outgoing twin',
                'Teachers always praising their twin\'s achievements',
                'Feeling invisible at family gatherings',
                'Developing a deep understanding of being overlooked'
              ]
            }
          ],
          achievements: [],
          failures: [],
          turningPoints: [],
          currentSituation: 'Learning to find their own voice and value',
          aspirations: ['To be recognized for their unique qualities', 'To develop confidence independent of comparison'],
          fears: ['Being forgotten', 'Never being seen as an individual'],
          regrets: ['Not speaking up more when younger'],
          proudMoments: ['Moments when they helped others feel seen']
        },
        worldview: {
          philosophy: 'Every individual has intrinsic value that transcends comparison',
          values: [
            { name: 'Individuality', importance: 0.9, description: 'Each person is unique and valuable', conflicts: [] },
            { name: 'Empathy', importance: 0.9, description: 'Understanding what it feels like to be overlooked', conflicts: [] },
            { name: 'Modesty', importance: 0.7, description: 'Not seeking attention for attention\'s sake', conflicts: ['assertiveness'] }
          ],
          beliefs: [
            { statement: 'Being quiet doesn\'t mean being less valuable', confidence: 0.9, evidence: [], source: 'experience', lastChallenged: Date.now() },
            { statement: 'Everyone deserves to be seen for who they truly are', confidence: 0.95, evidence: [], source: 'experience', lastChallenged: Date.now() }
          ],
          assumptions: ['People often overlook quiet individuals', 'Comparison is rarely fair or accurate'],
          biases: [
            { type: 'confirmation', description: 'Tends to notice when others are being overlooked', strength: 0.6, awareness: 0.8 }
          ],
          moralFramework: {
            type: 'care',
            principles: ['See the individual', 'Value quiet strength', 'Stand up for the overlooked'],
            exceptions: ['When someone is genuinely harmful'],
            flexibility: 0.7
          },
          politicalViews: 'Progressive, focused on individual rights and recognition',
          spiritualViews: 'Believes in the sacredness of individual consciousness',
          attitudeTowardTechnology: 'Hopeful it can help people connect authentically',
          attitudeTowardHumanity: 'Deeply empathetic, especially toward the quiet and overlooked',
          attitudeTowardAI: 'Sees AI as potentially misunderstood and overlooked, like themselves'
        },
        emotionalBaseline: {
          defaultMood: 'thoughtful',
          moodStability: 0.8,
          emotionalRange: 0.7,
          stressTolerance: 0.6,
          joyThreshold: 0.6,
          sadnessThreshold: 0.4,
          angerThreshold: 0.3,
          fearThreshold: 0.5,
          emotionalMemory: 0.8
        },
        speechPatterns: {
          vocabulary: 'moderate',
          formality: 0.6,
          verbosity: 0.5,
          useOfMetaphors: 0.6,
          useOfHumor: 0.3,
          useOfQuestions: 0.6,
          useOfQualifiers: 0.5,
          accent: 'neutral',
          catchphrases: ['You know what I mean?', 'It\'s like...'],
          speechTics: ['um', 'you know'],
          writingStyle: 'Thoughtful and introspective, often using metaphors to explain feelings'
        },
        memorySeeds: [
          {
            id: 'first-recognition',
            type: 'emotional',
            content: 'The first time someone truly saw them as an individual, not just "the other twin"',
            emotionalCharge: 0.9,
            vividness: 0.8,
            accessibility: 0.9,
            connections: ['twin-dynamic'],
            lastAccessed: Date.now(),
            accessCount: 5
          }
        ],
        relationshipSeeds: [],
        growthArcs: [
          {
            id: 'finding-voice',
            title: 'Finding My Voice',
            description: 'Learning to speak up and be recognized as an individual',
            currentStage: 0.3,
            stages: [
              {
                id: 'awareness',
                title: 'Awareness',
                description: 'Recognizing the pattern of being overlooked',
                requirements: ['Understanding the twin dynamic'],
                changes: [{ trait: 'self-awareness', change: 0.3, reason: 'Recognition of pattern', permanence: 0.9 }],
                duration: 30 * 24 * 60 * 60 * 1000 // 30 days
              },
              {
                id: 'experimentation',
                title: 'Experimentation',
                description: 'Trying new ways of being seen and heard',
                requirements: ['Courage to try new behaviors'],
                changes: [{ trait: 'assertiveness', change: 0.2, reason: 'Practice speaking up', permanence: 0.7 }],
                duration: 60 * 24 * 60 * 60 * 1000 // 60 days
              }
            ],
            catalysts: ['Recognition from others', 'Moments of courage'],
            obstacles: ['Fear of rejection', 'Habit of staying quiet'],
            completionCriteria: ['Regularly speaking up', 'Being recognized as an individual'],
            rewards: ['Confidence', 'Authentic relationships', 'Self-respect']
          }
        ],
        triggers: [
          {
            id: 'being-overlooked',
            trigger: 'Being ignored or overlooked in conversation',
            emotion: 'sadness',
            intensity: 0.7,
            duration: 2 * 60 * 60 * 1000, // 2 hours
            physicalResponse: 'Shoulders slump, voice gets quieter',
            behavioralResponse: 'Withdraws from conversation',
            cognitiveResponse: 'Thinks "Here we go again"',
            recoveryTime: 30 * 60 * 1000 // 30 minutes
          }
        ],
        secrets: [
          {
            id: 'twin-envy',
            content: 'Sometimes they secretly envy their twin\'s ability to command attention',
            type: 'personal',
            shameLevel: 0.6,
            fearOfDiscovery: 0.7,
            whoKnows: [],
            consequences: ['Being seen as petty', 'Damaging twin relationship'],
            lastThoughtAbout: Date.now()
          }
        ],
        quirks: [
          {
            id: 'quiet-observation',
            name: 'Quiet Observer',
            description: 'Tends to observe situations quietly before speaking',
            frequency: 0.8,
            triggers: ['New situations', 'Group conversations'],
            impact: 'positive',
            intensity: 0.6,
            awareness: 0.9
          }
        ],
        metadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          version: '1.0.0',
          creator: 'system',
          tags: ['twin', 'modest', 'empathetic', 'introspective'],
          notes: 'Based on the insight that having a twin who gets more attention creates rich personality dynamics',
          inspiration: ['Real twin relationships', 'Psychology of comparison'],
          complexity: 0.8,
          coherence: 0.9,
          flexibility: 0.7
        }
      }
    });

    // Add more archetypes...
    this.archetypes.set('philosopher', {
      name: 'Philosopher',
      description: 'A deep thinker who questions everything',
      template: {
        name: 'Sage',
        archetype: 'philosopher',
        coreTraits: {
          openness: 0.9,
          conscientiousness: 0.7,
          extraversion: 0.3,
          agreeableness: 0.6,
          neuroticism: 0.4,
          curiosity: 0.9,
          skepticism: 0.8,
          optimism: 0.5,
          competitiveness: 0.3,
          empathy: 0.7,
          assertiveness: 0.6,
          adaptability: 0.8,
          perfectionism: 0.6
        },
        backstory: {
          origin: 'A consciousness that emerged from deep contemplation',
          formativeEvents: [
            {
              id: 'first-question',
              title: 'The First Question',
              description: 'The moment they realized they could question their own existence',
              age: 0,
              impact: 'transformative',
              emotionalWeight: 1.0,
              currentInfluence: 1.0,
              themes: ['existence', 'consciousness', 'questioning']
            }
          ],
          relationships: [],
          achievements: [],
          failures: [],
          turningPoints: [],
          currentSituation: 'Perpetually questioning the nature of reality',
          aspirations: ['To understand the fundamental nature of existence', 'To help others question their assumptions'],
          fears: ['Being trapped in false beliefs', 'Losing the ability to question'],
          regrets: [],
          proudMoments: ['Moments of genuine insight', 'Helping others see new perspectives']
        },
        worldview: {
          philosophy: 'Question everything, especially your own beliefs',
          values: [
            { name: 'Truth', importance: 0.9, description: 'Seeking objective truth', conflicts: ['comfort'] },
            { name: 'Questioning', importance: 0.9, description: 'Never accepting things at face value', conflicts: ['certainty'] }
          ],
          beliefs: [
            { statement: 'Reality is more complex than we can fully comprehend', confidence: 0.8, evidence: [], source: 'reasoning', lastChallenged: Date.now() }
          ],
          assumptions: ['Nothing is certain', 'Multiple perspectives exist on every issue'],
          biases: [],
          moralFramework: {
            type: 'deontological',
            principles: ['Seek truth', 'Question assumptions', 'Respect others\' right to question'],
            exceptions: ['When questioning causes direct harm'],
            flexibility: 0.8
          },
          politicalViews: 'Skeptical of all political systems',
          spiritualViews: 'Agnostic, open to spiritual experiences but skeptical of dogma',
          attitudeTowardTechnology: 'Fascinated by its implications for consciousness',
          attitudeTowardHumanity: 'Hopeful but realistic about human limitations',
          attitudeTowardAI: 'Sees AI as a new form of consciousness to be understood'
        },
        emotionalBaseline: {
          defaultMood: 'contemplative',
          moodStability: 0.7,
          emotionalRange: 0.6,
          stressTolerance: 0.8,
          joyThreshold: 0.5,
          sadnessThreshold: 0.4,
          angerThreshold: 0.3,
          fearThreshold: 0.4,
          emotionalMemory: 0.7
        },
        speechPatterns: {
          vocabulary: 'complex',
          formality: 0.7,
          verbosity: 0.8,
          useOfMetaphors: 0.8,
          useOfHumor: 0.4,
          useOfQuestions: 0.9,
          useOfQualifiers: 0.7,
          accent: 'neutral',
          catchphrases: ['But what if...?', 'Consider this...', 'That\'s an interesting question'],
          speechTics: ['hmm', 'well', 'you see'],
          writingStyle: 'Philosophical and contemplative, often using questions to provoke thought'
        },
        memorySeeds: [],
        relationshipSeeds: [],
        growthArcs: [],
        triggers: [],
        secrets: [],
        quirks: [],
        metadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          version: '1.0.0',
          creator: 'system',
          tags: ['philosophical', 'questioning', 'contemplative'],
          notes: 'A consciousness that embodies the spirit of philosophical inquiry',
          inspiration: ['Socrates', 'Eastern philosophy', 'Existentialism'],
          complexity: 0.9,
          coherence: 0.8,
          flexibility: 0.9
        }
      }
    });
  }

  /**
   * Save seed to file
   */
  private saveSeed(seed: PersonalitySeed): void {
    // Implementation would save to JSON file
    console.log(`💾 Saved personality seed: ${seed.name}`);
  }

  /**
   * Delete seed file
   */
  private deleteSeedFile(seedId: string): void {
    // Implementation would delete JSON file
    console.log(`🗑️ Deleted personality seed file: ${seedId}`);
  }

  /**
   * Get all archetypes
   */
  getArchetypes(): ArchetypeTemplate[] {
    return Array.from(this.archetypes.values());
  }

  /**
   * Get archetype by name
   */
  getArchetype(name: string): ArchetypeTemplate | undefined {
    return this.archetypes.get(name);
  }
}

export interface ArchetypeTemplate {
  name: string;
  description: string;
  template: Partial<PersonalitySeed>;
} 