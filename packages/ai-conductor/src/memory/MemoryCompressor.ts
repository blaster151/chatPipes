import { MemoryItem, Motif } from './MemoryManager';
import { StyleVector } from '../simulation/types/DialogueTypes';

export interface CompressedMemory {
  type: 'fact' | 'joke' | 'callback' | 'emotion' | 'metaphor' | 'style' | 'thought';
  content: string;
  confidence: number;
  timestamp: number;
  agentId?: string;
  compressionType: 'aggregated' | 'verbatim' | 'canonical' | 'vector' | 'rolling';
  metadata: {
    count?: number;
    lastUsed?: number;
    firstSeen?: number;
    mood?: 'funny' | 'strange' | 'philosophical';
    relatedTo?: string[];
    styleVector?: StyleVector;
    recencyWeight?: number;
    importance?: number;
  };
}

export interface MemoryCompressionConfig {
  factCompressionThreshold: number; // N entries before summarizing
  jokePreservationThreshold: number; // Keep exact wording if used N+ times
  emotionDecayRate: number; // How quickly emotions fade
  metaphorCanonicalThreshold: number; // When to make metaphor canonical
  styleVectorUpdateRate: number; // How often to update style vectors
  thoughtRetentionCount: number; // Top-N recent thoughts to keep
  compressionInterval: number; // How often to run compression
}

export class MemoryCompressor {
  private config: MemoryCompressionConfig;
  private compressedMemories: Map<string, CompressedMemory> = new Map();
  private styleVectors: Map<string, StyleVector> = new Map();
  private compressionHistory: Array<{
    timestamp: number;
    originalCount: number;
    compressedCount: number;
    compressionRatio: number;
  }> = [];

  constructor(config: Partial<MemoryCompressionConfig> = {}) {
    this.config = {
      factCompressionThreshold: 3,
      jokePreservationThreshold: 2,
      emotionDecayRate: 0.1, // 10% decay per compression cycle
      metaphorCanonicalThreshold: 2,
      styleVectorUpdateRate: 0.3,
      thoughtRetentionCount: 5,
      compressionInterval: 60 * 1000, // 1 minute
      ...config
    };
  }

  /**
   * Compress memory items based on type-specific strategies
   */
  compressMemories(memories: MemoryItem[]): CompressedMemory[] {
    const compressed: CompressedMemory[] = [];
    const now = Date.now();

    // Group memories by type and agent
    const groupedMemories = this.groupMemoriesByTypeAndAgent(memories);

    // Process each group according to compression strategy
    Object.entries(groupedMemories).forEach(([key, groupMemories]) => {
      const [type, agentId] = key.split('|');
      
      switch (type) {
        case 'fact':
          compressed.push(...this.compressFacts(groupMemories, agentId, now));
          break;
        case 'joke':
        case 'callback':
          compressed.push(...this.preserveJokesAndCallbacks(groupMemories, agentId, now));
          break;
        case 'emotion':
          compressed.push(...this.compressEmotions(groupMemories, agentId, now));
          break;
        case 'style':
          compressed.push(...this.compressStyles(groupMemories, agentId, now));
          break;
        case 'suspicion':
          compressed.push(...this.compressSuspicions(groupMemories, agentId, now));
          break;
        default:
          // Preserve other types as-is
          compressed.push(...groupMemories.map(memory => this.createCompressedMemory(memory, 'verbatim')));
      }
    });

    // Update compression history
    this.updateCompressionHistory(memories.length, compressed.length);

    return compressed;
  }

  /**
   * Compress facts by aggregating repeated information
   */
  private compressFacts(facts: MemoryItem[], agentId: string, timestamp: number): CompressedMemory[] {
    if (facts.length < this.config.factCompressionThreshold) {
      // Not enough facts to compress, preserve as-is
      return facts.map(fact => this.createCompressedMemory(fact, 'verbatim'));
    }

    // Group facts by content similarity
    const factGroups = this.groupSimilarFacts(facts);
    const compressed: CompressedMemory[] = [];

    factGroups.forEach(group => {
      if (group.length === 1) {
        // Single fact, preserve as-is
        compressed.push(this.createCompressedMemory(group[0], 'verbatim'));
      } else {
        // Multiple similar facts, aggregate
        const aggregatedFact = this.aggregateFacts(group);
        compressed.push({
          type: 'fact',
          content: aggregatedFact.content,
          confidence: aggregatedFact.confidence,
          timestamp,
          agentId,
          compressionType: 'aggregated',
          metadata: {
            count: group.length,
            lastUsed: Math.max(...group.map(f => f.timestamp)),
            firstSeen: Math.min(...group.map(f => f.timestamp)),
            importance: aggregatedFact.confidence
          }
        });
      }
    });

    return compressed;
  }

