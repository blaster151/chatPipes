import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileStore } from '../src/storage/FileStore';
import { MemoryItem, MemorySummary, Utterance, SimpleMemoryItem, SimpleMemorySummary } from '../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('FileStore - Simple Tests', () => {
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

  it('should save and retrieve utterances', async () => {
    const memory: SimpleMemoryItem = {
      timestamp: new Date().toISOString(),
      role: 'user',
      text: 'Hello world'
    };

    await store.saveUtterance('test-agent', memory);
    const retrieved = await store.getUtterances('test-agent');

    expect(retrieved.length).toBe(1);
    expect(retrieved[0].text).toBe('Hello world');
    expect(retrieved[0].role).toBe('user');
  });

  it('should save and retrieve summaries', async () => {
    const summary: SimpleMemorySummary = {
      timestamp: new Date().toISOString(),
      facts: 'The user is happy and the weather is sunny',
      emotions: 'Overall emotional state: joy, with 2 instances detected',
      motifs: ['being here', 'happy']
    };

    await store.saveSummary('test-agent', summary);
    const retrieved = await store.getLatestSummary('test-agent');

    expect(retrieved).toBeDefined();
    expect(retrieved!.facts).toBe('The user is happy and the weather is sunny');
    expect(retrieved!.emotions).toBe('Overall emotional state: joy, with 2 instances detected');
    expect(retrieved!.motifs).toEqual(['being here', 'happy']);
  });

  it('should handle multiple agents', async () => {
    const memory1: SimpleMemoryItem = {
      timestamp: new Date().toISOString(),
      role: 'user',
      text: 'Hello from agent A'
    };

    const memory2: SimpleMemoryItem = {
      timestamp: new Date().toISOString(),
      role: 'agent',
      text: 'Hello from agent B'
    };

    await store.saveUtterance('agentA', memory1);
    await store.saveUtterance('agentB', memory2);

    const agentAMemories = await store.getUtterances('agentA');
    const agentBMemories = await store.getUtterances('agentB');

    expect(agentAMemories.length).toBe(1);
    expect(agentBMemories.length).toBe(1);
    expect(agentAMemories[0].text).toBe('Hello from agent A');
    expect(agentBMemories[0].text).toBe('Hello from agent B');
  });

  it('should clear agent data', async () => {
    const memory: SimpleMemoryItem = {
      timestamp: new Date().toISOString(),
      role: 'user',
      text: 'Hello world'
    };

    await store.saveUtterance('test-agent', memory);
    await store.clear('test-agent');

    const retrieved = await store.getUtterances('test-agent');
    expect(retrieved.length).toBe(0);
  });

  it('should respect limit parameter', async () => {
    const memory1: SimpleMemoryItem = {
      timestamp: new Date().toISOString(),
      role: 'user',
      text: 'First message'
    };

    const memory2: SimpleMemoryItem = {
      timestamp: new Date().toISOString(),
      role: 'agent',
      text: 'Second message'
    };

    await store.saveUtterance('test-agent', memory1);
    await store.saveUtterance('test-agent', memory2);

    const limited = await store.getUtterances('test-agent', 1);
    expect(limited.length).toBe(1);
    expect(limited[0].text).toBe('Second message'); // Should get the most recent
  });
}); 