import { MemoryItem, Motif } from './MemoryManager';
import { MemoryBlob } from './MemoryCapper';

export interface CompactMemoryData {
  agentId: string;
  memories: Array<{
    type: MemoryItem['type'];
    content: string;
    confidence: number;
    timestamp?: number;
    tags?: string[];
  }>;
  motifs: Array<{
    phrase: string;
    timesUsed: number;
    lastSeen: number;
    mood?: string;
  }>;
  personaSummary: string;
  style: {
    verbosity: number;
    metaphorAffinity: number;
    formality: number;
    creativity?: number;
    surrealism?: number;
    emotionalTone?: string;
  };
  metadata?: {
    lastUpdated: number;
    memoryCount: number;
    motifCount: number;
    totalSize: number;
  };
}

export class MemoryUtils {
  /**
   * 1. Compaction function - Summarize facts and replace with single summary
   */
  static compactFacts(memories: MemoryItem[], agentId: string): { compacted: MemoryItem[], summary: string } {
    const facts = memories.filter(m => m.agentId === agentId && m.type === 'fact');
    
    if (facts.length === 0) {
      return { compacted: memories, summary: '' };
    }

    // Generate summary of facts
    const summary = MemoryUtils.summarizeFacts(facts);
    
    // Remove original facts and add summary as manual memory
    const compacted = memories.filter(m => m.type !== 'fact' || m.agentId !== agentId);
    
    const summaryMemory: MemoryItem = {
      agentId,
      type: 'fact',
      content: summary,
      confidence: Math.min(1, facts.reduce((sum, f) => sum + f.confidence, 0) / facts.length + 0.1),
      timestamp: Date.now(),
      tags: ['compacted', 'summary'],
      derivedFrom: 'fact-compaction'
    };
    
    compacted.push(summaryMemory);
    
    return { compacted, summary };
  }

  /**
   * Summarize facts into a coherent summary
   */
  private static summarizeFacts(facts: MemoryItem[]): string {
    if (facts.length === 0) return '';
    if (facts.length === 1) return facts[0].content;

    // Group facts by topic
    const topics = MemoryUtils.groupFactsByTopic(facts);
    
    const summaries: string[] = [];
    
    Object.entries(topics).forEach(([topic, topicFacts]) => {
      if (topicFacts.length === 1) {
        summaries.push(topicFacts[0].content);
      } else {
        // Summarize multiple facts about same topic
        const topicSummary = MemoryUtils.summarizeTopicFacts(topicFacts);
        summaries.push(topicSummary);
      }
    });

    return summaries.join('. ');
  }

  /**
   * Group facts by topic similarity
   */
  private static groupFactsByTopic(facts: MemoryItem[]): Record<string, MemoryItem[]> {
    const topics: Record<string, MemoryItem[]> = {};
    
    facts.forEach(fact => {
      const topic = MemoryUtils.extractTopic(fact.content);
      
      if (!topics[topic]) {
        topics[topic] = [];
      }
      topics[topic].push(fact);
    });

    return topics;
  }

  /**
   * Extract topic from fact content
   */
  private static extractTopic(content: string): string {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('work') || contentLower.includes('job') || contentLower.includes('profession')) {
      return 'work';
    }
    if (contentLower.includes('live') || contentLower.includes('home') || contentLower.includes('city')) {
      return 'location';
    }
    if (contentLower.includes('study') || contentLower.includes('education') || contentLower.includes('degree')) {
      return 'education';
    }
    if (contentLower.includes('like') || contentLower.includes('enjoy') || contentLower.includes('love')) {
      return 'preferences';
    }
    if (contentLower.includes('have') || contentLower.includes('own') || contentLower.includes('possess')) {
      return 'possessions';
    }
    
