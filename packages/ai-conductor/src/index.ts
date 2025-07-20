// Multi-conversation entanglement system
export { MultiConvoEntanglement, type EntanglementEvent, type ThoughtDiffusion, type EnvironmentalMood } from './simulation/MultiConvoEntanglement';

// Dialogue types and rendering
export { DialogueRenderer, type DualUtterance, type ChatRenderBlock, type AmbientEvent, type AgentState, type StyleVector, type BehavioralImpact, type StyleContagion, type EntanglementChain } from './simulation/types/DialogueTypes';
export { DialogueRenderer } from './simulation/DialogueRenderer';

// State tracking
export { StateTracker, type StateUpdateEvent, type MoodDiffusion, type StyleDiffusion } from './simulation/StateTracker';

// Personality seed system
export { PersonalitySeedManager, type PersonalitySeed, type CoreTraits, type Backstory, type Worldview, type EmotionalBaseline, type SpeechPatterns, type MemorySeed, type RelationshipSeed, type GrowthArc, type EmotionalTrigger, type Secret, type Quirk, type PersonalityMetadata, type ArchetypeTemplate } from './personality/PersonalitySeed';

// Personality evolution system
export { PersonalityEvolution, type PersonalityState, type EmotionalState, type Experience, type PersonalityChange, type MoodEntry, type BehavioralPattern, type SelfReflection, type EvolutionEvent, type Interaction, type RelationshipEvent } from './personality/PersonalityEvolution';

// Memory management system
export { SharedMemoryManager, type SharedMemory, type CallbackTrigger, type RunningJoke, type SharedTheme, type SurrealMoment, type MemoryConfig, type MemoryInjection } from './memory/SharedMemoryManager';

// Persona injection system
export { PersonaInjector, type PersonaConfig, type PersonaInjection, type ConversationContext } from './persona/PersonaInjector';

// Core classes
export { AgentSession } from './core/AgentSession';
export { DialoguePipe } from './conversation/DialoguePipe';
export { MultiAgentDialogue } from './conversation/MultiAgentDialogue';
export { SessionManager } from './core/SessionManager';
export { InterjectionManager } from './core/InterjectionManager';

// Browser sessions
export { BrowserAgentSession } from './browser/BrowserAgentSession';
export { PlaywrightSession } from './browser/PlaywrightSession';

// Adapter System
export { 
  AgentAdapter, 
  BaseAgentAdapter, 
  AdapterCapabilities,
  AdapterFactory,
  AdapterRegistry,
  globalAdapterRegistry 
} from './adapters/AgentAdapter';

export { 
  ChatGPTAdapter, 
  ChatGPTConfig 
} from './adapters/ChatGPTAdapter';

export { 
  ClaudeAdapter, 
  ClaudeConfig 
} from './adapters/ClaudeAdapter';

export { 
  ChatGPTAdapterFactory,
  ClaudeAdapterFactory,
  GenericAdapterFactory,
  AdapterFactoryRegistry,
  globalAdapterFactoryRegistry 
} from './adapters/AdapterFactory';

// Types
export type {
  AgentSessionOptions,
  PromptJob,
  ResponseEvent,
  ErrorEvent,
  DialoguePipeOptions,
  MultiAgentDialogueOptions,
  SessionManagerOptions,
  Exchange,
  Transcript,
  SessionState,
  Interjection,
  Spectator,
  PersonaConfig,
  PlatformConfig,
  BrowserAgentConfig
} from '@chatpipes/types';

// Stealth and rate limiting
export { StealthSession } from './browser/StealthSession';
export { RateLimitManager } from './browser/RateLimitManager';
export type {
  StealthConfig,
  SessionIdentity,
  RateLimitConfig,
  PlatformRateLimits,
  RequestLog
} from './browser/types'; 