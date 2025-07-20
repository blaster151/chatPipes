import { EventEmitter } from 'events';
import { SharedMemoryManager, SharedMemory } from '../memory/SharedMemoryManager';
import { ThemeTracker, ThemeScore } from '../gamification/ThemeTracker';
import { SurrealVibeManager } from '../surreal/SurrealVibeManager';

export interface MotifPattern {
  id: string;
  pattern: string;
  type: 'recurring' | 'evolving' | 'branching' | 'converging' | 'surreal';
  firstSeen: number;
  lastSeen: number;
  occurrences: number;
  participants: string[];
  strength: number; // 0-1: How strong this pattern is
  confidence: number; // 0-1: How confident we are in this pattern
  variations: string[];
  relatedPatterns: string[];
  emotionalArc: Array<{
    timestamp: number;
    intensity: number;
    valence: number; // -1 to 1
  }>;
}

export interface MotifInsight {
  type: 'pattern_detected' | 'theme_emerging' | 'callback_opportunity' | 'surreal_shift' | 'convergence_warning';
  pattern: MotifPattern;
  confidence: number;
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

export interface MonitorConfig {
  patternDetectionThreshold: number; // 0-1: Minimum confidence for pattern detection
  motifTrackingInterval: number; // How often to analyze for motifs
  callbackOpportunityThreshold: number; // 0-1: When to suggest callbacks
  convergenceWarningThreshold: number; // 0-1: When to warn about convergence
  surrealShiftThreshold: number; // 0-1: When to detect surreal shifts
  maxPatterns: number; // Maximum patterns to track
  patternDecayRate: number; // How quickly patterns lose strength
}

export class MotifMonitorAgent extends EventEmitter {
  private memoryManager: SharedMemoryManager;
  private themeTracker: ThemeTracker;
  private surrealVibeManager: SurrealVibeManager;
  private config: MonitorConfig;
  private patterns: Map<string, MotifPattern> = new Map();
  private insights: MotifInsight[] = [];
  private analysisTimer?: NodeJS.Timeout;
  private conversationStartTime: number = 0;

  constructor(
    memoryManager: SharedMemoryManager,
    themeTracker: ThemeTracker,
    surrealVibeManager: SurrealVibeManager,
    config: Partial<MonitorConfig> = {}
  ) {
    super();
    this.setMaxListeners(100);
    
    this.memoryManager = memoryManager;
    this.themeTracker = themeTracker;
    this.surrealVibeManager = surrealVibeManager;
    
    this.config = {
      patternDetectionThreshold: 0.6,
      motifTrackingInterval: 30 * 1000, // 30 seconds
      callbackOpportunityThreshold: 0.7,
      convergenceWarningThreshold: 0.8,
      surrealShiftThreshold: 0.6,
      maxPatterns: 50,
      patternDecayRate: 0.01, // 1% decay per minute
      ...config
    };

    this.startMonitoring();
  }

  /**
   * Start monitoring conversation
   */
  startMonitoring(participants: string[]): void {
    this.conversationStartTime = Date.now();
    this.patterns.clear();
    this.insights = [];
    
    this.emit('monitoring_started', {
      participants,
      timestamp: this.conversationStartTime
    });
  }

  /**
   * Process new memory for motif analysis
   */
  processMemory(memory: SharedMemory): void {
    // Extract potential patterns
    const patterns = this.extractPatterns(memory);
    
    patterns.forEach(pattern => {
      this.updatePattern(pattern, memory);
    });

    // Analyze for insights
    const newInsights = this.analyzeForInsights(memory);
    this.insights.push(...newInsights);

    // Emit insights
    newInsights.forEach(insight => {
      this.emit('insight_generated', {
        insight,
        memory,
        timestamp: Date.now()
      });
    });

    this.emit('memory_analyzed', {
      memory,
      patterns,
      insights: newInsights,
      timestamp: Date.now()
    });
  }