    return 'general';
  }

  /**
   * Summarize facts about the same topic
   */
  private static summarizeTopicFacts(facts: MemoryItem[]): string {
    const contents = facts.map(f => f.content);
    
    // Extract key information
    const keyInfo = MemoryUtils.extractKeyInformation(contents);
    
    // Combine into summary
    return keyInfo.join('. ');
  }

  /**
   * Extract key information from fact contents
   */
  private static extractKeyInformation(contents: string[]): string[] {
    const keyInfo: string[] = [];
    
    // Look for personal information
    const personalInfo = contents.filter(c => 
      c.toLowerCase().includes('i am') || 
      c.toLowerCase().includes('i\'m') || 
      c.toLowerCase().includes('my name')
    );
    
    if (personalInfo.length > 0) {
      keyInfo.push(personalInfo[0]);
    }
    
    // Look for work information
    const workInfo = contents.filter(c => 
      c.toLowerCase().includes('work') || 
      c.toLowerCase().includes('job') || 
      c.toLowerCase().includes('profession')
    );
    
    if (workInfo.length > 0) {
      keyInfo.push(workInfo[0]);
    }
    
    // Look for location information
    const locationInfo = contents.filter(c => 
      c.toLowerCase().includes('live') || 
      c.toLowerCase().includes('home') || 
      c.toLowerCase().includes('city')
    );
    
    if (locationInfo.length > 0) {
      keyInfo.push(locationInfo[0]);
    }
    
    // Add other unique information
    const otherInfo = contents.filter(c => 
      !personalInfo.includes(c) && 
      !workInfo.includes(c) && 
      !locationInfo.includes(c)
    );
    
    keyInfo.push(...otherInfo.slice(0, 2)); // Limit to 2 additional facts
    
    return keyInfo;
  }

  /**
   * 2. Memory Importance Ranking
   */
  static getTopMemories(memories: MemoryItem[], limit: number = 20): MemoryItem[] {
    return memories
      .sort((a, b) => {
        // Combine confidence and recency
        const confidenceDiff = b.confidence - a.confidence;
        const recencyDiff = b.timestamp - a.timestamp;
        
        // Weight confidence more heavily (70% confidence, 30% recency)
        return (0.7 * confidenceDiff) + (0.3 * (recencyDiff / (24 * 60 * 60 * 1000))); // Normalize to days
      })
      .slice(0, limit);
  }

  /**
   * Get top memories by type
   */
  static getTopMemoriesByType(memories: MemoryItem[], type: MemoryItem['type'], limit: number = 10): MemoryItem[] {
    return MemoryUtils.getTopMemories(
      memories.filter(m => m.type === type),
      limit
    );
  }

  /**
   * Get top memories for specific agent
   */
  static getTopMemoriesForAgent(memories: MemoryItem[], agentId: string, limit: number = 15): MemoryItem[] {
    return MemoryUtils.getTopMemories(
      memories.filter(m => m.agentId === agentId),
      limit
    );
  }

  /**
   * 3. Motif Pruning
   * Keep only motifs with timesUsed >= 2 OR seen within last 24 hours
   */
  static pruneMotifs(motifs: Record<string, Motif>, hoursThreshold: number = 24): Record<string, Motif> {
    const now = Date.now();
    const timeThreshold = hoursThreshold * 60 * 60 * 1000; // Convert to milliseconds
    
    return Object.entries(motifs)
      .filter(([_, motif]) => {
        const timeSinceLastSeen = now - motif.lastSeen;
        const isFrequentlyUsed = motif.timesUsed >= 2;
        const isRecentlySeen = timeSinceLastSeen <= timeThreshold;
        
        return isFrequentlyUsed || isRecentlySeen;
      })
      .reduce((acc, [key, motif]) => {
        acc[key] = motif;
        return acc;
      }, {} as Record<string, Motif>);
  }

  /**
   * Get pruned motifs with metadata
   */
  static getPrunedMotifsWithMetadata(motifs: Record<string, Motif>, hoursThreshold: number = 24): {
    kept: Record<string, Motif>;
    removed: Record<string, Motif>;
    stats: {
      totalMotifs: number;
      keptMotifs: number;
      removedMotifs: number;
      keptByFrequency: number;
      keptByRecency: number;
    };
  } {
    const now = Date.now();
    const timeThreshold = hoursThreshold * 60 * 60 * 1000;
    
    const kept: Record<string, Motif> = {};
    const removed: Record<string, Motif> = {};
    let keptByFrequency = 0;
    let keptByRecency = 0;
    
    Object.entries(motifs).forEach(([key, motif]) => {
      const timeSinceLastSeen = now - motif.lastSeen;
      const isFrequentlyUsed = motif.timesUsed >= 2;
      const isRecentlySeen = timeSinceLastSeen <= timeThreshold;
      
      if (isFrequentlyUsed || isRecentlySeen) {
        kept[key] = motif;
        if (isFrequentlyUsed) keptByFrequency++;
        if (isRecentlySeen && !isFrequentlyUsed) keptByRecency++;
      } else {
        removed[key] = motif;
      }
    });
    
    return {
      kept,
      removed,
      stats: {
        totalMotifs: Object.keys(motifs).length,
        keptMotifs: Object.keys(kept).length,
        removedMotifs: Object.keys(removed).length,
        keptByFrequency,
        keptByRecency
      }
    };
  }

  /**
   * 4. Convert MemoryBlob to Firebase-friendly compact format
   */
  static toCompactFormat(blob: MemoryBlob): CompactMemoryData {
    return {
      agentId: blob.agentId,
      memories: blob.recentMemories.map(memory => ({
        type: memory.type,
        content: memory.content,
        confidence: memory.confidence,
        timestamp: memory.timestamp,
        tags: memory.tags
      })),
      motifs: Object.values(blob.motifs).map(motif => ({
        phrase: motif.phrase,
        timesUsed: motif.timesUsed,
        lastSeen: motif.lastSeen,
        mood: motif.mood
      })),
      personaSummary: blob.personaSummary,
      style: {
        verbosity: blob.styleVector.verbosity,
        metaphorAffinity: blob.styleVector.metaphorAffinity,
        formality: blob.styleVector.formality,
        creativity: blob.styleVector.creativity,
        surrealism: blob.styleVector.surrealism,
        emotionalTone: blob.styleVector.emotionalTone
      },
      metadata: {
        lastUpdated: blob.metadata.lastUpdated,
        memoryCount: blob.metadata.memoryCount,
        motifCount: blob.metadata.motifCount,
        totalSize: blob.metadata.totalSize
      }
    };
  }

  /**
   * Convert compact format back to MemoryBlob
   */
  static fromCompactFormat(data: CompactMemoryData): MemoryBlob {
    const motifs: Record<string, Motif> = {};
    
    data.motifs.forEach(motifData => {
      const key = MemoryUtils.normalizePhrase(motifData.phrase);
      motifs[key] = {
        phrase: motifData.phrase,
        timesUsed: motifData.timesUsed,
        lastSeen: motifData.lastSeen,
        firstSeen: motifData.lastSeen, // Approximate
        mood: motifData.mood as 'funny' | 'strange' | 'philosophical',
        relatedTo: []
      };
    });

    const memories: MemoryItem[] = data.memories.map(memoryData => ({
      agentId: data.agentId,
      originatorId: data.agentId,
      type: memoryData.type,
      content: memoryData.content,
      confidence: memoryData.confidence,
      timestamp: memoryData.timestamp || Date.now(),
      tags: memoryData.tags || [],
      derivedFrom: 'compact-format'
    }));

    return {
      agentId: data.agentId,
      motifs,
      recentMemories: memories,
      personaSummary: data.personaSummary,
      styleVector: {
        verbosity: data.style.verbosity,
        metaphorAffinity: data.style.metaphorAffinity,
        emotionalTone: data.style.emotionalTone || 'neutral',
        formality: data.style.formality,
        creativity: data.style.creativity || 0.5,
        absurdity: 0.5,
        surrealism: data.style.surrealism || 0.5
      },
      metadata: {
        totalSize: data.metadata?.totalSize || 0,
        lastUpdated: data.metadata?.lastUpdated || Date.now(),
        memoryCount: data.metadata?.memoryCount || memories.length,
        motifCount: data.metadata?.motifCount || Object.keys(motifs).length,
        compressionRatio: 1.0
      }
    };
  }

  /**
   * 5. Memory analysis utilities
   */
  static analyzeMemoryDistribution(memories: MemoryItem[]): {
    byType: Record<MemoryItem['type'], number>;
    byAgent: Record<string, number>;
    byConfidence: {
      high: number; // >= 0.8
      medium: number; // 0.5-0.8
      low: number; // < 0.5
    };
    byRecency: {
      recent: number; // < 1 hour
      today: number; // < 24 hours
      old: number; // >= 24 hours
    };
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const byType: Record<MemoryItem['type'], number> = {
      fact: 0,
      joke: 0,
      style: 0,
      callback: 0,
      suspicion: 0,
      emotion: 0
    };

    const byAgent: Record<string, number> = {};
    const byConfidence = { high: 0, medium: 0, low: 0 };
    const byRecency = { recent: 0, today: 0, old: 0 };

    memories.forEach(memory => {
      // Count by type
      byType[memory.type]++;

      // Count by agent
      const agentId = memory.agentId || 'unknown';
      byAgent[agentId] = (byAgent[agentId] || 0) + 1;

      // Count by confidence
      if (memory.confidence >= 0.8) byConfidence.high++;
      else if (memory.confidence >= 0.5) byConfidence.medium++;
      else byConfidence.low++;

      // Count by recency
      const age = now - memory.timestamp;
      if (age < oneHour) byRecency.recent++;
      else if (age < oneDay) byRecency.today++;
      else byRecency.old++;
    });

    return { byType, byAgent, byConfidence, byRecency };
  }

  /**
   * 6. Memory cleanup utilities
   */
  static cleanupOldMemories(memories: MemoryItem[], maxAgeHours: number = 24): MemoryItem[] {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    return memories.filter(memory => {
      // Keep high-confidence memories regardless of age
      if (memory.confidence >= 0.8) return true;
      
      // Keep memories within age limit
      return memory.timestamp >= cutoffTime;
    });
  }

  /**
   * Remove duplicate memories
   */
  static removeDuplicateMemories(memories: MemoryItem[]): MemoryItem[] {
    const seen = new Set<string>();
    const unique: MemoryItem[] = [];

    memories.forEach(memory => {
      const key = `${memory.agentId}|${memory.type}|${memory.content.substring(0, 50)}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(memory);
      }
    });

    return unique;
  }

  /**
   * Normalize phrase for consistent keys
   */
  private static normalizePhrase(phrase: string): string {
    return phrase.toLowerCase().replace(/[^\w\s]/g, '').trim();
  }
} 