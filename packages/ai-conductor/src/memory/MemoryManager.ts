import { DualUtterance } from '../simulation/types/DialogueTypes';

export interface MemoryItem {
  agentId?: string; // who it's about (optional = ambient or global)
  originatorId?: string; // who said it
  type: 'fact' | 'joke' | 'style' | 'callback' | 'suspicion' | 'emotion';
  content: string;
  confidence: number; // 0.0–1.0
  timestamp: number;
  tags?: string[];
  derivedFrom?: string; // original utterance or phrase
}

export interface Motif {
  phrase: string;
  timesUsed: number;
  lastSeen: number;
  firstSeen: number;
  mood?: 'funny' | 'strange' | 'philosophical';
  relatedTo?: string[]; // other motif ids
}

export class MotifTracker {
  private motifs: Record<string, Motif> = {};

  /**
   * Detect motifs in text
   */
  detect(text: string, agentId?: string): void {
    const motifs = this.extractMotifs(text);
    
    motifs.forEach(motif => {
      const key = this.normalizePhrase(motif.phrase);
      
      if (this.motifs[key]) {
        // Update existing motif
        this.motifs[key].timesUsed++;
        this.motifs[key].lastSeen = Date.now();
      } else {
        // Create new motif
        this.motifs[key] = {
          phrase: motif.phrase,
          timesUsed: 1,
          lastSeen: Date.now(),
          firstSeen: Date.now(),
          mood: motif.mood,
          relatedTo: []
        };
      }
    });

    // Update relationships between motifs
    this.updateMotifRelationships(motifs);
  }

  /**
   * Get emergent motifs (used multiple times)
   */
  getEmergentMotifs(): string[] {
    return Object.values(this.motifs)
      .filter(motif => motif.timesUsed >= 2)
      .sort((a, b) => b.timesUsed - a.timesUsed)
      .map(motif => motif.phrase);
  }

  /**
   * Get all motifs
   */
  getMotifs(): Record<string, Motif> {
    return this.motifs;
  }

  /**
   * Get motifs by mood
   */
  getMotifsByMood(mood: 'funny' | 'strange' | 'philosophical'): Motif[] {
    return Object.values(this.motifs)
      .filter(motif => motif.mood === mood)
      .sort((a, b) => b.timesUsed - a.timesUsed);
  }

