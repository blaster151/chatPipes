import { MemoryItem, Motif } from './MemoryManager';
import { CompressedMemory } from './MemoryCompressor';
import { StyleVector } from '../simulation/types/DialogueTypes';

export interface MemoryBlob {
  agentId: string;
  motifs: Record<string, Motif>;
  recentMemories: MemoryItem[];
  personaSummary: string;
  styleVector: StyleVector;
  metadata: {
    totalSize: number;
    lastUpdated: number;
    memoryCount: number;
    motifCount: number;
    compressionRatio: number;
  };
}

export interface MemoryCapperConfig {
  maxSizePerAgent: number; // 500KB in bytes
  maxRecentMemories: number; // 50 memories
  minConfidenceThreshold: number; // 0.5
  recencyWeight: number; // 0.7 (70% recency, 30% confidence)
  personaSummaryLength: number; // 200 characters
  motifPreservationThreshold: number; // 1 (keep all motifs)
}

export class MemoryCapper {
  private config: MemoryCapperConfig;
  private memoryBlobs: Map<string, MemoryBlob> = new Map();

  constructor(config: Partial<MemoryCapperConfig> = {}) {
    this.config = {
      maxSizePerAgent: 500 * 1024, // 500KB
      maxRecentMemories: 50,
      minConfidenceThreshold: 0.5,
      recencyWeight: 0.7,
      personaSummaryLength: 200,
      motifPreservationThreshold: 1,
      ...config
    };
  }

  /**
   * Create or update memory blob for an agent
   */
  createMemoryBlob(
    agentId: string,
    memories: MemoryItem[],
    motifs: Record<string, Motif>,
    styleVector?: StyleVector
  ): MemoryBlob {
    // Filter and prioritize memories
    const filteredMemories = this.filterAndPrioritizeMemories(memories);
    
    // Keep all motifs (canonical phrases + usage count)
    const preservedMotifs = this.preserveAllMotifs(motifs);
    
    // Generate persona summary
    const personaSummary = this.generatePersonaSummary(memories, styleVector);
    
    // Create memory blob
    const memoryBlob: MemoryBlob = {
      agentId,
      motifs: preservedMotifs,
      recentMemories: filteredMemories,
      personaSummary,
      styleVector: styleVector || this.createDefaultStyleVector(),
      metadata: {
        totalSize: 0,
        lastUpdated: Date.now(),
        memoryCount: filteredMemories.length,
        motifCount: Object.keys(preservedMotifs).length,
        compressionRatio: 0
      }
    };

    // Calculate size and apply constraints
    const sizedBlob = this.applySizeConstraints(memoryBlob);
    
    // Store the blob
    this.memoryBlobs.set(agentId, sizedBlob);
    
    return sizedBlob;
  }

  /**
   * Filter and prioritize memories by confidence + recency
   */
  private filterAndPrioritizeMemories(memories: MemoryItem[]): MemoryItem[] {
    if (memories.length === 0) return [];

    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Filter by confidence threshold
    const confidentMemories = memories.filter(memory => 
      memory.confidence >= this.config.minConfidenceThreshold
    );

    // Calculate priority scores (recency + confidence weighted)
    const scoredMemories = confidentMemories.map(memory => {
      const age = now - memory.timestamp;
      const recencyScore = Math.max(0, 1 - (age / maxAge));
      const confidenceScore = memory.confidence;
      
      const priorityScore = (this.config.recencyWeight * recencyScore) + 
                           ((1 - this.config.recencyWeight) * confidenceScore);
      
      return { memory, priorityScore };
    });

    // Sort by priority and take top N
    const sortedMemories = scoredMemories
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, this.config.maxRecentMemories)
      .map(item => item.memory);

