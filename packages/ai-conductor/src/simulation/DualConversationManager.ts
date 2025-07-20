import { EventEmitter } from 'events';
import { AgentSession } from '../core/AgentSession';

export interface InnerThoughtConfig {
  enabled: boolean;
  probability: number; // 0-1 chance of generating inner thought
  maxThoughtsPerExchange: number;
  thoughtTypes: InnerThoughtType[];
  behavioralImpact: boolean; // whether thoughts affect behavior
  memoryRetention: number; // how long thoughts persist (0-1)
  thoughtIntensity: number; // 0-1 how strongly thoughts affect behavior
}

export type InnerThoughtType = 
  | 'observation' 
  | 'judgment' 
  | 'suspicion' 
  | 'admiration' 
  | 'doubt' 
  | 'amusement' 
  | 'frustration' 
  | 'curiosity' 
  | 'concern' 
  | 'excitement';

export interface InnerThought {
  id: string;
  speakerId: string;
  targetId?: string; // who the thought is about
  content: string;
  type: InnerThoughtType;
  intensity: number; // 0-1 how strong the thought is
  timestamp: Date;
  context?: string; // what triggered this thought
  behavioralImpact?: BehavioralImpact;
}

export interface BehavioralImpact {
  trustChange: number; // -1 to 1
  sarcasmChange: number; // -1 to 1
  suspicionChange: number; // -1 to 1
  engagementChange: number; // -1 to 1
  assertivenessChange: number; // -1 to 1
  curiosityChange: number; // -1 to 1
  patienceChange: number; // -1 to 1
}

export interface DualExchange {
  id: string;
  speakerId: string;
  spoken: string;
  unspoken?: InnerThought;
  timestamp: Date;
  round: number;
  threadId: string;
  metadata?: {
    thoughtProbability: number;
    behavioralImpact: BehavioralImpact;
    emotionalState: string;
  };
}

export interface AgentMemory {
  agentId: string;
  thoughts: InnerThought[];
  behavioralState: BehavioralState;
  relationshipScores: Map<string, number>; // targetId -> relationship score
  lastUpdated: Date;
}

export interface BehavioralState {
  trust: number; // -1 to 1
  sarcasm: number; // -1 to 1
  suspicion: number; // -1 to 1
  engagement: number; // -1 to 1
  assertiveness: number; // -1 to 1
  curiosity: number; // -1 to 1
  patience: number; // -1 to 1
  timestamp: Date;
}

export interface ThoughtPromptTemplate {
  type: InnerThoughtType;
  templates: string[];
  triggers: string[]; // keywords that might trigger this thought type
}

export class DualConversationManager extends EventEmitter {
  private config: InnerThoughtConfig;
  private agentMemories: Map<string, AgentMemory> = new Map();
  private thoughtTemplates: Map<InnerThoughtType, ThoughtPromptTemplate> = new Map();
  private conversationHistory: DualExchange[] = [];

  constructor(config: Partial<InnerThoughtConfig> = {}) {
    super();
    this.setMaxListeners(100);
    
    this.config = {
      enabled: true,
      probability: 0.3,
      maxThoughtsPerExchange: 1,
      thoughtTypes: ['observation', 'judgment', 'suspicion', 'admiration', 'doubt'],
      behavioralImpact: true,
      memoryRetention: 0.8,
      thoughtIntensity: 0.6,
      ...config
    };

    this.initializeThoughtTemplates();
  }