  /**
   * Extract motifs from text
   */
  private extractMotifs(text: string): Array<{ phrase: string; mood?: 'funny' | 'strange' | 'philosophical' }> {
    const motifs: Array<{ phrase: string; mood?: 'funny' | 'strange' | 'philosophical' }> = [];
    const textLower = text.toLowerCase();

    // Detect jokes
    const jokePatterns = [
      /\b(joke|funny|hilarious|laugh|humor)\b/gi,
      /\b(that's what she said|dad joke|punchline)\b/gi,
      /\b(😂|😄|😆|🤣)\b/gi
    ];

    if (jokePatterns.some(pattern => pattern.test(text))) {
      motifs.push({ phrase: text.substring(0, 50), mood: 'funny' });
    }

    // Detect strange/surreal elements
    const strangePatterns = [
      /\b(strange|weird|bizarre|surreal|absurd)\b/gi,
      /\b(consciousness|reality|existence|quantum)\b/gi,
      /\b(dream|nightmare|hallucination)\b/gi
    ];

    if (strangePatterns.some(pattern => pattern.test(text))) {
      motifs.push({ phrase: text.substring(0, 50), mood: 'strange' });
    }

    // Detect philosophical elements
    const philosophicalPatterns = [
      /\b(philosophy|meaning|purpose|existence|consciousness)\b/gi,
      /\b(metaphor|analogy|like|as if|reminds me of)\b/gi,
      /\b(truth|reality|perception|knowledge)\b/gi
    ];

    if (philosophicalPatterns.some(pattern => pattern.test(text))) {
      motifs.push({ phrase: text.substring(0, 50), mood: 'philosophical' });
    }

    // Detect recurring phrases
    const phrases = text.split(/[.!?]/).filter(sentence => sentence.trim().length > 10);
    phrases.forEach(sentence => {
      const words = sentence.trim().split(' ').filter(word => word.length > 3);
      if (words.length >= 3) {
        const phrase = words.slice(0, 5).join(' '); // First 5 words
        motifs.push({ phrase });
      }
    });

    return motifs;
  }

  /**
   * Normalize phrase for consistent keys
   */
  private normalizePhrase(phrase: string): string {
    return phrase.toLowerCase().replace(/[^\w\s]/g, '').trim();
  }

  /**
   * Update relationships between motifs
   */
  private updateMotifRelationships(motifs: Array<{ phrase: string; mood?: 'funny' | 'strange' | 'philosophical' }>): void {
    motifs.forEach(motif => {
      const key = this.normalizePhrase(motif.phrase);
      const currentMotif = this.motifs[key];
      
      if (currentMotif) {
        // Find related motifs (same mood or similar content)
        Object.entries(this.motifs).forEach(([otherKey, otherMotif]) => {
          if (otherKey !== key && 
              (otherMotif.mood === motif.mood || 
               this.calculateSimilarity(motif.phrase, otherMotif.phrase) > 0.3)) {
            
            if (!currentMotif.relatedTo) {
              currentMotif.relatedTo = [];
            }
            if (!otherMotif.relatedTo) {
              otherMotif.relatedTo = [];
            }
            
            if (!currentMotif.relatedTo.includes(otherKey)) {
              currentMotif.relatedTo.push(otherKey);
            }
            if (!otherMotif.relatedTo.includes(key)) {
              otherMotif.relatedTo.push(key);
            }
          }
        });
      }
    });
  }

  /**
   * Calculate similarity between phrases
   */
  private calculateSimilarity(phrase1: string, phrase2: string): number {
    const words1 = new Set(phrase1.toLowerCase().split(' '));
    const words2 = new Set(phrase2.toLowerCase().split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

export class MemoryManager {
  private memories: MemoryItem[] = [];
  private motifs: MotifTracker = new MotifTracker();

  /**
   * Ingest chat messages and parse them for callbacks, tone shifts, character info
   */
  ingest(utterance: DualUtterance): void {
    const timestamp = Date.now();
    
    // Detect memory items from utterance
    const memoryItems = this.extractMemoryItems(utterance, timestamp);
    this.memories.push(...memoryItems);
    
    // Detect motifs
    this.motifs.detect(utterance.text, utterance.agentId);
    
    // Clean up old memories (keep last 100)
    if (this.memories.length > 100) {
      this.memories = this.memories.slice(-100);
    }
  }

  /**
   * Get memory summary for an agent
   */
  getMemorySummary(agentId?: string): string {
    const relevantMemories = agentId 
      ? this.memories.filter(memory => memory.agentId === agentId)
      : this.memories;
    
    if (relevantMemories.length === 0) {
      return "No specific memories found.";
    }
    
    // Group by type
    const facts = relevantMemories.filter(m => m.type === 'fact');
    const jokes = relevantMemories.filter(m => m.type === 'joke');
    const suspicions = relevantMemories.filter(m => m.type === 'suspicion');
    const emotions = relevantMemories.filter(m => m.type === 'emotion');
    
    const summary: string[] = [];
    
    if (facts.length > 0) {
      summary.push(`Facts: ${facts.slice(-3).map(f => f.content.substring(0, 30)).join(', ')}`);
    }
    
    if (jokes.length > 0) {
      summary.push(`Jokes: ${jokes.slice(-2).map(j => j.content.substring(0, 30)).join(', ')}`);
    }
    
    if (suspicions.length > 0) {
      summary.push(`Suspicions: ${suspicions.slice(-2).map(s => s.content.substring(0, 30)).join(', ')}`);
    }
    
    if (emotions.length > 0) {
      summary.push(`Emotions: ${emotions.slice(-2).map(e => e.content.substring(0, 30)).join(', ')}`);
    }
    
    return summary.join('. ') + '.';
  }

  /**
   * Get motif hints for reinforcement
   */
  getMotifHints(): string[] {
    const emergentMotifs = this.motifs.getEmergentMotifs();
    const allMotifs = this.motifs.getMotifs();
    
    return emergentMotifs.slice(0, 5).map(phrase => {
      const motif = allMotifs[this.normalizePhrase(phrase)];
      return `"${phrase}" (used ${motif.timesUsed} times, ${motif.mood || 'neutral'} mood)`;
    });
  }

  /**
   * Add manual memory note
   */
  addManualMemory(note: string, agentId?: string): void {
    const memoryItem: MemoryItem = {
      agentId,
      type: 'fact',
      content: note,
      confidence: 1.0,
      timestamp: Date.now(),
      tags: ['manual'],
      derivedFrom: 'manual'
    };
    
    this.memories.push(memoryItem);
  }

  /**
   * Extract memory items from utterance
   */
  private extractMemoryItems(utterance: DualUtterance, timestamp: number): MemoryItem[] {
    const items: MemoryItem[] = [];
    const text = utterance.text.toLowerCase();
    
    // Detect facts
    const factPatterns = [
      /\b(i am|i'm|i work|i study|i live)\b/gi,
      /\b(my name is|i'm called|i go by)\b/gi,
      /\b(i have|i own|i like|i love|i hate)\b/gi
    ];
    
    if (factPatterns.some(pattern => pattern.test(text))) {
      items.push({
        agentId: utterance.agentId,
        originatorId: utterance.agentId,
        type: 'fact',
        content: utterance.text,
        confidence: 0.8,
        timestamp,
        tags: ['personal'],
        derivedFrom: utterance.text
      });
    }
    
    // Detect jokes
    const jokePatterns = [
      /\b(joke|funny|hilarious|laugh|humor)\b/gi,
      /\b(that's what she said|dad joke|punchline)\b/gi,
      /\b(😂|😄|😆|🤣)\b/gi
    ];
    
    if (jokePatterns.some(pattern => pattern.test(text))) {
      items.push({
        agentId: utterance.agentId,
        originatorId: utterance.agentId,
        type: 'joke',
        content: utterance.text,
        confidence: 0.9,
        timestamp,
        tags: ['humor'],
        derivedFrom: utterance.text
      });
    }
    
    // Detect callbacks
    const callbackPatterns = [
      /\b(remember|earlier|before|we discussed|as mentioned)\b/gi,
      /\b(that reminds me|speaking of|going back to)\b/gi,
      /\b(like we said|as we talked about)\b/gi
    ];
    
    if (callbackPatterns.some(pattern => pattern.test(text))) {
      items.push({
        agentId: utterance.agentId,
        originatorId: utterance.agentId,
        type: 'callback',
        content: utterance.text,
        confidence: 0.7,
        timestamp,
        tags: ['callback'],
        derivedFrom: utterance.text
      });
    }
    
    // Detect suspicions
    const suspicionPatterns = [
      /\b(suspect|suspicious|think|believe|wonder)\b/gi,
      /\b(maybe|perhaps|possibly|could be)\b/gi,
      /\b(secret|hidden|mystery)\b/gi
    ];
    
    if (suspicionPatterns.some(pattern => pattern.test(text))) {
      items.push({
        agentId: utterance.agentId,
        originatorId: utterance.agentId,
        type: 'suspicion',
        content: utterance.text,
        confidence: 0.6,
        timestamp,
        tags: ['suspicion'],
        derivedFrom: utterance.text
      });
    }
    
    // Detect emotions
    const emotionPatterns = [
      /\b(happy|sad|angry|excited|worried|scared)\b/gi,
      /\b(love|hate|like|dislike|enjoy|suffer)\b/gi,
      /\b(😊|😢|😠|😱|😍|😭)\b/gi
    ];
    
    if (emotionPatterns.some(pattern => pattern.test(text))) {
      items.push({
        agentId: utterance.agentId,
        originatorId: utterance.agentId,
        type: 'emotion',
        content: utterance.text,
        confidence: 0.7,
        timestamp,
        tags: ['emotion'],
        derivedFrom: utterance.text
      });
    }
    
    // Detect style changes
    const stylePatterns = [
      /\b(formal|casual|professional|friendly)\b/gi,
      /\b(poetic|technical|simple|complex)\b/gi,
      /\b(metaphorical|literal|abstract|concrete)\b/gi
    ];
    
    if (stylePatterns.some(pattern => pattern.test(text))) {
      items.push({
        agentId: utterance.agentId,
        originatorId: utterance.agentId,
        type: 'style',
        content: utterance.text,
        confidence: 0.5,
        timestamp,
        tags: ['style'],
        derivedFrom: utterance.text
      });
    }
    
    return items;
  }

  /**
   * Normalize phrase for consistent keys
   */
  private normalizePhrase(phrase: string): string {
    return phrase.toLowerCase().replace(/[^\w\s]/g, '').trim();
  }

  /**
   * Get all memories
   */
  getAllMemories(): MemoryItem[] {
    return this.memories;
  }

  /**
   * Get memories by type
   */
  getMemoriesByType(type: MemoryItem['type']): MemoryItem[] {
    return this.memories.filter(memory => memory.type === type);
  }

  /**
   * Get memories for specific agent
   */
  getMemoriesForAgent(agentId: string): MemoryItem[] {
    return this.memories.filter(memory => memory.agentId === agentId);
  }

  /**
   * Get recent memories
   */
  getRecentMemories(limit: number = 10): MemoryItem[] {
    return this.memories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const totalMemories = this.memories.length;
    const memoryTypes = {
      fact: this.memories.filter(m => m.type === 'fact').length,
      joke: this.memories.filter(m => m.type === 'joke').length,
      style: this.memories.filter(m => m.type === 'style').length,
      callback: this.memories.filter(m => m.type === 'callback').length,
      suspicion: this.memories.filter(m => m.type === 'suspicion').length,
      emotion: this.memories.filter(m => m.type === 'emotion').length
    };
    
    const motifs = this.motifs.getMotifs();
    const totalMotifs = Object.keys(motifs).length;
    const emergentMotifs = this.motifs.getEmergentMotifs().length;
    
    return {
      totalMemories,
      memoryTypes,
      totalMotifs,
      emergentMotifs,
      averageConfidence: this.memories.reduce((sum, m) => sum + m.confidence, 0) / totalMemories || 0
    };
  }

  /**
   * Clear all memories
   */
  clear(): void {
    this.memories = [];
    this.motifs = new MotifTracker();
  }
} 