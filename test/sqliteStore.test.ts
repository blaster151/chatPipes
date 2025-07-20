import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteStore } from '../src/storage/SqliteStore';
import { MemoryItem, MemorySummary, Utterance } from '../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('SqliteStore', () => {
  let store: SqliteStore;
  const testDbPath = './test-data-sqlite.db';

  beforeEach(async () => {
    store = new SqliteStore(testDbPath);
    await store.init();
  });

  afterEach(async () => {
    store.close();
    try {
      await fs.unlink(testDbPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('init', () => {
    it('should create database tables', async () => {
      // The init method should create tables without throwing errors
      // We can verify this by trying to save data
      const memory = createMemory('Test memory', 'agentA');
      await store.saveUtterance('agentA', memory);
      
      const retrievedMemories = await store.getUtterances('agentA');
      expect(retrievedMemories.length).toBe(1);
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

    it('should handle emotional tone data', async () => {
      const memory = createMemory('I am very happy!', 'agentA', [], {
        valence: 0.8,
        arousal: 0.6,
        dominance: 0.7,
        primaryEmotion: 'joy',
        confidence: 0.9
      });

      await store.saveUtterance('agentA', memory);
      const retrievedMemories = await store.getUtterances('agentA');

      expect(retrievedMemories.length).toBe(1);
      expect(retrievedMemories[0].utterance.emotionalTone).toBeDefined();
      expect(retrievedMemories[0].utterance.emotionalTone!.valence).toBe(0.8);
      expect(retrievedMemories[0].utterance.emotionalTone!.primaryEmotion).toBe('joy');
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

    it('should handle multiple summaries for same agent', async () => {
      const summary1: MemorySummary = {
        totalMemories: 1,
        recentMemories: 1,
        averageImportance: 0.5,
        dominantEmotions: [],
        topMotifs: [],
        sources: [{ source: 'agentA', count: 1 }],
        timeRange: {
          earliest: new Date('2023-01-01'),
          latest: new Date('2023-01-01')
        }
      };

      const summary2: MemorySummary = {
        totalMemories: 2,
        recentMemories: 2,
        averageImportance: 0.6,
        dominantEmotions: [],
        topMotifs: [],
        sources: [{ source: 'agentA', count: 2 }],
        timeRange: {
          earliest: new Date('2023-01-01'),
          latest: new Date('2023-01-02')
        }
      };

      await store.saveSummary('agentA', summary1);
      await store.saveSummary('agentA', summary2);

      const latestSummary = await store.getLatestSummary('agentA');
      expect(latestSummary!.totalMemories).toBe(2);
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

    it('should support motif operations', async () => {
      const motif = {
        id: 'test-motif-1',
        pattern: 'hello world',
        frequency: 3,
        firstSeen: new Date(),
        lastSeen: new Date(),
        relatedMemories: ['memory-1', 'memory-2'],
        strength: 0.8
      };

      await store.saveMotif(motif);
      const motifs = await store.getMotifs();

      expect(motifs.length).toBe(1);
      expect(motifs[0].pattern).toBe('hello world');
      expect(motifs[0].frequency).toBe(3);
    });
  });
});

function createMemory(
  text: string, 
  source: string, 
  tags: string[] = [],
  emotionalTone?: any
): MemoryItem {
  const utterance: Utterance = {
    id: `test-${Date.now()}`,
    text,
    timestamp: new Date(),
    source,
    tags,
    emotionalTone
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