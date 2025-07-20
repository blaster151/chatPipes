import { v4 as uuidv4 } from 'uuid';
import {
  MotifDetector,
  Motif,
  Utterance
} from './types';

export class DefaultMotifDetector implements MotifDetector {
  private minPatternLength = 3;
  private maxPatternLength = 20;

  detectMotifs(utterances: Utterance[]): Motif[] {
    if (utterances.length < 2) {
      return [];
    }

    const patterns = new Map<string, {
      frequency: number;
      firstSeen: Date;
      lastSeen: Date;
      relatedMemories: string[];
      strength: number;
    }>();

    // Extract patterns from each utterance
    for (const utterance of utterances) {
      const textPatterns = this.extractPatterns(utterance.text);
      
      for (const pattern of textPatterns) {
        if (!patterns.has(pattern)) {
          patterns.set(pattern, {
            frequency: 0,
            firstSeen: utterance.timestamp,
            lastSeen: utterance.timestamp,
            relatedMemories: [],
            strength: 0
          });
        }

        const patternData = patterns.get(pattern)!;
        patternData.frequency++;
        patternData.lastSeen = utterance.timestamp;
        patternData.relatedMemories.push(utterance.id);
        
        // Calculate strength based on frequency and recency
        const daysSinceFirst = (Date.now() - patternData.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
        const recencyFactor = Math.max(0, 1 - daysSinceFirst / 30); // Decay over 30 days
        patternData.strength = Math.min(patternData.frequency / 10 + recencyFactor * 0.5, 1);
      }
    }

    // Convert to Motif objects
    const motifs: Motif[] = [];
    for (const [pattern, data] of patterns.entries()) {
      if (data.frequency >= 2) { // Minimum frequency threshold
        motifs.push({
          id: uuidv4(),
          pattern,
          frequency: data.frequency,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen,
          relatedMemories: data.relatedMemories,
          strength: data.strength
        });
      }
    }

    return motifs.sort((a, b) => b.frequency - a.frequency);
  }

  updateMotif(motif: Motif, newUtterance: Utterance): Motif {
    const updatedMotif = { ...motif };
    
    // Check if the new utterance contains this motif
    const textPatterns = this.extractPatterns(newUtterance.text);
    const containsMotif = textPatterns.includes(motif.pattern);
    
    if (containsMotif) {
      updatedMotif.frequency++;
      updatedMotif.lastSeen = newUtterance.timestamp;
      updatedMotif.relatedMemories.push(newUtterance.id);
      
      // Recalculate strength
      const daysSinceFirst = (Date.now() - updatedMotif.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0, 1 - daysSinceFirst / 30);
      updatedMotif.strength = Math.min(updatedMotif.frequency / 10 + recencyFactor * 0.5, 1);
    }

    return updatedMotif;
  }

  private extractPatterns(text: string): string[] {
    const patterns: string[] = [];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);

    // Extract n-grams (word sequences)
    for (let n = this.minPatternLength; n <= Math.min(this.maxPatternLength, words.length); n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const pattern = words.slice(i, i + n).join(' ');
        if (pattern.length >= this.minPatternLength) {
          patterns.push(pattern);
        }
      }
    }

    // Extract common phrases (quoted text)
    const phraseMatches = text.match(/"([^"]+)"/g);
    if (phraseMatches) {
      for (const match of phraseMatches) {
        const phrase = match.slice(1, -1).toLowerCase().trim();
        if (phrase.length >= this.minPatternLength) {
          patterns.push(phrase);
        }
      }
    }

    // Extract repeated words (frequency-based patterns)
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    for (const [word, count] of wordCounts.entries()) {
      if (count >= 2 && word.length >= 3) {
        patterns.push(word);
      }
    }

    return [...new Set(patterns)]; // Remove duplicates
  }
} 