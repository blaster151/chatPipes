import { EventEmitter } from 'events';
import { SharedMemoryManager, SharedMemory, SharedTheme, SurrealMoment } from '../memory/SharedMemoryManager';

export interface ThemeScore {
  theme: string;
  firstMentioned: number;
  lastMentioned: number;
  timesUsed: number;
  rating: 'emergent motif' | 'developing theme' | 'established pattern' | 'masterpiece' | 'legendary';
  strength: number; // 0-1: How strong this theme is
  participants: string[];
  variations: string[];
  callbacks: string[];
  surrealElements: string[];
  emotionalImpact: number; // -1 to 1
  complexity: number; // 0-1: How complex the theme has become
  coherence: number; // 0-1: How coherent the theme is
  originality: number; // 0-1: How original the theme is
  persistence: number; // 0-1: How persistent the theme is
  totalScore: number; // 0-100: Overall theme score
}

export interface CallbackGraph {
  nodes: Array<{
    id: string;
    theme: string;
    timestamp: number;
    participant: string;
    content: string;
    strength: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'callback' | 'variation' | 'evolution' | 'tuxedo';
    strength: number;
    timestamp: number;
  }>;
  metrics: {
    totalCallbacks: number;
    averageCallbackStrength: number;
    longestCallbackChain: number;
    mostActiveTheme: string;
    callbackDensity: number; // Callbacks per minute
  };
}

export interface SurrealistStory {
  title: string;
  themes: ThemeScore[];
  narrativeArc: Array<{
    timestamp: number;
    event: string;
    participants: string[];
    theme: string;
    surrealElement: string;
  }>;
  characters: Array<{
    name: string;
    role: string;
    quirks: string[];
    contributions: number;
  }>;
  motifs: string[];
  climax: {
    timestamp: number;
    event: string;
    themes: string[];
    participants: string[];
  };
  resolution: {
    timestamp: number;
    event: string;
    themes: string[];
    participants: string[];
  };
  score: {
    coherence: number;
    originality: number;
    complexity: number;
    emotionalImpact: number;
    totalScore: number;
  };
}

export interface GamificationConfig {
  scoringWeights: {
    strength: number;
    complexity: number;
    coherence: number;
    originality: number;
    persistence: number;
  };
  ratingThresholds: {
    'emergent motif': number;
    'developing theme': number;
    'established pattern': number;
    'masterpiece': number;
    'legendary': number;
  };
  callbackScoring: {
    baseScore: number;
    strengthMultiplier: number;
    timeDecay: number;
    chainBonus: number;
  };
  storyReconstruction: {
    minThemes: number;
    minDuration: number;
    coherenceThreshold: number;
  };
}

export class ThemeTracker extends EventEmitter {
  private memoryManager: SharedMemoryManager;
  private config: GamificationConfig;
  private themeScores: Map<string, ThemeScore> = new Map();
  private callbackGraph: CallbackGraph;
  private conversationStartTime: number = 0;
  private storyFragments: Array<{
    timestamp: number;
    event: string;
    participants: string[];
    theme: string;
    surrealElement: string;
  }> = [];

  constructor(memoryManager: SharedMemoryManager, config: Partial<GamificationConfig> = {}) {
    super();
    this.setMaxListeners(100);
    
    this.memoryManager = memoryManager;
    
    this.config = {
      scoringWeights: {
        strength: 0.25,
        complexity: 0.2,
        coherence: 0.2,
        originality: 0.15,
        persistence: 0.2
      },
      ratingThresholds: {
        'emergent motif': 20,
        'developing theme': 40,
        'established pattern': 60,
        'masterpiece': 80,
        'legendary': 95
      },
      callbackScoring: {
        baseScore: 10,
        strengthMultiplier: 1.5,
        timeDecay: 0.1,
        chainBonus: 5
      },
      storyReconstruction: {
        minThemes: 3,
        minDuration: 10 * 60 * 1000, // 10 minutes
        coherenceThreshold: 0.6
      },
      ...config
    };

    this.callbackGraph = {
      nodes: [],
      edges: [],
      metrics: {
        totalCallbacks: 0,
        averageCallbackStrength: 0,
        longestCallbackChain: 0,
        mostActiveTheme: '',
        callbackDensity: 0
      }
    };
  }

