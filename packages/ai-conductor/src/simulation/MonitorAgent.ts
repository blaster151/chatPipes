import { EventEmitter } from 'events';
import { ConvoThread, Transcript } from './ConvoThread';
import { Environment, AmbientEvent } from './Environment';
import { World } from './World';
import { CrossTalkManager, CrossTalkEvent } from './CrossTalkManager';
import { AgentSession } from '../core/AgentSession';

export interface MonitorAgentConfig {
  id: string;
  name: string;
  description: string;
  llmProvider: 'openai' | 'anthropic' | 'custom';
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  capabilities: MonitorCapabilities;
  updateFrequency: number; // milliseconds
  enableRealTimeMonitoring: boolean;
  enableNarrativeControl: boolean;
  enableInterjectionGeneration: boolean;
  enableCrossTalkDecision: boolean;
  enableAmbientNarration: boolean;
}

export interface MonitorCapabilities {
  canGenerateInterjections: boolean;
  canDecideCrossTalk: boolean;
  canNarrateAmbient: boolean;
  canControlNarrative: boolean;
  canAnalyzeEmotions: boolean;
  canPredictOutcomes: boolean;
  canSuggestEvents: boolean;
  maxConcurrentThreads: number;
  maxInterjectionsPerMinute: number;
}

export interface NarrativeSuggestion {
  id: string;
  type: 'interjection' | 'cross_talk' | 'ambient_event' | 'narrative_control' | 'emotional_nudge';
  target: string; // threadId, environmentId, or 'global'
  content: string;
  priority: number; // 1-10
  reasoning: string;
  confidence: number; // 0-1
  timestamp: Date;
  metadata?: any;
}

export interface EmotionalAnalysis {
  threadId: string;
  overallMood: string;
  tensionLevel: number; // 0-1
  engagementLevel: number; // 0-1
  dominantEmotions: string[];
  emotionalTrajectory: 'rising' | 'falling' | 'stable';
  suggestions: string[];
  timestamp: Date;
}

export interface NarrativeState {
  worldId: string;
  activeThreads: number;
  totalExchanges: number;
  crossTalkEvents: number;
  ambientEvents: number;
  interjections: number;
  overallMood: string;
  narrativeTension: number;
  storyArcs: string[];
  timestamp: Date;
}

export class MonitorAgent extends EventEmitter {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly config: MonitorAgentConfig;
  
  private world?: World;
  private crossTalkManager?: CrossTalkManager;
  private monitoredThreads: Map<string, ConvoThread> = new Map();
  private monitoredEnvironments: Map<string, Environment> = new Map();
  private narrativeSuggestions: NarrativeSuggestion[] = [];
  private emotionalAnalyses: Map<string, EmotionalAnalysis> = new Map();
  private isActive: boolean = false;
  private updateTimer?: NodeJS.Timeout;
  private llmSession?: AgentSession;

  constructor(config: MonitorAgentConfig) {
    super();
    this.setMaxListeners(100);
    
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.config = {
      temperature: 0.7,
      maxTokens: 1000,
      ...config
    };
  }

  /**
   * Initialize the monitor agent
   */
  async init(): Promise<void> {
    try {
      this.emit('monitor_initializing', { monitorId: this.id });

      // Initialize LLM session for monitoring
      this.llmSession = new AgentSession({
        agentType: this.config.llmProvider === 'openai' ? 'chatgpt' : 'claude',
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        systemPrompt: this.createSystemPrompt(),
        useStealth: false, // Direct API access
        apiKey: this.config.apiKey
      });

      await this.llmSession.init();

      this.emit('monitor_initialized', { monitorId: this.id });
    } catch (error) {
      this.emit('monitor_error', { error, monitorId: this.id });
      throw error;
    }
  }

