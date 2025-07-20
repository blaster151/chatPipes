import { EventEmitter } from 'events';
import { SharedMemoryManager, SharedMemory, SharedTheme, SurrealMoment } from './SharedMemoryManager';

export interface CooperativeMemory {
  id: string;
  type: 'joke' | 'metaphor' | 'reference' | 'suspicion' | 'vibe' | 'running_gag' | 'shared_secret';
  content: string;
  participants: string[];
  firstMentioned: number;
  lastMentioned: number;
  timesMentioned: number;
  strength: number; // 0-1: How strong this memory is
  humanReinforcement: number; // 0-1: How much human reinforcement it received
  agentReinforcement: number; // 0-1: How much agent reinforcement it received
  context: string;
  tags: string[];
  variations: string[];
  callbackTriggers: string[]; // Phrases that could trigger this memory
  emotionalCharge: number; // -1 to 1
  isActive: boolean;
  decayRate: number; // How quickly this memory fades
  reinforcementThreshold: number; // When to consider it "kept alive"
}

export interface MemoryReinjection {
  type: 'gentle' | 'contextual' | 'triggered' | 'spontaneous' | 'human_mimic';
  memory: CooperativeMemory;
  trigger: string;
  context: string;
  participants: string[];
  injection: string;
  priority: number; // 0-1: How important this reinjection is
  expectedResponse: string;
  timestamp: number;
}

export interface CooperativeMemoryConfig {
  humanReinforcementWeight: number; // How much to weight human reinforcement
  agentReinforcementWeight: number; // How much to weight agent reinforcement
  decayRate: number; // Base decay rate for memories
  reinforcementThreshold: number; // When memory is considered "kept alive"
  maxMemories: number; // Maximum memories to track
  callbackDetectionThreshold: number; // When to detect callbacks
  humanMimicryFrequency: number; // How often to mimic human reinforcement patterns
  tokenWindowSimulation: number; // Simulate token window limitations
}

export class CooperativeMemoryManager extends EventEmitter {
  private sharedMemoryManager: SharedMemoryManager;
  private config: CooperativeMemoryConfig;
  private cooperativeMemories: Map<string, CooperativeMemory> = new Map();
  private humanReinforcementPatterns: Array<{
    pattern: string;
    frequency: number;
    lastUsed: number;
    effectiveness: number;
  }> = [];
  private conversationStartTime: number = 0;
  private tokenWindow: Array<{
    content: string;
    timestamp: number;
    participant: string;
    memoryReferences: string[];
  }> = [];

  constructor(sharedMemoryManager: SharedMemoryManager, config: Partial<CooperativeMemoryConfig> = {}) {
    super();
    this.setMaxListeners(100);
    
    this.sharedMemoryManager = sharedMemoryManager;
    
    this.config = {
      humanReinforcementWeight: 0.7, // Humans are better at keeping memories alive
      agentReinforcementWeight: 0.3,
      decayRate: 0.01, // 1% decay per minute
      reinforcementThreshold: 0.6, // 60% reinforcement needed to keep memory alive
      maxMemories: 100,
      callbackDetectionThreshold: 0.4,
      humanMimicryFrequency: 0.3,
      tokenWindowSimulation: 50, // Simulate 50-message token window
      ...config
    };
  }

  /**
   * Start a cooperative conversation
   */
  startConversation(participants: string[]): void {
    this.conversationStartTime = Date.now();
    this.cooperativeMemories.clear();
    this.tokenWindow = [];
    
    this.emit('conversation_started', {
      participants,
      timestamp: this.conversationStartTime
    });
  }

  /**
   * Process a message for cooperative memory
   */
  processMessage(
    content: string,
    participant: string,
    participants: string[],
    isHuman: boolean = false
  ): void {
    const now = Date.now();
    
    // Add to token window
    this.addToTokenWindow(content, participant, now);
    
    // Detect new memories
    const newMemories = this.detectNewMemories(content, participant, participants, isHuman);
    
    // Detect callbacks to existing memories
    const callbacks = this.detectCallbacks(content, participant, participants, isHuman);
    
    // Update memory reinforcement
    this.updateMemoryReinforcement(content, participant, isHuman);
    
    // Generate reinjections
    const reinjections = this.generateReinjections(participants, content);
    
    this.emit('message_processed', {
      content,
      participant,
      isHuman,
      newMemories,
      callbacks,
      reinjections,
      timestamp: now
    });
  }

