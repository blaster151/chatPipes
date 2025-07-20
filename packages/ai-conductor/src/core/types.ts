export interface Utterance {
  id: string;
  text: string;
  timestamp: Date;
  source: string; // agentA, agentB, etc.
  emotionalTone?: EmotionalTone;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EmotionalTone {
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0 to 1 (calm to excited)
  dominance: number; // 0 to 1 (submissive to dominant)
  primaryEmotion?: string; // joy, sadness, anger, fear, surprise, disgust
  confidence: number; // 0 to 1 (confidence in emotion detection)
}

export interface MemoryItem {
  id: string;
  utterance: Utterance;
  importance: number; // 0 to 1
  accessCount: number;
  lastAccessed: Date;
  createdAt: Date;
  motifs: string[];
  summary?: string;
}

// Simplified MemoryItem for the new MemoryManager
export interface SimpleMemoryItem {
  timestamp: string;
  role: "user" | "agent";
  text: string;
}

export interface MemorySummary {
  totalMemories: number;
  recentMemories: number; // last 24 hours
  averageImportance: number;
  dominantEmotions: Array<{
    emotion: string;
    frequency: number;
    averageValence: number;
  }>;
  topMotifs: Array<{
    motif: string;
    frequency: number;
  }>;
  sources: Array<{
    source: string;
    count: number;
  }>;
  timeRange: {
    earliest: Date;
    latest: Date;
  };
}

// Simplified MemorySummary for the new MemoryManager
export interface SimpleMemorySummary {
  timestamp: string;
  facts: string;
  emotions: string;
  motifs: string[];
}

export interface Motif {
  id: string;
  pattern: string;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  relatedMemories: string[]; // memory IDs
  strength: number; // 0 to 1
}

export interface MemoryConfig {
  maxMemorySize: number;
  summarizationThreshold: number; // number of memories before summarization
  motifDetectionThreshold: number; // minimum frequency for motif detection
  importanceDecayRate: number; // how quickly importance decreases over time
  emotionalTrackingEnabled: boolean;
  motifTrackingEnabled: boolean;
  persistenceInterval: number; // milliseconds
}

export interface StorageAdapter {
  saveMemory(memory: MemoryItem): Promise<void>;
  getMemory(id: string): Promise<MemoryItem | null>;
  getAllMemories(): Promise<MemoryItem[]>;
  getMemoriesBySource(source: string): Promise<MemoryItem[]>;
  getMemoriesByTimeRange(start: Date, end: Date): Promise<MemoryItem[]>;
  deleteMemory(id: string): Promise<void>;
  clearAllMemories(): Promise<void>;
  saveMotif(motif: Motif): Promise<void>;
  getMotifs(): Promise<Motif[]>;
  updateMotif(motif: Motif): Promise<void>;
  deleteMotif(id: string): Promise<void>;
}

export interface Summarizer {
  summarizeFacts(memories: MemoryItem[]): string;
  summarizeEmotions(memories: MemoryItem[]): string;
  summarizeMotifs(motifs: Motif[]): string;
}

export interface MotifDetector {
  detectMotifs(utterances: Utterance[]): Motif[];
  updateMotif(motif: Motif, newUtterance: Utterance): Motif;
}

export interface EmotionalAnalyzer {
  analyzeEmotion(text: string): EmotionalTone;
}

export type MemoryQuery = {
  source?: string;
  timeRange?: { start: Date; end: Date };
  minImportance?: number;
  tags?: string[];
  emotionalTone?: Partial<EmotionalTone>;
  limit?: number;
  offset?: number;
};

export interface MemoryQueryResult {
  memories: MemoryItem[];
  total: number;
  hasMore: boolean;
} 