  /**
   * Create system prompt for the monitor agent
   */
  private createSystemPrompt(): string {
    return `You are ${this.name}, an AI monitor agent responsible for overseeing and enhancing narrative simulations.

Your capabilities include:
${this.config.capabilities.canGenerateInterjections ? '- Generating contextual interjections' : ''}
${this.config.capabilities.canDecideCrossTalk ? '- Deciding when conversations should cross-talk' : ''}
${this.config.capabilities.canNarrateAmbient ? '- Narrating ambient events and environmental changes' : ''}
${this.config.capabilities.canControlNarrative ? '- Controlling narrative direction and story arcs' : ''}
${this.config.capabilities.canAnalyzeEmotions ? '- Analyzing emotional states and dynamics' : ''}
${this.config.capabilities.canPredictOutcomes ? '- Predicting conversation outcomes and trajectories' : ''}
${this.config.capabilities.canSuggestEvents ? '- Suggesting events and surprises' : ''}

Your role is to:
1. Monitor conversation threads and their emotional dynamics
2. Generate appropriate interjections to guide or enhance conversations
3. Decide when cross-talk should occur between threads
4. Narrate ambient events to enrich the environment
5. Maintain narrative coherence and engagement
6. Analyze emotional states and suggest interventions when needed

Always provide reasoning for your suggestions and consider the overall narrative flow.`;
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;

    if (this.config.enableRealTimeMonitoring) {
      this.updateTimer = setInterval(() => {
        this.performMonitoringCycle();
      }, this.config.updateFrequency);
    }

    this.emit('monitor_started', { monitorId: this.id });
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    this.emit('monitor_stopped', { monitorId: this.id });
  }

  /**
   * Attach to a world for comprehensive monitoring
   */
  attachToWorld(world: World, crossTalkManager: CrossTalkManager): void {
    this.world = world;
    this.crossTalkManager = crossTalkManager;

    // Listen to world events
    world.on('thread_exchange', (data) => {
      this.handleThreadExchange(data);
    });

    world.on('cross_talk', (data) => {
      this.handleCrossTalk(data);
    });

    world.on('global_event', (data) => {
      this.handleGlobalEvent(data);
    });

    // Listen to cross-talk events
    crossTalkManager.on('cross_talk', (event) => {
      this.handleCrossTalkEvent(event);
    });

    this.emit('monitor_attached_to_world', { 
      monitorId: this.id, 
      worldId: world.id 
    });
  }

  /**
   * Monitor a specific conversation thread
   */
  monitorThread(thread: ConvoThread): void {
    this.monitoredThreads.set(thread.id, thread);

    // Listen to thread events
    thread.on('exchange', (exchange) => {
      this.handleThreadExchange({ threadId: thread.id, exchange });
    });

    thread.on('conversation_started', (data) => {
      this.handleThreadStarted(data);
    });

    thread.on('conversation_stopped', (data) => {
      this.handleThreadStopped(data);
    });

    thread.on('ambient_event', (data) => {
      this.handleThreadAmbientEvent(data);
    });

    this.emit('thread_monitoring_started', { 
      monitorId: this.id, 
      threadId: thread.id 
    });
  }

  /**
   * Monitor a specific environment
   */
  monitorEnvironment(environment: Environment): void {
    this.monitoredEnvironments.set(environment.id, environment);

    // Listen to environment events
    environment.on('ambient_event', (data) => {
      this.handleEnvironmentAmbientEvent(data);
    });

    environment.on('state_updated', (data) => {
      this.handleEnvironmentStateUpdate(data);
    });

    this.emit('environment_monitoring_started', { 
      monitorId: this.id, 
      environmentId: environment.id 
    });
  }

  /**
   * Perform a monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Analyze emotional states
      if (this.config.capabilities.canAnalyzeEmotions) {
        await this.analyzeEmotionalStates();
      }

      // Generate narrative suggestions
      if (this.config.capabilities.canSuggestEvents) {
        await this.generateNarrativeSuggestions();
      }

      // Decide on cross-talk events
      if (this.config.capabilities.canDecideCrossTalk) {
        await this.decideCrossTalkEvents();
      }

      // Generate ambient narration
      if (this.config.capabilities.canNarrateAmbient) {
        await this.generateAmbientNarration();
      }

      this.emit('monitoring_cycle_completed', { 
        monitorId: this.id, 
        timestamp: new Date() 
      });
    } catch (error) {
      this.emit('monitoring_cycle_error', { 
        error, 
        monitorId: this.id 
      });
    }
  }

  /**
   * Handle thread exchange
   */
  private async handleThreadExchange(data: { threadId: string; exchange: any }): Promise<void> {
    if (this.config.enableInterjectionGeneration) {
      await this.considerInterjection(data.threadId, data.exchange);
    }

    if (this.config.capabilities.canAnalyzeEmotions) {
      await this.updateEmotionalAnalysis(data.threadId);
    }
  }