  /**
   * Add message to token window
   */
  private addToTokenWindow(content: string, participant: string, timestamp: number): void {
    const memoryReferences = this.findMemoryReferences(content);
    
    this.tokenWindow.push({
      content,
      timestamp,
      participant,
      memoryReferences
    });
    
    // Maintain token window size
    if (this.tokenWindow.length > this.config.tokenWindowSimulation) {
      this.tokenWindow.shift();
    }
  }

  /**
   * Detect new memories in message
   */
  private detectNewMemories(
    content: string, 
    participant: string, 
    participants: string[], 
    isHuman: boolean
  ): CooperativeMemory[] {
    const newMemories: CooperativeMemory[] = [];
    
    // Detect jokes
    const jokes = this.detectJokes(content);
    jokes.forEach(joke => {
      const memory = this.createCooperativeMemory('joke', joke, participant, participants, isHuman);
      newMemories.push(memory);
    });
    
    // Detect metaphors
    const metaphors = this.detectMetaphors(content);
    metaphors.forEach(metaphor => {
      const memory = this.createCooperativeMemory('metaphor', metaphor, participant, participants, isHuman);
      newMemories.push(memory);
    });
    
    // Detect references
    const references = this.detectReferences(content);
    references.forEach(reference => {
      const memory = this.createCooperativeMemory('reference', reference, participant, participants, isHuman);
      newMemories.push(memory);
    });
    
    // Detect suspicions
    const suspicions = this.detectSuspicions(content);
    suspicions.forEach(suspicion => {
      const memory = this.createCooperativeMemory('suspicion', suspicion, participant, participants, isHuman);
      newMemories.push(memory);
    });
    
    // Detect vibes
    const vibes = this.detectVibes(content);
    vibes.forEach(vibe => {
      const memory = this.createCooperativeMemory('vibe', vibe, participant, participants, isHuman);
      newMemories.push(memory);
    });
    
    return newMemories;
  }

