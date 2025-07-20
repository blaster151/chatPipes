import { PlaywrightSession, SessionConfig, ChatMessage } from './PlaywrightSession';
import { BrowserProfileManager, BrowserProfile, ProfileRotationConfig } from './BrowserProfileManager';
import { ChatGPTPlatform } from './platforms/ChatGPTPlatform';
import { ClaudePlatform } from './platforms/ClaudePlatform';
import { BingChatPlatform } from './platforms/BingChatPlatform';
import { EventEmitter } from 'events';

export interface AgentSessionConfig {
  agentType: 'chatgpt' | 'claude' | 'perplexity' | 'bing';
  profileId?: string; // Use specific profile or auto-select
  autoRotate?: boolean; // Auto-rotate profiles
  rotationConfig?: Partial<ProfileRotationConfig>;
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  retryAttempts?: number;
  stealthMode?: boolean;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  deviceEmulation?: {
    device: string;
    userAgent?: string;
    viewport?: { width: number; height: number };
  };
}

export interface AgentSessionState {
  sessionId: string;
  agentType: string;
  profileId: string;
  isActive: boolean;
  isAuthenticated: boolean;
  messageCount: number;
  startTime: number;
  lastActivity: number;
  authState?: any;
}

export class AgentSession extends EventEmitter {
  private config: AgentSessionConfig;
  private profileManager: BrowserProfileManager;
  private playwrightSession?: PlaywrightSession;
  private currentProfile?: BrowserProfile;
  private sessionId: string;
  private isActive: boolean = false;
  private isAuthenticated: boolean = false;
  private messageCount: number = 0;
  private startTime: number = 0;
  private lastActivity: number = 0;

