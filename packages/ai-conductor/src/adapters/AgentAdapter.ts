import { EventEmitter } from 'events';
import { 
  AgentConfig, 
  AgentStats, 
  BrowserStats, 
  ResponseMetadata,
  Interjection 
} from '@chatpipes/types';

/**
 * Core interface for all agent adapters
 */
export interface AgentAdapter {
  readonly id: string;
  readonly type: string;
  readonly config: AgentConfig;
  
  // Core lifecycle methods
  init(): Promise<void>;
  send(prompt: string): Promise<string>;
  close(): Promise<void>;
  
  // State management
  isInitialized(): boolean;
  isConnected(): boolean;
  
  // Statistics and monitoring
  getStats(): AgentStats;
  resetStats(): void;
  
  // Event emission
  on(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
}

/**
 * Base adapter class providing common functionality
 */
export abstract class BaseAgentAdapter extends EventEmitter implements AgentAdapter {
  public readonly id: string;
  public readonly type: string;
  public readonly config: AgentConfig;
  
  protected initialized: boolean = false;
  protected connected: boolean = false;
  protected stats: AgentStats;
  protected browserStats: BrowserStats;

  constructor(id: string, type: string, config: AgentConfig) {
    super();
    this.setMaxListeners(100);
    
    this.id = id;
    this.type = type;
    this.config = config;
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      errors: [],
      browserStats: null
    };
    
    this.browserStats = {
      identityId: `identity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userAgent: '',
      viewport: { width: 1920, height: 1080 },
      sessionStartTime: new Date(),
      totalRequests: 0,
      rateLimitHits: 0,
      lastRateLimitHit: null,
      stealthScore: 0
    };
    
    this.stats.browserStats = this.browserStats;
  }

  /**
   * Initialize the adapter
   */
  abstract init(): Promise<void>;

  /**
   * Send a prompt and get response
   */
  abstract send(prompt: string): Promise<string>;

  /**
   * Close the adapter and cleanup resources
   */
  abstract close(): Promise<void>;

  /**
   * Check if adapter is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get adapter statistics
   */
  getStats(): AgentStats {
    return { ...this.stats };
  }

  /**
   * Reset adapter statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      errors: [],
      browserStats: this.browserStats
    };
  }

  /**
   * Update browser statistics
   */
  protected updateBrowserStats(updates: Partial<BrowserStats>): void {
    this.browserStats = { ...this.browserStats, ...updates };
    this.stats.browserStats = this.browserStats;
  }

  /**
   * Record a successful request
   */
  protected recordSuccess(responseTime: number, tokens: number = 0): void {
    this.stats.totalRequests++;
    this.stats.successfulRequests++;
    this.stats.lastRequestTime = new Date();
    
    // Update average response time
    const totalTime = this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime;
    this.stats.averageResponseTime = totalTime / this.stats.successfulRequests;
    
    this.stats.totalTokens += tokens;
    this.browserStats.totalRequests++;
    
    this.emit('request_success', {
      responseTime,
      tokens,
      timestamp: new Date()
    });
  }

  /**
   * Record a failed request
   */
  protected recordError(error: Error, responseTime: number = 0): void {
    this.stats.totalRequests++;
    this.stats.failedRequests++;
    this.stats.lastRequestTime = new Date();
    this.stats.errors.push({
      message: error.message,
      timestamp: new Date(),
      responseTime
    });
    
    this.browserStats.totalRequests++;
    
    this.emit('request_error', {
      error,
      responseTime,
      timestamp: new Date()
    });
  }

  /**
   * Record rate limit hit
   */
  protected recordRateLimit(): void {
    this.browserStats.rateLimitHits++;
    this.browserStats.lastRateLimitHit = new Date();
    
    this.emit('rate_limit_hit', {
      timestamp: new Date(),
      totalHits: this.browserStats.rateLimitHits
    });
  }

  /**
   * Update stealth score
   */
  protected updateStealthScore(score: number): void {
    this.browserStats.stealthScore = Math.max(0, Math.min(100, score));
    
    this.emit('stealth_score_updated', {
      score: this.browserStats.stealthScore,
      timestamp: new Date()
    });
  }

  /**
   * Get adapter capabilities
   */
  abstract getCapabilities(): AdapterCapabilities;

  /**
   * Validate configuration
   */
  abstract validateConfig(): boolean;
}

/**
 * Adapter capabilities interface
 */
export interface AdapterCapabilities {
  supportsStreaming: boolean;
  supportsInterjections: boolean;
  supportsRateLimiting: boolean;
  supportsStealth: boolean;
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  supportedModels: string[];
  features: string[];
}

/**
 * Adapter factory interface
 */
export interface AdapterFactory {
  createAdapter(id: string, config: AgentConfig): AgentAdapter;
  getSupportedTypes(): string[];
  validateConfig(type: string, config: AgentConfig): boolean;
}

/**
 * Adapter registry for managing all available adapters
 */
export class AdapterRegistry {
  private factories: Map<string, AdapterFactory> = new Map();
  private adapters: Map<string, AgentAdapter> = new Map();

  /**
   * Register an adapter factory
   */
  registerFactory(type: string, factory: AdapterFactory): void {
    this.factories.set(type, factory);
  }

  /**
   * Create an adapter instance
   */
  createAdapter(type: string, id: string, config: AgentConfig): AgentAdapter {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`No factory registered for adapter type: ${type}`);
    }

    if (!factory.validateConfig(type, config)) {
      throw new Error(`Invalid configuration for adapter type: ${type}`);
    }

    const adapter = factory.createAdapter(id, config);
    this.adapters.set(adapter.id, adapter);
    
    return adapter;
  }

  /**
   * Get an existing adapter instance
   */
  getAdapter(id: string): AgentAdapter | null {
    return this.adapters.get(id) || null;
  }

  /**
   * Get all registered adapter types
   */
  getSupportedTypes(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Get all active adapters
   */
  getAllAdapters(): AgentAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Remove an adapter instance
   */
  removeAdapter(id: string): boolean {
    return this.adapters.delete(id);
  }

  /**
   * Close all adapters
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.adapters.values()).map(adapter => adapter.close());
    await Promise.all(closePromises);
    this.adapters.clear();
  }
}

/**
 * Global adapter registry instance
 */
export const globalAdapterRegistry = new AdapterRegistry(); 