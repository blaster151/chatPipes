// Example: AgentSession.ts
export interface PersonaConfig {
  name: string;
  description: string;
  instructions: string;
  memoryContext?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PlatformConfig {
  // Platform-specific settings
  chatgpt?: {
    model?: 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo';
    apiKey?: string;
    organization?: string;
  };
  claude?: {
    model?: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
    apiKey?: string;
    maxTokens?: number;
  };
  perplexity?: {
    searchType?: 'concise' | 'detailed' | 'creative' | 'precise';
    focus?: 'web' | 'academic' | 'writing' | 'wolfram-alpha';
    apiKey?: string;
  };
  deepseek?: {
    model?: 'deepseek-chat' | 'deepseek-coder';
    apiKey?: string;
    temperature?: number;
  };
}

export class AgentSession {
  private sessionId: string;
  private isInitialized: boolean = false;
  private promptQueue: string[] = [];
  private latestResponse: string = '';
  private memoryManager?: any; // Will be MemoryManager type
  private platformConfig: PlatformConfig;
  private conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];

  constructor(
    public target: 'chatgpt' | 'claude' | 'perplexity' | 'deepseek',
    private persona: PersonaConfig,
    platformConfig: PlatformConfig = {}
  ) {
    this.sessionId = this.generateSessionId();
    this.platformConfig = platformConfig;
  }

  async init() {
    if (this.isInitialized) {
      throw new Error('Session already initialized');
    }

    // Initialize based on target
    switch (this.target) {
      case 'chatgpt':
        await this.initChatGPT();
        break;
      case 'claude':
        await this.initClaude();
        break;
      case 'perplexity':
        await this.initPerplexity();
        break;
      case 'deepseek':
        await this.initDeepSeek();
        break;
      default:
        throw new Error(`Unsupported target: ${this.target}`);
    }

    this.isInitialized = true;
  }

  async sendPrompt(text: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Session not initialized. Call init() first.');
    }

    // Add to memory if memory manager is available
    if (this.memoryManager) {
      await this.memoryManager.ingestUtterance('user', text);
    }

    // Send prompt based on target
    let response: string;
    switch (this.target) {
      case 'chatgpt':
        response = await this.sendChatGPTPrompt(text);
        break;
      case 'claude':
        response = await this.sendClaudePrompt(text);
        break;
      case 'perplexity':
        response = await this.sendPerplexityPrompt(text);
        break;
      case 'deepseek':
        response = await this.sendDeepSeekPrompt(text);
        break;
      default:
        throw new Error(`Unsupported target: ${this.target}`);
    }

    this.latestResponse = response;

    // Add response to memory if memory manager is available
    if (this.memoryManager) {
      await this.memoryManager.ingestUtterance('agent', response);
    }

