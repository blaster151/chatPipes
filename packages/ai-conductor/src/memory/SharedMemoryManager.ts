import { EventEmitter } from 'events';

export interface SharedMemory {
  id: string;
  type: 'joke' | 'metaphor' | 'moment' | 'theme' | 'callback' | 'surreal' | 'emotional';
  text: string;
  participants: string[];
  timestamp: number;
  importance: number; // 0-1: How significant this memory is
  emotionalCharge: number; // -1 to 1: negative to positive
  callbackCount: number; // How many times this has been referenced
  lastReferenced: number;
  tags: string[];
  context: string; // What was happening when this memory was created
  relatedMemories: string[]; // IDs of related memories
  strength: number; // 0-1: How strong this memory is (decays over time)
  isActive: boolean; // Whether this memory is currently being referenced
}

export interface CallbackTrigger {
  id: string;
  memoryId: string;
  trigger: string; // What should trigger this callback
  context: string; // When to inject this callback
  frequency: number; // 0-1: How often to trigger (0 = never, 1 = always)
  lastTriggered: number;
  successCount: number; // How many times this callback was successfully used
  failureCount: number; // How many times this callback failed
}

export interface RunningJoke {
  id: string;
  name: string;
  description: string;
  participants: string[];
  setup: string; // The original setup
  punchlines: string[]; // Different ways the joke has been delivered
  variations: string[]; // Different variations of the joke
  callbacks: string[]; // References to this joke
  timestamp: number;
  lastUsed: number;
  usageCount: number;
  strength: number; // 0-1: How strong this joke is
  isActive: boolean;
  tags: string[];
}

export interface SharedTheme {
  id: string;
  name: string;
  description: string;
  participants: string[];
  manifestations: string[]; // How this theme has manifested
  emotionalTone: string;
  intensity: number; // 0-1: How intense this theme is
  timestamp: number;
  lastManifested: number;
  manifestationCount: number;
  isActive: boolean;
  tags: string[];
}

export interface SurrealMoment {
  id: string;
  description: string;
  participants: string[];
  surrealElements: string[];
  emotionalImpact: number; // -1 to 1
  timestamp: number;
  callbackCount: number;
  lastReferenced: number;
  strength: number;
  isActive: boolean;
  tags: string[];
}

export interface MemoryConfig {
  maxMemories: number;
  decayRate: number; // How quickly memories lose strength
  callbackThreshold: number; // Minimum strength for callbacks
  jokeThreshold: number; // Minimum strength for running jokes
  themeThreshold: number; // Minimum strength for shared themes
  surrealThreshold: number; // Minimum strength for surreal moments
  reinforcementInterval: number; // How often to reinforce memories
  callbackFrequency: number; // How often to inject callbacks
}

export interface MemoryInjection {
  type: 'callback' | 'joke' | 'theme' | 'surreal' | 'reinforcement';
  content: string;
  priority: number; // 0-1: How important this injection is
  context: string; // When to use this injection
  participants: string[];
}

export class SharedMemoryManager extends EventEmitter {
  private sharedMemories: Map<string, SharedMemory> = new Map();
  private callbackTriggers: Map<string, CallbackTrigger> = new Map();
  private runningJokes: Map<string, RunningJoke> = new Map();
  private sharedThemes: Map<string, SharedTheme> = new Map();
  private surrealMoments: Map<string, SurrealMoment> = new Map();
  private config: MemoryConfig;
  private reinforcementTimer?: NodeJS.Timeout;

  constructor(config: Partial<MemoryConfig> = {}) {
    super();
    this.setMaxListeners(100);
    
    this.config = {
      maxMemories: 1000,
      decayRate: 0.01, // 1% decay per hour
      callbackThreshold: 0.3,
      jokeThreshold: 0.5,
      themeThreshold: 0.4,
      surrealThreshold: 0.6,
      reinforcementInterval: 5 * 60 * 1000, // 5 minutes
      callbackFrequency: 0.3, // 30% chance per interaction
      ...config
    };

    this.startReinforcementTimer();
  }

