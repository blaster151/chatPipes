// Core types
export interface PersonaConfig {
  name: string;
  description: string;
  instructions: string;
  temperature?: number;
  maxTokens?: number;
  memoryContext?: string;
  behaviorStyle?: string;
  introPrompt?: string;
}

export interface PlatformConfig {
  chatgpt?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  claude?: {
    model?: string;
    maxTokens?: number;
  };
  perplexity?: {
    searchType?: 'concise' | 'detailed' | 'creative' | 'precise';
    focus?: 'web' | 'academic' | 'writing' | 'wolfram-alpha';
  };
  deepseek?: {
    model?: string;
    maxTokens?: number;
  };
}

// AgentSession types
export interface BrowserConfig {
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  viewport?: { width: number; height: number };
  userAgent?: string;
  extraArgs?: string[];
}

export interface SessionConfig {
  url: string;
  selectors: {
    chatInput: string;
    sendButton: string;
    responseContainer: string;
    responseText: string;
    loadingIndicator?: string;
    newChatButton?: string;
    modelSelector?: string;
    searchTypeSelector?: string;
    focusSelector?: string;
  };
  preActions?: Array<{
    type: 'click' | 'type' | 'select' | 'wait' | 'waitForSelector';
    selector?: string;
    value?: string;
    timeout?: number;
  }>;
  postActions?: Array<{
    type: 'click' | 'type' | 'select' | 'wait' | 'waitForSelector';
    selector?: string;
    value?: string;
    timeout?: number;
  }>;
  responseWaitStrategy: 'selector' | 'text' | 'network' | 'timeout';
  responseTimeout?: number;
  maxRetries?: number;
}

export interface SessionEvent {
  type: 'session_started' | 'message_sent' | 'response_received' | 'error' | 'session_closed';
  timestamp: Date;
  data?: any;
}

export interface AgentSession {
  id: string;
  persona: PersonaConfig;
  platform: string;
  isActive: boolean;
  sessionContext: any; // Browser session context
  queue: any[]; // Message queue
  init(): Promise<void>;
  sendPrompt(prompt: string): Promise<string>;
  close(): Promise<void>;
  setMemoryManager(memory: any): void;
}

// Session Persistence types
export interface Exchange {
  id: string;
  from: string;
  to: string;
  prompt: string;
  response: string;
  timestamp: Date;
  round: number;
  metadata?: {
    tokens?: number;
    duration?: number;
    platform?: string;
    model?: string;
  };
}

export interface InterjectionRecord {
  id: string;
  type: 'side_question' | 'correction' | 'direction' | 'pause' | 'resume';
  text: string;
  target: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  appliedAt?: Date;
  promptModification?: string; // Serialized function or description
}

export interface SessionState {
  id: string;
  name: string;
  type: 'dialogue' | 'multi-agent';
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'completed' | 'error';
  config: {
    maxRounds?: number;
    turnDelay?: number;
    enableStreaming?: boolean;
    synthesisStrategy?: string;
    contextWindow?: number;
  };
  agents: Array<{
    id: string;
    name: string;
    persona: PersonaConfig;
    platform: string;
    isActive: boolean;
  }>;
  exchanges: Exchange[];
  interjections: InterjectionRecord[];
  currentRound: number;
  currentTurn: string | null;
  metadata?: {
    totalTokens?: number;
    totalDuration?: number;
    averageResponseTime?: number;
    errorCount?: number;
  };
}

export interface SessionReplay {
  sessionId: string;
  replayId: string;
  startTime: Date;
  endTime?: Date;
  speed: 'slow' | 'normal' | 'fast' | 'instant';
  currentExchangeIndex: number;
  isPlaying: boolean;
  exchanges: Exchange[];
}

export interface LiveLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'turn' | 'interjection' | 'system' | 'error';
  message: string;
  data?: any;
  agentId?: string;
  exchangeId?: string;
}

// DialoguePipe types
export interface DialoguePipe {
  id: string;
  agentSessions: AgentSession[];
  spectators: Spectator[];
  isActive: boolean;
  currentTurn: number;
  maxRounds?: number;
  turnDelay?: number;
  enableStreaming?: boolean;
  interjectionPattern?: RegExp;
  start(): Promise<void>;
  stop(): Promise<void>;
  addSpectator(spectator: Spectator): void;
  removeSpectator(spectatorId: string): void;
  addInterjection(interjection: Interjection): void;
}

export interface Interjection {
  id: string;
  type: 'side_question' | 'correction' | 'direction' | 'pause' | 'resume';
  text: string;
  target?: 'A' | 'B' | 'both' | string; // Agent ID or 'both'
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  promptModification?: (originalPrompt: string) => string;
}

