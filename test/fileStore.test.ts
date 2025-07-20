import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileStore } from '../src/storage/FileStore';
import { MemoryItem, MemorySummary, Utterance } from '../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('FileStore', () => {
  let store: FileStore;

  beforeEach(async () => {
    store = new FileStore();
    await store.init();
  });

  afterEach(async () => {
    try {
      await fs.rm(path.resolve(__dirname, '../../.memdata'), { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('init', () => {
    it('should create data directory', async () => {
      const dataDir = path.resolve(__dirname, '../../.memdata');
      const dirExists = await fs.access(dataDir).then(() => true).catch(() => false);
      
      expect(dirExists).toBe(true);
    });
  });

  describe('saveUtterance and getUtterances', () => {
    it('should save and retrieve utterances for an agent', async () => {
      const memory1 = createMemory('Hello from agent A', 'agentA');
      const memory2 = createMemory('Hello from agent B', 'agentB');
      const memory3 = createMemory('Another from agent A', 'agentA');

      await store.saveUtterance('agentA', memory1);
      await store.saveUtterance('agentB', memory2);
      await store.saveUtterance('agentA', memory3);

      const agentAMemories = await store.getUtterances('agentA');
      const agentBMemories = await store.getUtterances('agentB');

      expect(agentAMemories.length).toBe(2);
      expect(agentBMemories.length).toBe(1);
      expect(agentAMemories.every(m => m.utterance.source === 'agentA')).toBe(true);
      expect(agentBMemories.every(m => m.utterance.source === 'agentB')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const memory1 = createMemory('Memory 1', 'agentA');
      const memory2 = createMemory('Memory 2', 'agentA');
      const memory3 = createMemory('Memory 3', 'agentA');

      await store.saveUtterance('agentA', memory1);
      await store.saveUtterance('agentA', memory2);
      await store.saveUtterance('agentA', memory3);

      const limitedMemories = await store.getUtterances('agentA', 2);
      expect(limitedMemories.length).toBe(2);
    });
  });

  describe('saveSummary and getLatestSummary', () => {
    it('should save and retrieve summary for an agent', async () => {
      const summary: MemorySummary = {
        totalMemories: 5,
        recentMemories: 3,
        averageImportance: 0.7,
        dominantEmotions: [
          { emotion: 'joy', frequency: 0.6, averageValence: 0.8 }
        ],
        topMotifs: [
          { motif: 'hello world', frequency: 3 }
        ],
        sources: [
          { source: 'agentA', count: 5 }
        ],
        timeRange: {
          earliest: new Date('2023-01-01'),
          latest: new Date('2023-01-02')
        }
      };

      await store.saveSummary('agentA', summary);
      const retrievedSummary = await store.getLatestSummary('agentA');

      expect(retrievedSummary).toBeDefined();
      expect(retrievedSummary!.totalMemories).toBe(5);
      expect(retrievedSummary!.dominantEmotions[0].emotion).toBe('joy');
    });

    it('should return null for non-existent summary', async () => {
      const summary = await store.getLatestSummary('non-existent-agent');
      expect(summary).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear memories for specific agent', async () => {
      const memory1 = createMemory('Memory from agent A', 'agentA');
      const memory2 = createMemory('Memory from agent B', 'agentB');

      await store.saveUtterance('agentA', memory1);
      await store.saveUtterance('agentB', memory2);

      await store.clear('agentA');

      const agentAMemories = await store.getUtterances('agentA');
      const agentBMemories = await store.getUtterances('agentB');

      expect(agentAMemories.length).toBe(0);
      expect(agentBMemories.length).toBe(1);
    });
  });

  describe('legacy methods', () => {
    it('should support legacy saveMemory method', async () => {
      const memory = createMemory('Test memory', 'agentA');
      await store.saveMemory(memory);

      const retrievedMemory = await store.getMemory(memory.id);
      expect(retrievedMemory).toBeDefined();
      expect(retrievedMemory!.utterance.text).toBe('Test memory');
    });

    it('should support legacy getAllMemories method', async () => {
      const memory1 = createMemory('Memory 1', 'agentA');
      const memory2 = createMemory('Memory 2', 'agentB');

      await store.saveMemory(memory1);
      await store.saveMemory(memory2);

      const allMemories = await store.getAllMemories();
      expect(allMemories.length).toBe(2);
    });
  });
});

function createMemory(text: string, source: string): MemoryItem {
  const utterance: Utterance = {
    id: `test-${Date.now()}`,
    text,
    timestamp: new Date(),
    source,
    tags: []
  };

  return {
    id: `memory-${Date.now()}`,
    utterance,
    importance: 0.5,
    accessCount: 0,
    lastAccessed: new Date(),
    createdAt: new Date(),
    motifs: []
  };
} 