  /**
   * Capture a shared memory
   */
  captureMemory(
    type: SharedMemory['type'],
    text: string,
    participants: string[],
    importance: number = 0.5,
    emotionalCharge: number = 0,
    context: string = '',
    tags: string[] = []
  ): SharedMemory {
    const id = `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: SharedMemory = {
      id,
      type,
      text,
      participants,
      timestamp: Date.now(),
      importance,
      emotionalCharge,
      callbackCount: 0,
      lastReferenced: Date.now(),
      tags,
      context,
      relatedMemories: [],
      strength: importance,
      isActive: true
    };

    this.sharedMemories.set(id, memory);

    // Check if this should become a running joke, theme, or surreal moment
    this.processMemoryForSpecialTypes(memory);

    this.emit('memory_captured', {
      memory,
      timestamp: Date.now()
    });

    return memory;
  }

  /**
   * Process memory for special types (jokes, themes, surreal moments)
   */
  private processMemoryForSpecialTypes(memory: SharedMemory): void {
    // Check for running joke potential
    if (memory.type === 'joke' && memory.importance > this.config.jokeThreshold) {
      this.createRunningJoke(memory);
    }

    // Check for shared theme potential
    if (memory.type === 'theme' && memory.importance > this.config.themeThreshold) {
      this.createSharedTheme(memory);
    }

    // Check for surreal moment potential
    if (memory.type === 'surreal' && memory.importance > this.config.surrealThreshold) {
      this.createSurrealMoment(memory);
    }

    // Create callback trigger
    if (memory.importance > this.config.callbackThreshold) {
      this.createCallbackTrigger(memory);
    }
  }

  /**
   * Create a running joke from a memory
   */
  private createRunningJoke(memory: SharedMemory): void {
    const jokeId = `joke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const joke: RunningJoke = {
      id: jokeId,
      name: this.extractJokeName(memory.text),
      description: memory.text,
      participants: memory.participants,
      setup: memory.text,
      punchlines: [memory.text],
      variations: [],
      callbacks: [],
      timestamp: Date.now(),
      lastUsed: Date.now(),
      usageCount: 1,
      strength: memory.importance,
      isActive: true,
      tags: memory.tags
    };

    this.runningJokes.set(jokeId, joke);

    this.emit('running_joke_created', {
      joke,
      sourceMemory: memory,
      timestamp: Date.now()
    });
  }

  /**
   * Create a shared theme from a memory
   */
  private createSharedTheme(memory: SharedMemory): void {
    const themeId = `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const theme: SharedTheme = {
      id: themeId,
      name: this.extractThemeName(memory.text),
      description: memory.text,
      participants: memory.participants,
      manifestations: [memory.text],
      emotionalTone: this.determineEmotionalTone(memory.emotionalCharge),
      intensity: memory.importance,
      timestamp: Date.now(),
      lastManifested: Date.now(),
      manifestationCount: 1,
      isActive: true,
      tags: memory.tags
    };

    this.sharedThemes.set(themeId, theme);

    this.emit('shared_theme_created', {
      theme,
      sourceMemory: memory,
      timestamp: Date.now()
    });
  }

  /**
   * Create a surreal moment from a memory
   */
  private createSurrealMoment(memory: SharedMemory): void {
    const surrealId = `surreal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const surreal: SurrealMoment = {
      id: surrealId,
      description: memory.text,
      participants: memory.participants,
      surrealElements: this.extractSurrealElements(memory.text),
      emotionalImpact: memory.emotionalCharge,
      timestamp: Date.now(),
      callbackCount: 0,
      lastReferenced: Date.now(),
      strength: memory.importance,
      isActive: true,
      tags: memory.tags
    };

    this.surrealMoments.set(surrealId, surreal);

    this.emit('surreal_moment_created', {
      surreal,
      sourceMemory: memory,
      timestamp: Date.now()
    });
  }

