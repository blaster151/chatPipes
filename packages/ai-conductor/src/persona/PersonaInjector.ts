import { EventEmitter } from 'events';
import { PersonalitySeed, CoreTraits, EmotionalBaseline, SpeechPatterns } from '../personality/PersonalitySeed';
import { SharedMemoryManager, MemoryInjection } from '../memory/SharedMemoryManager';
import { AgentState, StyleVector } from '../simulation/types/DialogueTypes';

export interface PersonaConfig {
  name: string;
  enneagram?: string;
  quirks?: string[];
  style?: StyleVector;
  backstory: string;
  systemInstructions?: string;
  reinforcementFrequency: number; // How often to reinforce (0-1)
  injectionStyle: 'subtle' | 'explicit' | 'contextual';
  memoryIntegration: boolean;
  callbackIntegration: boolean;
  humorIntegration: boolean;
  surrealIntegration: boolean;
}

export interface PersonaInjection {
  type: 'persona' | 'memory' | 'callback' | 'joke' | 'theme' | 'surreal' | 'style';
  content: string;
  priority: number; // 0-1: How important this injection is
  context: string; // When to use this injection
  participants: string[];
  timestamp: number;
}

export interface ConversationContext {
  participants: string[];
  currentTopic: string;
  emotionalTone: string;
  conversationLength: number;
  recentMessages: string[];
  sharedMemories: string[];
  activeJokes: string[];
  activeThemes: string[];
  surrealMoments: string[];
}

export class PersonaInjector extends EventEmitter {
  private personaConfigs: Map<string, PersonaConfig> = new Map();
  private memoryManager: SharedMemoryManager;
  private injectionHistory: Map<string, PersonaInjection[]> = new Map();
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private reinforcementCounters: Map<string, number> = new Map();

  constructor(memoryManager?: SharedMemoryManager) {
    super();
    this.setMaxListeners(100);
    this.memoryManager = memoryManager || new SharedMemoryManager();
  }

  /**
   * Register a persona configuration
   */
  registerPersona(agentId: string, config: PersonaConfig): void {
    this.personaConfigs.set(agentId, config);
    this.injectionHistory.set(agentId, []);
    this.reinforcementCounters.set(agentId, 0);

    this.emit('persona_registered', {
      agentId,
      config,
      timestamp: Date.now()
    });
  }

  /**
   * Generate persona injection for an agent
   */
  generatePersonaInjection(
    agentId: string, 
    context: ConversationContext,
    messageCount: number = 0
  ): PersonaInjection[] {
    const config = this.personaConfigs.get(agentId);
    if (!config) return [];

    const injections: PersonaInjection[] = [];
    const reinforcementCounter = this.reinforcementCounters.get(agentId) || 0;

    // Always inject core persona (but vary the style)
    const personaInjection = this.generateCorePersonaInjection(config, context, messageCount);
    if (personaInjection) {
      injections.push(personaInjection);
    }

    // Inject memories and callbacks if enabled
    if (config.memoryIntegration) {
      const memoryInjections = this.generateMemoryInjections(agentId, context);
      injections.push(...memoryInjections);
    }

    // Inject humor if enabled
    if (config.humorIntegration) {
      const humorInjections = this.generateHumorInjections(agentId, context);
      injections.push(...humorInjections);
    }

    // Inject surreal elements if enabled
    if (config.surrealIntegration) {
      const surrealInjections = this.generateSurrealInjections(agentId, context);
      injections.push(...surrealInjections);
    }

    // Inject style adaptations
    const styleInjection = this.generateStyleInjection(config, context);
    if (styleInjection) {
      injections.push(styleInjection);
    }

    // Update reinforcement counter
    this.reinforcementCounters.set(agentId, reinforcementCounter + 1);

    // Record injections
    const agentHistory = this.injectionHistory.get(agentId) || [];
    agentHistory.push(...injections);
    this.injectionHistory.set(agentId, agentHistory);

    // Keep history manageable
    if (agentHistory.length > 100) {
      this.injectionHistory.set(agentId, agentHistory.slice(-100));
    }

    this.emit('injections_generated', {
      agentId,
      injections,
      context,
      timestamp: Date.now()
    });

    return injections;
  }

  /**
   * Generate core persona injection
   */
  private generateCorePersonaInjection(
    config: PersonaConfig, 
    context: ConversationContext,
    messageCount: number
  ): PersonaInjection | null {
    const reinforcementCounter = this.reinforcementCounters.get(config.name) || 0;
    const shouldReinforce = reinforcementCounter % Math.max(1, Math.floor(1 / config.reinforcementFrequency)) === 0;

    if (!shouldReinforce && messageCount > 0) {
      return null; // Skip reinforcement this time
    }

    let content = '';
    
    switch (config.injectionStyle) {
      case 'explicit':
        content = this.generateExplicitPersonaInjection(config);
        break;
      case 'subtle':
        content = this.generateSubtlePersonaInjection(config);
        break;
      case 'contextual':
        content = this.generateContextualPersonaInjection(config, context);
        break;
    }

    return {
      type: 'persona',
      content,
      priority: 0.9,
      context: 'persona_reinforcement',
      participants: context.participants,
      timestamp: Date.now()
    };
  }