  /**
   * Initialize thought templates for different types
   */
  private initializeThoughtTemplates(): void {
    this.thoughtTemplates.set('observation', {
      type: 'observation',
      templates: [
        "I notice {target} seems {observation}.",
        "{target} appears to be {observation}.",
        "There's something {observation} about {target}.",
        "I'm picking up on {observation} from {target}."
      ],
      triggers: ['notice', 'seem', 'appear', 'look', 'sound']
    });

    this.thoughtTemplates.set('judgment', {
      type: 'judgment',
      templates: [
        "{target} is {judgment}.",
        "I think {target} is {judgment}.",
        "{target} strikes me as {judgment}.",
        "There's something {judgment} about {target}."
      ],
      triggers: ['think', 'believe', 'feel', 'strike', 'seem']
    });

    this.thoughtTemplates.set('suspicion', {
      type: 'suspicion',
      templates: [
        "I'm not sure I trust {target}.",
        "There's something off about {target}.",
        "I wonder what {target} is really thinking.",
        "{target} seems to be hiding something."
      ],
      triggers: ['trust', 'suspicious', 'hiding', 'secret', 'lie']
    });

    this.thoughtTemplates.set('admiration', {
      type: 'admiration',
      templates: [
        "I really admire {target}'s {quality}.",
        "{target} is quite {admirable}.",
        "I'm impressed by {target}.",
        "{target} has a way with {skill}."
      ],
      triggers: ['admire', 'impress', 'great', 'amazing', 'wonderful']
    });

    this.thoughtTemplates.set('doubt', {
      type: 'doubt',
      templates: [
        "I'm not convinced by {target}.",
        "I have my doubts about {target}.",
        "I'm skeptical of {target}'s {claim}.",
        "I wonder if {target} is right."
      ],
      triggers: ['doubt', 'skeptical', 'unconvinced', 'question', 'wonder']
    });

    this.thoughtTemplates.set('amusement', {
      type: 'amusement',
      templates: [
        "This is actually kind of funny.",
        "I can't help but find this amusing.",
        "There's something entertaining about this.",
        "I'm enjoying this more than I expected."
      ],
      triggers: ['funny', 'amusing', 'entertaining', 'enjoy', 'laugh']
    });

    this.thoughtTemplates.set('frustration', {
      type: 'frustration',
      templates: [
        "This is getting frustrating.",
        "I'm losing patience with {target}.",
        "Why can't {target} just {action}?",
        "This is taking longer than it should."
      ],
      triggers: ['frustrated', 'annoyed', 'patience', 'tired', 'enough']
    });

    this.thoughtTemplates.set('curiosity', {
      type: 'curiosity',
      templates: [
        "I'm curious about {target}.",
        "I wonder what {target} is thinking.",
        "There's more to {target} than meets the eye.",
        "I'd like to know more about {target}."
      ],
      triggers: ['curious', 'wonder', 'interesting', 'more', 'know']
    });

    this.thoughtTemplates.set('concern', {
      type: 'concern',
      templates: [
        "I'm worried about {target}.",
        "I hope {target} is okay.",
        "There's something concerning about this.",
        "I'm not sure this is a good idea."
      ],
      triggers: ['worried', 'concerned', 'hope', 'okay', 'good']
    });

    this.thoughtTemplates.set('excitement', {
      type: 'excitement',
      templates: [
        "This is getting exciting!",
        "I'm really looking forward to this.",
        "This could be interesting.",
        "I'm intrigued by what's happening."
      ],
      triggers: ['exciting', 'looking forward', 'interesting', 'intrigued', 'great']
    });
  }

