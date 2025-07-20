import { MemoryItem, MemorySummary, Motif, SimpleMemoryItem, SimpleMemorySummary } from "../core/types";

export interface StorageAdapter {
  init(): Promise<void>; // Setup schema or load file
  saveUtterance(agentId: string, item: SimpleMemoryItem): Promise<void>;
  getUtterances(agentId: string, limit?: number): Promise<SimpleMemoryItem[]>;
  saveSummary(agentId: string, summary: SimpleMemorySummary): Promise<void>;
  getLatestSummary(agentId: string): Promise<SimpleMemorySummary | null>;
  clear(agentId: string): Promise<void>; // Optional: clear memory for one agent
  
  // Legacy methods for backward compatibility
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