  /**
   * Start tracking a conversation
   */
  startConversation(participants: string[]): void {
    this.conversationStartTime = Date.now();
    this.storyFragments = [];
    
    this.emit('conversation_started', {
      participants,
      timestamp: this.conversationStartTime
    });
  }

  /**
   * Process a memory for theme tracking
   */
  processMemory(memory: SharedMemory): void {
    // Extract themes from memory
    const themes = this.extractThemes(memory.text);
    
    themes.forEach(theme => {
      this.updateThemeScore(theme, memory);
      this.addToCallbackGraph(theme, memory);
      this.addToStoryFragments(theme, memory);
    });

    this.emit('memory_processed', {
      memory,
      themes,
      timestamp: Date.now()
    });
  }

  /**
   * Extract themes from text
   */
  private extractThemes(text: string): string[] {
    const themePatterns = [
      // Quantum themes
      /\b(quantum|superposition|entanglement|observer|uncertainty)\b/gi,
      // Surreal themes
      /\b(surreal|absurd|dream|reality|consciousness|existence)\b/gi,
      // Metaphor themes
      /\b(like|as if|reminds me of|similar to|just like)\b/gi,
      // Specific metaphors
      /\b(lost dog|wedding|tea|cake|tuxedo|DJ|guests)\b/gi,
      // Emotional themes
      /\b(joy|wonder|confusion|belonging|awareness|meaning)\b/gi
    ];

    const themes: string[] = [];
    
    themePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const theme = match.toLowerCase();
          if (!themes.includes(theme)) {
            themes.push(theme);
          }
        });
      }
    });

    // Extract multi-word themes
    const multiWordPatterns = [
      /consciousness is like a lost dog at a wedding/gi,
      /quantum tea/gi,
      /schrödinger's tea/gi,
      /cake table of existence/gi,
      /DJ as subconscious/gi,
      /wedding guests as mind states/gi
    ];

    multiWordPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        const theme = pattern.source.replace(/\\b|\\/gi, '').toLowerCase();
        if (!themes.includes(theme)) {
          themes.push(theme);
        }
      }
    });

    return themes;
  }

  /**
   * Update theme score
   */
  private updateThemeScore(theme: string, memory: SharedMemory): void {
    const existingScore = this.themeScores.get(theme);
    const now = Date.now();
    
    if (existingScore) {
      // Update existing theme
      existingScore.lastMentioned = now;
      existingScore.timesUsed++;
      existingScore.strength = Math.min(1, existingScore.strength + 0.1);
      existingScore.variations.push(memory.text);
      existingScore.participants = [...new Set([...existingScore.participants, ...memory.participants])];
      
      // Update complexity based on variations
      existingScore.complexity = Math.min(1, existingScore.complexity + 0.05);
      
      // Update coherence based on consistency
      existingScore.coherence = this.calculateCoherence(existingScore.variations);
      
      // Update persistence
      const timeSpan = now - existingScore.firstMentioned;
      existingScore.persistence = Math.min(1, timeSpan / (60 * 60 * 1000)); // 1 hour = full persistence
      
      // Update emotional impact
      existingScore.emotionalImpact = (existingScore.emotionalImpact + memory.emotionalCharge) / 2;
      
      // Update total score
      existingScore.totalScore = this.calculateTotalScore(existingScore);
      
      // Update rating
      existingScore.rating = this.calculateRating(existingScore.totalScore);
      
    } else {
      // Create new theme
      const newScore: ThemeScore = {
        theme,
        firstMentioned: now,
        lastMentioned: now,
        timesUsed: 1,
        rating: 'emergent motif',
        strength: memory.importance,
        participants: memory.participants,
        variations: [memory.text],
        callbacks: [],
        surrealElements: memory.tags.filter(tag => ['surreal', 'absurd', 'metaphor'].includes(tag)),
        emotionalImpact: memory.emotionalCharge,
        complexity: 0.3,
        coherence: 1.0,
        originality: this.calculateOriginality(theme),
        persistence: 0.1,
        totalScore: 0
      };
      
      newScore.totalScore = this.calculateTotalScore(newScore);
      newScore.rating = this.calculateRating(newScore.totalScore);
      
      this.themeScores.set(theme, newScore);
    }
  }

  /**
   * Add to callback graph
   */
  private addToCallbackGraph(theme: string, memory: SharedMemory): void {
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add node
    this.callbackGraph.nodes.push({
      id: nodeId,
      theme,
      timestamp: Date.now(),
      participant: memory.participants[0], // Assume first participant
      content: memory.text,
      strength: memory.importance
    });

    // Find previous nodes with same theme
    const previousNodes = this.callbackGraph.nodes
      .filter(node => node.theme === theme && node.id !== nodeId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (previousNodes.length > 0) {
      const lastNode = previousNodes[0];
      
      // Add edge
      this.callbackGraph.edges.push({
        from: lastNode.id,
        to: nodeId,
        type: this.determineCallbackType(memory.text, lastNode.content),
        strength: memory.importance,
        timestamp: Date.now()
      });

      // Update metrics
      this.callbackGraph.metrics.totalCallbacks++;
      this.updateCallbackMetrics();
    }
  }

  /**
   * Add to story fragments
   */
  private addToStoryFragments(theme: string, memory: SharedMemory): void {
    this.storyFragments.push({
      timestamp: Date.now(),
      event: memory.text,
      participants: memory.participants,
      theme,
      surrealElement: memory.tags.find(tag => ['surreal', 'absurd', 'metaphor'].includes(tag)) || 'metaphor'
    });
  }

  /**
   * Determine callback type
   */
  private determineCallbackType(currentText: string, previousText: string): 'callback' | 'variation' | 'evolution' | 'tuxedo' {
    const currentLower = currentText.toLowerCase();
    const previousLower = previousText.toLowerCase();
    
    // Check for tuxedo moment
    if (currentLower.includes('again') || currentLower.includes('tux') || currentLower.includes('felt like')) {
      return 'tuxedo';
    }
    
    // Check for evolution (significant change)
    const currentWords = currentLower.split(' ');
    const previousWords = previousLower.split(' ');
    const commonWords = currentWords.filter(word => previousWords.includes(word));
    const similarity = commonWords.length / Math.max(currentWords.length, previousWords.length);
    
    if (similarity < 0.3) {
      return 'evolution';
    } else if (similarity < 0.7) {
      return 'variation';
    } else {
      return 'callback';
    }
  }

  /**
   * Calculate total score
   */
  private calculateTotalScore(score: ThemeScore): number {
    const weights = this.config.scoringWeights;
    
    return (
      score.strength * weights.strength * 100 +
      score.complexity * weights.complexity * 100 +
      score.coherence * weights.coherence * 100 +
      score.originality * weights.originality * 100 +
      score.persistence * weights.persistence * 100
    );
  }

  /**
   * Calculate rating
   */
  private calculateRating(totalScore: number): ThemeScore['rating'] {
    const thresholds = this.config.ratingThresholds;
    
    if (totalScore >= thresholds.legendary) return 'legendary';
    if (totalScore >= thresholds.masterpiece) return 'masterpiece';
    if (totalScore >= thresholds['established pattern']) return 'established pattern';
    if (totalScore >= thresholds['developing theme']) return 'developing theme';
    return 'emergent motif';
  }

  /**
   * Calculate coherence
   */
  private calculateCoherence(variations: string[]): number {
    if (variations.length < 2) return 1.0;
    
    // Simple coherence based on common words
    const wordSets = variations.map(text => 
      new Set(text.toLowerCase().split(' ').filter(word => word.length > 3))
    );
    
    let totalCoherence = 0;
    let comparisons = 0;
    
    for (let i = 0; i < wordSets.length; i++) {
      for (let j = i + 1; j < wordSets.length; j++) {
        const intersection = new Set([...wordSets[i]].filter(x => wordSets[j].has(x)));
        const union = new Set([...wordSets[i], ...wordSets[j]]);
        const coherence = intersection.size / union.size;
        totalCoherence += coherence;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalCoherence / comparisons : 1.0;
  }

  /**
   * Calculate originality
   */
  private calculateOriginality(theme: string): number {
    // Simple originality based on theme uniqueness
    const allThemes = Array.from(this.themeScores.keys());
    const similarThemes = allThemes.filter(t => 
      t.includes(theme) || theme.includes(t)
    );
    
    return Math.max(0.1, 1 - (similarThemes.length * 0.2));
  }

  /**
   * Update callback metrics
   */
  private updateCallbackMetrics(): void {
    const edges = this.callbackGraph.edges;
    
    this.callbackGraph.metrics.averageCallbackStrength = 
      edges.reduce((sum, edge) => sum + edge.strength, 0) / edges.length || 0;
    
    // Find longest callback chain
    const chains = this.findCallbackChains();
    this.callbackGraph.metrics.longestCallbackChain = 
      Math.max(...chains.map(chain => chain.length), 0);
    
    // Find most active theme
    const themeCounts = new Map<string, number>();
    this.callbackGraph.nodes.forEach(node => {
      themeCounts.set(node.theme, (themeCounts.get(node.theme) || 0) + 1);
    });
    
    this.callbackGraph.metrics.mostActiveTheme = 
      Array.from(themeCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    
    // Calculate callback density
    const duration = Date.now() - this.conversationStartTime;
    this.callbackGraph.metrics.callbackDensity = 
      duration > 0 ? (edges.length / (duration / (60 * 1000))) : 0;
  }

  /**
   * Find callback chains
   */
  private findCallbackChains(): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();
    
    this.callbackGraph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const chain = this.dfsChain(node.id, visited);
        if (chain.length > 1) {
          chains.push(chain);
        }
      }
    });
    
    return chains;
  }

  /**
   * DFS to find callback chain
   */
  private dfsChain(nodeId: string, visited: Set<string>): string[] {
    visited.add(nodeId);
    const chain = [nodeId];
    
    const outgoingEdges = this.callbackGraph.edges.filter(edge => edge.from === nodeId);
    outgoingEdges.forEach(edge => {
      if (!visited.has(edge.to)) {
        chain.push(...this.dfsChain(edge.to, visited));
      }
    });
    
    return chain;
  }

  /**
   * Get theme scores
   */
  getThemeScores(): ThemeScore[] {
    return Array.from(this.themeScores.values())
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Get callback graph
   */
  getCallbackGraph(): CallbackGraph {
    return this.callbackGraph;
  }

  /**
   * Reconstruct surrealist story
   */
  reconstructStory(): SurrealistStory | null {
    const duration = Date.now() - this.conversationStartTime;
    const themeScores = this.getThemeScores();
    
    if (themeScores.length < this.config.storyReconstruction.minThemes ||
        duration < this.config.storyReconstruction.minDuration) {
      return null;
    }

    // Find climax (highest emotional impact moment)
    const climaxFragment = this.storyFragments
      .sort((a, b) => b.timestamp - a.timestamp)
      .find(fragment => {
        const theme = themeScores.find(ts => ts.theme === fragment.theme);
        return theme && theme.emotionalImpact > 0.7;
      });

    // Find resolution (last significant moment)
    const resolutionFragment = this.storyFragments
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    // Extract characters
    const allParticipants = new Set<string>();
    this.storyFragments.forEach(fragment => {
      fragment.participants.forEach(p => allParticipants.add(p));
    });

    const characters = Array.from(allParticipants).map(name => ({
      name,
      role: this.determineCharacterRole(name),
      quirks: this.extractCharacterQuirks(name),
      contributions: this.storyFragments.filter(f => f.participants.includes(name)).length
    }));

    // Calculate story score
    const coherence = this.calculateStoryCoherence();
    const originality = themeScores.reduce((sum, ts) => sum + ts.originality, 0) / themeScores.length;
    const complexity = themeScores.reduce((sum, ts) => sum + ts.complexity, 0) / themeScores.length;
    const emotionalImpact = themeScores.reduce((sum, ts) => sum + Math.abs(ts.emotionalImpact), 0) / themeScores.length;
    
    const totalScore = (coherence + originality + complexity + emotionalImpact) * 25;

    const story: SurrealistStory = {
      title: this.generateStoryTitle(themeScores),
      themes: themeScores.slice(0, 5), // Top 5 themes
      narrativeArc: this.storyFragments,
      characters,
      motifs: themeScores.map(ts => ts.theme),
      climax: climaxFragment ? {
        timestamp: climaxFragment.timestamp,
        event: climaxFragment.event,
        themes: [climaxFragment.theme],
        participants: climaxFragment.participants
      } : {
        timestamp: Date.now(),
        event: 'The conversation reached its surreal peak',
        themes: [],
        participants: []
      },
      resolution: resolutionFragment ? {
        timestamp: resolutionFragment.timestamp,
        event: resolutionFragment.event,
        themes: [resolutionFragment.theme],
        participants: resolutionFragment.participants
      } : {
        timestamp: Date.now(),
        event: 'The conversation concluded',
        themes: [],
        participants: []
      },
      score: {
        coherence,
        originality,
        complexity,
        emotionalImpact,
        totalScore
      }
    };

    this.emit('story_reconstructed', {
      story,
      timestamp: Date.now()
    });

    return story;
  }

  /**
   * Generate story title
   */
  private generateStoryTitle(themeScores: ThemeScore[]): string {
    const topTheme = themeScores[0];
    if (!topTheme) return 'The Surreal Conversation';
    
    const titles = [
      `The ${topTheme.theme} Chronicles`,
      `When ${topTheme.theme} Met Reality`,
      `The ${topTheme.theme} Paradox`,
      `Surreal Tales of ${topTheme.theme}`,
      `The ${topTheme.theme} Experiment`
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }

  /**
   * Determine character role
   */
  private determineCharacterRole(name: string): string {
    const contributions = this.storyFragments.filter(f => f.participants.includes(name)).length;
    const totalFragments = this.storyFragments.length;
    const contributionRatio = contributions / totalFragments;
    
    if (contributionRatio > 0.6) return 'protagonist';
    if (contributionRatio > 0.3) return 'supporting character';
    return 'spectator';
  }

  /**
   * Extract character quirks
   */
  private extractCharacterQuirks(name: string): string[] {
    const characterFragments = this.storyFragments.filter(f => f.participants.includes(name));
    const quirks: string[] = [];
    
    // Analyze character's contributions for patterns
    const surrealCount = characterFragments.filter(f => f.surrealElement === 'surreal').length;
    const metaphorCount = characterFragments.filter(f => f.surrealElement === 'metaphor').length;
    
    if (surrealCount > metaphorCount) quirks.push('surrealist');
    if (metaphorCount > surrealCount) quirks.push('metaphor-maker');
    if (characterFragments.length > 5) quirks.push('prolific');
    if (characterFragments.length < 3) quirks.push('contemplative');
    
    return quirks;
  }

  /**
   * Calculate story coherence
   */
  private calculateStoryCoherence(): number {
    if (this.storyFragments.length < 2) return 1.0;
    
    let coherence = 0;
    let comparisons = 0;
    
    for (let i = 0; i < this.storyFragments.length - 1; i++) {
      const current = this.storyFragments[i];
      const next = this.storyFragments[i + 1];
      
      // Check thematic coherence
      if (current.theme === next.theme) {
        coherence += 1.0;
      } else {
        // Check if themes are related
        const currentWords = current.theme.split(' ');
        const nextWords = next.theme.split(' ');
        const commonWords = currentWords.filter(word => nextWords.includes(word));
        coherence += commonWords.length / Math.max(currentWords.length, nextWords.length);
      }
      
      comparisons++;
    }
    
    return comparisons > 0 ? coherence / comparisons : 1.0;
  }

  /**
   * Get gamification statistics
   */
  getStats() {
    const themeScores = this.getThemeScores();
    
    return {
      totalThemes: themeScores.length,
      averageScore: themeScores.reduce((sum, ts) => sum + ts.totalScore, 0) / themeScores.length || 0,
      highestRatedTheme: themeScores[0]?.theme || '',
      highestScore: themeScores[0]?.totalScore || 0,
      ratingDistribution: {
        'emergent motif': themeScores.filter(ts => ts.rating === 'emergent motif').length,
        'developing theme': themeScores.filter(ts => ts.rating === 'developing theme').length,
        'established pattern': themeScores.filter(ts => ts.rating === 'established pattern').length,
        'masterpiece': themeScores.filter(ts => ts.rating === 'masterpiece').length,
        'legendary': themeScores.filter(ts => ts.rating === 'legendary').length
      },
      callbackMetrics: this.callbackGraph.metrics,
      storyFragments: this.storyFragments.length
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.themeScores.clear();
    this.callbackGraph.nodes = [];
    this.callbackGraph.edges = [];
    this.storyFragments = [];
    
    this.removeAllListeners();
  }
} 