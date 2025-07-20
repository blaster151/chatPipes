import { SessionIdentity } from './StealthSession';

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  cooldownPeriod: number; // milliseconds
  retryDelays: number[]; // array of delays in milliseconds
  maxRetries: number;
}

export interface PlatformRateLimits {
  chatgpt: RateLimitConfig;
  claude: RateLimitConfig;
  perplexity: RateLimitConfig;
  deepseek: RateLimitConfig;
}

export interface RequestLog {
  timestamp: Date;
  platform: string;
  identityId: string;
  success: boolean;
  responseTime: number;
  errorCode?: string;
}

export class RateLimitManager {
  private requestLogs: RequestLog[] = [];
  private activeSessions: Map<string, SessionIdentity> = new Map();
  private platformConfigs: PlatformRateLimits;

  constructor() {
    this.platformConfigs = {
      chatgpt: {
        maxRequestsPerMinute: 20,
        maxRequestsPerHour: 100,
        maxRequestsPerDay: 1000,
        cooldownPeriod: 60000, // 1 minute
        retryDelays: [1000, 2000, 5000, 10000, 30000],
        maxRetries: 5
      },
      claude: {
        maxRequestsPerMinute: 15,
        maxRequestsPerHour: 80,
        maxRequestsPerDay: 800,
        cooldownPeriod: 120000, // 2 minutes
        retryDelays: [2000, 5000, 10000, 30000, 60000],
        maxRetries: 5
      },
      perplexity: {
        maxRequestsPerMinute: 30,
        maxRequestsPerHour: 150,
        maxRequestsPerDay: 1500,
        cooldownPeriod: 30000, // 30 seconds
        retryDelays: [500, 1000, 2000, 5000, 10000],
        maxRetries: 3
      },
      deepseek: {
        maxRequestsPerMinute: 25,
        maxRequestsPerHour: 120,
        maxRequestsPerDay: 1200,
        cooldownPeriod: 45000, // 45 seconds
        retryDelays: [1000, 2000, 5000, 15000, 45000],
        maxRetries: 4
      }
    };
  }

  /**
   * Register a session identity
   */
  registerSession(identityId: string, identity: SessionIdentity): void {
    this.activeSessions.set(identityId, identity);
  }

  /**
   * Unregister a session identity
   */
  unregisterSession(identityId: string): void {
    this.activeSessions.delete(identityId);
  }

  /**
   * Check if request is allowed for platform and identity
   */
  async canMakeRequest(platform: string, identityId: string): Promise<{
    allowed: boolean;
    waitTime?: number;
    reason?: string;
  }> {
    const config = this.platformConfigs[platform as keyof PlatformRateLimits];
    if (!config) {
      return { allowed: false, reason: 'Unknown platform' };
    }

    const now = new Date();
    const logs = this.getRequestLogs(platform, identityId);

    // Check minute limit
    const minuteAgo = new Date(now.getTime() - 60000);
    const requestsLastMinute = logs.filter(log => log.timestamp > minuteAgo).length;
    
    if (requestsLastMinute >= config.maxRequestsPerMinute) {
      const oldestRequest = logs
        .filter(log => log.timestamp > minuteAgo)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      
      const waitTime = 60000 - (now.getTime() - oldestRequest.timestamp.getTime());
      return {
        allowed: false,
        waitTime: Math.max(0, waitTime),
        reason: 'Rate limit exceeded (per minute)'
      };
    }

    // Check hour limit
    const hourAgo = new Date(now.getTime() - 3600000);
    const requestsLastHour = logs.filter(log => log.timestamp > hourAgo).length;
    
    if (requestsLastHour >= config.maxRequestsPerHour) {
      const oldestRequest = logs
        .filter(log => log.timestamp > hourAgo)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      
      const waitTime = 3600000 - (now.getTime() - oldestRequest.timestamp.getTime());
      return {
        allowed: false,
        waitTime: Math.max(0, waitTime),
        reason: 'Rate limit exceeded (per hour)'
      };
    }

    // Check day limit
    const dayAgo = new Date(now.getTime() - 86400000);
    const requestsLastDay = logs.filter(log => log.timestamp > dayAgo).length;
    
    if (requestsLastDay >= config.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded (per day)'
      };
    }

    return { allowed: true };
  }

  /**
   * Log a request attempt
   */
  logRequest(
    platform: string,
    identityId: string,
    success: boolean,
    responseTime: number,
    errorCode?: string
  ): void {
    const log: RequestLog = {
      timestamp: new Date(),
      platform,
      identityId,
      success,
      responseTime,
      errorCode
    };

    this.requestLogs.push(log);

    // Clean up old logs (keep last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.requestLogs = this.requestLogs.filter(log => log.timestamp > weekAgo);
  }

  /**
   * Get retry delay for failed request
   */
  getRetryDelay(platform: string, attempt: number): number {
    const config = this.platformConfigs[platform as keyof PlatformRateLimits];
    if (!config || attempt >= config.retryDelays.length) {
      return config?.retryDelays[config.retryDelays.length - 1] || 30000;
    }

    return config.retryDelays[attempt];
  }

  /**
   * Check if retry is allowed
   */
  canRetry(platform: string, attempt: number): boolean {
    const config = this.platformConfigs[platform as keyof PlatformRateLimits];
    return config ? attempt < config.maxRetries : false;
  }

  /**
   * Get request logs for platform and identity
   */
  private getRequestLogs(platform: string, identityId: string): RequestLog[] {
    return this.requestLogs.filter(log => 
      log.platform === platform && log.identityId === identityId
    );
  }

  /**
   * Get rate limit statistics
   */
  getStats(platform?: string, identityId?: string) {
    let logs = this.requestLogs;
    
    if (platform) {
      logs = logs.filter(log => log.platform === platform);
    }
    
    if (identityId) {
      logs = logs.filter(log => log.identityId === identityId);
    }

    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60000);
    const hourAgo = new Date(now.getTime() - 3600000);
    const dayAgo = new Date(now.getTime() - 86400000);

    const requestsLastMinute = logs.filter(log => log.timestamp > minuteAgo).length;
    const requestsLastHour = logs.filter(log => log.timestamp > hourAgo).length;
    const requestsLastDay = logs.filter(log => log.timestamp > dayAgo).length;

    const successRate = logs.length > 0 
      ? (logs.filter(log => log.success).length / logs.length) * 100 
      : 0;

    const averageResponseTime = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
      : 0;

    const errorCodes = logs
      .filter(log => log.errorCode)
      .reduce((acc, log) => {
        acc[log.errorCode!] = (acc[log.errorCode!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalRequests: logs.length,
      requestsLastMinute,
      requestsLastHour,
      requestsLastDay,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      errorCodes,
      activeSessions: this.activeSessions.size
    };
  }

  /**
   * Get platform-specific rate limit configuration
   */
  getPlatformConfig(platform: string): RateLimitConfig | null {
    return this.platformConfigs[platform as keyof PlatformRateLimits] || null;
  }

  /**
   * Update platform rate limit configuration
   */
  updatePlatformConfig(platform: string, config: Partial<RateLimitConfig>): void {
    const existing = this.platformConfigs[platform as keyof PlatformRateLimits];
    if (existing) {
      this.platformConfigs[platform as keyof PlatformRateLimits] = {
        ...existing,
        ...config
      };
    }
  }

  /**
   * Reset rate limit manager
   */
  reset(): void {
    this.requestLogs = [];
    this.activeSessions.clear();
  }
} 