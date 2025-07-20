import { 
  AgentAdapter, 
  AdapterFactory as IAdapterFactory,
  globalAdapterRegistry 
} from './AgentAdapter';
import { AgentConfig } from '@chatpipes/types';
import { ChatGPTAdapter, ChatGPTConfig } from './ChatGPTAdapter';
import { ClaudeAdapter, ClaudeConfig } from './ClaudeAdapter';

/**
 * ChatGPT Adapter Factory
 */
export class ChatGPTAdapterFactory implements IAdapterFactory {
  createAdapter(id: string, config: AgentConfig): AgentAdapter {
    const chatGPTConfig: ChatGPTConfig = {
      ...config,
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
      systemPrompt: config.systemPrompt,
      conversationHistory: config.conversationHistory !== false,
      useStealth: config.useStealth !== false,
      rateLimitConfig: {
        requestsPerMinute: config.rateLimitConfig?.requestsPerMinute || 20,
        cooldownPeriod: config.rateLimitConfig?.cooldownPeriod || 60000
      }
    };

    return new ChatGPTAdapter(id, chatGPTConfig);
  }

  getSupportedTypes(): string[] {
    return ['chatgpt', 'gpt', 'openai'];
  }

  validateConfig(type: string, config: AgentConfig): boolean {
    // Validate required fields for ChatGPT
    if (!config.userAgent && config.useStealth !== false) {
      return false;
    }

    // Validate model
    const validModels = ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'];
    if (config.model && !validModels.includes(config.model)) {
      return false;
    }

    return true;
  }
}

/**
 * Claude Adapter Factory
 */
export class ClaudeAdapterFactory implements IAdapterFactory {
  createAdapter(id: string, config: AgentConfig): AgentAdapter {
    const claudeConfig: ClaudeConfig = {
      ...config,
      model: config.model || 'claude-3-sonnet',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 100000,
      systemPrompt: config.systemPrompt,
      conversationHistory: config.conversationHistory !== false,
      useStealth: config.useStealth !== false,
      rateLimitConfig: {
        requestsPerMinute: config.rateLimitConfig?.requestsPerMinute || 15,
        cooldownPeriod: config.rateLimitConfig?.cooldownPeriod || 60000
      }
    };

    return new ClaudeAdapter(id, claudeConfig);
  }

  getSupportedTypes(): string[] {
    return ['claude', 'anthropic'];
  }

  validateConfig(type: string, config: AgentConfig): boolean {
    // Validate required fields for Claude
    if (!config.userAgent && config.useStealth !== false) {
      return false;
    }

    // Validate model
    const validModels = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
    if (config.model && !validModels.includes(config.model)) {
      return false;
    }

    return true;
  }
}

/**
 * Generic Adapter Factory that can create any registered adapter type
 */
export class GenericAdapterFactory implements IAdapterFactory {
  createAdapter(id: string, config: AgentConfig): AgentAdapter {
    const type = config.type || 'chatgpt';
    
    // Try to find a specific factory for this type
    const factory = globalAdapterRegistry['factories'].get(type);
    if (factory) {
      return factory.createAdapter(id, config);
    }

    // Fallback to ChatGPT if no specific factory found
    const chatGPTFactory = new ChatGPTAdapterFactory();
    return chatGPTFactory.createAdapter(id, config);
  }

  getSupportedTypes(): string[] {
    return Array.from(globalAdapterRegistry.getSupportedTypes());
  }

  validateConfig(type: string, config: AgentConfig): boolean {
    const factory = globalAdapterRegistry['factories'].get(type);
    if (factory) {
      return factory.validateConfig(type, config);
    }
    
    // Fallback validation
    return !!(config.userAgent || config.apiKey);
  }
}

/**
 * Adapter Factory Registry - manages all available adapter factories
 */
export class AdapterFactoryRegistry {
  private factories: Map<string, IAdapterFactory> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.registerDefaultFactories();
  }

  /**
   * Register default factories
   */
  private registerDefaultFactories(): void {
    // Register ChatGPT factory
    const chatGPTFactory = new ChatGPTAdapterFactory();
    this.registerFactory('chatgpt', chatGPTFactory);
    this.registerAlias('gpt', 'chatgpt');
    this.registerAlias('openai', 'chatgpt');

    // Register Claude factory
    const claudeFactory = new ClaudeAdapterFactory();
    this.registerFactory('claude', claudeFactory);
    this.registerAlias('anthropic', 'claude');

    // Register generic factory
    const genericFactory = new GenericAdapterFactory();
    this.registerFactory('generic', genericFactory);
  }

  /**
   * Register a factory for a specific type
   */
  registerFactory(type: string, factory: IAdapterFactory): void {
    this.factories.set(type, factory);
  }

  /**
   * Register an alias for an existing type
   */
  registerAlias(alias: string, type: string): void {
    this.aliases.set(alias, type);
  }

  /**
   * Get factory for a type (including aliases)
   */
  getFactory(type: string): IAdapterFactory | null {
    // Check if it's an alias
    const actualType = this.aliases.get(type) || type;
    return this.factories.get(actualType) || null;
  }

  /**
   * Create an adapter using the appropriate factory
   */
  createAdapter(type: string, id: string, config: AgentConfig): AgentAdapter {
    const factory = this.getFactory(type);
    if (!factory) {
      throw new Error(`No factory found for adapter type: ${type}`);
    }

    if (!factory.validateConfig(type, config)) {
      throw new Error(`Invalid configuration for adapter type: ${type}`);
    }

    return factory.createAdapter(id, config);
  }

  /**
   * Get all supported types (including aliases)
   */
  getSupportedTypes(): string[] {
    const types = Array.from(this.factories.keys());
    const aliases = Array.from(this.aliases.keys());
    return [...types, ...aliases];
  }

  /**
   * Get factory information
   */
  getFactoryInfo(type: string): { type: string; aliases: string[]; capabilities?: any } | null {
    const factory = this.getFactory(type);
    if (!factory) return null;

    const aliases = Array.from(this.aliases.entries())
      .filter(([alias, actualType]) => actualType === type)
      .map(([alias]) => alias);

    return {
      type,
      aliases,
      capabilities: factory.getSupportedTypes()
    };
  }

  /**
   * List all available factories
   */
  listFactories(): Array<{ type: string; aliases: string[]; supportedTypes: string[] }> {
    return Array.from(this.factories.keys()).map(type => {
      const factory = this.factories.get(type)!;
      const aliases = Array.from(this.aliases.entries())
        .filter(([alias, actualType]) => actualType === type)
        .map(([alias]) => alias);

      return {
        type,
        aliases,
        supportedTypes: factory.getSupportedTypes()
      };
    });
  }
}

/**
 * Global adapter factory registry instance
 */
export const globalAdapterFactoryRegistry = new AdapterFactoryRegistry();

// Register factories with the global registry
globalAdapterRegistry.registerFactory('chatgpt', new ChatGPTAdapterFactory());
globalAdapterRegistry.registerFactory('claude', new ClaudeAdapterFactory());
globalAdapterRegistry.registerFactory('generic', new GenericAdapterFactory()); 