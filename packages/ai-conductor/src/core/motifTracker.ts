import { Motif, Utterance } from './types';
import { DefaultMotifDetector } from './DefaultMotifDetector';

export class MotifTracker {
  private detector: DefaultMotifDetector;
  private motifs: Map<string, Motif> = new Map();

  constructor() {
    this.detector = new DefaultMotifDetector();
  }

  async trackMotifs(utterances: Utterance[]): Promise<Motif[]> {
    const detectedMotifs = this.detector.detectMotifs(utterances);
    
    // Update existing motifs
    for (const motif of detectedMotifs) {
      const existing = this.motifs.get(motif.pattern);
      if (existing) {
        existing.frequency += motif.frequency;
        existing.lastSeen = motif.lastSeen;
        existing.relatedMemories.push(...motif.relatedMemories);
        existing.strength = Math.min(existing.strength + 0.1, 1);
      } else {
        this.motifs.set(motif.pattern, motif);
      }
    }

    return Array.from(this.motifs.values());
  }

  async updateMotif(motif: Motif, newUtterance: Utterance): Promise<Motif> {
    return this.detector.updateMotif(motif, newUtterance);
  }

  getMotifs(): Motif[] {
    return Array.from(this.motifs.values());
  }

  getMotifByPattern(pattern: string): Motif | undefined {
    return this.motifs.get(pattern);
  }

  clearMotifs(): void {
    this.motifs.clear();
  }
} 