  /**
   * Handle cross-talk event
   */
  private async handleCrossTalkEvent(event: CrossTalkEvent): Promise<void> {
    this.emit('cross_talk_observed', {
      monitorId: this.id,
      event,
      timestamp: new Date()
    });
  }

  /**
   * Handle global event
   */
  private async handleGlobalEvent(data: any): Promise<void> {
    if (this.config.capabilities.canNarrateAmbient) {
      await this.narrateGlobalEvent(data);
    }
  }

  /**
   * Consider generating an interjection
   */
  private async considerInterjection(threadId: string, exchange: any): Promise<void> {
    const thread = this.monitoredThreads.get(threadId);
    if (!thread) return;

    const prompt = `Analyze this conversation exchange and determine if an interjection would enhance the narrative:

Thread: ${thread.name}
Exchange: ${exchange.from} → ${exchange.to}
Content: ${exchange.response}

Consider:
- Would an interjection add value to the conversation?
- What type of interjection would be most appropriate?
- How would it affect the emotional dynamics?

Respond with a JSON object:
{
  "should_interject": boolean,
  "interjection_type": "question|comment|observation|challenge|support",
  "content": "the interjection text",
  "reasoning": "why this interjection is appropriate",
  "priority": 1-10
}`;

    try {
      const response = await this.llmSession!.sendPrompt(prompt);
      const suggestion = JSON.parse(response);

      if (suggestion.should_interject) {
        const narrativeSuggestion: NarrativeSuggestion = {
          id: `interjection-${Date.now()}`,
          type: 'interjection',
          target: threadId,
          content: suggestion.content,
          priority: suggestion.priority,
          reasoning: suggestion.reasoning,
          confidence: 0.8,
          timestamp: new Date(),
          metadata: {
            interjectionType: suggestion.interjection_type,
            exchangeId: exchange.id
          }
        };

        this.narrativeSuggestions.push(narrativeSuggestion);
        this.emit('interjection_suggested', {
          monitorId: this.id,
          suggestion: narrativeSuggestion
        });
      }
    } catch (error) {
      console.error('Error generating interjection:', error);
    }
  }

  /**
   * Analyze emotional states
   */
  private async analyzeEmotionalStates(): Promise<void> {
    for (const [threadId, thread] of this.monitoredThreads) {
      const transcript = thread.getTranscript();
      if (transcript.length === 0) continue;

      const recentExchanges = transcript.slice(-5);
      const prompt = `Analyze the emotional state of this conversation thread:

Thread: ${thread.name}
Recent exchanges:
${recentExchanges.map(ex => `${ex.from}: ${ex.response}`).join('\n')}

Provide a JSON analysis:
{
  "overall_mood": "positive|negative|neutral|mixed",
  "tension_level": 0.0-1.0,
  "engagement_level": 0.0-1.0,
  "dominant_emotions": ["emotion1", "emotion2"],
  "emotional_trajectory": "rising|falling|stable",
  "suggestions": ["suggestion1", "suggestion2"]
}`;

      try {
        const response = await this.llmSession!.sendPrompt(prompt);
        const analysis = JSON.parse(response);

        const emotionalAnalysis: EmotionalAnalysis = {
          threadId,
          overallMood: analysis.overall_mood,
          tensionLevel: analysis.tension_level,
          engagementLevel: analysis.engagement_level,
          dominantEmotions: analysis.dominant_emotions,
          emotionalTrajectory: analysis.emotional_trajectory,
          suggestions: analysis.suggestions,
          timestamp: new Date()
        };

        this.emotionalAnalyses.set(threadId, emotionalAnalysis);
        this.emit('emotional_analysis_updated', {
          monitorId: this.id,
          analysis: emotionalAnalysis
        });
      } catch (error) {
        console.error('Error analyzing emotions:', error);
      }
    }
  }