  /**
   * Initialize agent memory
   */
  initializeAgentMemory(agentId: string): void {
    if (!this.agentMemories.has(agentId)) {
      this.agentMemories.set(agentId, {
        agentId,
        thoughts: [],
        behavioralState: {
          trust: 0,
          sarcasm: 0,
          suspicion: 0,
          engagement: 0.5,
          assertiveness: 0,
          curiosity: 0.3,
          patience: 0.5,
          timestamp: new Date()
        },
        relationshipScores: new Map(),
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Generate a dual exchange (spoken + unspoken)
   */
  async generateDualExchange(
    agent: AgentSession,
    spokenResponse: string,
    context: {
      threadId: string;
      round: number;
      participants: string[];
      recentExchanges: DualExchange[];
      targetParticipant?: string;
    }
  ): Promise<DualExchange> {
    const agentId = agent.id;
    this.initializeAgentMemory(agentId);

    // Determine if agent should have an inner thought
    const shouldThink = this.shouldGenerateThought(agentId, context);
    let unspokenThought: InnerThought | undefined;

    if (shouldThink) {
      unspokenThought = await this.generateInnerThought(agent, context);
      
      // Apply behavioral impact
      if (unspokenThought && this.config.behavioralImpact) {
        this.applyBehavioralImpact(agentId, unspokenThought);
      }
    }

    const dualExchange: DualExchange = {
      id: `exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      speakerId: agentId,
      spoken: spokenResponse,
      unspoken: unspokenThought,
      timestamp: new Date(),
      round: context.round,
      threadId: context.threadId,
      metadata: {
        thoughtProbability: shouldThink ? this.config.probability : 0,
        behavioralImpact: unspokenThought?.behavioralImpact,
        emotionalState: this.getAgentEmotionalState(agentId)
      }
    };

    // Store in conversation history
    this.conversationHistory.push(dualExchange);

    // Store thought in agent memory
    if (unspokenThought) {
      const memory = this.agentMemories.get(agentId)!;
      memory.thoughts.push(unspokenThought);
      memory.lastUpdated = new Date();

      // Clean up old thoughts based on retention
      this.cleanupOldThoughts(agentId);
    }

    this.emit('dual_exchange_generated', {
      exchange: dualExchange,
      timestamp: new Date()
    });

    return dualExchange;
  }

  /**
   * Determine if agent should generate an inner thought
   */
  private shouldGenerateThought(agentId: string, context: any): boolean {
    if (!this.config.enabled) return false;

    const baseProbability = this.config.probability;
    const memory = this.agentMemories.get(agentId);
    
    if (!memory) return Math.random() < baseProbability;

    // Adjust probability based on behavioral state
    let adjustedProbability = baseProbability;

    // Higher curiosity increases thought probability
    adjustedProbability += memory.behavioralState.curiosity * 0.2;

    // Higher suspicion increases thought probability
    adjustedProbability += memory.behavioralState.suspicion * 0.15;

    // Lower trust increases thought probability
    adjustedProbability += (1 - memory.behavioralState.trust) * 0.1;

    // Cap at 0.8 to avoid constant thoughts
    adjustedProbability = Math.min(0.8, adjustedProbability);

    return Math.random() < adjustedProbability;
  }

  /**
   * Generate an inner thought for an agent
   */
  private async generateInnerThought(
    agent: AgentSession,
    context: {
      threadId: string;
      round: number;
      participants: string[];
      recentExchanges: DualExchange[];
      targetParticipant?: string;
    }
  ): Promise<InnerThought> {
    const agentId = agent.id;
    const memory = this.agentMemories.get(agentId)!;
    const targetId = context.targetParticipant || context.participants.find(p => p !== agentId);

    // Determine thought type based on context and behavioral state
    const thoughtType = this.determineThoughtType(memory, context);
    const template = this.thoughtTemplates.get(thoughtType)!;

    // Create thought content
    const thoughtContent = await this.createThoughtContent(agent, template, targetId, context);

    // Calculate intensity based on behavioral state
    const intensity = this.calculateThoughtIntensity(memory, thoughtType);

    // Generate behavioral impact
    const behavioralImpact = this.calculateBehavioralImpact(thoughtType, intensity, targetId);

    const thought: InnerThought = {
      id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      speakerId: agentId,
      targetId,
      content: thoughtContent,
      type: thoughtType,
      intensity,
      timestamp: new Date(),
      context: this.createThoughtContext(context),
      behavioralImpact
    };

    return thought;
  }

  /**
   * Determine thought type based on context and behavioral state
   */
  private determineThoughtType(memory: AgentMemory, context: any): InnerThoughtType {
    const state = memory.behavioralState;
    const recentThoughts = memory.thoughts.slice(-3);
    
    // If recent thoughts are mostly negative, continue that pattern
    const recentNegativeThoughts = recentThoughts.filter(t => 
      ['suspicion', 'doubt', 'frustration'].includes(t.type)
    ).length;

    if (recentNegativeThoughts > 1) {
      return Math.random() < 0.7 ? 'suspicion' : 'doubt';
    }

    // High suspicion leads to suspicion thoughts
    if (state.suspicion > 0.6) {
      return 'suspicion';
    }

    // Low trust leads to judgment thoughts
    if (state.trust < 0.3) {
      return 'judgment';
    }

    // High curiosity leads to curiosity thoughts
    if (state.curiosity > 0.6) {
      return 'curiosity';
    }

    // High engagement leads to observation thoughts
    if (state.engagement > 0.7) {
      return 'observation';
    }

    // Default to observation
    return 'observation';
  }

  /**
   * Create thought content using LLM
   */
  private async createThoughtContent(
    agent: AgentSession,
    template: ThoughtPromptTemplate,
    targetId: string | undefined,
    context: any
  ): Promise<string> {
    const prompt = `You are having an inner thought about ${targetId || 'the conversation'}. 

Recent conversation context:
${context.recentExchanges.slice(-3).map(ex => `${ex.speakerId}: ${ex.spoken}`).join('\n')}

Generate a natural, realistic inner thought that fits this template style:
${template.templates.join('\n')}

The thought should be:
- Natural and conversational
- Reflective of your personality
- About ${targetId || 'the current situation'}
- Written in italics (without the asterisks)

Respond with just the thought content, no additional formatting.`;

    try {
      const response = await agent.sendPrompt(prompt);
      return response.trim();
    } catch (error) {
      // Fallback to template-based generation
      const templateText = template.templates[Math.floor(Math.random() * template.templates.length)];
      return templateText.replace('{target}', targetId || 'them');
    }
  }

  /**
   * Calculate thought intensity
   */
  private calculateThoughtIntensity(memory: AgentMemory, thoughtType: InnerThoughtType): number {
    const baseIntensity = this.config.thoughtIntensity;
    const state = memory.behavioralState;

    let intensity = baseIntensity;

    // Adjust based on behavioral state
    switch (thoughtType) {
      case 'suspicion':
        intensity += state.suspicion * 0.3;
        break;
      case 'trust':
        intensity += (1 - state.trust) * 0.3;
        break;
      case 'curiosity':
        intensity += state.curiosity * 0.3;
        break;
      case 'engagement':
        intensity += state.engagement * 0.3;
        break;
    }

    return Math.min(1, Math.max(0, intensity));
  }

  /**
   * Calculate behavioral impact of a thought
   */
  private calculateBehavioralImpact(
    thoughtType: InnerThoughtType,
    intensity: number,
    targetId: string | undefined
  ): BehavioralImpact {
    const impact: BehavioralImpact = {
      trustChange: 0,
      sarcasmChange: 0,
      suspicionChange: 0,
      engagementChange: 0,
      assertivenessChange: 0,
      curiosityChange: 0,
      patienceChange: 0
    };

    const multiplier = intensity * this.config.thoughtIntensity;

    switch (thoughtType) {
      case 'suspicion':
        impact.suspicionChange = 0.2 * multiplier;
        impact.trustChange = -0.15 * multiplier;
        break;
      case 'admiration':
        impact.trustChange = 0.2 * multiplier;
        impact.engagementChange = 0.15 * multiplier;
        break;
      case 'doubt':
        impact.suspicionChange = 0.15 * multiplier;
        impact.trustChange = -0.1 * multiplier;
        break;
      case 'curiosity':
        impact.curiosityChange = 0.2 * multiplier;
        impact.engagementChange = 0.15 * multiplier;
        break;
      case 'frustration':
        impact.patienceChange = -0.2 * multiplier;
        impact.sarcasmChange = 0.15 * multiplier;
        break;
      case 'amusement':
        impact.engagementChange = 0.1 * multiplier;
        impact.patienceChange = 0.1 * multiplier;
        break;
      case 'concern':
        impact.engagementChange = 0.15 * multiplier;
        impact.patienceChange = 0.1 * multiplier;
        break;
      case 'excitement':
        impact.engagementChange = 0.2 * multiplier;
        impact.curiosityChange = 0.15 * multiplier;
        break;
    }

    return impact;
  }

  /**
   * Apply behavioral impact to agent memory
   */
  private applyBehavioralImpact(agentId: string, thought: InnerThought): void {
    const memory = this.agentMemories.get(agentId);
    if (!memory || !thought.behavioralImpact) return;

    const impact = thought.behavioralImpact;
    const state = memory.behavioralState;

    // Apply changes
    state.trust = Math.max(-1, Math.min(1, state.trust + impact.trustChange));
    state.sarcasm = Math.max(-1, Math.min(1, state.sarcasm + impact.sarcasmChange));
    state.suspicion = Math.max(-1, Math.min(1, state.suspicion + impact.suspicionChange));
    state.engagement = Math.max(-1, Math.min(1, state.engagement + impact.engagementChange));
    state.assertiveness = Math.max(-1, Math.min(1, state.assertiveness + impact.assertivenessChange));
    state.curiosity = Math.max(-1, Math.min(1, state.curiosity + impact.curiosityChange));
    state.patience = Math.max(-1, Math.min(1, state.patience + impact.patienceChange));

    state.timestamp = new Date();
    memory.lastUpdated = new Date();

    // Update relationship score if thought is about a specific person
    if (thought.targetId) {
      const currentScore = memory.relationshipScores.get(thought.targetId) || 0;
      const relationshipChange = (impact.trustChange + impact.engagementChange) / 2;
      memory.relationshipScores.set(thought.targetId, 
        Math.max(-1, Math.min(1, currentScore + relationshipChange))
      );
    }

    this.emit('behavioral_state_updated', {
      agentId,
      thought,
      newState: state,
      timestamp: new Date()
    });
  }

  /**
   * Clean up old thoughts based on retention rate
   */
  private cleanupOldThoughts(agentId: string): void {
    const memory = this.agentMemories.get(agentId);
    if (!memory) return;

    const retentionThreshold = Date.now() - (24 * 60 * 60 * 1000 * (1 - this.config.memoryRetention));
    memory.thoughts = memory.thoughts.filter(thought => 
      thought.timestamp.getTime() > retentionThreshold
    );
  }

  /**
   * Create thought context
   */
  private createThoughtContext(context: any): string {
    return `Thread: ${context.threadId}, Round: ${context.round}, Participants: ${context.participants.join(', ')}`;
  }

  /**
   * Get agent's current emotional state
   */
  private getAgentEmotionalState(agentId: string): string {
    const memory = this.agentMemories.get(agentId);
    if (!memory) return 'neutral';

    const state = memory.behavioralState;
    
    if (state.suspicion > 0.6) return 'suspicious';
    if (state.trust < -0.3) return 'distrustful';
    if (state.curiosity > 0.6) return 'curious';
    if (state.engagement > 0.6) return 'engaged';
    if (state.patience < -0.3) return 'impatient';
    if (state.sarcasm > 0.4) return 'sarcastic';
    
    return 'neutral';
  }

  /**
   * Get agent memory
   */
  getAgentMemory(agentId: string): AgentMemory | undefined {
    return this.agentMemories.get(agentId);
  }

  /**
   * Get agent behavioral state
   */
  getAgentBehavioralState(agentId: string): BehavioralState | undefined {
    const memory = this.agentMemories.get(agentId);
    return memory?.behavioralState;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(limit: number = 100): DualExchange[] {
    return this.conversationHistory.slice(-limit);
  }

  /**
   * Get thoughts for a specific agent
   */
  getAgentThoughts(agentId: string, limit: number = 50): InnerThought[] {
    const memory = this.agentMemories.get(agentId);
    return memory ? memory.thoughts.slice(-limit) : [];
  }

  /**
   * Get relationship score between two agents
   */
  getRelationshipScore(agentId: string, targetId: string): number {
    const memory = this.agentMemories.get(agentId);
    return memory?.relationshipScores.get(targetId) || 0;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<InnerThoughtConfig>): void {
    this.config = { ...this.config, ...updates };
    
    this.emit('config_updated', {
      config: this.config,
      timestamp: new Date()
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): InnerThoughtConfig {
    return { ...this.config };
  }

  /**
   * Get dual conversation statistics
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      probability: this.config.probability,
      behavioralImpact: this.config.behavioralImpact,
      totalExchanges: this.conversationHistory.length,
      totalThoughts: this.conversationHistory.filter(ex => ex.unspoken).length,
      agentMemories: Array.from(this.agentMemories.keys()),
      thoughtTypes: this.config.thoughtTypes
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.agentMemories.clear();
    this.conversationHistory = [];
    this.thoughtTemplates.clear();
    this.removeAllListeners();
  }
} 