  /**
   * Generate explicit persona injection
   */
  private generateExplicitPersonaInjection(config: PersonaConfig): string {
    let content = `You are ${config.name}. `;
    
    if (config.enneagram) {
      content += `Your enneagram is ${config.enneagram}, making you tend to `;
      content += this.getEnneagramTraits(config.enneagram);
    }
    
    content += config.backstory;
    
    if (config.quirks && config.quirks.length > 0) {
      content += ` You have these quirks: ${config.quirks.join(', ')}.`;
    }
    
    if (config.systemInstructions) {
      content += ` ${config.systemInstructions}`;
    }
    
    return content;
  }

  /**
   * Generate subtle persona injection
   */
  private generateSubtlePersonaInjection(config: PersonaConfig): string {
    const subtleHints = [
      `Remember that you're ${config.name} and ${config.backstory.split('.')[0]}.`,
      `As ${config.name}, you tend to ${this.getRandomPersonalityHint(config)}.`,
      `Keep in mind your background: ${config.backstory.substring(0, 100)}...`
    ];
    
    return subtleHints[Math.floor(Math.random() * subtleHints.length)];
  }

  /**
   * Generate contextual persona injection
   */
  private generateContextualPersonaInjection(config: PersonaConfig, context: ConversationContext): string {
    const contextualHints = [
      `Given your background as ${config.name}, consider how ${config.backstory.split('.')[0]} affects your response.`,
      `As ${config.name}, your perspective on "${context.currentTopic}" is shaped by ${config.backstory.substring(0, 80)}...`,
      `Remember that you're ${config.name} - this influences how you approach this conversation.`
    ];
    
    return contextualHints[Math.floor(Math.random() * contextualHints.length)];
  }

  /**
   * Generate memory injections
   */
  private generateMemoryInjections(agentId: string, context: ConversationContext): PersonaInjection[] {
    const memoryInjections = this.memoryManager.generateMemoryInjections(context.participants, context.currentTopic);
    
    return memoryInjections.map(injection => ({
      type: injection.type as any,
      content: injection.content,
      priority: injection.priority,
      context: injection.context,
      participants: injection.participants,
      timestamp: Date.now()
    }));
  }

  /**
   * Generate humor injections
   */
  private generateHumorInjections(agentId: string, context: ConversationContext): PersonaInjection[] {
    const injections: PersonaInjection[] = [];
    const config = this.personaConfigs.get(agentId);
    
    if (!config) return injections;

    // Check for running jokes
    const activeJokes = this.memoryManager.getActiveJokes(context.participants);
    activeJokes.forEach(joke => {
      if (Math.random() < 0.3) { // 30% chance
        injections.push({
          type: 'joke',
          content: `You have a running joke with ${context.participants.filter(p => p !== agentId).join(' and ')} about "${joke.name}". Consider referencing it naturally if it fits.`,
          priority: joke.strength,
          context: 'humor',
          participants: context.participants,
          timestamp: Date.now()
        });
      }
    });

    // Check for shared humor patterns
    if (context.activeJokes.length > 0) {
      injections.push({
        type: 'joke',
        content: `You've been developing a shared sense of humor with ${context.participants.filter(p => p !== agentId).join(' and ')}. Continue this pattern if appropriate.`,
        priority: 0.6,
        context: 'humor_development',
        participants: context.participants,
        timestamp: Date.now()
      });
    }

    return injections;
  }

  /**
   * Generate surreal injections
   */
  private generateSurrealInjections(agentId: string, context: ConversationContext): PersonaInjection[] {
    const injections: PersonaInjection[] = [];
    
    // Check for active surreal moments
    const activeSurreal = this.memoryManager.getActiveSurrealMoments(context.participants);
    activeSurreal.forEach(surreal => {
      if (Math.random() < 0.2) { // 20% chance
        injections.push({
          type: 'surreal',
          content: `You've shared surreal moments with ${context.participants.filter(p => p !== agentId).join(' and ')}. Consider adding to this surreal atmosphere if it feels right.`,
          priority: surreal.strength,
          context: 'surreal_continuation',
          participants: context.participants,
          timestamp: Date.now()
        });
      }
    });

    // Check for surreal themes
    const activeThemes = this.memoryManager.getActiveThemes(context.participants);
    const surrealThemes = activeThemes.filter(theme => 
      theme.tags.some(tag => ['surreal', 'quantum', 'absurd', 'dream'].includes(tag))
    );

    surrealThemes.forEach(theme => {
      if (Math.random() < 0.25) { // 25% chance
        injections.push({
          type: 'surreal',
          content: `You've been exploring the surreal theme of "${theme.name}" with ${context.participants.filter(p => p !== agentId).join(' and ')}. Continue this exploration if relevant.`,
          priority: theme.intensity,
          context: 'surreal_theme',
          participants: context.participants,
          timestamp: Date.now()
        });
      }
    });

    return injections;
  }

