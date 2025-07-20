import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';
import { DefaultSummarizer } from '../src/core/DefaultSummarizer';
import { DefaultMotifDetector } from '../src/core/DefaultMotifDetector';
import { DefaultEmotionalAnalyzer } from '../src/core/DefaultEmotionalAnalyzer';
import { MemoryItem } from '../src/core/types';

describe('MemoryManager', () => {
  let manager: MemoryManager;
  let storage: FileStore;

  beforeEach(async () => {
    storage = new FileStore();
    
    manager = new MemoryManager(
      storage,
      new DefaultSummarizer(),
      new DefaultMotifDetector(),
      new DefaultEmotionalAnalyzer(),
      {
        maxMemorySize: 10,
        summarizationThreshold: 5,
        motifDetectionThreshold: 2,
        emotionalTrackingEnabled: true,
        motifTrackingEnabled: true
      },
      'test-persona'
    );

    await manager.initialize();
  });

  afterEach(async () => {
    await storage.clearAllMemories();
  });

  describe('ingestUtterance', () => {
    it('should create a memory item with correct structure', async () => {
      const memory = await manager.ingestUtterance(
        'Hello world',
        'test-agent',
        ['greeting'],
        { context: 'test' }
      );

      expect(memory).toBeDefined();
      expect(memory.id).toBeDefined();
      expect(memory.utterance.text).toBe('Hello world');
      expect(memory.utterance.source).toBe('test-agent');
      expect(memory.utterance.tags).toEqual(['greeting']);
      expect(memory.utterance.metadata).toEqual({ context: 'test' });
      expect(memory.importance).toBeGreaterThan(0);
      expect(memory.importance).toBeLessThanOrEqual(1);
      expect(memory.accessCount).toBe(0);
      expect(memory.createdAt).toBeInstanceOf(Date);
      expect(memory.lastAccessed).toBeInstanceOf(Date);
    });

    it('should analyze emotional tone when enabled', async () => {
      const memory = await manager.ingestUtterance(
        'I am very happy today!',
        'test-agent'
      );

      expect(memory.utterance.emotionalTone).toBeDefined();
      expect(memory.utterance.emotionalTone!.valence).toBeGreaterThan(0);
      expect(memory.utterance.emotionalTone!.confidence).toBeGreaterThan(0);
    });

    it('should calculate importance based on content', async () => {
      const happyMemory = await manager.ingestUtterance(
        'I am very happy today!',
        'test-agent',
        ['positive', 'emotion']
      );

      const neutralMemory = await manager.ingestUtterance(
        'The weather is okay.',
        'test-agent'
      );

      expect(happyMemory.importance).toBeGreaterThan(neutralMemory.importance);
    });
  });

  describe('getMemory', () => {
    it('should retrieve a memory by ID', async () => {
      const originalMemory = await manager.ingestUtterance(
        'Test memory',
        'test-agent'
      );

      const retrievedMemory = await manager.getMemory(originalMemory.id);
      
      expect(retrievedMemory).toBeDefined();
      expect(retrievedMemory!.id).toBe(originalMemory.id);
      expect(retrievedMemory!.utterance.text).toBe('Test memory');
    });

    it('should return null for non-existent memory', async () => {
      const memory = await manager.getMemory('non-existent-id');
      expect(memory).toBeNull();
    });

    it('should increment access count when retrieving memory', async () => {
      const memory = await manager.ingestUtterance(
        'Test memory',
        'test-agent'
      );

      expect(memory.accessCount).toBe(0);

      await manager.getMemory(memory.id);
      const retrievedMemory = await manager.getMemory(memory.id);
      
      expect(retrievedMemory!.accessCount).toBe(2);
    });
  });

  describe('queryMemories', () => {
    beforeEach(async () => {
      await manager.ingestUtterance('Memory 1', 'agentA', ['tag1']);
      await manager.ingestUtterance('Memory 2', 'agentB', ['tag2']);
      await manager.ingestUtterance('Memory 3', 'agentA', ['tag1', 'tag3']);
    });

    it('should filter by source', async () => {
      const result = await manager.queryMemories({ source: 'agentA' });
      
      expect(result.memories.length).toBe(2);
      expect(result.memories.every(m => m.utterance.source === 'agentA')).toBe(true);
    });

    it('should filter by tags', async () => {
      const result = await manager.queryMemories({ tags: ['tag1'] });
      
      expect(result.memories.length).toBe(2);
      expect(result.memories.every(m => m.utterance.tags!.includes('tag1'))).toBe(true);
    });

    it('should support pagination', async () => {
      const result = await manager.queryMemories({ limit: 2, offset: 0 });
      
      expect(result.memories.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('getSummary', () => {
    beforeEach(async () => {
      await manager.ingestUtterance('Happy memory', 'agentA');
      await manager.ingestUtterance('Sad memory', 'agentB');
      await manager.ingestUtterance('Another happy memory', 'agentA');
    });

    it('should generate summary with correct statistics', async () => {
      const summary = await manager.getSummary();
      
      expect(summary.totalMemories).toBe(3);
      expect(summary.recentMemories).toBe(3);
      expect(summary.averageImportance).toBeGreaterThan(0);
      expect(summary.sources.length).toBe(2);
      expect(summary.timeRange.earliest).toBeInstanceOf(Date);
      expect(summary.timeRange.latest).toBeInstanceOf(Date);
    });

    it('should include source breakdown', async () => {
      const summary = await manager.getSummary();
      
      const agentASource = summary.sources.find(s => s.source === 'agentA');
      const agentBSource = summary.sources.find(s => s.source === 'agentB');
      
      expect(agentASource!.count).toBe(2);
      expect(agentBSource!.count).toBe(1);
    });
  });

  describe('summarizeFacts', () => {
    it('should generate factual summary', async () => {
      await manager.ingestUtterance('Important fact 1', 'agentA');
      await manager.ingestUtterance('Important fact 2', 'agentB');
      
      const facts = await manager.summarizeFacts();
      
      expect(typeof facts).toBe('string');
      expect(facts.length).toBeGreaterThan(0);
      expect(facts).toContain('agentA');
      expect(facts).toContain('agentB');
    });
  });

  describe('summarizeEmotions', () => {
    it('should generate emotional summary', async () => {
      await manager.ingestUtterance('I am very happy today!', 'agentA');
      await manager.ingestUtterance('I am sad and disappointed', 'agentB');
      
      const emotions = await manager.summarizeEmotions();
      
      expect(typeof emotions).toBe('string');
      expect(emotions.length).toBeGreaterThan(0);
    });
  });

  describe('getMotifs', () => {
    it('should detect motifs from repeated patterns', async () => {
      await manager.ingestUtterance('I love working on this project', 'agentA');
      await manager.ingestUtterance('I love working on this codebase', 'agentA');
      await manager.ingestUtterance('I love working on this system', 'agentA');
      
      const motifs = await manager.getMotifs();
      
      expect(motifs.length).toBeGreaterThan(0);
      expect(motifs.some(m => m.pattern.includes('love working'))).toBe(true);
    });
  });

  describe('deleteMemory', () => {
    it('should delete a memory by ID', async () => {
      const memory = await manager.ingestUtterance('Test memory', 'test-agent');
      
      await manager.deleteMemory(memory.id);
      
      const retrievedMemory = await manager.getMemory(memory.id);
      expect(retrievedMemory).toBeNull();
    });
  });

  describe('clearAllMemories', () => {
    it('should clear all memories', async () => {
      await manager.ingestUtterance('Memory 1', 'agentA');
      await manager.ingestUtterance('Memory 2', 'agentB');
      
      await manager.clearAllMemories();
      
      const result = await manager.queryMemories({});
      expect(result.memories.length).toBe(0);
    });
  });
}); 