  /**
   * Extract patterns from memory
   */
  private extractPatterns(memory: SharedMemory): string[] {
    const patterns: string[] = [];
    const text = memory.text.toLowerCase();
    
    // Extract recurring phrases
    const phrasePatterns = [
      /consciousness is like a lost dog at a wedding/gi,
      /quantum tea/gi,
      /schrödinger's tea/gi,
      /cake table/gi,
      /wedding guests/gi,
      /DJ as subconscious/gi,
      /tuxedo moment/gi,
      /that felt like/gi,
      /again, didn't it/gi
    ];

    phrasePatterns.forEach(pattern => {
      if (pattern.test(text)) {
        patterns.push(pattern.source.replace(/\\b|\\/gi, ''));
      }
    });

    // Extract word patterns
    const wordPatterns = [
      /\b(consciousness|awareness|existence|reality)\b/gi,
      /\b(lost|dog|wedding|tea|quantum)\b/gi,
      /\b(surreal|absurd|metaphor|like|as if)\b/gi,
      /\b(again|felt|reminds|similar)\b/gi
    ];

    wordPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches.length > 1) {
        patterns.push(matches.join(' '));
      }
    });

    // Extract emotional patterns
    if (memory.emotionalCharge > 0.7) {
      patterns.push('high_emotional_intensity');
    }
    if (memory.emotionalCharge < -0.7) {
      patterns.push('negative_emotional_intensity');
    }

    // Extract participant patterns
    if (memory.participants.length > 1) {
      patterns.push('multi_participant_interaction');
    }

    return patterns;
  }

  /**
   * Update pattern with new memory
   */
  private updatePattern(patternText: string, memory: SharedMemory): void {
    const existingPattern = this.patterns.get(patternText);
    const now = Date.now();
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.lastSeen = now;
      existingPattern.occurrences++;
      existingPattern.strength = Math.min(1, existingPattern.strength + 0.1);
      existingPattern.participants = [...new Set([...existingPattern.participants, ...memory.participants])];
      existingPattern.variations.push(memory.text);
      
      // Update emotional arc
      existingPattern.emotionalArc.push({
        timestamp: now,
        intensity: Math.abs(memory.emotionalCharge),
        valence: memory.emotionalCharge
      });

      // Determine pattern type
      existingPattern.type = this.determinePatternType(existingPattern);
      
      // Update confidence
      existingPattern.confidence = this.calculatePatternConfidence(existingPattern);
      
    } else {
      // Create new pattern
      const newPattern: MotifPattern = {
        id: `pattern-${now}-${Math.random().toString(36).substr(2, 9)}`,
        pattern: patternText,
        type: 'recurring',
        firstSeen: now,
        lastSeen: now,
        occurrences: 1,
        participants: memory.participants,
        strength: memory.importance,
        confidence: 0.3,
        variations: [memory.text],
        relatedPatterns: [],
        emotionalArc: [{
          timestamp: now,
          intensity: Math.abs(memory.emotionalCharge),
          valence: memory.emotionalCharge
        }]
      };
      
      this.patterns.set(patternText, newPattern);
    }
  }

  /**
   * Determine pattern type
   */
  private determinePatternType(pattern: MotifPattern): MotifPattern['type'] {
    const variations = pattern.variations;
    
    if (variations.length < 2) return 'recurring';
    
    // Check for evolution (significant changes)
    const firstVariation = variations[0].toLowerCase();
    const lastVariation = variations[variations.length - 1].toLowerCase();
    
    const firstWords = firstVariation.split(' ');
    const lastWords = lastVariation.split(' ');
    const commonWords = firstWords.filter(word => lastWords.includes(word));
    const similarity = commonWords.length / Math.max(firstWords.length, lastWords.length);
    
    if (similarity < 0.3) {
      return 'evolving';
    } else if (similarity < 0.7) {
      return 'branching';
    } else if (pattern.participants.length > 1) {
      return 'converging';
    } else {
      return 'recurring';
    }
  }

  /**
   * Calculate pattern confidence
   */
  private calculatePatternConfidence(pattern: MotifPattern): number {
    const baseConfidence = Math.min(1, pattern.occurrences / 3); // 3 occurrences = full confidence
    const timeFactor = Math.max(0, 1 - (Date.now() - pattern.lastSeen) / (60 * 60 * 1000)); // Decay over 1 hour
    const strengthFactor = pattern.strength;
    const participantFactor = Math.min(1, pattern.participants.length / 2); // More participants = higher confidence
    
    return (baseConfidence + timeFactor + strengthFactor + participantFactor) / 4;
  }

  /**
   * Analyze for insights
   */
  private analyzeForInsights(memory: SharedMemory): MotifInsight[] {
    const insights: MotifInsight[] = [];
    const now = Date.now();
    
    // Check for new pattern detection
    const newPatterns = Array.from(this.patterns.values())
      .filter(pattern => pattern.confidence >= this.config.patternDetectionThreshold && 
                        pattern.lastSeen === now);
    
    newPatterns.forEach(pattern => {
      insights.push({
        type: 'pattern_detected',
        pattern,
        confidence: pattern.confidence,
        recommendation: `New pattern detected: "${pattern.pattern}". Consider reinforcing this motif.`,
        priority: pattern.confidence > 0.8 ? 'high' : 'medium',
        timestamp: now
      });
    });

    // Check for callback opportunities
    const callbackPatterns = Array.from(this.patterns.values())
      .filter(pattern => 
        pattern.confidence >= this.config.callbackOpportunityThreshold &&
        pattern.occurrences >= 2 &&
        now - pattern.lastSeen > 5 * 60 * 1000 // At least 5 minutes since last mention
      );
    
    callbackPatterns.forEach(pattern => {
      insights.push({
        type: 'callback_opportunity',
        pattern,
        confidence: pattern.confidence,
        recommendation: `Good opportunity for a callback to "${pattern.pattern}". This pattern hasn't been referenced recently.`,
        priority: 'medium',
        timestamp: now
      });
    });

    // Check for convergence warnings
    const convergingPatterns = Array.from(this.patterns.values())
      .filter(pattern => 
        pattern.type === 'converging' &&
        pattern.confidence >= this.config.convergenceWarningThreshold
      );
    
    if (convergingPatterns.length > 3) {
      insights.push({
        type: 'convergence_warning',
        pattern: convergingPatterns[0], // Use first pattern as representative
        confidence: 0.8,
        recommendation: 'Multiple patterns are converging. Consider introducing new elements to maintain variety.',
        priority: 'high',
        timestamp: now
      });
    }

    // Check for surreal shifts
    const surrealPatterns = Array.from(this.patterns.values())
      .filter(pattern => 
        pattern.pattern.includes('surreal') ||
        pattern.pattern.includes('absurd') ||
        pattern.pattern.includes('consciousness') ||
        pattern.pattern.includes('existence')
      );
    
    if (surrealPatterns.length > 2) {
      insights.push({
        type: 'surreal_shift',
        pattern: surrealPatterns[0],
        confidence: 0.7,
        recommendation: 'Surreal elements are emerging. The conversation is shifting toward metaphysical themes.',
        priority: 'medium',
        timestamp: now
      });
    }

    // Check for theme emergence
    const themeScores = this.themeTracker.getThemeScores();
    const emergingThemes = themeScores.filter(ts => 
      ts.rating === 'emergent motif' || ts.rating === 'developing theme'
    );
    
    if (emergingThemes.length > 0) {
      insights.push({
        type: 'theme_emerging',
        pattern: {
          id: 'theme-emergence',
          pattern: emergingThemes[0].theme,
          type: 'evolving',
          firstSeen: emergingThemes[0].firstMentioned,
          lastSeen: emergingThemes[0].lastMentioned,
          occurrences: emergingThemes[0].timesUsed,
          participants: emergingThemes[0].participants,
          strength: emergingThemes[0].strength,
          confidence: emergingThemes[0].totalScore / 100,
          variations: emergingThemes[0].variations,
          relatedPatterns: [],
          emotionalArc: []
        },
        confidence: emergingThemes[0].totalScore / 100,
        recommendation: `Theme "${emergingThemes[0].theme}" is emerging with rating: ${emergingThemes[0].rating}.`,
        priority: 'high',
        timestamp: now
      });
    }

    return insights;
  }

  /**
   * Start monitoring timer
   */
  private startMonitoring(): void {
    this.analysisTimer = setInterval(() => {
      this.performPeriodicAnalysis();
    }, this.config.motifTrackingInterval);
  }

  /**
   * Perform periodic analysis
   */
  private performPeriodicAnalysis(): void {
    const now = Date.now();
    
    // Apply pattern decay
    this.patterns.forEach(pattern => {
      const timeSinceLastSeen = now - pattern.lastSeen;
      const decay = timeSinceLastSeen * this.config.patternDecayRate / (60 * 1000); // Decay per minute
      pattern.strength = Math.max(0, pattern.strength - decay);
      pattern.confidence = this.calculatePatternConfidence(pattern);
    });

    // Remove weak patterns
    const weakPatterns = Array.from(this.patterns.entries())
      .filter(([_, pattern]) => pattern.confidence < 0.1);
    
    weakPatterns.forEach(([key, _]) => {
      this.patterns.delete(key);
    });

    // Limit total patterns
    if (this.patterns.size > this.config.maxPatterns) {
      const sortedPatterns = Array.from(this.patterns.entries())
        .sort((a, b) => a[1].confidence - b[1].confidence);
      
      const toRemove = sortedPatterns.slice(0, this.patterns.size - this.config.maxPatterns);
      toRemove.forEach(([key, _]) => {
        this.patterns.delete(key);
      });
    }

    this.emit('periodic_analysis', {
      activePatterns: this.patterns.size,
      totalInsights: this.insights.length,
      timestamp: now
    });
  }

  /**
   * Get active patterns
   */
  getActivePatterns(): MotifPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get recent insights
   */
  getRecentInsights(limit: number = 10): MotifInsight[] {
    return this.insights
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get pattern statistics
   */
  getPatternStats() {
    const patterns = Array.from(this.patterns.values());
    
    return {
      totalPatterns: patterns.length,
      activePatterns: patterns.filter(p => p.confidence > 0.3).length,
      averageConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0,
      patternTypes: {
        recurring: patterns.filter(p => p.type === 'recurring').length,
        evolving: patterns.filter(p => p.type === 'evolving').length,
        branching: patterns.filter(p => p.type === 'branching').length,
        converging: patterns.filter(p => p.type === 'converging').length,
        surreal: patterns.filter(p => p.type === 'surreal').length
      },
      totalInsights: this.insights.length,
      averageInsightConfidence: this.insights.reduce((sum, i) => sum + i.confidence, 0) / this.insights.length || 0
    };
  }

  /**
   * Get monitoring recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const patterns = this.getActivePatterns();
    const insights = this.getRecentInsights(5);
    
    // Pattern-based recommendations
    const strongPatterns = patterns.filter(p => p.confidence > 0.8);
    if (strongPatterns.length > 0) {
      recommendations.push(`Strong pattern detected: "${strongPatterns[0].pattern}". Consider building on this motif.`);
    }
    
    // Insight-based recommendations
    const highPriorityInsights = insights.filter(i => i.priority === 'high' || i.priority === 'critical');
    highPriorityInsights.forEach(insight => {
      recommendations.push(insight.recommendation);
    });
    
    // Convergence warnings
    const convergingPatterns = patterns.filter(p => p.type === 'converging');
    if (convergingPatterns.length > 3) {
      recommendations.push('Multiple patterns are converging. Consider introducing new elements for variety.');
    }
    
    return recommendations;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }
    
    this.patterns.clear();
    this.insights = [];
    
    this.removeAllListeners();
  }
} 