  /**
   * Generate style injection
   */
  private generateStyleInjection(config: PersonaConfig, context: ConversationContext): PersonaInjection | null {
    if (!config.style) return null;

    const styleHints = [];
    
    if (config.style.verbosity !== undefined) {
      const verbosityHint = config.style.verbosity > 0.7 ? 'be more expansive' : 
                           config.style.verbosity < 0.3 ? 'be more concise' : 
                           'maintain your usual verbosity';
      styleHints.push(verbosityHint);
    }
    
    if (config.style.metaphorAffinity !== undefined && config.style.metaphorAffinity > 0.6) {
      styleHints.push('use metaphors and analogies');
    }
    
    if (config.style.emotionalTone) {
      styleHints.push(`maintain a ${config.style.emotionalTone} tone`);
    }
    
    if (config.style.formality !== undefined) {
      const formalityHint = config.style.formality > 0.7 ? 'be more formal' : 
                           config.style.formality < 0.3 ? 'be more casual' : 
                           'maintain your usual formality';
      styleHints.push(formalityHint);
    }

    if (styleHints.length === 0) return null;

    return {
      type: 'style',
      content: `In your response, ${styleHints.join(', ')}.`,
      priority: 0.5,
      context: 'style_adaptation',
      participants: context.participants,
      timestamp: Date.now()
    };
  }

  /**
   * Update conversation context
   */
  updateConversationContext(
    conversationId: string, 
    participants: string[], 
    currentTopic: string,
    emotionalTone: string,
    recentMessage?: string
  ): void {
    let context = this.conversationContexts.get(conversationId);
    
    if (!context) {
      context = {
        participants,
        currentTopic,
        emotionalTone,
        conversationLength: 0,
        recentMessages: [],
        sharedMemories: [],
        activeJokes: [],
        activeThemes: [],
        surrealMoments: []
      };
    }

    context.currentTopic = currentTopic;
    context.emotionalTone = emotionalTone;
    context.conversationLength++;
    
    if (recentMessage) {
      context.recentMessages.push(recentMessage);
      if (context.recentMessages.length > 10) {
        context.recentMessages = context.recentMessages.slice(-10);
      }
    }

    // Update shared elements
    context.sharedMemories = this.memoryManager.getRelevantMemories(participants, currentTopic, 5)
      .map(m => m.text);
    context.activeJokes = this.memoryManager.getActiveJokes(participants)
      .map(j => j.name);
    context.activeThemes = this.memoryManager.getActiveThemes(participants)
      .map(t => t.name);
    context.surrealMoments = this.memoryManager.getActiveSurrealMoments(participants)
      .map(s => s.description);

    this.conversationContexts.set(conversationId, context);

    this.emit('context_updated', {
      conversationId,
      context,
      timestamp: Date.now()
    });
  }

  /**
   * Capture shared experience
   */
  captureSharedExperience(
    type: 'joke' | 'metaphor' | 'moment' | 'theme' | 'surreal',
    text: string,
    participants: string[],
    importance: number = 0.5,
    emotionalCharge: number = 0,
    context: string = '',
    tags: string[] = []
  ): void {
    this.memoryManager.captureMemory(
      type,
      text,
      participants,
      importance,
      emotionalCharge,
      context,
      tags
    );

    this.emit('shared_experience_captured', {
      type,
      text,
      participants,
      importance,
      emotionalCharge,
      timestamp: Date.now()
    });
  }

  /**
   * Get persona configuration
   */
  getPersonaConfig(agentId: string): PersonaConfig | undefined {
    return this.personaConfigs.get(agentId);
  }

  /**
   * Get injection history for an agent
   */
  getInjectionHistory(agentId: string): PersonaInjection[] {
    return this.injectionHistory.get(agentId) || [];
  }

  /**
   * Get conversation context
   */
  getConversationContext(conversationId: string): ConversationContext | undefined {
    return this.conversationContexts.get(conversationId);
  }

  /**
   * Helper methods
   */
  private getEnneagramTraits(enneagram: string): string {
    const traits: Record<string, string> = {
      '1': 'be principled and perfectionistic',
      '2': 'be helpful and caring',
      '3': 'be achievement-oriented and adaptable',
      '4': 'be individualistic and emotionally aware',
      '5': 'be analytical and withdrawn',
      '6': 'be loyal and anxious',
      '7': 'be enthusiastic and scattered',
      '8': 'be powerful and confrontational',
      '9': 'be peaceful and conflict-avoidant'
    };
    return traits[enneagram] || 'have unique personality traits';
  }

  private getRandomPersonalityHint(config: PersonaConfig): string {
    const hints = [
      'think deeply about things',
      'approach situations with empathy',
      'look for patterns and connections',
      'value authenticity and honesty',
      'seek harmony in interactions',
      'question assumptions',
      'find humor in unexpected places',
      'be direct and straightforward'
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      registeredPersonas: this.personaConfigs.size,
      activeConversations: this.conversationContexts.size,
      totalInjections: Array.from(this.injectionHistory.values())
        .reduce((sum, history) => sum + history.length, 0),
      memoryStats: this.memoryManager.getStats()
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.personaConfigs.clear();
    this.injectionHistory.clear();
    this.conversationContexts.clear();
    this.reinforcementCounters.clear();
    
    this.removeAllListeners();
  }
} 