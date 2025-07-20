import { BrowserAgentSession, BrowserAgentConfig } from '../core/BrowserAgentSession';
import { PersonaConfig, PlatformConfig } from '../core/AgentSession';
import { MemoryManager } from '../core/MemoryManager';
import { FileStore } from '../storage/FileStore';

export interface AgentConfig {
  id: string;
  target: 'chatgpt' | 'claude' | 'perplexity' | 'deepseek';
  persona: PersonaConfig;
  platformConfig?: PlatformConfig;
  browserConfig?: BrowserAgentConfig;
  memoryManager?: MemoryManager;
}

export interface ConversationConfig {
  agents: AgentConfig[];
  flow: Array<{
    from: string;
    to: string;
    promptTemplate?: string;
    delay?: number;
  }>;
  maxRounds?: number;
  autoStart?: boolean;
}

export interface ConversationEvent {
  timestamp: Date;
  round: number;
  from: string;
  to: string;
  prompt: string;
  response: string;
  duration: number;
}

export class ConversationOrchestrator {
  private agents: Map<string, BrowserAgentSession> = new Map();
  private memoryManagers: Map<string, MemoryManager> = new Map();
  private config: ConversationConfig;
  private isRunning: boolean = false;
  private currentRound: number = 0;
  private events: ConversationEvent[] = [];
  private conversationId: string;

  constructor(config: ConversationConfig) {
    this.config = config;
    this.conversationId = this.generateConversationId();
  }

  async initialize(): Promise<void> {
    console.log(`Initializing conversation orchestrator with ${this.config.agents.length} agents`);

    for (const agentConfig of this.config.agents) {
      // Create memory manager for each agent
      const store = new FileStore();
      const memoryManager = new MemoryManager(store, agentConfig.id);
      await memoryManager.init();
      this.memoryManagers.set(agentConfig.id, memoryManager);

      // Create agent session
      const session = new BrowserAgentSession(
        agentConfig.target,
        agentConfig.persona,
        agentConfig.platformConfig || {},
        agentConfig.browserConfig || { useBrowser: false }
      );

      // Connect memory manager
      session.setMemoryManager(memoryManager);

      // Initialize session
      await session.init();

      this.agents.set(agentConfig.id, session);
    }

    console.log('Conversation orchestrator initialized successfully');
  }

  async startConversation(initialPrompt?: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Conversation is already running');
    }

    this.isRunning = true;
    this.currentRound = 0;

    console.log(`Starting conversation: ${this.conversationId}`);

    if (initialPrompt) {
      // Start with initial prompt to first agent
      const firstAgent = this.config.agents[0];
      const firstSession = this.agents.get(firstAgent.id);
      
      if (firstSession) {
        const startTime = Date.now();
        const response = await firstSession.sendPrompt(initialPrompt);
        const duration = Date.now() - startTime;

        this.events.push({
          timestamp: new Date(),
          round: this.currentRound,
          from: 'user',
          to: firstAgent.id,
          prompt: initialPrompt,
          response,
          duration
        });

        console.log(`Round ${this.currentRound}: user → ${firstAgent.id}: "${initialPrompt}" → "${response.substring(0, 100)}..."`);
      }
    }

