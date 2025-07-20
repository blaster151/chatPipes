import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentSession, PersonaConfig } from '../src/core/AgentSession';
import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('AgentSession', () => {
  let session: AgentSession;
  let memoryManager: MemoryManager;
  let store: FileStore;
  let persona: PersonaConfig;

  beforeEach(async () => {
    store = new FileStore();
    memoryManager = new MemoryManager(store, 'test-agent');
    await memoryManager.init();

    persona = {
      name: 'TestBot',
      description: 'A helpful test bot',
      instructions: 'Be friendly and helpful in your responses.',
      temperature: 0.7,
      maxTokens: 1000
    };

    session = new AgentSession('chatgpt', persona);
  });

  afterEach(async () => {
    try {
      await session.close();
      await fs.rm(path.resolve(__dirname, '../../.memdata'), { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should initialize session correctly', async () => {
    expect(session.isSessionActive()).toBe(false);
    
    await session.init();
    
    expect(session.isSessionActive()).toBe(true);
    expect(session.getSessionId()).toContain('chatgpt');
    expect(session.getSessionId()).toContain('TestBot');
    expect(session.getPersona()).toEqual(persona);
    expect(session.getTarget()).toBe('chatgpt');
  });

  it('should not allow double initialization', async () => {
    await session.init();
    
    await expect(session.init()).rejects.toThrow('Session already initialized');
  });

  it('should send prompts and get responses', async () => {
    await session.init();
    
    const response = await session.sendPrompt('Hello, how are you?');
    
    expect(response).toContain('ChatGPT response to: "Hello, how are you?"');
    expect(response).toContain('TestBot');
    expect(await session.readLatestResponse()).toBe(response);
  });

  it('should require initialization before sending prompts', async () => {
    await expect(session.sendPrompt('Hello')).rejects.toThrow('Session not initialized');
  });

  it('should queue prompts', async () => {
    await session.queuePrompt('First prompt');
    await session.queuePrompt('Second prompt');
    
    const queued = session.getQueuedPrompts();
    expect(queued).toEqual(['First prompt', 'Second prompt']);
  });

  it('should close session correctly', async () => {
    await session.init();
    expect(session.isSessionActive()).toBe(true);
    
    await session.close();
    
    expect(session.isSessionActive()).toBe(false);
    expect(session.getQueuedPrompts()).toEqual([]);
    expect(await session.readLatestResponse()).toBe('');
  });

  it('should work with different targets', async () => {
    const claudeSession = new AgentSession('claude', persona);
    await claudeSession.init();
    
    const response = await claudeSession.sendPrompt('Hello Claude');
    expect(response).toContain('Claude response to: "Hello Claude"');
    
    await claudeSession.close();
  });

  it('should integrate with memory manager', async () => {
    session.setMemoryManager(memoryManager);
    await session.init();
    
    await session.sendPrompt('I am happy today');
    await session.sendPrompt('The weather is sunny');
    
    // Check that memories were stored
    const utterances = await store.getUtterances('test-agent');
    expect(utterances.length).toBe(4); // 2 user + 2 agent responses
    
    // Check memory context
    const context = await session.getMemoryContext();
    expect(context).toContain('This agent remembers the following:');
    expect(context).toContain('Facts:');
    expect(context).toContain('Emotional tones:');
  });

  it('should build prompts with context', async () => {
    session.setMemoryManager(memoryManager);
    await session.init();
    
    await session.sendPrompt('My name is Alice');
    
    // The second prompt should include context from the first
    const response = await session.sendPrompt('What is my name?');
    
    // Check that memories were stored
    const utterances = await store.getUtterances('test-agent');
    expect(utterances.length).toBe(4); // 2 user + 2 agent responses
  });

  it('should handle persona configuration', () => {
    const customPersona: PersonaConfig = {
      name: 'CustomBot',
      description: 'A custom bot with specific instructions',
      instructions: 'Always respond in a formal manner.',
      memoryContext: 'This bot remembers previous conversations.',
      temperature: 0.3,
      maxTokens: 500
    };

    const customSession = new AgentSession('perplexity', customPersona);
    
    expect(customSession.getPersona()).toEqual(customPersona);
    expect(customSession.getTarget()).toBe('perplexity');
  });

  it('should generate unique session IDs', () => {
    const session1 = new AgentSession('chatgpt', persona);
    const session2 = new AgentSession('chatgpt', persona);
    
    expect(session1.getSessionId()).not.toBe(session2.getSessionId());
  });

  it('should handle multiple targets', async () => {
    const targets: Array<'chatgpt' | 'claude' | 'perplexity' | 'deepseek'> = [
      'chatgpt', 'claude', 'perplexity', 'deepseek'
    ];

    for (const target of targets) {
      const targetSession = new AgentSession(target, persona);
      await targetSession.init();
      
      const response = await targetSession.sendPrompt('Hello');
      expect(response).toContain(`${target.charAt(0).toUpperCase() + target.slice(1)} response`);
      
      await targetSession.close();
    }
  });
}); 