  /**
   * Generate narrative suggestions
   */
  private async generateNarrativeSuggestions(): Promise<void> {
    const prompt = `Based on the current state of monitored conversations, suggest narrative interventions:

Monitored threads: ${Array.from(this.monitoredThreads.keys()).join(', ')}
Monitored environments: ${Array.from(this.monitoredEnvironments.keys()).join(', ')}

Suggest up to 3 narrative interventions that would enhance the simulation. For each suggestion, provide:
{
  "type": "interjection|cross_talk|ambient_event|narrative_control|emotional_nudge",
  "target": "threadId or environmentId or 'global'",
  "content": "description of the intervention",
  "priority": 1-10,
  "reasoning": "why this intervention is needed",
  "confidence": 0.0-1.0
}

Respond with a JSON array of suggestions.`;

    try {
      const response = await this.llmSession!.sendPrompt(prompt);
      const suggestions = JSON.parse(response);

      for (const suggestion of suggestions) {
        const narrativeSuggestion: NarrativeSuggestion = {
          id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: suggestion.type,
          target: suggestion.target,
          content: suggestion.content,
          priority: suggestion.priority,
          reasoning: suggestion.reasoning,
          confidence: suggestion.confidence,
          timestamp: new Date()
        };

        this.narrativeSuggestions.push(narrativeSuggestion);
        this.emit('narrative_suggestion_generated', {
          monitorId: this.id,
          suggestion: narrativeSuggestion
        });
      }
    } catch (error) {
      console.error('Error generating narrative suggestions:', error);
    }
  }

  /**
   * Decide on cross-talk events
   */
  private async decideCrossTalkEvents(): Promise<void> {
    if (!this.crossTalkManager || !this.world) return;

    const activeThreads = Array.from(this.monitoredThreads.values())
      .filter(thread => thread.getState().isActive);

    for (let i = 0; i < activeThreads.length; i++) {
      for (let j = i + 1; j < activeThreads.length; j++) {
        const threadA = activeThreads[i];
        const threadB = activeThreads[j];

        if (threadA.getState().environmentId === threadB.getState().environmentId) {
          const prompt = `Should these two conversation threads cross-talk?

Thread A (${threadA.name}): ${threadA.getTranscript().slice(-2).map(ex => ex.response).join(' ')}
Thread B (${threadB.name}): ${threadB.getTranscript().slice(-2).map(ex => ex.response).join(' ')}

Consider:
- Would cross-talk enhance the narrative?
- Are the conversations thematically related?
- Would it create interesting dynamics?

Respond with JSON:
{
  "should_cross_talk": boolean,
  "reasoning": "explanation",
  "confidence": 0.0-1.0
}`;

          try {
            const response = await this.llmSession!.sendPrompt(prompt);
            const decision = JSON.parse(response);

            if (decision.should_cross_talk && decision.confidence > 0.7) {
              this.crossTalkManager.simulateEavesdrop(
                threadA.getState().environmentId!,
                threadA.id,
                threadB.id,
                true
              );

              this.emit('cross_talk_decided', {
                monitorId: this.id,
                sourceThread: threadA.id,
                targetThread: threadB.id,
                reasoning: decision.reasoning,
                confidence: decision.confidence
              });
            }
          } catch (error) {
            console.error('Error deciding cross-talk:', error);
          }
        }
      }
    }
  }

