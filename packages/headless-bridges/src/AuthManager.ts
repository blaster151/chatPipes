import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { BrowserProfileManager, BrowserProfile, AuthState } from './BrowserProfileManager';
import { PlaywrightSession } from './PlaywrightSession';
import { ChatGPTPlatform } from './platforms/ChatGPTPlatform';
import { ClaudePlatform } from './platforms/ClaudePlatform';
import { BingChatPlatform } from './platforms/BingChatPlatform';

export interface AuthManagerConfig {
  encryptionKey?: string; // Auto-generated if not provided
  authDir: string;
  maxRetries: number;
  retryDelay: number;
  verificationInterval: number; // milliseconds
  sessionTimeout: number; // milliseconds
  enableUI: boolean;
  uiPort?: number;
  enableEncryption: boolean;
  enablePeriodicVerification: boolean;
}

export interface LoginStep {
  id: string;
  title: string;
  description: string;
  type: 'input' | 'button' | 'wait' | 'captcha' | 'verification';
  selector?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  validation?: (value: string) => boolean;
  nextStep?: string;
  errorMessage?: string;
}

export interface LoginFlow {
  platform: string;
  steps: LoginStep[];
  successIndicators: string[];
  failureIndicators: string[];
  timeout: number;
}

export interface AuthSession {
  id: string;
  platform: string;
  profileId: string;
  startTime: number;
  lastVerified: number;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'expired';
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  isValid: boolean;
  reason?: string;
  requiresReauth: boolean;
  timestamp: number;
}

export class AuthManager extends EventEmitter {
  private config: AuthManagerConfig;
  private profileManager: BrowserProfileManager;
  private encryptionKey: string;
  private authSessions: Map<string, AuthSession> = new Map();
  private verificationTimer?: NodeJS.Timeout;
  private loginFlows: Map<string, LoginFlow> = new Map();
  private isActive: boolean = false;

  constructor(config: Partial<AuthManagerConfig> = {}, profileManager?: BrowserProfileManager) {
    super();
    this.setMaxListeners(100);
    
    this.config = {
      authDir: 'auth',
      maxRetries: 3,
      retryDelay: 5000,
      verificationInterval: 30 * 60 * 1000, // 30 minutes
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      enableUI: true,
      uiPort: 3001,
      enableEncryption: true,
      enablePeriodicVerification: true,
      ...config
    };

    this.profileManager = profileManager || new BrowserProfileManager();
    this.encryptionKey = this.config.encryptionKey || this.generateEncryptionKey();
    
    this.ensureAuthDirectory();
    this.initializeLoginFlows();
  }

  /**
   * Start the auth manager
   */
  async start(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;

    // Start periodic verification if enabled
    if (this.config.enablePeriodicVerification) {
      this.startPeriodicVerification();
    }

    // Start UI if enabled
    if (this.config.enableUI) {
      await this.startAuthUI();
    }

    this.emit('auth_manager_started', {
      timestamp: Date.now(),
      config: this.config
    });
  }

  /**
   * Stop the auth manager
   */
  async stop(): Promise<void> {
    if (!this.isActive) return;

    this.isActive = false;

    // Stop periodic verification
    if (this.verificationTimer) {
      clearInterval(this.verificationTimer);
      this.verificationTimer = undefined;
    }

    // Stop UI
    if (this.config.enableUI) {
      await this.stopAuthUI();
    }

    this.emit('auth_manager_stopped', {
      timestamp: Date.now()
    });
  }

