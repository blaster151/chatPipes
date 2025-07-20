// Core exports
export { MemoryManager } from './core/MemoryManager';
export { AgentSession, PersonaConfig, PlatformConfig } from './core/AgentSession';
export { BrowserAgentSession, BrowserAgentConfig } from './core/BrowserAgentSession';
export { MotifTracker } from './core/motifTracker';
export { DefaultSummarizer } from './core/DefaultSummarizer';
export { DefaultMotifDetector } from './core/DefaultMotifDetector';
export { DefaultEmotionalAnalyzer } from './core/DefaultEmotionalAnalyzer';

// Storage exports
export { StorageAdapter } from './storage/StorageAdapter';
export { FileStore } from './storage/FileStore';

// Browser automation exports
export { PlaywrightSession, BrowserConfig, SessionConfig } from './browser/PlaywrightSession';
export { getPlatformConfig, robustPlatformConfigs } from './browser/playwrightPlatformConfigs';

// Conversation exports
export { ConversationOrchestrator, AgentConfig, ConversationConfig, ConversationEvent } from './conversation/ConversationOrchestrator';
export { DialoguePipe, Interjection, DialogueConfig, TurnEvent } from './conversation/DialoguePipe';
export { MultiAgentDialogue, MultiAgentConfig, AgentInfo, TurnContext, TurnEvent as MultiAgentTurnEvent } from './conversation/MultiAgentDialogue';
export { SqliteStore } from './storage/SqliteStore';

// Summarizer exports
export { summarizeFacts, extractKeyFacts, summarizeByTopic } from './core/summarizers/summarizeFacts';
export { summarizeEmotions, analyzeEmotionalTrends, getEmotionalProfile } from './core/summarizers/summarizeEmotions';

// Type exports
export type {
  Utterance,
  EmotionalTone,
  MemoryItem,
  MemorySummary,
  Motif,
  MemoryConfig,
  Summarizer,
  MotifDetector,
  EmotionalAnalyzer,
  MemoryQuery,
  MemoryQueryResult
} from './core/types';

// Server and CLI exports
export { default as server } from './server/index';
export { default as CLIBridge } from './cli/bridge';

// Default configuration
export const defaultConfig = require('./config/default.json'); 