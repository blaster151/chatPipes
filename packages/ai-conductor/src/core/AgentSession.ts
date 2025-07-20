import { EventEmitter } from 'events';
import { 
  PersonaConfig, 
  PlatformConfig, 
  BrowserAgentConfig,
  Interjection,
  Spectator,
  AgentConfig,
  AgentStats
} from '@chatpipes/types';
import { 
  AgentAdapter, 
  globalAdapterRegistry,
  globalAdapterFactoryRegistry 
} from '../adapters/AgentAdapter';
import { InterjectionManager } from '../interjection/InterjectionManager';
import { SessionManager } from '../session/SessionManager';

export interface AgentSessionOptions {
  agentType: 'chatgpt' | 'claude' | 'perplexity' | 'deepseek';
  persona?: PersonaConfig;
  headless?: boolean;
  platformConfig?: PlatformConfig;
  browserConfig?: BrowserAgentConfig;
  sessionManager?: SessionManager;
  sessionId?: string;
  userAgent?: string;
  viewport?: PlatformConfig['viewport'];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  conversationHistory?: string[];
  useStealth?: boolean;
  rateLimitConfig?: PlatformConfig['rateLimitConfig'];
  apiKey?: string;
}

export interface PromptJob {
  id: string;
  prompt: string;
  timestamp: Date;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  interjection?: Interjection;
}

export interface ResponseEvent {
  from: 'agent';
  text: string;
  prompt: string;
  timestamp: Date;
  jobId: string;
  interjectionId?: string;
}

export interface ErrorEvent {
  error: Error;
  prompt?: string;
  timestamp: Date;
  jobId?: string;
}

export class AgentSession extends EventEmitter {
  private adapter: AgentAdapter;
  private promptQueue: PromptJob[] = [];
  private isProcessing = false;
  private isInitialized = false;
  private isClosed = false;
  private responseStreamGenerator: AsyncGenerator<ResponseEvent, void> | null = null;
  private interjectionManager: InterjectionManager;
  private sessionManager?: SessionManager;
  private sessionId?: string;

  constructor(options: AgentSessionOptions) {
    super();
    
    // Set max listeners to prevent memory leaks
    this.setMaxListeners(100);
    
    this.interjectionManager = new InterjectionManager();
    this.sessionManager = options.sessionManager;
    this.sessionId = options.sessionId;

    // Create adapter using the factory system
    const adapterType = options.agentType || 'chatgpt';
    const adapterConfig: AgentConfig = {
      type: adapterType,
      userAgent: options.userAgent,
      viewport: options.viewport,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      systemPrompt: options.systemPrompt,
      conversationHistory: options.conversationHistory,
      useStealth: options.useStealth,
      rateLimitConfig: options.rateLimitConfig,
      apiKey: options.apiKey
    };

    this.adapter = globalAdapterFactoryRegistry.createAdapter(adapterType, `session-${Date.now()}`, adapterConfig);

    // Forward adapter events
    this.adapter.on('initializing', (data) => {
      this.emit('initializing', { ...data, sessionId: this.sessionId });
    });

    this.adapter.on('initialized', (data) => {
      this.emit('initialized', { ...data, sessionId: this.sessionId });
    });

    this.adapter.on('message_sent', (data) => {
      this.emit('message_sent', { ...data, sessionId: this.sessionId });
    });

    this.adapter.on('request_success', (data) => {
      this.emit('request_success', { ...data, sessionId: this.sessionId });
    });

    this.adapter.on('request_error', (data) => {
      this.emit('request_error', { ...data, sessionId: this.sessionId });
    });

    this.adapter.on('rate_limit_hit', (data) => {
      this.emit('rate_limit_hit', { ...data, sessionId: this.sessionId });
    });

    this.adapter.on('stealth_score_updated', (data) => {
      this.emit('stealth_score_updated', { ...data, sessionId: this.sessionId });
    });

    this.adapter.on('closing', (data) => {
      this.emit('closing', { ...data, sessionId: this.sessionId });
    });

    this.adapter.on('closed', (data) => {
      this.emit('closed', { ...data, sessionId: this.sessionId });
    });
  }