    // Start the conversation flow
    await this.runConversationFlow();
  }

  async runConversationFlow(): Promise<void> {
    const maxRounds = this.config.maxRounds || 10;

    while (this.isRunning && this.currentRound < maxRounds) {
      this.currentRound++;

      for (const flowStep of this.config.flow) {
        if (!this.isRunning) break;

        const fromSession = this.agents.get(flowStep.from);
        const toSession = this.agents.get(flowStep.to);

        if (!fromSession || !toSession) {
          console.error(`Agent not found: ${flowStep.from} or ${flowStep.to}`);
          continue;
        }

        try {
          // Get the last response from the 'from' agent
          const lastEvent = this.events
            .filter(e => e.to === flowStep.from)
            .pop();

          if (!lastEvent) {
            console.warn(`No previous response from ${flowStep.from}`);
            continue;
          }

          // Create prompt for the next agent
          const prompt = this.buildPrompt(flowStep.promptTemplate, {
            fromAgent: flowStep.from,
            toAgent: flowStep.to,
            lastResponse: lastEvent.response,
            conversationContext: await this.getConversationContext()
          });

          // Send prompt and get response
          const startTime = Date.now();
          const response = await toSession.sendPrompt(prompt);
          const duration = Date.now() - startTime;

          // Record event
          this.events.push({
            timestamp: new Date(),
            round: this.currentRound,
            from: flowStep.from,
            to: flowStep.to,
            prompt,
            response,
            duration
          });

          console.log(`Round ${this.currentRound}: ${flowStep.from} → ${flowStep.to}: "${prompt.substring(0, 100)}..." → "${response.substring(0, 100)}..."`);

          // Apply delay if specified
          if (flowStep.delay) {
            await new Promise(resolve => setTimeout(resolve, flowStep.delay));
          }

        } catch (error) {
          console.error(`Error in conversation flow: ${error instanceof Error ? error.message : String(error)}`);
          this.events.push({
            timestamp: new Date(),
            round: this.currentRound,
            from: flowStep.from,
            to: flowStep.to,
            prompt: 'ERROR',
            response: error instanceof Error ? error.message : String(error),
            duration: 0
          });
        }
      }

      // Check if conversation should continue
      if (this.shouldContinueConversation()) {
        continue;
      } else {
        console.log('Conversation ending conditions met');
        break;
      }
    }

    this.isRunning = false;
    console.log(`Conversation completed after ${this.currentRound} rounds`);
  }

  async stopConversation(): Promise<void> {
    this.isRunning = false;
    console.log('Conversation stopped by user');
  }

  async addInterjection(agentId: string, prompt: string): Promise<string> {
    const session = this.agents.get(agentId);
    if (!session) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const startTime = Date.now();
    const response = await session.sendPrompt(prompt);
    const duration = Date.now() - startTime;

    this.events.push({
      timestamp: new Date(),
      round: this.currentRound,
      from: 'user',
      to: agentId,
      prompt,
      response,
      duration
    });

    console.log(`Interjection: user → ${agentId}: "${prompt}" → "${response.substring(0, 100)}..."`);

    return response;
  }

  async queuePrompt(agentId: string, prompt: string): Promise<void> {
    const session = this.agents.get(agentId);
    if (!session) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    await session.queuePrompt(prompt);
    console.log(`Prompt queued for ${agentId}: "${prompt}"`);
  }

  // Session persistence
  async saveConversation(path?: string): Promise<void> {
    const conversationData = {
      id: this.conversationId,
      config: this.config,
      events: this.events,
      agents: Array.from(this.agents.entries()).map(([id, session]) => ({
        id,
        sessionData: session.exportSession()
      })),
      memoryManagers: Array.from(this.memoryManagers.entries()).map(([id, manager]) => ({
        id,
        // Memory data is already persisted by FileStore
      }))
    };

    const fs = require('fs').promises;
    const filePath = path || `conversations/${this.conversationId}.json`;
    
    await fs.mkdir('conversations', { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(conversationData, null, 2));
    
    console.log(`Conversation saved to: ${filePath}`);
  }

  static async loadConversation(filePath: string): Promise<ConversationOrchestrator> {
    const fs = require('fs').promises;
    const conversationData = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    const orchestrator = new ConversationOrchestrator(conversationData.config);
    
    // Restore agents and sessions
    for (const agentData of conversationData.agents) {
      const session = await BrowserAgentSession.importSession(agentData.sessionData);
      orchestrator.agents.set(agentData.id, session);
    }

    // Restore events
    orchestrator.events = conversationData.events.map((event: any) => ({
      ...event,
      timestamp: new Date(event.timestamp)
    }));

    orchestrator.conversationId = conversationData.id;

    return orchestrator;
  }

  // Utility methods
  private buildPrompt(template: string | undefined, context: any): string {
    if (!template) {
      return `Continue the conversation based on this response: "${context.lastResponse}"`;
    }

    return template
      .replace('{fromAgent}', context.fromAgent)
      .replace('{toAgent}', context.toAgent)
      .replace('{lastResponse}', context.lastResponse)
      .replace('{conversationContext}', context.conversationContext);
  }

  private async getConversationContext(): Promise<string> {
    const contexts = await Promise.all(
      Array.from(this.memoryManagers.values()).map(manager => manager.getRehydrationPrompt())
    );
    return contexts.filter(Boolean).join('\n\n');
  }

  private shouldContinueConversation(): boolean {
    // Add logic to determine if conversation should continue
    // For example, check for natural ending, max rounds, etc.
    return this.currentRound < (this.config.maxRounds || 10);
  }

  private generateConversationId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getConversationId(): string {
    return this.conversationId;
  }

  getEvents(): ConversationEvent[] {
    return [...this.events];
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  isConversationRunning(): boolean {
    return this.isRunning;
  }

  getAgents(): Map<string, BrowserAgentSession> {
    return new Map(this.agents);
  }

  getAgent(agentId: string): BrowserAgentSession | undefined {
    return this.agents.get(agentId);
  }

  async close(): Promise<void> {
    this.isRunning = false;
    
    for (const session of this.agents.values()) {
      await session.close();
    }
    
    console.log('Conversation orchestrator closed');
  }
} 