    return sortedMemories;
  }

  /**
   * Preserve all motifs (canonical phrases + usage count)
   */
  private preserveAllMotifs(motifs: Record<string, Motif>): Record<string, Motif> {
    // Keep all motifs regardless of usage count
    return Object.entries(motifs)
      .filter(([_, motif]) => motif.timesUsed >= this.config.motifPreservationThreshold)
      .reduce((acc, [key, motif]) => {
        acc[key] = motif;
        return acc;
      }, {} as Record<string, Motif>);
  }

  /**
   * Generate persona summary
   */
  private generatePersonaSummary(memories: MemoryItem[], styleVector?: StyleVector): string {
    const traits: string[] = [];
    
    // Analyze memory types
    const memoryTypes = {
      fact: memories.filter(m => m.type === 'fact').length,
      joke: memories.filter(m => m.type === 'joke').length,
      callback: memories.filter(m => m.type === 'callback').length,
      suspicion: memories.filter(m => m.type === 'suspicion').length,
      emotion: memories.filter(m => m.type === 'emotion').length,
      style: memories.filter(m => m.type === 'style').length
    };

    // Add personality traits based on memory patterns
    if (memoryTypes.joke > 2) traits.push('humorous');
    if (memoryTypes.suspicion > 1) traits.push('suspicious');
    if (memoryTypes.emotion > 3) traits.push('emotional');
    if (memoryTypes.callback > 2) traits.push('good memory');
    if (memoryTypes.fact > 5) traits.push('factual');

    // Add style-based traits
    if (styleVector) {
      if (styleVector.metaphorAffinity > 0.7) traits.push('metaphorical');
      if (styleVector.verbosity > 0.7) traits.push('verbose');
      if (styleVector.formality > 0.7) traits.push('formal');
      if (styleVector.formality < 0.3) traits.push('casual');
      if (styleVector.creativity > 0.7) traits.push('creative');
      if (styleVector.surrealism > 0.7) traits.push('surreal');
    }

    // Add relationship insights
    const relationshipInsights = this.extractRelationshipInsights(memories);
    if (relationshipInsights.length > 0) {
      traits.push(...relationshipInsights);
    }

    // Generate summary
    let summary = traits.length > 0 ? traits.join(', ') : 'balanced personality';
    
    // Truncate to fit within character limit
    if (summary.length > this.config.personaSummaryLength) {
      summary = summary.substring(0, this.config.personaSummaryLength - 3) + '...';
    }

    return summary;
  }

  /**
   * Extract relationship insights from memories
   */
  private extractRelationshipInsights(memories: MemoryItem[]): string[] {
    const insights: string[] = [];
    const agentMentions = new Map<string, number>();

    // Count mentions of other agents
    memories.forEach(memory => {
      const content = memory.content.toLowerCase();
      const words = content.split(' ');
      
      words.forEach(word => {
        if (word.startsWith('@') || /^[A-Z][a-z]+$/.test(word)) {
          const agentName = word.replace('@', '');
          if (agentName.length > 2) {
            agentMentions.set(agentName, (agentMentions.get(agentName) || 0) + 1);
          }
        }
      });
    });

    // Generate relationship insights
    agentMentions.forEach((count, agentName) => {
      if (count > 2) {
        const memories = this.getMemoriesAboutAgent(memories, agentName);
        const sentiment = this.analyzeSentiment(memories);
        
        if (sentiment === 'positive') {
          insights.push(`friendly with ${agentName}`);
        } else if (sentiment === 'negative') {
          insights.push(`suspicious of ${agentName}`);
        } else {
          insights.push(`neutral toward ${agentName}`);
        }
      }
    });

    return insights.slice(0, 3); // Limit to 3 relationship insights
  }

  /**
   * Get memories about a specific agent
   */
  private getMemoriesAboutAgent(memories: MemoryItem[], agentName: string): MemoryItem[] {
    return memories.filter(memory => 
      memory.content.toLowerCase().includes(agentName.toLowerCase()) ||
      memory.agentId === agentName
    );
  }

  /**
   * Analyze sentiment of memories
   */
  private analyzeSentiment(memories: MemoryItem[]): 'positive' | 'negative' | 'neutral' {
    if (memories.length === 0) return 'neutral';

    const positiveWords = ['like', 'love', 'enjoy', 'great', 'amazing', 'wonderful', 'friendly'];
    const negativeWords = ['hate', 'dislike', 'suspicious', 'worried', 'angry', 'annoyed'];

    let positiveCount = 0;
    let negativeCount = 0;

    memories.forEach(memory => {
      const content = memory.content.toLowerCase();
      
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Apply size constraints to memory blob
   */
  private applySizeConstraints(blob: MemoryBlob): MemoryBlob {
    let currentSize = this.calculateBlobSize(blob);
    let constrainedBlob = { ...blob };

    // If within limits, return as-is
    if (currentSize <= this.config.maxSizePerAgent) {
      constrainedBlob.metadata.totalSize = currentSize;
      constrainedBlob.metadata.compressionRatio = 1;
      return constrainedBlob;
    }

    // Apply size constraints in order of priority
    // 1. Keep all motifs (highest priority)
    // 2. Keep high-confidence memories
    // 3. Reduce persona summary length
    // 4. Trim memories if still over limit

    // Step 1: Try reducing persona summary
    if (currentSize > this.config.maxSizePerAgent) {
      constrainedBlob.personaSummary = this.truncatePersonaSummary(constrainedBlob.personaSummary);
      currentSize = this.calculateBlobSize(constrainedBlob);
    }

    // Step 2: Trim memories if still over limit
    if (currentSize > this.config.maxSizePerAgent) {
      const targetSize = this.config.maxSizePerAgent;
      const motifSize = this.calculateMotifsSize(constrainedBlob.motifs);
      const personaSize = this.calculateStringSize(constrainedBlob.personaSummary);
      const styleSize = this.calculateStyleVectorSize(constrainedBlob.styleVector);
      const metadataSize = 200; // Approximate metadata size
      
      const availableForMemories = targetSize - motifSize - personaSize - styleSize - metadataSize;
      
      constrainedBlob.recentMemories = this.trimMemoriesToSize(
        constrainedBlob.recentMemories, 
        availableForMemories
      );
      
      currentSize = this.calculateBlobSize(constrainedBlob);
    }

    // Update metadata
    constrainedBlob.metadata.totalSize = currentSize;
    constrainedBlob.metadata.memoryCount = constrainedBlob.recentMemories.length;
    constrainedBlob.metadata.compressionRatio = currentSize / this.config.maxSizePerAgent;

    return constrainedBlob;
  }

  /**
   * Calculate size of memory blob in bytes
   */
  private calculateBlobSize(blob: MemoryBlob): number {
    const motifsSize = this.calculateMotifsSize(blob.motifs);
    const memoriesSize = this.calculateMemoriesSize(blob.recentMemories);
    const personaSize = this.calculateStringSize(blob.personaSummary);
    const styleSize = this.calculateStyleVectorSize(blob.styleVector);
    const metadataSize = 200; // Approximate metadata size

    return motifsSize + memoriesSize + personaSize + styleSize + metadataSize;
  }

  /**
   * Calculate size of motifs in bytes
   */
  private calculateMotifsSize(motifs: Record<string, Motif>): number {
    let size = 0;
    Object.values(motifs).forEach(motif => {
      size += this.calculateStringSize(motif.phrase);
      size += 8; // timesUsed (number)
      size += 8; // lastSeen (number)
      size += 8; // firstSeen (number)
      size += 20; // mood (string)
      size += (motif.relatedTo?.length || 0) * 20; // relatedTo array
    });
    return size;
  }

  /**
   * Calculate size of memories in bytes
   */
  private calculateMemoriesSize(memories: MemoryItem[]): number {
    let size = 0;
    memories.forEach(memory => {
      size += this.calculateStringSize(memory.content);
      size += 20; // agentId (string)
      size += 20; // originatorId (string)
      size += 20; // type (string)
      size += 8; // confidence (number)
      size += 8; // timestamp (number)
      size += (memory.tags?.length || 0) * 15; // tags array
      size += this.calculateStringSize(memory.derivedFrom || '');
    });
    return size;
  }

  /**
   * Calculate size of string in bytes
   */
  private calculateStringSize(str: string): number {
    return new TextEncoder().encode(str).length;
  }

  /**
   * Calculate size of style vector in bytes
   */
  private calculateStyleVectorSize(styleVector: StyleVector): number {
    return Object.values(styleVector).reduce((size, value) => {
      if (typeof value === 'string') {
        return size + this.calculateStringSize(value);
      } else {
        return size + 8; // number
      }
    }, 0);
  }

  /**
   * Truncate persona summary to fit size constraints
   */
  private truncatePersonaSummary(summary: string): string {
    const maxLength = Math.floor(this.config.personaSummaryLength * 0.8);
    if (summary.length <= maxLength) return summary;
    
    return summary.substring(0, maxLength - 3) + '...';
  }

  /**
   * Trim memories to fit within size limit
   */
  private trimMemoriesToSize(memories: MemoryItem[], targetSize: number): MemoryItem[] {
    if (targetSize <= 0) return [];

    const trimmedMemories: MemoryItem[] = [];
    let currentSize = 0;

    for (const memory of memories) {
      const memorySize = this.calculateMemorySize(memory);
      
      if (currentSize + memorySize <= targetSize) {
        trimmedMemories.push(memory);
        currentSize += memorySize;
      } else {
        break;
      }
    }

    return trimmedMemories;
  }

  /**
   * Calculate size of single memory item
   */
  private calculateMemorySize(memory: MemoryItem): number {
    return this.calculateStringSize(memory.content) +
           this.calculateStringSize(memory.agentId || '') +
           this.calculateStringSize(memory.originatorId || '') +
           this.calculateStringSize(memory.type) +
           8 + // confidence
           8 + // timestamp
           (memory.tags?.reduce((size, tag) => size + this.calculateStringSize(tag), 0) || 0) +
           this.calculateStringSize(memory.derivedFrom || '');
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
   * Get memory blob for agent
   */
  getMemoryBlob(agentId: string): MemoryBlob | undefined {
    return this.memoryBlobs.get(agentId);
  }

  /**
   * Get all memory blobs
   */
  getAllMemoryBlobs(): Map<string, MemoryBlob> {
    return this.memoryBlobs;
  }

  /**
   * Get memory blob size for agent
   */
  getBlobSize(agentId: string): number {
    const blob = this.memoryBlobs.get(agentId);
    return blob ? blob.metadata.totalSize : 0;
  }

  /**
   * Get compression statistics
   */
  getCompressionStats() {
    const blobs = Array.from(this.memoryBlobs.values());
    const totalSize = blobs.reduce((sum, blob) => sum + blob.metadata.totalSize, 0);
    const totalMemories = blobs.reduce((sum, blob) => sum + blob.metadata.memoryCount, 0);
    const totalMotifs = blobs.reduce((sum, blob) => sum + blob.metadata.motifCount, 0);
    const avgCompressionRatio = blobs.reduce((sum, blob) => sum + blob.metadata.compressionRatio, 0) / blobs.length;

    return {
      totalAgents: blobs.length,
      totalSize,
      totalMemories,
      totalMotifs,
      averageCompressionRatio: avgCompressionRatio,
      averageSizePerAgent: totalSize / blobs.length,
      sizeLimit: this.config.maxSizePerAgent
    };
  }

  /**
   * Clear all memory blobs
   */
  clear(): void {
    this.memoryBlobs.clear();
  }

  /**
   * Remove memory blob for agent
   */
  removeAgent(agentId: string): boolean {
    return this.memoryBlobs.delete(agentId);
  }
} 