export interface TurnEvent {
  type: 'turn_start' | 'turn_end' | 'interjection' | 'pause' | 'resume';
  agentId: string;
  agentName: string;
  message?: string;
  interjection?: Interjection;
  timestamp: Date;
  round: number;
}

// Spectator types
export interface Spectator {
  id: string;
  type: 'cli' | 'ui' | 'api';
  name: string;
  onTurnEvent(event: TurnEvent): void;
  onDialogueEvent(event: DialogueEvent): void;
  onError(error: Error): void;
}

export interface DialogueEvent {
  type: 'dialogue_started' | 'dialogue_ended' | 'agent_joined' | 'agent_left' | 'interjection_added';
  timestamp: Date;
  data?: any;
}

// Multi-agent dialogue types
export interface AgentInfo {
  id: string;
  name: string;
  session: AgentSession;
  isActive: boolean;
}

export interface TurnContext {
  agentId: string;
  agentName: string;
  round: number;
  turn: number;
  previousMessages: Array<{
    agentId: string;
    agentName: string;
    message: string;
    timestamp: Date;
  }>;
  synthesizedContext: string;
}

export interface MultiAgentConfig {
  maxRounds?: number;
  turnDelay?: number;
  enableStreaming?: boolean;
  contextWindow?: number;
  synthesisStrategy?: 'all' | 'recent' | 'weighted';
  skipInactiveAgents?: boolean;
  allowInterruptions?: boolean;
}

// Memory types
export interface Utterance {
  id: string;
  text: string;
  timestamp: Date;
  speaker: string;
  emotionalTone?: EmotionalTone;
  metadata?: Record<string, any>;
}

export interface EmotionalTone {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  trust: number;
  anticipation: number;
}

export interface MemoryItem {
  id: string;
  content: string;
  type: 'fact' | 'emotion' | 'conversation' | 'motif';
  timestamp: Date;
  tags: string[];
  metadata: Record<string, any>;
  emotionalTone?: EmotionalTone;
}

export interface MemorySummary {
  id: string;
  content: string;
  type: 'factual' | 'emotional' | 'conversational';
  timestamp: Date;
  sourceItems: string[];
  confidence: number;
}

export interface Motif {
  id: string;
  pattern: string;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  emotionalTone?: EmotionalTone;
  tags: string[];
}

export interface MemoryConfig {
  maxItems?: number;
  retentionDays?: number;
  summarizationInterval?: number;
  motifDetectionEnabled?: boolean;
  emotionalAnalysisEnabled?: boolean;
}

export interface MemoryQuery {
  text?: string;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  type?: 'fact' | 'emotion' | 'conversation' | 'motif';
  limit?: number;
}

export interface MemoryQueryResult {
  items: MemoryItem[];
  total: number;
  query: MemoryQuery;
}

// Storage types
export interface StorageAdapter {
  init(): Promise<void>;
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  close(): Promise<void>;
}

// Summarizer types
export interface Summarizer {
  summarize(items: MemoryItem[]): Promise<MemorySummary>;
  extractKeyFacts(items: MemoryItem[]): Promise<string[]>;
  summarizeByTopic(items: MemoryItem[], topic: string): Promise<MemorySummary>;
}

export interface MotifDetector {
  detectMotifs(items: MemoryItem[]): Promise<Motif[]>;
  updateMotif(motif: Motif, newItem: MemoryItem): Motif;
}

export interface EmotionalAnalyzer {
  analyzeEmotionalTone(text: string): Promise<EmotionalTone>;
  analyzeEmotionalTrends(items: MemoryItem[]): Promise<EmotionalTone>;
  getEmotionalProfile(items: MemoryItem[]): Promise<EmotionalTone>;
}

// Observability and Replay Types
export interface DialogueExchange {
  id: string;
  from: string;
  to: string;
  prompt: string;
  response: string;
  round: number;
  timestamp: Date;
  interjectionId?: string;
  metadata?: ExchangeMetadata;
}

export interface ExchangeMetadata {
  duration: number;
  tokens: number;
  platform: string;
  model: string;
  interjectionId?: string;
  error?: string;
}

export interface ReplayOptions {
  speed: 'instant' | 'fast' | 'normal' | 'slow';
  enableInterjections: boolean;
  enableMetadata: boolean;
  autoAdvance: boolean;
  loop: boolean;
  sessionName?: string;
}

export interface ReplayEvent {
  type: 'exchange' | 'interjection' | 'system';
  exchange?: DialogueExchange;
  interjection?: Interjection;
  index: number;
  timestamp: Date;
  sessionId: string;
}

export interface ReplayState {
  sessionId: string;
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  startTime: Date;
  currentTime: Date;
  speed: string;
  totalExchanges: number;
} 