  constructor(config: AgentSessionConfig, profileManager?: BrowserProfileManager) {
    super();
    this.setMaxListeners(50);
    
    this.config = {
      autoRotate: true,
      headless: true,
      slowMo: 100,
      timeout: 30000,
      retryAttempts: 3,
      stealthMode: true,
      ...config
    };
    
    this.profileManager = profileManager || new BrowserProfileManager('browser-profiles', this.config.rotationConfig);
    this.sessionId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the agent session
   */
  async init(): Promise<void> {
    try {
      console.log(`🚀 Initializing agent session for ${this.config.agentType}...`);

      // Get or create profile
      await this.initializeProfile();

      // Create platform-specific configuration
      const platformConfig = this.getPlatformConfig();

      // Create Playwright session configuration
      const sessionConfig: SessionConfig = {
        platform: this.config.agentType,
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts,
        stealthMode: this.config.stealthMode,
        proxy: this.config.proxy,
        deviceEmulation: this.config.deviceEmulation || {
          device: 'Desktop Chrome',
          userAgent: this.currentProfile!.userAgent,
          viewport: this.currentProfile!.viewport
        }
      };

      // Create Playwright session
      this.playwrightSession = new PlaywrightSession(sessionConfig, platformConfig);

      // Set up event forwarding
      this.setupEventForwarding();

      // Initialize Playwright session
      await this.playwrightSession.initialize();

      // Mark profile as active
      this.profileManager.markProfileActive(this.currentProfile!.id);

      this.isActive = true;
      this.startTime = Date.now();
      this.lastActivity = Date.now();

      this.emit('session_initialized', {
        sessionId: this.sessionId,
        agentType: this.config.agentType,
        profileId: this.currentProfile!.id,
        timestamp: Date.now()
      });

      console.log(`✅ Agent session initialized for ${this.config.agentType}`);
    } catch (error) {
      console.error(`❌ Failed to initialize agent session:`, error);
      throw error;
    }
  }

  /**
   * Initialize profile (get existing or create new)
   */
  private async initializeProfile(): Promise<void> {
    if (this.config.profileId) {
      // Use specific profile
      this.currentProfile = this.profileManager.getProfile(this.config.profileId);
      if (!this.currentProfile) {
        throw new Error(`Profile ${this.config.profileId} not found`);
      }
    } else {
      // Get available profile or create new one
      this.currentProfile = this.profileManager.getAvailableProfile(this.config.agentType);
      
      if (!this.currentProfile) {
        console.log(`📝 No available profile found for ${this.config.agentType}, creating new one...`);
        this.currentProfile = await this.createNewProfile();
      }
    }

    console.log(`👤 Using profile: ${this.currentProfile.name} (${this.currentProfile.id})`);
  }

  /**
   * Create new profile for agent type
   */
  private async createNewProfile(): Promise<BrowserProfile> {
    const stealthSettings = {
      enabled: true,
      webglVendor: 'Intel Inc.',
      webglRenderer: 'Intel(R) HD Graphics 620',
      hardwareConcurrency: 8,
      deviceMemory: 8,
      platform: 'Win32',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: true,
      doNotTrack: null,
      canvasFingerprint: this.generateCanvasFingerprint(),
      audioFingerprint: this.generateAudioFingerprint(),
      timezoneOffset: -300,
      screenResolution: { width: 1920, height: 1080 },
      colorDepth: 24,
      pixelDepth: 24,
      touchSupport: false,
      maxTouchPoints: 0
    };

    return this.profileManager.createProfile({
      agentType: this.config.agentType,
      name: `${this.config.agentType}-session-${Date.now()}`,
      description: `Auto-generated profile for ${this.config.agentType} agent session`,
      storagePath: `browser-profiles/${this.config.agentType}-${Date.now()}`,
      userAgent: this.getDefaultUserAgent(),
      viewport: { width: 1280, height: 720 },
      timezone: 'America/New_York',
      locale: 'en-US',
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
      permissions: ['geolocation'],
      extraHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      stealthSettings
    });
  }

  /**
   * Get platform-specific configuration
   */
  private getPlatformConfig() {
    switch (this.config.agentType) {
      case 'chatgpt':
        return new ChatGPTPlatform().getConfig();
      case 'claude':
        return new ClaudePlatform().getConfig();
      case 'bing':
        return new BingChatPlatform().getConfig();
      case 'perplexity':
        // TODO: Implement PerplexityPlatform
        return new ChatGPTPlatform().getConfig(); // Fallback
      default:
        throw new Error(`Unsupported agent type: ${this.config.agentType}`);
    }
  }

  /**
   * Set up event forwarding from Playwright session
   */
  private setupEventForwarding(): void {
    if (!this.playwrightSession) return;

    // Forward Playwright session events
    this.playwrightSession.on('session_initialized', (data) => {
      this.emit('playwright_initialized', data);
    });

    this.playwrightSession.on('authentication_successful', (data) => {
      this.isAuthenticated = true;
      this.emit('authentication_successful', data);
    });

    this.playwrightSession.on('authentication_failed', (data) => {
      this.isAuthenticated = false;
      this.emit('authentication_failed', data);
    });

    this.playwrightSession.on('message_sent', (data) => {
      this.messageCount++;
      this.lastActivity = Date.now();
      this.emit('message_sent', data);
    });

    this.playwrightSession.on('response_received', (data) => {
      this.lastActivity = Date.now();
      this.emit('response_received', data);
    });

    this.playwrightSession.on('captcha_detected', (data) => {
      this.emit('captcha_detected', data);
    });

    this.playwrightSession.on('session_closed', (data) => {
      this.emit('playwright_closed', data);
    });
  }

  /**
   * Authenticate with the platform
   */
  async authenticate(username?: string, password?: string): Promise<boolean> {
    if (!this.playwrightSession) {
      throw new Error('Session not initialized');
    }

    try {
      const isAuthenticated = await this.playwrightSession.authenticate(username, password);
      
      if (isAuthenticated && this.currentProfile) {
        // Update profile auth state
        const authState = await this.playwrightSession.getAuthState();
        if (authState) {
          this.profileManager.updateProfileAuthState(this.currentProfile.id, authState);
        }
      }

      return isAuthenticated;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Send a message to the AI platform
   */
  async sendMessage(message: string): Promise<ChatMessage> {
    if (!this.playwrightSession) {
      throw new Error('Session not initialized');
    }

    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      this.lastActivity = Date.now();
      const response = await this.playwrightSession.sendMessage(message);
      
      this.emit('message_exchange', {
        userMessage: message,
        aiResponse: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error('Message sending error:', error);
      throw error;
    }
  }

  /**
   * Get session state
   */
  getState(): AgentSessionState {
    return {
      sessionId: this.sessionId,
      agentType: this.config.agentType,
      profileId: this.currentProfile?.id || '',
      isActive: this.isActive,
      isAuthenticated: this.isAuthenticated,
      messageCount: this.messageCount,
      startTime: this.startTime,
      lastActivity: this.lastActivity,
      authState: this.currentProfile?.authState
    };
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): BrowserProfile | undefined {
    return this.currentProfile;
  }

  /**
   * Get message history
   */
  getMessageHistory(): ChatMessage[] {
    return this.playwrightSession?.getMessageHistory() || [];
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(path?: string): Promise<Buffer> {
    if (!this.playwrightSession) {
      throw new Error('Session not initialized');
    }
    return await this.playwrightSession.takeScreenshot(path);
  }

  /**
   * Rotate to a different profile
   */
  async rotateProfile(): Promise<void> {
    if (!this.config.autoRotate) {
      throw new Error('Profile rotation is disabled');
    }

    console.log('🔄 Rotating to different profile...');

    // Mark current profile as inactive
    if (this.currentProfile) {
      this.profileManager.markProfileInactive(this.currentProfile.id);
    }

    // Close current session
    if (this.playwrightSession) {
      await this.playwrightSession.close();
    }

    // Get new profile
    const newProfile = this.profileManager.getAvailableProfile(this.config.agentType);
    if (!newProfile) {
      throw new Error('No available profiles for rotation');
    }

    this.currentProfile = newProfile;
    console.log(`👤 Rotated to profile: ${newProfile.name} (${newProfile.id})`);

    // Reinitialize with new profile
    await this.init();
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      sessionId: this.sessionId,
      agentType: this.config.agentType,
      profileId: this.currentProfile?.id,
      isActive: this.isActive,
      isAuthenticated: this.isAuthenticated,
      messageCount: this.messageCount,
      sessionDuration: Date.now() - this.startTime,
      lastActivity: this.lastActivity,
      profileStats: this.profileManager.getStats()
    };
  }

  /**
   * Close the session
   */
  async close(): Promise<void> {
    try {
      console.log(`🔒 Closing agent session for ${this.config.agentType}...`);

      // Mark profile as inactive
      if (this.currentProfile) {
        this.profileManager.markProfileInactive(this.currentProfile.id);
      }

      // Close Playwright session
      if (this.playwrightSession) {
        await this.playwrightSession.close();
      }

      this.isActive = false;

      this.emit('session_closed', {
        sessionId: this.sessionId,
        agentType: this.config.agentType,
        timestamp: Date.now()
      });

      console.log(`✅ Agent session closed for ${this.config.agentType}`);
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }

  /**
   * Helper methods for fingerprinting
   */
  private generateCanvasFingerprint(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateAudioFingerprint(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getDefaultUserAgent(): string {
    switch (this.config.agentType) {
      case 'bing':
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0';
      default:
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    }
  }
} 