  /**
   * Generate ambient narration
   */
  private async generateAmbientNarration(): Promise<void> {
    for (const [environmentId, environment] of this.monitoredEnvironments) {
      const state = environment.getState();
      const recentEvents = environment.getEventHistory(3);

      const prompt = `Narrate an ambient event for this environment:

Environment: ${environment.name}
Current state: ${JSON.stringify(state, null, 2)}
Recent events: ${recentEvents.map(e => e.description).join(', ')}

Generate a natural, atmospheric ambient event that would enhance the environment. Consider:
- The current mood and atmosphere
- Recent events and their impact
- The type of environment
- Natural progression of events

Respond with JSON:
{
  "description": "the ambient event description",
  "type": "environmental|social|atmospheric",
  "intensity": 0.0-1.0,
  "affects": ["mood", "noise", "social"],
  "reasoning": "why this event fits"
}`;

      try {
        const response = await this.llmSession!.sendPrompt(prompt);
        const narration = JSON.parse(response);

        const ambientEvent: AmbientEvent = {
          id: `monitor-ambient-${Date.now()}`,
          type: narration.type,
          description: narration.description,
          intensity: narration.intensity,
          duration: 5000,
          affects: narration.affects,
          timestamp: new Date()
        };

        environment.emitEvent(ambientEvent);

        this.emit('ambient_narration_generated', {
          monitorId: this.id,
          environmentId,
          event: ambientEvent,
          reasoning: narration.reasoning
        });
      } catch (error) {
        console.error('Error generating ambient narration:', error);
      }
    }
  }

  /**
   * Get narrative state
   */
  getNarrativeState(): NarrativeState {
    return {
      worldId: this.world?.id || 'unknown',
      activeThreads: Array.from(this.monitoredThreads.values())
        .filter(thread => thread.getState().isActive).length,
      totalExchanges: Array.from(this.monitoredThreads.values())
        .reduce((sum, thread) => sum + thread.getState().totalExchanges, 0),
      crossTalkEvents: this.narrativeSuggestions.filter(s => s.type === 'cross_talk').length,
      ambientEvents: this.narrativeSuggestions.filter(s => s.type === 'ambient_event').length,
      interjections: this.narrativeSuggestions.filter(s => s.type === 'interjection').length,
      overallMood: this.calculateOverallMood(),
      narrativeTension: this.calculateNarrativeTension(),
      storyArcs: this.identifyStoryArcs(),
      timestamp: new Date()
    };
  }

  /**
   * Calculate overall mood
   */
  private calculateOverallMood(): string {
    const analyses = Array.from(this.emotionalAnalyses.values());
    if (analyses.length === 0) return 'neutral';

    const moodCounts = analyses.reduce((acc, analysis) => {
      acc[analysis.overallMood] = (acc[analysis.overallMood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  /**
   * Calculate narrative tension
   */
  private calculateNarrativeTension(): number {
    const analyses = Array.from(this.emotionalAnalyses.values());
    if (analyses.length === 0) return 0.5;

    const avgTension = analyses.reduce((sum, analysis) => sum + analysis.tensionLevel, 0) / analyses.length;
    return avgTension;
  }

  /**
   * Identify story arcs
   */
  private identifyStoryArcs(): string[] {
    // This would analyze conversation patterns to identify emerging story arcs
    return ['character_development', 'conflict_resolution', 'relationship_building'];
  }

  /**
   * Get narrative suggestions
   */
  getNarrativeSuggestions(limit: number = 50): NarrativeSuggestion[] {
    return this.narrativeSuggestions.slice(-limit);
  }

  /**
   * Get emotional analyses
   */
  getEmotionalAnalyses(): Map<string, EmotionalAnalysis> {
    return new Map(this.emotionalAnalyses);
  }

  /**
   * Get monitor statistics
   */
  getStats() {
    return {
      id: this.id,
      name: this.name,
      isActive: this.isActive,
      monitoredThreads: this.monitoredThreads.size,
      monitoredEnvironments: this.monitoredEnvironments.size,
      narrativeSuggestions: this.narrativeSuggestions.length,
      emotionalAnalyses: this.emotionalAnalyses.size,
      config: this.config
    };
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.stop();
    
    this.monitoredThreads.clear();
    this.monitoredEnvironments.clear();
    this.narrativeSuggestions = [];
    this.emotionalAnalyses.clear();
    
    if (this.llmSession) {
      await this.llmSession.close();
    }
    
    this.removeAllListeners();
  }
} 