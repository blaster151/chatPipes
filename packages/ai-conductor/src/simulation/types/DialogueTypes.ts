// Core dual-layered communication types
export interface DualUtterance {
  speakerId: string;
  spoken: string;
  unspoken?: string;
  timestamp: number;
  metadata?: {
    thoughtType?: string;
    intensity?: number;
    behavioralImpact?: BehavioralImpact;
    emotionalState?: string;
    context?: string;
  };
}

// Visual rendering blocks for UI
export interface ChatRenderBlock {
  type: 'spoken' | 'unspoken' | 'ambient' | 'interjection' | 'cross_talk' | 'thought_diffusion' | 'environmental_mood';
  text: string;
  speakerId?: string;
  targetId?: string; // for cross-talk or thought diffusion
  style?: 'italic' | 'quote' | 'gray' | 'bold' | 'highlight' | 'fade';
  timestamp: number;
  metadata?: {
    thoughtType?: string;
    intensity?: number;
    emotionalState?: string;
    environmentalImpact?: string;
    diffusionPath?: string[];
    chainId?: string;
  };
}

// Environmental events
export interface AmbientEvent {
  id: string;
  envId: string;
  text: string;
  source: 'monitor' | 'system' | 'randomGen' | 'agent' | 'entanglement';
  timestamp: number;
  intensity?: number;
  type?: 'environmental' | 'social' | 'atmospheric' | 'narrative';
  affects?: string[]; // mood, noise, social, etc.
  metadata?: {
    trigger?: string;
    environmentalImpact?: string;
    emotionalContagion?: boolean;
  };
}

// Agent state tracking
export interface AgentState {
  id: string;
  name: string;
  traits: Record<string, number>; // e.g., suspicion: 0.7, openness: 0.3
  mood?: string;
  styleAdaptation?: StyleVector;
  lastHeard?: string;
  lastSpoken?: DualUtterance;
  memory?: string[]; // history or episodic notes
  behavioralState?: BehavioralState;
  relationshipScores?: Record<string, number>; // targetId -> score
  thoughtHistory?: InnerThought[];
  environmentalInfluence?: EnvironmentalInfluence;
  timestamp: number;
}

// Style vector for personality evolution
export interface StyleVector {
  verbosity?: number; // 0.0 - 1.0
  metaphorAffinity?: number; // 0.0 - 1.0
  emotionalTone?: 'neutral' | 'tense' | 'warm' | 'sarcastic' | 'anxious' | 'excited' | 'suspicious' | 'trusting';
  formality?: number; // 0.0 - 1.0
  assertiveness?: number; // 0.0 - 1.0
  curiosity?: number; // 0.0 - 1.0
  patience?: number; // 0.0 - 1.0
  empathy?: number; // 0.0 - 1.0
  humor?: number; // 0.0 - 1.0
  directness?: number; // 0.0 - 1.0
  adaptability?: number; // 0.0 - 1.0
}

// Behavioral state for tracking changes
export interface BehavioralState {
  trust: number; // -1 to 1
  sarcasm: number; // -1 to 1
  suspicion: number; // -1 to 1
  engagement: number; // -1 to 1
  assertiveness: number; // -1 to 1
  curiosity: number; // -1 to 1
  patience: number; // -1 to 1
  empathy: number; // -1 to 1
  timestamp: number;
}

// Inner thought structure
export interface InnerThought {
  id: string;
  speakerId: string;
  targetId?: string;
  content: string;
  type: InnerThoughtType;
  intensity: number; // 0-1
  timestamp: number;
  context?: string;
  behavioralImpact?: BehavioralImpact;
}

export type InnerThoughtType = 
  | 'observation' 
  | 'judgment' 
  | 'suspicion' 
  | 'admiration' 
  | 'doubt' 
  | 'amusement' 
  | 'frustration' 
  | 'curiosity' 
  | 'concern' 
  | 'excitement';

// Behavioral impact of thoughts
export interface BehavioralImpact {
  trustChange: number; // -1 to 1
  sarcasmChange: number; // -1 to 1
  suspicionChange: number; // -1 to 1
  engagementChange: number; // -1 to 1
  assertivenessChange: number; // -1 to 1
  curiosityChange: number; // -1 to 1
  patienceChange: number; // -1 to 1
  empathyChange: number; // -1 to 1
}

// Environmental influence on agents
export interface EnvironmentalInfluence {
  environmentId: string;
  moodContagion?: number; // 0-1 how much agent is affected by environment
  tensionAbsorption?: number; // 0-1 how much tension agent absorbs
  energyTransfer?: number; // 0-1 how much energy agent gains/loses
  trustModification?: number; // -1 to 1 how environment affects trust
  lastInfluence?: {
    type: string;
    intensity: number;
    timestamp: number;
  };
}

// Conversation thread state
export interface ThreadState {
  id: string;
  name: string;
  participants: string[];
  environmentId?: string;
  isActive: boolean;
  currentRound: number;
  totalExchanges: number;
  dualExchanges: DualUtterance[];
  ambientEvents: AmbientEvent[];
  interjections: ChatRenderBlock[];
  crossTalkEvents: ChatRenderBlock[];
  thoughtDiffusions: ChatRenderBlock[];
  environmentalMoodShifts: ChatRenderBlock[];
  startTime: number;
  lastActivity: number;
  metadata?: {
    subscriptionMode?: string;
    enableDualConversation?: boolean;
    entanglementLevel?: number;
  };
}