  /**
   * Create a callback trigger for a memory
   */
  private createCallbackTrigger(memory: SharedMemory): void {
    const triggerId = `trigger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const trigger: CallbackTrigger = {
      id: triggerId,
      memoryId: memory.id,
      trigger: this.generateTrigger(memory),
      context: this.generateContext(memory),
      frequency: memory.importance,
      lastTriggered: 0,
      successCount: 0,
      failureCount: 0
    };

    this.callbackTriggers.set(triggerId, trigger);
  }

  /**
   * Get relevant memories for a conversation
   */
  getRelevantMemories(participants: string[], context: string = '', limit: number = 10): SharedMemory[] {
    const relevantMemories = Array.from(this.sharedMemories.values())
      .filter(memory => 
        memory.isActive &&
        memory.participants.some(p => participants.includes(p)) &&
        memory.strength > this.config.callbackThreshold
      )
      .sort((a, b) => {
        // Sort by relevance (context match), strength, and recency
        const contextMatchA = this.calculateContextMatch(a, context);
        const contextMatchB = this.calculateContextMatch(b, context);
        
        const relevanceA = contextMatchA * 0.4 + a.strength * 0.4 + (Date.now() - a.lastReferenced) / (24 * 60 * 60 * 1000) * 0.2;
        const relevanceB = contextMatchB * 0.4 + b.strength * 0.4 + (Date.now() - b.lastReferenced) / (24 * 60 * 60 * 1000) * 0.2;
        
        return relevanceB - relevanceA;
      })
      .slice(0, limit);

    return relevantMemories;
  }

  /**
   * Get active running jokes for participants
   */
  getActiveJokes(participants: string[]): RunningJoke[] {
    return Array.from(this.runningJokes.values())
      .filter(joke => 
        joke.isActive &&
        joke.participants.some(p => participants.includes(p)) &&
        joke.strength > this.config.jokeThreshold
      )
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Get active shared themes for participants
   */
  getActiveThemes(participants: string[]): SharedTheme[] {
    return Array.from(this.sharedThemes.values())
      .filter(theme => 
        theme.isActive &&
        theme.participants.some(p => participants.includes(p)) &&
        theme.intensity > this.config.themeThreshold
      )
      .sort((a, b) => b.intensity - a.intensity);
  }

  /**
   * Get active surreal moments for participants
   */
  getActiveSurrealMoments(participants: string[]): SurrealMoment[] {
    return Array.from(this.surrealMoments.values())
      .filter(surreal => 
        surreal.isActive &&
        surreal.participants.some(p => participants.includes(p)) &&
        surreal.strength > this.config.surrealThreshold
      )
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Generate memory injections for a conversation
   */
  generateMemoryInjections(participants: string[], context: string = ''): MemoryInjection[] {
    const injections: MemoryInjection[] = [];

    // Get relevant memories
    const relevantMemories = this.getRelevantMemories(participants, context, 5);
    
    // Add callbacks
    relevantMemories.forEach(memory => {
      if (Math.random() < this.config.callbackFrequency) {
        injections.push({
          type: 'callback',
          content: `If appropriate, reference the earlier moment: "${memory.text}"`,
          priority: memory.strength,
          context: 'conversation',
          participants: memory.participants
        });
      }
    });

    // Add running jokes
    const activeJokes = this.getActiveJokes(participants);
    activeJokes.forEach(joke => {
      if (Math.random() < 0.2) { // 20% chance to reference a joke
        injections.push({
          type: 'joke',
          content: `Consider referencing the running joke about "${joke.name}" if it fits naturally`,
          priority: joke.strength,
          context: 'humor',
          participants: joke.participants
        });
      }
    });

    // Add shared themes
    const activeThemes = this.getActiveThemes(participants);
    activeThemes.forEach(theme => {
      if (Math.random() < 0.3) { // 30% chance to reinforce theme
        injections.push({
          type: 'theme',
          content: `Continue developing the shared theme of "${theme.name}" if relevant`,
          priority: theme.intensity,
          context: 'thematic',
          participants: theme.participants
        });
      }
    });

    // Add surreal moments
    const activeSurreal = this.getActiveSurrealMoments(participants);
    activeSurreal.forEach(surreal => {
      if (Math.random() < 0.15) { // 15% chance to reference surreal moment
        injections.push({
          type: 'surreal',
          content: `Consider referencing the surreal moment about "${surreal.description.substring(0, 50)}..." if it fits`,
          priority: surreal.strength,
          context: 'surreal',
          participants: surreal.participants
        });
      }
    });

    // Sort by priority
    injections.sort((a, b) => b.priority - a.priority);

    return injections;
  }

  /**
   * Record a callback usage
   */
  recordCallbackUsage(memoryId: string, success: boolean = true): void {
    const memory = this.sharedMemories.get(memoryId);
    if (memory) {
      memory.callbackCount++;
      memory.lastReferenced = Date.now();
      memory.strength = Math.min(1, memory.strength + 0.1); // Strengthen memory on usage
    }

    // Update callback triggers
    const triggers = Array.from(this.callbackTriggers.values())
      .filter(trigger => trigger.memoryId === memoryId);
    
    triggers.forEach(trigger => {
      if (success) {
        trigger.successCount++;
      } else {
        trigger.failureCount++;
      }
      trigger.lastTriggered = Date.now();
    });
  }

  /**
   * Add variation to a running joke
   */
  addJokeVariation(jokeId: string, variation: string): void {
    const joke = this.runningJokes.get(jokeId);
    if (joke) {
      joke.variations.push(variation);
      joke.usageCount++;
      joke.lastUsed = Date.now();
      joke.strength = Math.min(1, joke.strength + 0.05);
    }
  }

  /**
   * Add manifestation to a shared theme
   */
  addThemeManifestation(themeId: string, manifestation: string): void {
    const theme = this.sharedThemes.get(themeId);
    if (theme) {
      theme.manifestations.push(manifestation);
      theme.manifestationCount++;
      theme.lastManifested = Date.now();
      theme.intensity = Math.min(1, theme.intensity + 0.05);
    }
  }

  /**
   * Start reinforcement timer
   */
  private startReinforcementTimer(): void {
    this.reinforcementTimer = setInterval(() => {
      this.reinforceMemories();
    }, this.config.reinforcementInterval);
  }

  /**
   * Reinforce active memories
   */
  private reinforceMemories(): void {
    const now = Date.now();
    
    // Apply decay to all memories
    this.sharedMemories.forEach(memory => {
      const hoursSinceLastUse = (now - memory.lastReferenced) / (60 * 60 * 1000);
      const decay = hoursSinceLastUse * this.config.decayRate;
      memory.strength = Math.max(0, memory.strength - decay);
      
      if (memory.strength < 0.1) {
        memory.isActive = false;
      }
    });

    // Apply decay to running jokes
    this.runningJokes.forEach(joke => {
      const hoursSinceLastUse = (now - joke.lastUsed) / (60 * 60 * 1000);
      const decay = hoursSinceLastUse * this.config.decayRate;
      joke.strength = Math.max(0, joke.strength - decay);
      
      if (joke.strength < 0.1) {
        joke.isActive = false;
      }
    });

    // Apply decay to shared themes
    this.sharedThemes.forEach(theme => {
      const hoursSinceLastUse = (now - theme.lastManifested) / (60 * 60 * 1000);
      const decay = hoursSinceLastUse * this.config.decayRate;
      theme.intensity = Math.max(0, theme.intensity - decay);
      
      if (theme.intensity < 0.1) {
        theme.isActive = false;
      }
    });

    this.emit('memories_reinforced', {
      timestamp: now,
      activeMemories: Array.from(this.sharedMemories.values()).filter(m => m.isActive).length,
      activeJokes: Array.from(this.runningJokes.values()).filter(j => j.isActive).length,
      activeThemes: Array.from(this.sharedThemes.values()).filter(t => t.isActive).length
    });
  }

  /**
   * Helper methods
   */
  private extractJokeName(text: string): string {
    // Simple extraction - could be more sophisticated
    const words = text.split(' ').slice(0, 3).join(' ');
    return words.length > 20 ? words.substring(0, 20) + '...' : words;
  }

  private extractThemeName(text: string): string {
    // Extract key theme words
    const themeWords = text.toLowerCase().match(/\b(quantum|surreal|absurd|magical|dream|reality|existence|consciousness)\b/g);
    return themeWords ? themeWords[0] : 'shared experience';
  }

  private determineEmotionalTone(emotionalCharge: number): string {
    if (emotionalCharge > 0.5) return 'joyful';
    if (emotionalCharge > 0.2) return 'positive';
    if (emotionalCharge > -0.2) return 'neutral';
    if (emotionalCharge > -0.5) return 'melancholic';
    return 'dark';
  }

  private extractSurrealElements(text: string): string[] {
    const surrealKeywords = ['quantum', 'surreal', 'absurd', 'dream', 'reality', 'existence', 'consciousness', 'magical'];
    return surrealKeywords.filter(keyword => text.toLowerCase().includes(keyword));
  }

  private generateTrigger(memory: SharedMemory): string {
    // Generate contextual triggers for callbacks
    const triggers = [
      `when discussing ${memory.tags.join(' or ')}`,
      `if the conversation becomes ${memory.type}`,
      `when similar emotions arise`,
      `if the context reminds you of this moment`
    ];
    return triggers[Math.floor(Math.random() * triggers.length)];
  }

  private generateContext(memory: SharedMemory): string {
    return `conversation involving ${memory.participants.join(' and ')}`;
  }

  private calculateContextMatch(memory: SharedMemory, context: string): number {
    if (!context) return 0.5;
    
    const memoryWords = memory.text.toLowerCase().split(' ');
    const contextWords = context.toLowerCase().split(' ');
    const commonWords = memoryWords.filter(word => contextWords.includes(word));
    
    return commonWords.length / Math.max(memoryWords.length, contextWords.length);
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      totalMemories: this.sharedMemories.size,
      activeMemories: Array.from(this.sharedMemories.values()).filter(m => m.isActive).length,
      totalJokes: this.runningJokes.size,
      activeJokes: Array.from(this.runningJokes.values()).filter(j => j.isActive).length,
      totalThemes: this.sharedThemes.size,
      activeThemes: Array.from(this.sharedThemes.values()).filter(t => t.isActive).length,
      totalSurreal: this.surrealMoments.size,
      activeSurreal: Array.from(this.surrealMoments.values()).filter(s => s.isActive).length,
      totalCallbacks: this.callbackTriggers.size
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.reinforcementTimer) {
      clearInterval(this.reinforcementTimer);
    }
    
    this.sharedMemories.clear();
    this.callbackTriggers.clear();
    this.runningJokes.clear();
    this.sharedThemes.clear();
    this.surrealMoments.clear();
    
    this.removeAllListeners();
  }
} 