  /**
   * Initialize the agent session
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('AgentSession already initialized');
    }

    if (this.isClosed) {
      throw new Error('AgentSession has been closed');
    }

    try {
      this.emit('session_initializing', { sessionId: this.sessionId });
      
      await this.adapter.init();
      
      this.emit('session_initialized', { sessionId: this.sessionId });
    } catch (error) {
      this.emit('session_error', { error, sessionId: this.sessionId });
      throw error;
    }
  }

  /**
   * Send a prompt and get response
   */
  async sendPrompt(prompt: string): Promise<string> {
    if (!this.adapter.isInitialized()) {
      throw new Error('Agent session not initialized');
    }

    // Check for pending interjections
    const pendingInterjection = this.interjectionManager.getNextInterjection(
      this.adapter.getStats().browserStats?.identityId || 'unknown'
    );

    let finalPrompt = prompt;
    let appliedInterjectionId: string | null = null;

    if (pendingInterjection) {
      finalPrompt = this.interjectionManager.applyInterjection(prompt, pendingInterjection.interjection);
      appliedInterjectionId = pendingInterjection.id;
      this.interjectionManager.markApplied(pendingInterjection.id);
    }

    // Emit prompt event
    this.emit('prompt_sent', {
      prompt: finalPrompt,
      originalPrompt: prompt,
      interjectionId: appliedInterjectionId,
      timestamp: new Date(),
      sessionId: this.sessionId
    });

    // Send via adapter
    const response = await this.adapter.send(finalPrompt);

    // Emit response event
    this.emit('response_received', {
      prompt: finalPrompt,
      response,
      interjectionId: appliedInterjectionId,
      timestamp: new Date(),
      sessionId: this.sessionId
    });

    // Record in session manager if available
    if (this.sessionManager && this.sessionId) {
      this.sessionManager.recordExchange({
        id: `exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: 'user',
        to: this.adapter.type,
        prompt: finalPrompt,
        response,
        round: 1,
        timestamp: new Date(),
        metadata: {
          duration: 0,
          tokens: 0,
          platform: this.adapter.type,
          model: this.adapter.getCapabilities().supportedModels[0] || 'unknown',
          interjectionId: appliedInterjectionId
        }
      });
    }

    return response;
  }

  /**
   * Queue a prompt for processing
   */
  async queuePrompt(prompt: string): Promise<string> {
    if (!this.adapter.isInitialized()) {
      throw new Error('Agent session not initialized');
    }

    if (this.isClosed) {
      throw new Error('AgentSession has been closed');
    }

    return new Promise<string>((resolve, reject) => {
      const job: PromptJob = {
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        prompt,
        timestamp: new Date(),
        resolve,
        reject
      };

      this.promptQueue.push(job);
      this.processQueue();
    });
  }

  /**
   * Process the prompt queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.promptQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.promptQueue.length > 0) {
      const job = this.promptQueue.shift()!;
      
      try {
        // Emit prompt event
        this.emit('prompt', {
          text: job.prompt,
          timestamp: job.timestamp,
          jobId: job.id
        });

        // Send prompt to browser session
        const response = await this.sendPrompt(job.prompt);

        // Create response event
        const responseEvent: ResponseEvent = {
          from: 'agent',
          text: response,
          prompt: job.prompt,
          timestamp: new Date(),
          jobId: job.id,
          interjectionId: job.interjection?.id
        };

        // Emit response event
        this.emit('response', responseEvent);

        // Resolve promise if this was a sendPrompt call
        if (job.resolve !== (() => {})) {
          job.resolve(response);
        }

        // Add delay between requests to be respectful
        if (this.promptQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        const errorEvent: ErrorEvent = {
          error: error instanceof Error ? error : new Error(String(error)),
          prompt: job.prompt,
          timestamp: new Date(),
          jobId: job.id
        };

        this.emit('error', errorEvent);

        // Reject promise if this was a sendPrompt call
        if (job.reject !== (() => {})) {
          job.reject(errorEvent.error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get response stream as async generator
   */
  get responseStream(): AsyncGenerator<ResponseEvent, void> {
    if (!this.responseStreamGenerator) {
      this.responseStreamGenerator = this.createResponseStream();
    }
    return this.responseStreamGenerator;
  }

  /**
   * Create response stream generator
   */
  private async *createResponseStream(): AsyncGenerator<ResponseEvent, void> {
    const responseQueue: ResponseEvent[] = [];
    let resolveNext: ((value: IteratorResult<ResponseEvent>) => void) | null = null;

    // Listen for response events
    this.on('response', (responseEvent: ResponseEvent) => {
      if (resolveNext) {
        resolveNext({ value: responseEvent, done: false });
        resolveNext = null;
      } else {
        responseQueue.push(responseEvent);
      }
    });

    // Listen for close events
    this.on('close', () => {
      if (resolveNext) {
        resolveNext({ value: undefined, done: true });
        resolveNext = null;
      }
    });

    while (true) {
      if (responseQueue.length > 0) {
        yield responseQueue.shift()!;
      } else {
        yield new Promise<IteratorResult<ResponseEvent>>(resolve => {
          resolveNext = resolve;
        });
      }
    }
  }

  /**
   * Add interjection to next prompt
   */
  addInterjection(interjection: Interjection): void {
    if (this.promptQueue.length > 0) {
      // Add interjection to the next queued prompt
      const nextJob = this.promptQueue[0];
      nextJob.interjection = interjection;
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    return this.adapter.getStats();
  }

  /**
   * Get adapter capabilities
   */
  getCapabilities() {
    return this.adapter.getCapabilities();
  }

  /**
   * Get pending interjections
   */
  getPendingInterjections(): Interjection[] {
    return this.interjectionManager.getPendingInterjections();
  }

  /**
   * Clear interjections
   */
  clearInterjections(): void {
    this.interjectionManager.clearInterjections();
  }

  /**
   * Close the session
   */
  async close(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;
    this.isProcessing = false;

    // Clear queue
    this.promptQueue.forEach(job => {
      if (job.reject !== (() => {})) {
        job.reject(new Error('Session closed'));
      }
    });
    this.promptQueue = [];

    // Close browser session
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
    }

    this.emit('close');
    this.removeAllListeners();
  }

  /**
   * Type-safe event listeners
   */
  on(event: 'prompt', listener: (data: { text: string; timestamp: Date; jobId: string }) => void): this;
  on(event: 'response', listener: (data: ResponseEvent) => void): this;
  on(event: 'error', listener: (data: ErrorEvent) => void): this;
  on(event: 'ready', listener: () => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * Type-safe event emitters
   */
  emit(event: 'prompt', data: { text: string; timestamp: Date; jobId: string }): boolean;
  emit(event: 'response', data: ResponseEvent): boolean;
  emit(event: 'error', data: ErrorEvent): boolean;
  emit(event: 'ready'): boolean;
  emit(event: 'close'): boolean;
  emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Get adapter instance (for advanced usage)
   */
  getAdapter(): AgentAdapter {
    return this.adapter;
  }

  /**
   * Check if session is initialized
   */
  isInitialized(): boolean {
    return this.adapter.isInitialized();
  }

  /**
   * Check if session is connected
   */
  isConnected(): boolean {
    return this.adapter.isConnected();
  }
} 