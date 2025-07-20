import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('MemoryManager - Simple Tests', () => {
  let manager: MemoryManager;
  let store: FileStore;

  beforeEach(async () => {
    store = new FileStore();
    manager = new MemoryManager(store, 'test-agent');
    await manager.init();
  });

  afterEach(async () => {
    try {
      await fs.rm(path.resolve(__dirname, '../../.memdata'), { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should ingest user and agent utterances', async () => {
    await manager.ingestUtterance('user', 'Hello, how are you?');
    await manager.ingestUtterance('agent', 'I am doing well, thank you for asking!');

    const utterances = await store.getUtterances('test-agent');
    expect(utterances.length).toBe(2);
    expect(utterances[0].role).toBe('user');
    expect(utterances[0].text).toBe('Hello, how are you?');
    expect(utterances[1].role).toBe('agent');
    expect(utterances[1].text).toBe('I am doing well, thank you for asking!');
  });

  it('should generate summary with facts and emotions', async () => {
    await manager.ingestUtterance('user', 'I am happy today');
    await manager.ingestUtterance('agent', 'That is wonderful to hear');
    await manager.ingestUtterance('user', 'The weather is sunny');

    const summary = await manager.generateSummary();
    
    expect(summary.timestamp).toBeDefined();
    expect(summary.facts).toBeDefined();
    expect(summary.emotions).toBeDefined();
    expect(summary.motifs).toBeDefined();
    expect(Array.isArray(summary.motifs)).toBe(true);
  });

  it('should extract motifs from repeated patterns', async () => {
    await manager.ingestUtterance('user', 'I love being here');
    await manager.ingestUtterance('agent', 'It is great being here');
    await manager.ingestUtterance('user', 'Being here is amazing');

    const summary = await manager.generateSummary();
    expect(summary.motifs).toContain('being here');
  });

  it('should generate rehydration prompt', async () => {
    await manager.ingestUtterance('user', 'I am happy today');
    await manager.ingestUtterance('agent', 'That is wonderful');

    const prompt = await manager.getRehydrationPrompt();
    expect(prompt).toContain('This agent remembers the following:');
    expect(prompt).toContain('Facts:');
    expect(prompt).toContain('Emotional tones:');
  });

  it('should return empty prompt when no summary exists', async () => {
    const prompt = await manager.getRehydrationPrompt();
    expect(prompt).toBe('');
  });

  it('should wipe all data for agent', async () => {
    await manager.ingestUtterance('user', 'Hello');
    await manager.ingestUtterance('agent', 'Hi there');

    await manager.wipe();

    const utterances = await store.getUtterances('test-agent');
    expect(utterances.length).toBe(0);
  });
}); 