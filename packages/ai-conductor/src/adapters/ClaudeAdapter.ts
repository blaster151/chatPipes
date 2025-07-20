import { BaseAgentAdapter, AdapterCapabilities } from './AgentAdapter';
import { AgentConfig, BrowserStats } from '@chatpipes/types';
import { StealthSession } from '@chatpipes/headless-bridges';
import { RateLimitManager } from '@chatpipes/headless-bridges';

export interface ClaudeConfig extends AgentConfig {
  model?: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  conversationHistory?: boolean;
  useStealth?: boolean;
  rateLimitConfig?: {
    requestsPerMinute: number;
    cooldownPeriod: number;
  };
}

export class ClaudeAdapter extends BaseAgentAdapter {
  private stealthSession?: StealthSession;
  private rateLimitManager?: RateLimitManager;
  private conversationId?: string;
  private messageHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(id: string, config: ClaudeConfig) {
    super(id, 'claude', config);
  }

  async init(): Promise<void> {
    try {
      this.emit('initializing', { adapterId: this.id, type: this.type });

      // Initialize stealth session if enabled
      if (this.config.useStealth !== false) {
        this.stealthSession = new StealthSession({
          userAgent: this.config.userAgent,
          viewport: this.config.viewport,
          enableStealth: true,
          enableAntiDetection: true
        });

        await this.stealthSession.init();
        this.connected = true;
        
        // Update browser stats
        this.updateBrowserStats({
          userAgent: this.stealthSession.getUserAgent(),
          viewport: this.stealthSession.getViewport(),
          stealthScore: 90 // Very high stealth score for Claude
        });
      }

      // Initialize rate limit manager
      this.rateLimitManager = new RateLimitManager({
        platform: 'claude',
        requestsPerMinute: this.config.rateLimitConfig?.requestsPerMinute || 15,
        cooldownPeriod: this.config.rateLimitConfig?.cooldownPeriod || 60000
      });

      this.initialized = true;
      this.emit('initialized', { adapterId: this.id, type: this.type });
    } catch (error) {
      this.recordError(error as Error);
      throw error;
    }
  }

  async send(prompt: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    const startTime = Date.now();

    try {
      // Check rate limits
      if (this.rateLimitManager) {
        await this.rateLimitManager.waitForAvailability();
      }

      // Add system prompt if provided
      let fullPrompt = prompt;
      if (this.config.systemPrompt && this.messageHistory.length === 0) {
        this.messageHistory.push({ role: 'assistant', content: this.config.systemPrompt });
      }

      // Add user message to history
      this.messageHistory.push({ role: 'user', content: prompt });

      // Prepare messages for API
      const messages = this.config.conversationHistory !== false 
        ? this.messageHistory 
        : [{ role: 'user' as const, content: prompt }];

      let response: string;

      if (this.stealthSession) {
        // Use stealth browser session
        response = await this.sendViaBrowser(prompt, messages);
      } else {
        // Use direct API (if configured)
        response = await this.sendViaAPI(prompt, messages);
      }

      // Add assistant response to history
      this.messageHistory.push({ role: 'assistant', content: response });

      // Trim history if too long
      if (this.messageHistory.length > 50) {
        this.messageHistory = this.messageHistory.slice(-50);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime, this.estimateTokens(response));

      this.emit('message_sent', {
        prompt,
        response,
        responseTime,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordError(error as Error, responseTime);
      throw error;
    }
  }

  private async sendViaBrowser(prompt: string, messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.stealthSession) {
      throw new Error('Stealth session not initialized');
    }

    // Navigate to Claude
    await this.stealthSession.navigate('https://claude.ai/');
    
    // Wait for page to load
    await this.stealthSession.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
    
    // Type the prompt
    await this.stealthSession.type('[data-testid="chat-input"]', prompt);
    
    // Submit the message
    await this.stealthSession.click('[data-testid="send-button"]');
    
    // Wait for response
    await this.stealthSession.waitForSelector('.claude-message', { timeout: 30000 });
    
    // Extract response
    const response = await this.stealthSession.getText('.claude-message');
    
    return response;
  }

  private async sendViaAPI(prompt: string, messages: Array<{ role: string; content: string }>): Promise<string> {
    // This would implement direct API calls if API keys are configured
    throw new Error('Direct API not implemented - use stealth browser mode');
  }

  async close(): Promise<void> {
    try {
      this.emit('closing', { adapterId: this.id, type: this.type });

      if (this.stealthSession) {
        await this.stealthSession.close();
      }

      this.initialized = false;
      this.connected = false;

      this.emit('closed', { adapterId: this.id, type: this.type });
    } catch (error) {
      this.recordError(error as Error);
      throw error;
    }
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportsStreaming: false,
      supportsInterjections: true,
      supportsRateLimiting: true,
      supportsStealth: true,
      maxTokensPerRequest: this.config.maxTokens || 100000,
      maxRequestsPerMinute: this.config.rateLimitConfig?.requestsPerMinute || 15,
      supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      features: ['conversation_history', 'system_prompts', 'stealth_mode', 'rate_limiting', 'large_context']
    };
  }

  validateConfig(): boolean {
    return !!(this.config.useStealth !== false || this.config.apiKey);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.messageHistory];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.messageHistory = [];
    if (this.config.systemPrompt) {
      this.messageHistory.push({ role: 'assistant', content: this.config.systemPrompt });
    }
  }

  /**
   * Set conversation ID for tracking
   */
  setConversationId(id: string): void {
    this.conversationId = id;
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string | undefined {
    return this.conversationId;
  }
} 