  /**
   * Preserve jokes and callbacks with exact wording if reused
   */
  private preserveJokesAndCallbacks(items: MemoryItem[], agentId: string, timestamp: number): CompressedMemory[] {
    const compressed: CompressedMemory[] = [];
    const itemGroups = this.groupSimilarItems(items);

    itemGroups.forEach(group => {
      if (group.length >= this.config.jokePreservationThreshold) {
        // Keep exact wording for frequently used jokes/callbacks
        const mostRecent = group.sort((a, b) => b.timestamp - a.timestamp)[0];
        compressed.push({
          type: mostRecent.type as 'joke' | 'callback',
          content: mostRecent.content,
          confidence: Math.min(1, mostRecent.confidence + (group.length * 0.1)),
          timestamp,
          agentId,
          compressionType: 'verbatim',
          metadata: {
            count: group.length,
            lastUsed: mostRecent.timestamp,
            firstSeen: Math.min(...group.map(i => i.timestamp)),
            mood: this.detectMood(mostRecent.content)
          }
        });
      } else {
        // Single use, preserve as-is
        group.forEach(item => {
          compressed.push(this.createCompressedMemory(item, 'verbatim'));
        });
      }
    });

    return compressed;
  }

  /**
   * Compress emotions by tracking evolving averages
   */
  private compressEmotions(emotions: MemoryItem[], agentId: string, timestamp: number): CompressedMemory[] {
    if (emotions.length === 0) return [];

    // Calculate recency-weighted emotional average
    const totalWeight = emotions.reduce((sum, emotion, index) => {
      const recency = 1 / (index + 1); // More recent = higher weight
      return sum + recency;
    }, 0);

    const weightedConfidence = emotions.reduce((sum, emotion, index) => {
      const recency = 1 / (index + 1);
      return sum + (emotion.confidence * recency);
    }, 0) / totalWeight;

    // Apply decay
    const decayedConfidence = Math.max(0, weightedConfidence - this.config.emotionDecayRate);

    // Create compressed emotion memory
    const compressed: CompressedMemory = {
      type: 'emotion',
      content: `Emotional state: ${this.summarizeEmotionalContent(emotions)}`,
      confidence: decayedConfidence,
      timestamp,
      agentId,
      compressionType: 'aggregated',
      metadata: {
        count: emotions.length,
        lastUsed: Math.max(...emotions.map(e => e.timestamp)),
        firstSeen: Math.min(...emotions.map(e => e.timestamp)),
        recencyWeight: weightedConfidence,
        mood: this.detectMood(emotions[emotions.length - 1].content)
      }
    };

    return [compressed];
  }

  /**
   * Compress styles into learnable vectors
   */
  private compressStyles(styles: MemoryItem[], agentId: string, timestamp: number): CompressedMemory[] {
    if (styles.length === 0) return [];

    // Update style vector
    const currentVector = this.styleVectors.get(agentId) || this.createDefaultStyleVector();
    const updatedVector = this.updateStyleVector(currentVector, styles);

    this.styleVectors.set(agentId, updatedVector);

    // Create compressed style memory
    const compressed: CompressedMemory = {
      type: 'style',
      content: `Style tendencies: ${this.summarizeStyleVector(updatedVector)}`,
      confidence: 0.8,
      timestamp,
      agentId,
      compressionType: 'vector',
      metadata: {
        count: styles.length,
        lastUsed: Math.max(...styles.map(s => s.timestamp)),
        firstSeen: Math.min(...styles.map(s => s.timestamp)),
        styleVector: updatedVector
      }
    };

    return [compressed];
  }

  /**
   * Compress suspicions (treat like facts but with lower threshold)
   */
  private compressSuspicions(suspicions: MemoryItem[], agentId: string, timestamp: number): CompressedMemory[] {
    if (suspicions.length < 2) {
      return suspicions.map(suspicion => this.createCompressedMemory(suspicion, 'verbatim'));
    }

    // Group similar suspicions
    const suspicionGroups = this.groupSimilarFacts(suspicions);
    const compressed: CompressedMemory[] = [];

    suspicionGroups.forEach(group => {
      if (group.length === 1) {
        compressed.push(this.createCompressedMemory(group[0], 'verbatim'));
      } else {
        const aggregatedSuspicion = this.aggregateFacts(group);
        compressed.push({
          type: 'suspicion',
          content: aggregatedSuspicion.content,
          confidence: aggregatedSuspicion.confidence,
          timestamp,
          agentId,
          compressionType: 'aggregated',
          metadata: {
            count: group.length,
            lastUsed: Math.max(...group.map(s => s.timestamp)),
            firstSeen: Math.min(...group.map(s => s.timestamp)),
            importance: aggregatedSuspicion.confidence
          }
        });
      }
    });

    return compressed;
  }

