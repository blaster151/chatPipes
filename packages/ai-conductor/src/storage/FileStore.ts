import fs from "fs/promises";
import path from "path";
import { StorageAdapter } from "./StorageAdapter";
import { MemoryItem, MemorySummary, SimpleMemoryItem, SimpleMemorySummary } from "../core/types";

const DATA_DIR = path.resolve(__dirname, "../../.memdata");

export class FileStore implements StorageAdapter {
  async init(): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  private filePath(agentId: string, type: "utterances" | "summary") {
    return path.join(DATA_DIR, `${agentId}.${type}.json`);
  }

  async saveUtterance(agentId: string, item: SimpleMemoryItem): Promise<void> {
    const file = this.filePath(agentId, "utterances");
    const data = await this.getUtterances(agentId);
    data.push(item);
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
  }

  async getUtterances(agentId: string, limit?: number): Promise<SimpleMemoryItem[]> {
    const file = this.filePath(agentId, "utterances");
    try {
      const text = await fs.readFile(file, "utf-8");
      const data = JSON.parse(text) as SimpleMemoryItem[];
      return limit ? data.slice(-limit) : data;
    } catch {
      return [];
    }
  }

  async saveSummary(agentId: string, summary: SimpleMemorySummary): Promise<void> {
    const file = this.filePath(agentId, "summary");
    await fs.writeFile(file, JSON.stringify(summary, null, 2), "utf-8");
  }

  async getLatestSummary(agentId: string): Promise<SimpleMemorySummary | null> {
    const file = this.filePath(agentId, "summary");
    try {
      const text = await fs.readFile(file, "utf-8");
      const data = JSON.parse(text) as SimpleMemorySummary;
      return data;
    } catch {
      return null;
    }
  }

  async clear(agentId: string): Promise<void> {
    await Promise.all([
      fs.rm(this.filePath(agentId, "utterances"), { force: true }),
      fs.rm(this.filePath(agentId, "summary"), { force: true }),
    ]);
  }

  // Legacy methods for backward compatibility
  async saveMemory(memory: MemoryItem): Promise<void> {
    // Convert MemoryItem to SimpleMemoryItem for storage
    const simpleItem: SimpleMemoryItem = {
      timestamp: memory.utterance.timestamp.toISOString(),
      role: memory.utterance.source.includes('user') ? 'user' : 'agent',
      text: memory.utterance.text
    };
    await this.saveUtterance(memory.utterance.source, simpleItem);
  }

  async getMemory(id: string): Promise<MemoryItem | null> {
    const memories = await this.getAllMemories();
    return memories.find(m => m.id === id) || null;
  }

  async getAllMemories(): Promise<MemoryItem[]> {
    // This is a simplified implementation that gets all memories from all agents
    const files = await fs.readdir(DATA_DIR);
    const utteranceFiles = files.filter(f => f.endsWith('.utterances.json'));
    
    const allMemories: MemoryItem[] = [];
    for (const file of utteranceFiles) {
      const agentId = file.replace('.utterances.json', '');
      const simpleMemories = await this.getUtterances(agentId);
      
      // Convert SimpleMemoryItem back to MemoryItem for legacy compatibility
      const convertedMemories = simpleMemories.map((simple, index) => ({
        id: `${agentId}-${index}`,
        utterance: {
          id: `${agentId}-utterance-${index}`,
          text: simple.text,
          timestamp: new Date(simple.timestamp),
          source: agentId,
          tags: []
        },
        importance: 0.5,
        accessCount: 0,
        lastAccessed: new Date(simple.timestamp),
        createdAt: new Date(simple.timestamp),
        motifs: []
      }));
      
      allMemories.push(...convertedMemories);
    }
    
    return allMemories;
  }

  async getMemoriesBySource(source: string): Promise<MemoryItem[]> {
    const simpleMemories = await this.getUtterances(source);
    
    // Convert SimpleMemoryItem back to MemoryItem for legacy compatibility
    return simpleMemories.map((simple, index) => ({
      id: `${source}-${index}`,
      utterance: {
        id: `${source}-utterance-${index}`,
        text: simple.text,
        timestamp: new Date(simple.timestamp),
        source: source,
        tags: []
      },
      importance: 0.5,
      accessCount: 0,
      lastAccessed: new Date(simple.timestamp),
      createdAt: new Date(simple.timestamp),
      motifs: []
    }));
  }

  async getMemoriesByTimeRange(start: Date, end: Date): Promise<MemoryItem[]> {
    const memories = await this.getAllMemories();
    return memories.filter(m => 
      m.utterance.timestamp >= start && m.utterance.timestamp <= end
    );
  }

  async deleteMemory(id: string): Promise<void> {
    const memories = await this.getAllMemories();
    const memory = memories.find(m => m.id === id);
    if (memory) {
      const agentId = memory.utterance.source;
      const currentMemories = await this.getUtterances(agentId);
      // For simple memories, we can't easily delete by ID, so we'll clear all
      // This is a limitation of the simplified structure
      await this.clear(agentId);
    }
  }

  async clearAllMemories(): Promise<void> {
    const files = await fs.readdir(DATA_DIR);
    const utteranceFiles = files.filter(f => f.endsWith('.utterances.json'));
    
    for (const file of utteranceFiles) {
      const agentId = file.replace('.utterances.json', '');
      await this.clear(agentId);
    }
  }

  async saveMotif(motif: any): Promise<void> {
    // Simplified motif storage - store in a separate file
    const motifFile = path.join(DATA_DIR, 'motifs.json');
    try {
      const text = await fs.readFile(motifFile, "utf-8");
      const motifs = JSON.parse(text);
      motifs.push(motif);
      await fs.writeFile(motifFile, JSON.stringify(motifs, null, 2), "utf-8");
    } catch {
      await fs.writeFile(motifFile, JSON.stringify([motif], null, 2), "utf-8");
    }
  }

  async getMotifs(): Promise<any[]> {
    const motifFile = path.join(DATA_DIR, 'motifs.json');
    try {
      const text = await fs.readFile(motifFile, "utf-8");
      const data = JSON.parse(text) as any[];
      
      // Convert date strings back to Date objects
      return data.map(motif => ({
        ...motif,
        firstSeen: new Date(motif.firstSeen),
        lastSeen: new Date(motif.lastSeen)
      }));
    } catch {
      return [];
    }
  }

  async updateMotif(motif: any): Promise<void> {
    await this.saveMotif(motif);
  }

  async deleteMotif(id: string): Promise<void> {
    const motifFile = path.join(DATA_DIR, 'motifs.json');
    try {
      const text = await fs.readFile(motifFile, "utf-8");
      const motifs = JSON.parse(text);
      const filteredMotifs = motifs.filter((m: any) => m.id !== id);
      await fs.writeFile(motifFile, JSON.stringify(filteredMotifs, null, 2), "utf-8");
    } catch {
      // File doesn't exist or is invalid, nothing to delete
    }
  }
} 