    return response;
  }

  async queuePrompt(text: string): Promise<void> {
    this.promptQueue.push(text);
  }

  async readLatestResponse(): Promise<string> {
    return this.latestResponse;
  }

  async close() {
    if (!this.isInitialized) {
      return;
    }

    // Clean up based on target
    switch (this.target) {
      case 'chatgpt':
        await this.closeChatGPT();
        break;
      case 'claude':
        await this.closeClaude();
        break;
      case 'perplexity':
        await this.closePerplexity();
        break;
      case 'deepseek':
        await this.closeDeepSeek();
        break;
    }

    this.isInitialized = false;
    this.promptQueue = [];
    this.latestResponse = '';
    this.conversationHistory = [];
  }

  // Platform-specific methods for handling unique behaviors
  async startNewChat(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Session not initialized. Call init() first.');
    }

    switch (this.target) {
      case 'claude':
        // Claude requires explicit "New Chat" - clear conversation history
        this.conversationHistory = [{
          role: 'assistant',
          content: this.buildSystemPrompt()
        }];
        console.log('Started new Claude chat session');
        break;
      case 'chatgpt':
        // ChatGPT can continue conversation, but we can reset if needed
        this.conversationHistory = [{
          role: 'assistant',
          content: this.buildSystemPrompt()
        }];
        console.log('Reset ChatGPT conversation history');
        break;
      case 'perplexity':
        // Perplexity can switch search types - reset to default
        this.conversationHistory = [{
          role: 'assistant',
          content: this.buildSystemPrompt()
        }];
        console.log('Reset Perplexity conversation history');
        break;
      case 'deepseek':
        // DeepSeek can continue conversation, but we can reset if needed
        this.conversationHistory = [{
          role: 'assistant',
          content: this.buildSystemPrompt()
        }];
        console.log('Reset DeepSeek conversation history');
        break;
    }
  }

  async switchSearchType(searchType: 'concise' | 'detailed' | 'creative' | 'precise'): Promise<void> {
    if (this.target !== 'perplexity') {
      throw new Error('Search type switching is only available for Perplexity');
    }

    if (!this.isInitialized) {
      throw new Error('Session not initialized. Call init() first.');
    }

    // Update Perplexity configuration
    this.platformConfig.perplexity = {
      ...this.platformConfig.perplexity,
      searchType
    };

    console.log(`Switched Perplexity search type to: ${searchType}`);
  }

  async switchFocus(focus: 'web' | 'academic' | 'writing' | 'wolfram-alpha'): Promise<void> {
    if (this.target !== 'perplexity') {
      throw new Error('Focus switching is only available for Perplexity');
    }

    if (!this.isInitialized) {
      throw new Error('Session not initialized. Call init() first.');
    }

    // Update Perplexity configuration
    this.platformConfig.perplexity = {
      ...this.platformConfig.perplexity,
      focus
    };

    console.log(`Switched Perplexity focus to: ${focus}`);
  }

  getConversationHistory(): Array<{role: 'user' | 'assistant', content: string}> {
    return [...this.conversationHistory];
  }

  getPlatformConfig(): PlatformConfig {
    return { ...this.platformConfig };
  }

  // Memory management integration
  setMemoryManager(memoryManager: any) {
    this.memoryManager = memoryManager;
  }

  async getMemoryContext(): Promise<string> {
    if (!this.memoryManager) {
      return this.persona.memoryContext || '';
    }

    return await this.memoryManager.getRehydrationPrompt();
  }

  // Private methods for different targets
  private async initChatGPT(): Promise<void> {
    const config = this.platformConfig.chatgpt || {};
    const model = config.model || 'gpt-4';
    
    if (!config.apiKey) {
      console.warn('ChatGPT API key not provided. Using mock mode.');
    }
    
    console.log(`Initializing ChatGPT session for persona: ${this.persona.name} with model: ${model}`);
    
    // Initialize conversation with system message
    this.conversationHistory = [{
      role: 'assistant',
      content: this.buildSystemPrompt()
    }];
  }

  private async initClaude(): Promise<void> {
    const config = this.platformConfig.claude || {};
    const model = config.model || 'claude-3-sonnet';
    
    if (!config.apiKey) {
      console.warn('Claude API key not provided. Using mock mode.');
    }
    
    console.log(`Initializing Claude session for persona: ${this.persona.name} with model: ${model}`);
    
    // Claude requires a "New Chat" equivalent - we'll start fresh
    this.conversationHistory = [{
      role: 'assistant',
      content: this.buildSystemPrompt()
    }];
  }

  private async initPerplexity(): Promise<void> {
    const config = this.platformConfig.perplexity || {};
    const searchType = config.searchType || 'concise';
    const focus = config.focus || 'web';
    
    if (!config.apiKey) {
      console.warn('Perplexity API key not provided. Using mock mode.');
    }
    
    console.log(`Initializing Perplexity session for persona: ${this.persona.name} with search type: ${searchType}, focus: ${focus}`);
    
    // Perplexity has different conversation modes - we'll use the configured search type
    this.conversationHistory = [{
      role: 'assistant',
      content: this.buildSystemPrompt()
    }];
  }

  private async initDeepSeek(): Promise<void> {
    const config = this.platformConfig.deepseek || {};
    const model = config.model || 'deepseek-chat';
    
    if (!config.apiKey) {
      console.warn('DeepSeek API key not provided. Using mock mode.');
    }
    
    console.log(`Initializing DeepSeek session for persona: ${this.persona.name} with model: ${model}`);
    
    this.conversationHistory = [{
      role: 'assistant',
      content: this.buildSystemPrompt()
    }];
  }

  private async sendChatGPTPrompt(text: string): Promise<string> {
    const config = this.platformConfig.chatgpt || {};
    const model = config.model || 'gpt-4';
    
    // Add user message to conversation history
    this.conversationHistory.push({ role: 'user', content: text });
    
    // Build the full conversation context
    const context = await this.getMemoryContext();
    const messages = this.buildChatMessages(context, text);
    
    // Mock API call - in real implementation, this would call OpenAI API
    const response = `ChatGPT (${model}) response to: "${text}" (Persona: ${this.persona.name})`;
    
    // Add assistant response to conversation history
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    return response;
  }

  private async sendClaudePrompt(text: string): Promise<string> {
    const config = this.platformConfig.claude || {};
    const model = config.model || 'claude-3-sonnet';
    
    // Claude requires fresh context for each "New Chat" - we'll simulate this
    const context = await this.getMemoryContext();
    const messages = this.buildChatMessages(context, text);
    
    // Mock API call - in real implementation, this would call Anthropic API
    const response = `Claude (${model}) response to: "${text}" (Persona: ${this.persona.name})`;
    
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: text });
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    return response;
  }

  private async sendPerplexityPrompt(text: string): Promise<string> {
    const config = this.platformConfig.perplexity || {};
    const searchType = config.searchType || 'concise';
    const focus = config.focus || 'web';
    
    // Perplexity has different search types - we'll use the configured one
    const context = await this.getMemoryContext();
    const messages = this.buildChatMessages(context, text);
    
    // Mock API call - in real implementation, this would call Perplexity API
    const response = `Perplexity (${searchType}/${focus}) response to: "${text}" (Persona: ${this.persona.name})`;
    
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: text });
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    return response;
  }

  private async sendDeepSeekPrompt(text: string): Promise<string> {
    const config = this.platformConfig.deepseek || {};
    const model = config.model || 'deepseek-chat';
    
    const context = await this.getMemoryContext();
    const messages = this.buildChatMessages(context, text);
    
    // Mock API call - in real implementation, this would call DeepSeek API
    const response = `DeepSeek (${model}) response to: "${text}" (Persona: ${this.persona.name})`;
    
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: text });
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    return response;
  }

  private async closeChatGPT(): Promise<void> {
    // Clean up ChatGPT session
    console.log('Closing ChatGPT session');
  }

  private async closeClaude(): Promise<void> {
    // Clean up Claude session
    console.log('Closing Claude session');
  }

  private async closePerplexity(): Promise<void> {
    // Clean up Perplexity session
    console.log('Closing Perplexity session');
  }

  private async closeDeepSeek(): Promise<void> {
    // Clean up DeepSeek session
    console.log('Closing DeepSeek session');
  }

  private buildSystemPrompt(): string {
    const parts = [
      `You are ${this.persona.name}.`,
      this.persona.description,
      this.persona.instructions
    ];

    if (this.persona.memoryContext) {
      parts.push(`\nInitial context: ${this.persona.memoryContext}`);
    }

    return parts.join('\n\n');
  }

  private buildChatMessages(context: string, userText: string): Array<{role: 'system' | 'user' | 'assistant', content: string}> {
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [];
    
    // Add system message with persona and context
    let systemContent = this.buildSystemPrompt();
    if (context) {
      systemContent += `\n\nContext from previous interactions:\n${context}`;
    }
    messages.push({ role: 'system', content: systemContent });
    
    // Add conversation history
    messages.push(...this.conversationHistory);
    
    // Add current user message
    messages.push({ role: 'user', content: userText });
    
    return messages;
  }

  private buildPrompt(context: string, userText: string): string {
    const parts = [
      `You are ${this.persona.name}.`,
      this.persona.description,
      this.persona.instructions
    ];

    if (context) {
      parts.push(`\nContext from previous interactions:\n${context}`);
    }

    parts.push(`\nUser: ${userText}\n${this.persona.name}:`);

    return parts.join('\n\n');
  }

  private generateSessionId(): string {
    return `${this.target}-${this.persona.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getSessionId(): string {
    return this.sessionId;
  }

  getPersona(): PersonaConfig {
    return this.persona;
  }

  getTarget(): string {
    return this.target;
  }

  isSessionActive(): boolean {
    return this.isInitialized;
  }

  getQueuedPrompts(): string[] {
    return [...this.promptQueue];
  }
} 