  /**
   * Guide user through login process
   */
  async guideLogin(platform: string, profileId?: string): Promise<AuthSession | null> {
    try {
      console.log(`🔐 Starting login guide for ${platform}...`);

      const loginFlow = this.loginFlows.get(platform);
      if (!loginFlow) {
        throw new Error(`No login flow defined for ${platform}`);
      }

      // Create or get profile
      let profile: BrowserProfile;
      if (profileId) {
        profile = this.profileManager.getProfile(profileId)!;
      } else {
        profile = this.profileManager.getAvailableProfile(platform) || 
                 await this.createProfileForPlatform(platform);
      }

      // Create Playwright session for login
      const session = await this.createLoginSession(platform, profile);

      // Execute login flow
      const success = await this.executeLoginFlow(session, loginFlow);

      if (success) {
        // Save encrypted auth state
        await this.saveEncryptedAuthState(platform, profile.id, session);

        // Create auth session
        const authSession: AuthSession = {
          id: `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          platform,
          profileId: profile.id,
          startTime: Date.now(),
          lastVerified: Date.now(),
          isActive: true,
          verificationStatus: 'verified'
        };

        this.authSessions.set(authSession.id, authSession);

        // Update profile auth state
        const authState = await this.getAuthStateFromSession(session);
        this.profileManager.updateProfileAuthState(profile.id, authState);

        this.emit('login_successful', {
          platform,
          profileId: profile.id,
          authSession,
          timestamp: Date.now()
        });

        console.log(`✅ Login successful for ${platform}`);
        return authSession;
      } else {
        throw new Error(`Login failed for ${platform}`);
      }

    } catch (error) {
      console.error(`❌ Login guide failed for ${platform}:`, error);
      
      this.emit('login_failed', {
        platform,
        profileId,
        error: error.message,
        timestamp: Date.now()
      });

      return null;
    }
  }

  /**
   * Verify login status for a session
   */
  async verifyLoginStatus(authSessionId: string): Promise<VerificationResult> {
    const authSession = this.authSessions.get(authSessionId);
    if (!authSession) {
      return {
        isValid: false,
        reason: 'Auth session not found',
        requiresReauth: true,
        timestamp: Date.now()
      };
    }

    try {
      const profile = this.profileManager.getProfile(authSession.profileId);
      if (!profile) {
        return {
          isValid: false,
          reason: 'Profile not found',
          requiresReauth: true,
          timestamp: Date.now()
        };
      }

      // Create verification session
      const session = await this.createVerificationSession(authSession.platform, profile);

      // Check login status
      const isValid = await this.checkLoginStatus(session, authSession.platform);

      const result: VerificationResult = {
        isValid,
        requiresReauth: !isValid,
        timestamp: Date.now()
      };

      if (isValid) {
        authSession.lastVerified = Date.now();
        authSession.verificationStatus = 'verified';
        result.reason = 'Login status verified';
      } else {
        authSession.verificationStatus = 'failed';
        result.reason = 'Login status verification failed';
      }

      this.authSessions.set(authSessionId, authSession);

      this.emit('login_verified', {
        authSessionId,
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error(`❌ Login verification failed for ${authSessionId}:`, error);
      
      return {
        isValid: false,
        reason: `Verification error: ${error.message}`,
        requiresReauth: true,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Re-authenticate if needed
   */
  async reauthenticateIfNeeded(authSessionId: string): Promise<boolean> {
    const verification = await this.verifyLoginStatus(authSessionId);
    
    if (verification.requiresReauth) {
      console.log(`🔄 Re-authentication required for session ${authSessionId}`);
      
      const authSession = this.authSessions.get(authSessionId);
      if (authSession) {
        const newAuthSession = await this.guideLogin(authSession.platform, authSession.profileId);
        return !!newAuthSession;
      }
    }
    
    return verification.isValid;
  }

  /**
   * Get auth session
   */
  getAuthSession(authSessionId: string): AuthSession | undefined {
    return this.authSessions.get(authSessionId);
  }

  /**
   * Get all auth sessions
   */
  getAllAuthSessions(): AuthSession[] {
    return Array.from(this.authSessions.values());
  }

  /**
   * Get auth sessions by platform
   */
  getAuthSessionsByPlatform(platform: string): AuthSession[] {
    return Array.from(this.authSessions.values())
      .filter(session => session.platform === platform);
  }

  /**
   * Delete auth session
   */
  deleteAuthSession(authSessionId: string): boolean {
    const authSession = this.authSessions.get(authSessionId);
    if (!authSession) return false;

    this.authSessions.delete(authSessionId);

    // Delete encrypted auth state file
    const authFilePath = path.join(this.config.authDir, `${authSession.platform}-${authSession.profileId}.enc`);
    if (fs.existsSync(authFilePath)) {
      fs.unlinkSync(authFilePath);
    }

    this.emit('auth_session_deleted', {
      authSessionId,
      authSession,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Load encrypted auth state
   */
  async loadEncryptedAuthState(platform: string, profileId: string): Promise<AuthState | null> {
    try {
      const authFilePath = path.join(this.config.authDir, `${platform}-${profileId}.enc`);
      
      if (!fs.existsSync(authFilePath)) {
        return null;
      }

      const encryptedData = fs.readFileSync(authFilePath);
      const decryptedData = this.decrypt(encryptedData);
      const authState = JSON.parse(decryptedData);

      // Check if auth state is still valid
      if (authState.expiresAt && Date.now() > authState.expiresAt) {
        console.log(`⏰ Auth state expired for ${platform}-${profileId}`);
        return null;
      }

      return authState;
    } catch (error) {
      console.error(`Failed to load encrypted auth state for ${platform}-${profileId}:`, error);
      return null;
    }
  }

  /**
   * Save encrypted auth state
   */
  private async saveEncryptedAuthState(platform: string, profileId: string, session: any): Promise<void> {
    try {
      const authState = await this.getAuthStateFromSession(session);
      authState.expiresAt = Date.now() + this.config.sessionTimeout;

      const authData = JSON.stringify(authState);
      const encryptedData = this.encrypt(authData);

      const authFilePath = path.join(this.config.authDir, `${platform}-${profileId}.enc`);
      fs.writeFileSync(authFilePath, encryptedData);

      console.log(`💾 Saved encrypted auth state for ${platform}-${profileId}`);
    } catch (error) {
      console.error(`Failed to save encrypted auth state for ${platform}-${profileId}:`, error);
    }
  }

  /**
   * Execute login flow
   */
  private async executeLoginFlow(session: any, loginFlow: LoginFlow): Promise<boolean> {
    try {
      console.log(`🔄 Executing login flow for ${loginFlow.platform}...`);

      for (const step of loginFlow.steps) {
        console.log(`📝 Step: ${step.title}`);
        
        switch (step.type) {
          case 'input':
            if (step.selector && step.value) {
              await session.page.waitForSelector(step.selector);
              await session.page.fill(step.selector, step.value);
              await this.humanDelay(500, 1500);
            }
            break;

          case 'button':
            if (step.selector) {
              await session.page.waitForSelector(step.selector);
              await session.page.click(step.selector);
              await this.humanDelay(1000, 3000);
            }
            break;

          case 'wait':
            await this.humanDelay(2000, 5000);
            break;

          case 'captcha':
            console.log(`⚠️ Captcha detected - waiting for manual solving...`);
            if (step.selector) {
              await session.page.waitForSelector(step.selector, { state: 'detached' });
            }
            break;

          case 'verification':
            // Check for success/failure indicators
            const success = await this.checkLoginStatus(session, loginFlow.platform);
            if (!success) {
              console.log(`❌ Login verification failed`);
              return false;
            }
            break;
        }
      }

      // Final verification
      const finalSuccess = await this.checkLoginStatus(session, loginFlow.platform);
      return finalSuccess;

    } catch (error) {
      console.error(`❌ Login flow execution failed:`, error);
      return false;
    }
  }

  /**
   * Check login status
   */
  private async checkLoginStatus(session: any, platform: string): Promise<boolean> {
    try {
      const loginFlow = this.loginFlows.get(platform);
      if (!loginFlow) return false;

      // Check for success indicators
      for (const indicator of loginFlow.successIndicators) {
        const element = await session.page.$(indicator);
        if (element) {
          return true;
        }
      }

      // Check for failure indicators
      for (const indicator of loginFlow.failureIndicators) {
        const element = await session.page.$(indicator);
        if (element) {
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error(`Failed to check login status for ${platform}:`, error);
      return false;
    }
  }

  /**
   * Create login session
   */
  private async createLoginSession(platform: string, profile: BrowserProfile): Promise<any> {
    const platformConfig = this.getPlatformConfig(platform);
    
    const sessionConfig = {
      platform,
      headless: false, // Show browser for login
      slowMo: 100,
      timeout: 30000,
      retryAttempts: 3,
      stealthMode: true,
      deviceEmulation: {
        device: 'Desktop Chrome',
        userAgent: profile.userAgent,
        viewport: profile.viewport
      }
    };

    const session = new PlaywrightSession(sessionConfig, platformConfig);
    await session.initialize();
    
    return session;
  }

  /**
   * Create verification session
   */
  private async createVerificationSession(platform: string, profile: BrowserProfile): Promise<any> {
    const platformConfig = this.getPlatformConfig(platform);
    
    const sessionConfig = {
      platform,
      headless: true, // Headless for verification
      slowMo: 50,
      timeout: 15000,
      retryAttempts: 2,
      stealthMode: true,
      deviceEmulation: {
        device: 'Desktop Chrome',
        userAgent: profile.userAgent,
        viewport: profile.viewport
      }
    };

    const session = new PlaywrightSession(sessionConfig, platformConfig);
    await session.initialize();
    
    return session;
  }

  /**
   * Get platform configuration
   */
  private getPlatformConfig(platform: string) {
    switch (platform) {
      case 'chatgpt':
        return new ChatGPTPlatform().getConfig();
      case 'claude':
        return new ClaudePlatform().getConfig();
      case 'bing':
        return new BingChatPlatform().getConfig();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Create profile for platform
   */
  private async createProfileForPlatform(platform: string): Promise<BrowserProfile> {
    return this.profileManager.createProfile({
      agentType: platform as any,
      name: `${platform}-auth-profile-${Date.now()}`,
      description: `Auth profile for ${platform}`,
      storagePath: `browser-profiles/${platform}-auth-${Date.now()}`,
      userAgent: this.getDefaultUserAgent(platform),
      viewport: { width: 1280, height: 720 },
      timezone: 'America/New_York',
      locale: 'en-US',
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
      permissions: ['geolocation']
    });
  }

  /**
   * Get auth state from session
   */
  private async getAuthStateFromSession(session: any): Promise<AuthState> {
    // This would need to be implemented based on the actual PlaywrightSession interface
    // For now, returning a mock auth state
    return {
      platform: 'unknown',
      timestamp: Date.now(),
      storageState: {},
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      isValid: true
    };
  }

  /**
   * Initialize login flows
   */
  private initializeLoginFlows(): void {
    // ChatGPT login flow
    this.loginFlows.set('chatgpt', {
      platform: 'chatgpt',
      steps: [
        {
          id: 'username',
          title: 'Enter Username',
          description: 'Enter your ChatGPT username or email',
          type: 'input',
          selector: 'input[name="username"]',
          placeholder: 'Username or email',
          required: true
        },
        {
          id: 'password',
          title: 'Enter Password',
          description: 'Enter your ChatGPT password',
          type: 'input',
          selector: 'input[name="password"]',
          placeholder: 'Password',
          required: true
        },
        {
          id: 'submit',
          title: 'Submit Login',
          description: 'Click the login button',
          type: 'button',
          selector: 'button[type="submit"]'
        },
        {
          id: 'captcha',
          title: 'Solve Captcha',
          description: 'If a captcha appears, solve it manually',
          type: 'captcha',
          selector: '[data-testid="captcha"]'
        },
        {
          id: 'verification',
          title: 'Verify Login',
          description: 'Verify that login was successful',
          type: 'verification'
        }
      ],
      successIndicators: [
        '[data-testid="send-button"]',
        '.conversation-turn',
        '[data-testid="chat-input"]'
      ],
      failureIndicators: [
        '[data-testid="error-message"]',
        '.error',
        '[data-testid="login-form"]'
      ],
      timeout: 60000
    });

    // Claude login flow
    this.loginFlows.set('claude', {
      platform: 'claude',
      steps: [
        {
          id: 'email',
          title: 'Enter Email',
          description: 'Enter your Claude email address',
          type: 'input',
          selector: 'input[name="email"]',
          placeholder: 'Email address',
          required: true
        },
        {
          id: 'password',
          title: 'Enter Password',
          description: 'Enter your Claude password',
          type: 'input',
          selector: 'input[name="password"]',
          placeholder: 'Password',
          required: true
        },
        {
          id: 'submit',
          title: 'Submit Login',
          description: 'Click the login button',
          type: 'button',
          selector: 'button[type="submit"]'
        },
        {
          id: 'verification',
          title: 'Verify Login',
          description: 'Verify that login was successful',
          type: 'verification'
        }
      ],
      successIndicators: [
        '[data-testid="send-button"]',
        '.conversation-turn',
        '[data-testid="chat-input"]'
      ],
      failureIndicators: [
        '[data-testid="error-message"]',
        '.error',
        '[data-testid="login-form"]'
      ],
      timeout: 60000
    });

    // Bing Chat login flow
    this.loginFlows.set('bing', {
      platform: 'bing',
      steps: [
        {
          id: 'email',
          title: 'Enter Microsoft Email',
          description: 'Enter your Microsoft account email',
          type: 'input',
          selector: 'input[name="loginfmt"]',
          placeholder: 'Email address',
          required: true
        },
        {
          id: 'password',
          title: 'Enter Password',
          description: 'Enter your Microsoft account password',
          type: 'input',
          selector: 'input[name="passwd"]',
          placeholder: 'Password',
          required: true
        },
        {
          id: 'submit',
          title: 'Submit Login',
          description: 'Click the login button',
          type: 'button',
          selector: 'input[type="submit"]'
        },
        {
          id: 'verification',
          title: 'Verify Login',
          description: 'Verify that login was successful',
          type: 'verification'
        }
      ],
      successIndicators: [
        '[data-testid="send-button"]',
        '.conversation-turn',
        '[data-testid="chat-input"]'
      ],
      failureIndicators: [
        '[data-testid="error-message"]',
        '.error',
        '[data-testid="login-form"]'
      ],
      timeout: 60000
    });
  }

  /**
   * Start periodic verification
   */
  private startPeriodicVerification(): void {
    this.verificationTimer = setInterval(async () => {
      console.log('🔍 Running periodic login verification...');
      
      for (const [sessionId, authSession] of this.authSessions) {
        if (authSession.isActive) {
          await this.verifyLoginStatus(sessionId);
        }
      }
    }, this.config.verificationInterval);
  }

  /**
   * Start auth UI
   */
  private async startAuthUI(): Promise<void> {
    // This would start a local web server for the auth UI
    // Implementation depends on the UI framework used
    console.log(`🌐 Auth UI started on port ${this.config.uiPort}`);
  }

  /**
   * Stop auth UI
   */
  private async stopAuthUI(): Promise<void> {
    // Stop the auth UI server
    console.log('🌐 Auth UI stopped');
  }

  /**
   * Encryption/Decryption methods
   */
  private encrypt(data: string): Buffer {
    if (!this.config.enableEncryption) {
      return Buffer.from(data);
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
  }

  private decrypt(encryptedData: Buffer): string {
    if (!this.config.enableEncryption) {
      return encryptedData.toString();
    }

    const iv = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get default user agent
   */
  private getDefaultUserAgent(platform: string): string {
    switch (platform) {
      case 'bing':
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0';
      default:
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    }
  }

  /**
   * Ensure auth directory exists
   */
  private ensureAuthDirectory(): void {
    if (!fs.existsSync(this.config.authDir)) {
      fs.mkdirSync(this.config.authDir, { recursive: true });
    }
  }

  /**
   * Human-like delay
   */
  private async humanDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get auth manager statistics
   */
  getStats() {
    const sessions = Array.from(this.authSessions.values());
    const activeSessions = sessions.filter(s => s.isActive);
    const verifiedSessions = sessions.filter(s => s.verificationStatus === 'verified');

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      verifiedSessions: verifiedSessions.length,
      sessionsByPlatform: sessions.reduce((acc, session) => {
        acc[session.platform] = (acc[session.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      config: this.config
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.authSessions.clear();
    this.loginFlows.clear();
    this.removeAllListeners();
  }
} 