// Environment state with mood tracking
export interface EnvironmentState {
  id: string;
  name: string;
  overallMood: string; // 'positive', 'negative', 'neutral'
  tensionLevel: number; // 0-1
  trustLevel: number; // 0-1
  energyLevel: number; // 0-1
  curiosityLevel: number; // 0-1
  suspicionLevel: number; // 0-1
  lastUpdated: number;
  contributingFactors: string[];
  activeThreads: string[];
  ambientEvents: AmbientEvent[];
  moodHistory: MoodSnapshot[];
}

// Mood snapshot for tracking changes over time
export interface MoodSnapshot {
  timestamp: number;
  mood: string;
  tensionLevel: number;
  trustLevel: number;
  energyLevel: number;
  curiosityLevel: number;
  suspicionLevel: number;
  contributingFactors: string[];
}

// World state aggregation
export interface WorldState {
  id: string;
  name: string;
  isActive: boolean;
  time: {
    worldTime: number;
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
  recentEvents: string[];
  entanglementChains: EntanglementChain[];
  environmentalMoods: Record<string, EnvironmentState>;
  agentStates: Record<string, AgentState>;
  threadStates: Record<string, ThreadState>;
}

// Entanglement chain for tracking complex interactions
export interface EntanglementChain {
  id: string;
  events: EntanglementEvent[];
  depth: number;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  impact: {
    threadsAffected: string[];
    agentsAffected: string[];
    environmentalChanges: string[];
    totalIntensity: number;
  };
}

// Entanglement event
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
  timestamp: number;
}

// Style contagion and influence
export interface StyleContagion {
  sourceAgentId: string;
  targetAgentId: string;
  styleVector: StyleVector;
  intensity: number; // 0-1
  duration: number; // milliseconds
  timestamp: number;
  metadata?: {
    trigger?: string;
    context?: string;
    decayRate?: number;
  };
}

// Diffusion-ready state for style/mood propagation
export interface DiffusionState {
  agentId: string;
  styleVector: StyleVector;
  behavioralState: BehavioralState;
  environmentalInfluence: EnvironmentalInfluence;
  relationshipScores: Record<string, number>;
  thoughtHistory: InnerThought[];
  lastUpdate: number;
  diffusionFactors: {
    susceptibility: number; // 0-1 how easily influenced
    influenceRadius: number; // how far influence spreads
    styleRetention: number; // 0-1 how long styles persist
    moodStability: number; // 0-1 how stable mood is
  };
}

// Conversation transcript with dual layers
export interface DualTranscript {
  threadId: string;
  exchanges: DualUtterance[];
  renderBlocks: ChatRenderBlock[];
  ambientEvents: AmbientEvent[];
  startTime: number;
  endTime?: number;
  metadata?: {
    totalExchanges: number;
    thoughtCount: number;
    crossTalkCount: number;
    environmentalMoodShifts: number;
  };
}

// Real-time conversation stream
export interface ConversationStream {
  threadId: string;
  blocks: ChatRenderBlock[];
  agentStates: Record<string, AgentState>;
  environmentState?: EnvironmentState;
  isActive: boolean;
  lastUpdate: number;
}

// Utility types for type safety
export type ChatBlockType = ChatRenderBlock['type'];
export type StyleTone = StyleVector['emotionalTone'];
export type ThoughtType = InnerThought['type'];
export type EntanglementType = EntanglementEvent['type'];

// Configuration types
export interface DualConversationConfig {
  enabled: boolean;
  probability: number; // 0-1 chance of inner thoughts
  maxThoughtsPerExchange: number;
  thoughtTypes: InnerThoughtType[];
  behavioralImpact: boolean;
  memoryRetention: number; // 0-1
  thoughtIntensity: number; // 0-1
  styleContagion?: boolean;
  moodDiffusion?: boolean;
}

export interface EntanglementConfig {
  enabled: boolean;
  crossTalkProbability: number;
  thoughtDiffusionProbability: number;
  environmentalDiffusion: boolean;
  overhearingRange: number;
  emotionalContagion: boolean;
  tensionPropagation: boolean;
  trustDiffusion: boolean;
  maxEntanglementDepth: number;
  diffusionDecay: number;
  styleContagion?: boolean;
}

// Event types for the event system
export interface DialogueEvent {
  type: 'dual_exchange' | 'thought_generated' | 'behavioral_update' | 'style_contagion' | 'mood_diffusion';
  data: any;
  timestamp: number;
}

// Statistics and analytics
export interface DialogueStats {
  totalExchanges: number;
  totalThoughts: number;
  thoughtTypeDistribution: Record<InnerThoughtType, number>;
  styleContagionEvents: number;
  moodDiffusionEvents: number;
  averageThoughtIntensity: number;
  mostActiveAgents: string[];
  environmentalMoodHistory: MoodSnapshot[];
  entanglementChainCount: number;
  averageChainDepth: number;
}

// Export all types for easy importing
export type {
  DualUtterance,
  ChatRenderBlock,
  AmbientEvent,
  AgentState,
  StyleVector,
  BehavioralState,
  InnerThought,
  BehavioralImpact,
  EnvironmentalInfluence,
  ThreadState,
  EnvironmentState,
  MoodSnapshot,
  WorldState,
  EntanglementChain,
  EntanglementEvent,
  StyleContagion,
  DiffusionState,
  DualTranscript,
  ConversationStream,
  DualConversationConfig,
  EntanglementConfig,
  DialogueEvent,
  DialogueStats
}; 