  /**
   * Create cooperative memory
   */
  private createCooperativeMemory(
    type: CooperativeMemory['type'],
    content: string,
    participant: string,
    participants: string[],
    isHuman: boolean
  ): CooperativeMemory {
    const now = Date.now();
    const memoryId = `coop-memory-${now}-${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: CooperativeMemory = {
      id: memoryId,
      type,
      content,
      participants,
      firstMentioned: now,
      lastMentioned: now,
      timesMentioned: 1,
      strength: isHuman ? 0.8 : 0.6, // Human memories start stronger
      humanReinforcement: isHuman ? 0.8 : 0.0,
      agentReinforcement: isHuman ? 0.0 : 0.6,
      context: this.extractContext(content),
      tags: this.extractTags(content),
      variations: [content],
      callbackTriggers: this.generateCallbackTriggers(content),
      emotionalCharge: this.extractEmotionalCharge(content),
      isActive: true,
      decayRate: this.config.decayRate,
      reinforcementThreshold: this.config.reinforcementThreshold
    };
    
    this.cooperativeMemories.set(memoryId, memory);
    
    // Also add to shared memory manager
    this.sharedMemoryManager.captureMemory(
      type,
      content,
      participants,
      memory.strength,
      memory.emotionalCharge,
      memory.context,
      memory.tags
    );
    
    return memory;
  }

  /**
   * Detect callbacks to existing memories
   */
  private detectCallbacks(
    content: string, 
    participant: string, 
    participants: string[], 
    isHuman: boolean
  ): Array<{ memory: CooperativeMemory; strength: number }> {
    const callbacks: Array<{ memory: CooperativeMemory; strength: number }> = [];
    
    this.cooperativeMemories.forEach(memory => {
      if (!memory.isActive) return;
      
      // Check if content references this memory
      const callbackStrength = this.calculateCallbackStrength(content, memory);
      
      if (callbackStrength > this.config.callbackDetectionThreshold) {
        callbacks.push({ memory, strength: callbackStrength });
        
        // Update memory reinforcement
        if (isHuman) {
          memory.humanReinforcement = Math.min(1, memory.humanReinforcement + 0.2);
        } else {
          memory.agentReinforcement = Math.min(1, memory.agentReinforcement + 0.1);
        }
        
        memory.lastMentioned = Date.now();
        memory.timesMentioned++;
        memory.variations.push(content);
        
        // Update strength based on reinforcement
        memory.strength = this.calculateMemoryStrength(memory);
      }
    });
    
    return callbacks;
  }

  /**
   * Calculate callback strength
   */
  private calculateCallbackStrength(content: string, memory: CooperativeMemory): number {
    const contentLower = content.toLowerCase();
    const memoryLower = memory.content.toLowerCase();
    
    // Check for direct references
    if (contentLower.includes(memoryLower.substring(0, 20))) {
      return 0.9;
    }
    
    // Check for callback triggers
    const triggerMatches = memory.callbackTriggers.filter(trigger => 
      contentLower.includes(trigger.toLowerCase())
    );
    
    if (triggerMatches.length > 0) {
      return 0.7;
    }
    
    // Check for tag matches
    const tagMatches = memory.tags.filter(tag => 
      contentLower.includes(tag.toLowerCase())
    );
    
    if (tagMatches.length > 0) {
      return 0.5;
    }
    
    // Check for semantic similarity (simple word overlap)
    const contentWords = new Set(contentLower.split(' ').filter(word => word.length > 3));
    const memoryWords = new Set(memoryLower.split(' ').filter(word => word.length > 3));
    const intersection = new Set([...contentWords].filter(x => memoryWords.has(x)));
    const union = new Set([...contentWords, ...memoryWords]);
    
    return intersection.size / union.size;
  }

  /**
   * Update memory reinforcement
   */
  private updateMemoryReinforcement(content: string, participant: string, isHuman: boolean): void {
    // Track human reinforcement patterns
    if (isHuman) {
      this.trackHumanReinforcementPattern(content);
    }
    
    // Apply decay to all memories
    this.cooperativeMemories.forEach(memory => {
      const timeSinceLastMentioned = Date.now() - memory.lastMentioned;
      const decay = timeSinceLastMentioned * memory.decayRate / (60 * 1000); // Decay per minute
      
      memory.strength = Math.max(0, memory.strength - decay);
      
      // Deactivate weak memories
      if (memory.strength < 0.1) {
        memory.isActive = false;
      }
    });
  }

  /**
   * Track human reinforcement patterns
   */
  private trackHumanReinforcementPattern(content: string): void {
    // Look for patterns in how humans reinforce memories
    const reinforcementPatterns = [
      /remember when/i,
      /that reminds me/i,
      /speaking of/i,
      /like we said/i,
      /as we discussed/i,
      /going back to/i,
      /that's right/i,
      /exactly/i
    ];
    
    reinforcementPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        const patternStr = pattern.source;
        const existing = this.humanReinforcementPatterns.find(p => p.pattern === patternStr);
        
        if (existing) {
          existing.frequency++;
          existing.lastUsed = Date.now();
          existing.effectiveness = Math.min(1, existing.effectiveness + 0.1);
        } else {
          this.humanReinforcementPatterns.push({
            pattern: patternStr,
            frequency: 1,
            lastUsed: Date.now(),
            effectiveness: 0.5
          });
        }
      }
    });
  }

  /**
   * Generate memory reinjections
   */
  private generateReinjections(participants: string[], currentContext: string): MemoryReinjection[] {
    const reinjections: MemoryReinjection[] = [];
    const now = Date.now();
    
    // Find memories that need reinforcement
    const memoriesNeedingReinforcement = Array.from(this.cooperativeMemories.values())
      .filter(memory => 
        memory.isActive &&
        memory.strength < memory.reinforcementThreshold &&
        now - memory.lastMentioned > 5 * 60 * 1000 // At least 5 minutes since last mention
      )
      .sort((a, b) => b.strength - a.strength);
    
    memoriesNeedingReinforcement.slice(0, 3).forEach(memory => {
      // Generate gentle reinjection
      const reinjection = this.createGentleReinjection(memory, participants, currentContext);
      if (reinjection) {
        reinjections.push(reinjection);
      }
    });
    
    // Mimic human reinforcement patterns
    if (Math.random() < this.config.humanMimicryFrequency) {
      const humanMimicReinjection = this.createHumanMimicReinjection(participants, currentContext);
      if (humanMimicReinjection) {
        reinjections.push(humanMimicReinjection);
      }
    }
    
    return reinjections;
  }

  /**
   * Create gentle reinjection
   */
  private createGentleReinjection(
    memory: CooperativeMemory, 
    participants: string[], 
    context: string
  ): MemoryReinjection | null {
    const reinjectionTemplates = [
      `If it fits the flow, reference the "${memory.content.substring(0, 30)}..." moment from earlier.`,
      `Consider bringing back the ${memory.type} about "${memory.content.substring(0, 20)}..." if relevant.`,
      `The conversation might benefit from revisiting the ${memory.type} we discussed earlier.`,
      `If appropriate, build on the "${memory.content.substring(0, 25)}..." theme.`
    ];
    
    const template = reinjectionTemplates[Math.floor(Math.random() * reinjectionTemplates.length)];
    
    return {
      type: 'gentle',
      memory,
      trigger: 'memory_decay',
      context,
      participants,
      injection: template,
      priority: memory.strength,
      expectedResponse: 'memory_reference',
      timestamp: Date.now()
    };
  }

  /**
   * Create human mimic reinjection
   */
  private createHumanMimicReinjection(participants: string[], context: string): MemoryReinjection | null {
    const activeMemories = Array.from(this.cooperativeMemories.values())
      .filter(memory => memory.isActive && memory.humanReinforcement > 0.5)
      .sort((a, b) => b.humanReinforcement - a.humanReinforcement);
    
    if (activeMemories.length === 0) return null;
    
    const memory = activeMemories[0];
    const humanPatterns = this.humanReinforcementPatterns
      .sort((a, b) => b.effectiveness - a.effectiveness);
    
    if (humanPatterns.length === 0) return null;
    
    const pattern = humanPatterns[0];
    const mimicTemplate = `Mimic human reinforcement pattern: "${pattern.pattern}" to bring back the ${memory.type} about "${memory.content.substring(0, 30)}..."`;
    
    return {
      type: 'human_mimic',
      memory,
      trigger: 'human_pattern_mimic',
      context,
      participants,
      injection: mimicTemplate,
      priority: 0.8,
      expectedResponse: 'human_like_reinforcement',
      timestamp: Date.now()
    };
  }

  /**
   * Detect jokes in content
   */
  private detectJokes(content: string): string[] {
    const jokePatterns = [
      /\b(joke|funny|humor|laugh|hilarious)\b/gi,
      /\b(that's what she said|dad joke|punchline)\b/gi,
      /\b(😂|😄|😆|🤣)\b/gi
    ];
    
    return jokePatterns.some(pattern => pattern.test(content)) ? [content] : [];
  }

  /**
   * Detect metaphors in content
   */
  private detectMetaphors(content: string): string[] {
    const metaphorPatterns = [
      /\b(like|as if|reminds me of|similar to|just like)\b/gi,
      /\b(consciousness|reality|time|memory|existence)\b/gi,
      /\b(quantum|surreal|absurd|metaphor)\b/gi
    ];
    
    return metaphorPatterns.some(pattern => pattern.test(content)) ? [content] : [];
  }

  /**
   * Detect references in content
   */
  private detectReferences(content: string): string[] {
    const referencePatterns = [
      /\b(remember|earlier|before|we discussed|as mentioned)\b/gi,
      /\b(twin brother|sister|family member)\b/gi,
      /\b(past|previous|history)\b/gi
    ];
    
    return referencePatterns.some(pattern => pattern.test(content)) ? [content] : [];
  }

  /**
   * Detect suspicions in content
   */
  private detectSuspicions(content: string): string[] {
    const suspicionPatterns = [
      /\b(suspect|suspicious|think|believe|wonder)\b/gi,
      /\b(maybe|perhaps|possibly|could be)\b/gi,
      /\b(secret|hidden|mystery)\b/gi
    ];
    
    return suspicionPatterns.some(pattern => pattern.test(content)) ? [content] : [];
  }

  /**
   * Detect vibes in content
   */
  private detectVibes(content: string): string[] {
    const vibePatterns = [
      /\b(vibe|energy|atmosphere|mood|feeling)\b/gi,
      /\b(surreal|absurd|weird|strange|bizarre)\b/gi,
      /\b(comfortable|awkward|tense|relaxed)\b/gi
    ];
    
    return vibePatterns.some(pattern => pattern.test(content)) ? [content] : [];
  }

  /**
   * Extract context from content
   */
  private extractContext(content: string): string {
    const words = content.split(' ').slice(0, 10).join(' ');
    return words.length > 50 ? words.substring(0, 50) + '...' : words;
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Extract key concepts
    const concepts = ['quantum', 'tea', 'consciousness', 'surreal', 'absurd', 'metaphor', 'joke', 'vibe'];
    concepts.forEach(concept => {
      if (contentLower.includes(concept)) {
        tags.push(concept);
      }
    });
    
    return tags;
  }

  /**
   * Generate callback triggers
   */
  private generateCallbackTriggers(content: string): string[] {
    const triggers: string[] = [];
    const words = content.split(' ').filter(word => word.length > 3);
    
    // Use key words as triggers
    words.slice(0, 5).forEach(word => {
      triggers.push(word.toLowerCase());
    });
    
    return triggers;
  }

  /**
   * Extract emotional charge
   */
  private extractEmotionalCharge(content: string): number {
    const positiveWords = ['love', 'amazing', 'wonderful', 'great', 'excellent', 'fantastic'];
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'horrible', 'disgusting'];
    
    const contentLower = content.toLowerCase();
    let charge = 0;
    
    positiveWords.forEach(word => {
      if (contentLower.includes(word)) charge += 0.2;
    });
    
    negativeWords.forEach(word => {
      if (contentLower.includes(word)) charge -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, charge));
  }

  /**
   * Find memory references in content
   */
  private findMemoryReferences(content: string): string[] {
    const references: string[] = [];
    
    this.cooperativeMemories.forEach(memory => {
      if (this.calculateCallbackStrength(content, memory) > 0.3) {
        references.push(memory.id);
      }
    });
    
    return references;
  }

  /**
   * Calculate memory strength
   */
  private calculateMemoryStrength(memory: CooperativeMemory): number {
    const humanWeight = this.config.humanReinforcementWeight;
    const agentWeight = this.config.agentReinforcementWeight;
    
    return (memory.humanReinforcement * humanWeight + memory.agentReinforcement * agentWeight);
  }

  /**
   * Get active memories
   */
  getActiveMemories(): CooperativeMemory[] {
    return Array.from(this.cooperativeMemories.values())
      .filter(memory => memory.isActive)
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Get memory by ID
   */
  getMemory(memoryId: string): CooperativeMemory | undefined {
    return this.cooperativeMemories.get(memoryId);
  }

  /**
   * Get token window
   */
  getTokenWindow(): Array<{ content: string; timestamp: number; participant: string; memoryReferences: string[] }> {
    return this.tokenWindow;
  }

  /**
   * Get human reinforcement patterns
   */
  getHumanReinforcementPatterns(): Array<{ pattern: string; frequency: number; lastUsed: number; effectiveness: number }> {
    return this.humanReinforcementPatterns;
  }

  /**
   * Get cooperative memory statistics
   */
  getStats() {
    const memories = Array.from(this.cooperativeMemories.values());
    const activeMemories = memories.filter(m => m.isActive);
    
    return {
      totalMemories: memories.length,
      activeMemories: activeMemories.length,
      averageStrength: activeMemories.reduce((sum, m) => sum + m.strength, 0) / activeMemories.length || 0,
      averageHumanReinforcement: activeMemories.reduce((sum, m) => sum + m.humanReinforcement, 0) / activeMemories.length || 0,
      averageAgentReinforcement: activeMemories.reduce((sum, m) => sum + m.agentReinforcement, 0) / activeMemories.length || 0,
      memoryTypes: {
        joke: activeMemories.filter(m => m.type === 'joke').length,
        metaphor: activeMemories.filter(m => m.type === 'metaphor').length,
        reference: activeMemories.filter(m => m.type === 'reference').length,
        suspicion: activeMemories.filter(m => m.type === 'suspicion').length,
        vibe: activeMemories.filter(m => m.type === 'vibe').length,
        running_gag: activeMemories.filter(m => m.type === 'running_gag').length,
        shared_secret: activeMemories.filter(m => m.type === 'shared_secret').length
      },
      humanReinforcementPatterns: this.humanReinforcementPatterns.length,
      tokenWindowSize: this.tokenWindow.length
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cooperativeMemories.clear();
    this.humanReinforcementPatterns = [];
    this.tokenWindow = [];
    
    this.removeAllListeners();
  }
} 