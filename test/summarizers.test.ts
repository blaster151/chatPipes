import { describe, it, expect } from 'vitest';
import { summarizeFacts, extractKeyFacts, summarizeByTopic } from '../src/core/summarizers/summarizeFacts';
import { summarizeEmotions, analyzeEmotionalTrends, getEmotionalProfile } from '../src/core/summarizers/summarizeEmotions';
import { MemoryItem, Utterance, EmotionalTone } from '../src/core/types';

describe('Summarizers', () => {
  describe('summarizeFacts', () => {
    it('should return message for empty memories', () => {
      const result = summarizeFacts([]);
      expect(result).toBe('No memories to summarize.');
    });

    it('should summarize memories by source', () => {
      const memories: MemoryItem[] = [
        createMemory('Hello from agent A', 'agentA', ['greeting']),
        createMemory('Hello from agent B', 'agentB', ['greeting']),
        createMemory('Another from agent A', 'agentA', ['info'])
      ];

      const result = summarizeFacts(memories);
      
      expect(result).toContain('agentA has 2 total memories');
      expect(result).toContain('agentB has 1 total memories');
    });

    it('should extract key facts from important memories', () => {
      const memories: MemoryItem[] = [
        createMemory('Important fact 1', 'agentA', [], 0.8),
        createMemory('Important fact 2', 'agentB', [], 0.9),
        createMemory('Less important fact', 'agentA', [], 0.3)
      ];

      const facts = extractKeyFacts(memories);
      
      expect(facts.length).toBe(2);
      expect(facts[0]).toContain('Important fact 1');
      expect(facts[1]).toContain('Important fact 2');
    });

    it('should summarize by topic using tags', () => {
      const memories: MemoryItem[] = [
        createMemory('Work related 1', 'agentA', ['work']),
        createMemory('Work related 2', 'agentA', ['work']),
        createMemory('Personal note', 'agentA', ['personal'])
      ];

      const topics = summarizeByTopic(memories);
      
      expect(topics.has('work')).toBe(true);
      expect(topics.has('personal')).toBe(true);
      expect(topics.get('work')!.length).toBe(2);
      expect(topics.get('personal')!.length).toBe(1);
    });
  });

  describe('summarizeEmotions', () => {
    it('should return message for empty memories', () => {
      const result = summarizeEmotions([]);
      expect(result).toBe('No emotional data to summarize.');
    });

    it('should return message for memories without emotional data', () => {
      const memories: MemoryItem[] = [
        createMemory('No emotion here', 'agentA')
      ];

      const result = summarizeEmotions(memories);
      expect(result).toBe('No emotional tone data available.');
    });

    it('should summarize emotional state', () => {
      const memories: MemoryItem[] = [
        createMemory('I am very happy!', 'agentA', [], 0.5, {
          valence: 0.8,
          arousal: 0.6,
          dominance: 0.7,
          primaryEmotion: 'joy',
          confidence: 0.9
        }),
        createMemory('I am sad', 'agentB', [], 0.5, {
          valence: -0.7,
          arousal: 0.3,
          dominance: 0.2,
          primaryEmotion: 'sadness',
          confidence: 0.8
        })
      ];

      const result = summarizeEmotions(memories);
      
      expect(result).toContain('Overall emotional state');
      expect(result).toContain('joy');
      expect(result).toContain('sadness');
    });

    it('should analyze emotional trends', () => {
      const memories: MemoryItem[] = [
        createMemory('Sad first', 'agentA', [], 0.5, {
          valence: -0.5,
          arousal: 0.3,
          dominance: 0.2,
          confidence: 0.8
        }),
        createMemory('Happy later', 'agentA', [], 0.5, {
          valence: 0.8,
          arousal: 0.6,
          dominance: 0.7,
          confidence: 0.9
        })
      ];

      const trends = analyzeEmotionalTrends(memories);
      
      expect(trends.trend).toBe('improving');
      expect(trends.confidence).toBeGreaterThan(0);
      expect(trends.details).toContain('improved');
    });

    it('should get emotional profile', () => {
      const memories: MemoryItem[] = [
        createMemory('Happy message', 'agentA', [], 0.5, {
          valence: 0.8,
          arousal: 0.6,
          dominance: 0.7,
          primaryEmotion: 'joy',
          confidence: 0.9
        }),
        createMemory('Another happy message', 'agentA', [], 0.5, {
          valence: 0.7,
          arousal: 0.5,
          dominance: 0.6,
          primaryEmotion: 'joy',
          confidence: 0.8
        })
      ];

      const profile = getEmotionalProfile(memories);
      
      expect(profile.dominantEmotions.length).toBeGreaterThan(0);
      expect(profile.dominantEmotions[0].emotion).toBe('joy');
      expect(profile.emotionalRange.average).toBeGreaterThan(0);
      expect(profile.emotionalStability).toBeGreaterThan(0);
    });
  });
});

function createMemory(
  text: string, 
  source: string, 
  tags: string[] = [], 
  importance: number = 0.5,
  emotionalTone?: EmotionalTone
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
    importance,
    accessCount: 0,
    lastAccessed: new Date(),
    createdAt: new Date(),
    motifs: []
  };
} 