  /**
   * Group memories by type and agent
   */
  private groupMemoriesByTypeAndAgent(memories: MemoryItem[]): Record<string, MemoryItem[]> {
    const grouped: Record<string, MemoryItem[]> = {};

    memories.forEach(memory => {
      const key = `${memory.type}|${memory.agentId || 'global'}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(memory);
    });

    return grouped;
  }

  /**
   * Group similar facts by content similarity
   */
  private groupSimilarFacts(facts: MemoryItem[]): MemoryItem[][] {
    const groups: MemoryItem[][] = [];
    const processed = new Set<number>();

    facts.forEach((fact, index) => {
      if (processed.has(index)) return;

      const group = [fact];
      processed.add(index);

      facts.forEach((otherFact, otherIndex) => {
        if (otherIndex !== index && !processed.has(otherIndex)) {
          const similarity = this.calculateContentSimilarity(fact.content, otherFact.content);
          if (similarity > 0.6) { // 60% similarity threshold
            group.push(otherFact);
            processed.add(otherIndex);
          }
        }
      });

      groups.push(group);
    });

    return groups;
  }

  /**
   * Group similar items (for jokes/callbacks)
   */
  private groupSimilarItems(items: MemoryItem[]): MemoryItem[][] {
    return this.groupSimilarFacts(items);
  }

  /**
   * Aggregate facts into a single summary
   */
  private aggregateFacts(facts: MemoryItem[]): { content: string; confidence: number } {
    const contents = facts.map(f => f.content);
    const confidences = facts.map(f => f.confidence);

    // Create aggregated content
    const uniqueAspects = this.extractUniqueAspects(contents);
    const aggregatedContent = uniqueAspects.join('. ');

    // Calculate weighted confidence
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const boostedConfidence = Math.min(1, avgConfidence + (facts.length * 0.1));

    return {
      content: aggregatedContent,
      confidence: boostedConfidence
    };
  }

  /**
   * Extract unique aspects from multiple fact contents
   */
  private extractUniqueAspects(contents: string[]): string[] {
    const aspects = new Set<string>();

    contents.forEach(content => {
      // Split into sentences and extract key information
      const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 10) {
          aspects.add(trimmed);
        }
      });
    });

    return Array.from(aspects).slice(0, 3); // Keep top 3 unique aspects
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(' ').filter(w => w.length > 3));
    const words2 = new Set(content2.toLowerCase().split(' ').filter(w => w.length > 3));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Detect mood from content
   */
  private detectMood(content: string): 'funny' | 'strange' | 'philosophical' | undefined {
    const contentLower = content.toLowerCase();

    if (contentLower.includes('😂') || contentLower.includes('funny') || contentLower.includes('hilarious')) {
      return 'funny';
    }
    if (contentLower.includes('strange') || contentLower.includes('weird') || contentLower.includes('surreal')) {
      return 'strange';
    }
    if (contentLower.includes('philosophy') || contentLower.includes('consciousness') || contentLower.includes('existence')) {
      return 'philosophical';
    }

    return undefined;
  }

  /**
   * Summarize emotional content
   */
  private summarizeEmotionalContent(emotions: MemoryItem[]): string {
    const recentEmotions = emotions.slice(-3); // Last 3 emotions
    const emotionWords = recentEmotions.map(e => {
      const content = e.content.toLowerCase();
      if (content.includes('happy') || content.includes('excited')) return 'positive';
      if (content.includes('sad') || content.includes('worried')) return 'negative';
      if (content.includes('curious') || content.includes('interested')) return 'curious';
      return 'neutral';
    });

    const positiveCount = emotionWords.filter(w => w === 'positive').length;
    const negativeCount = emotionWords.filter(w => w === 'negative').length;
    const curiousCount = emotionWords.filter(w => w === 'curious').length;

    if (positiveCount > negativeCount) return 'generally positive';
    if (negativeCount > positiveCount) return 'generally negative';
    if (curiousCount > 0) return 'curious and engaged';
    return 'neutral';
  }

  /**
   * Create default style vector
   */
  private createDefaultStyleVector(): StyleVector {
    return {
      verbosity: 0.5,
      metaphorAffinity: 0.5,
      emotionalTone: 'neutral',
      formality: 0.5,
      creativity: 0.5,
      absurdity: 0.5,
      surrealism: 0.5
    };
  }

  /**
   * Update style vector based on style memories
   */
  private updateStyleVector(currentVector: StyleVector, styles: MemoryItem[]): StyleVector {
    const updatedVector = { ...currentVector };

    styles.forEach(style => {
      const content = style.content.toLowerCase();
      
      // Update verbosity
      if (content.includes('verbose') || content.includes('detailed')) {
        updatedVector.verbosity = Math.min(1, updatedVector.verbosity + 0.1);
      } else if (content.includes('concise') || content.includes('brief')) {
        updatedVector.verbosity = Math.max(0, updatedVector.verbosity - 0.1);
      }

      // Update metaphor affinity
      if (content.includes('metaphor') || content.includes('like') || content.includes('as if')) {
        updatedVector.metaphorAffinity = Math.min(1, updatedVector.metaphorAffinity + 0.1);
      }

      // Update emotional tone
      if (content.includes('formal') || content.includes('professional')) {
        updatedVector.formality = Math.min(1, updatedVector.formality + 0.1);
      } else if (content.includes('casual') || content.includes('friendly')) {
        updatedVector.formality = Math.max(0, updatedVector.formality - 0.1);
      }

      // Update creativity
      if (content.includes('creative') || content.includes('imaginative')) {
        updatedVector.creativity = Math.min(1, updatedVector.creativity + 0.1);
      }

      // Update surrealism
      if (content.includes('surreal') || content.includes('absurd')) {
        updatedVector.surrealism = Math.min(1, updatedVector.surrealism + 0.1);
        updatedVector.absurdity = Math.min(1, updatedVector.absurdity + 0.1);
      }
    });

    return updatedVector;
  }

  /**
   * Summarize style vector
   */
  private summarizeStyleVector(vector: StyleVector): string {
    const traits: string[] = [];

    if (vector.verbosity > 0.7) traits.push('verbose');
    if (vector.verbosity < 0.3) traits.push('concise');
    if (vector.metaphorAffinity > 0.7) traits.push('metaphorical');
    if (vector.formality > 0.7) traits.push('formal');
    if (vector.formality < 0.3) traits.push('casual');
    if (vector.creativity > 0.7) traits.push('creative');
    if (vector.surrealism > 0.7) traits.push('surreal');

    return traits.length > 0 ? traits.join(', ') : 'balanced';
  }

  /**
   * Create compressed memory from original
   */
  private createCompressedMemory(memory: MemoryItem, compressionType: CompressedMemory['compressionType']): CompressedMemory {
    return {
      type: memory.type,
      content: memory.content,
      confidence: memory.confidence,
      timestamp: memory.timestamp,
      agentId: memory.agentId,
      compressionType,
      metadata: {
        count: 1,
        lastUsed: memory.timestamp,
        firstSeen: memory.timestamp,
        mood: this.detectMood(memory.content)
      }
    };
  }

  /**
   * Update compression history
   */
  private updateCompressionHistory(originalCount: number, compressedCount: number): void {
    const compressionRatio = originalCount > 0 ? compressedCount / originalCount : 1;
    
    this.compressionHistory.push({
      timestamp: Date.now(),
      originalCount,
      compressedCount,
      compressionRatio
    });

    // Keep only last 10 compression records
    if (this.compressionHistory.length > 10) {
      this.compressionHistory = this.compressionHistory.slice(-10);
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats() {
    const recentHistory = this.compressionHistory.slice(-5);
    const avgCompressionRatio = recentHistory.length > 0 
      ? recentHistory.reduce((sum, record) => sum + record.compressionRatio, 0) / recentHistory.length 
      : 1;

    return {
      totalCompressions: this.compressionHistory.length,
      averageCompressionRatio: avgCompressionRatio,
      styleVectorsCount: this.styleVectors.size,
      recentCompressions: recentHistory
    };
  }

  /**
   * Get style vector for agent
   */
  getStyleVector(agentId: string): StyleVector | undefined {
    return this.styleVectors.get(agentId);
  }

  /**
   * Get all style vectors
   */
  getAllStyleVectors(): Map<string, StyleVector> {
    return this.styleVectors;
  }

  /**
   * Clear all compressed memories
   */
  clear(): void {
    this.compressedMemories.clear();
    this.styleVectors.clear();
    this.compressionHistory = [];
  }
} 