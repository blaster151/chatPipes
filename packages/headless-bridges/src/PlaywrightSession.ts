import { chromium, Browser, BrowserContext, Page, LaunchOptions, BrowserContextOptions } from 'playwright';
import { chromium as chromiumExtra } from 'playwright-extra';
import StealthPlugin from 'playwright-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// Apply stealth plugin
chromiumExtra.use(StealthPlugin());

export interface PlatformConfig {
  name: string;
  url: string;
  authRequired: boolean;
  edgeOnly?: boolean;
  userAgent?: string;
  viewport?: { width: number; height: number };
  timezone?: string;
  locale?: string;
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  extraHeaders?: Record<string, string>;
  waitForSelector?: string;
  loginSelectors?: {
    username?: string;
    password?: string;
    submit?: string;
    captcha?: string;
  };
  chatSelectors?: {
    input: string;
    send: string;
    messages: string;
    messageContent: string;
  };
}

export interface AuthState {
  platform: string;
  timestamp: number;
  storageState: any;
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
}

export interface SessionConfig {
  platform: string;
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  stealthMode?: boolean;
  deviceEmulation?: {
    device: string;
    userAgent?: string;
    viewport?: { width: number; height: number };
  };
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    platform: string;
    sessionId: string;
    responseTime?: number;
    tokens?: number;
  };
}

export class PlaywrightSession extends EventEmitter {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private config: SessionConfig;
  private platformConfig: PlatformConfig;
  private authState?: AuthState;
  private isAuthenticated: boolean = false;
  private messageHistory: ChatMessage[] = [];
  private sessionId: string;

  constructor(config: SessionConfig, platformConfig: PlatformConfig) {
    super();
    this.setMaxListeners(50);
    
    this.config = {
      headless: true,
      slowMo: 100,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      stealthMode: true,
      ...config
    };
    
    this.platformConfig = platformConfig;
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the browser session
   */
  async initialize(): Promise<void> {
    try {
      console.log(`🚀 Initializing Playwright session for ${this.platformConfig.name}...`);

      // Launch browser with appropriate configuration
      const launchOptions: LaunchOptions = {
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: this.getBrowserArgs()
      };

      // Use Edge for Bing Chat
      if (this.platformConfig.edgeOnly) {
        launchOptions.executablePath = this.getEdgeExecutablePath();
      }

      // Use stealth mode if enabled
      const browserType = this.config.stealthMode ? chromiumExtra : chromium;
      this.browser = await browserType.launch(launchOptions);

      // Create context with authentication state if available
      const contextOptions = await this.getContextOptions();
      this.context = await this.browser.newContext(contextOptions);

      // Create page
      this.page = await this.context.newPage();

      // Set up page event listeners
      this.setupPageListeners();

      // Load authentication state if available
      await this.loadAuthState();

      // Navigate to platform
      await this.navigateToPlatform();

      this.emit('session_initialized', {
        sessionId: this.sessionId,
        platform: this.platformConfig.name,
        timestamp: Date.now()
      });

      console.log(`✅ Playwright session initialized for ${this.platformConfig.name}`);
    } catch (error) {
      console.error(`❌ Failed to initialize Playwright session:`, error);
      throw error;
    }
  }

  /**
   * Get browser launch arguments
   */
  private getBrowserArgs(): string[] {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ];

    // Add proxy if configured
    if (this.config.proxy) {
      args.push(`--proxy-server=${this.config.proxy.server}`);
    }

    return args;
  }

  /**
   * Get Edge executable path
   */
  private getEdgeExecutablePath(): string {
    const platform = process.platform;
    
    switch (platform) {
      case 'win32':
        return 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      case 'darwin':
        return '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
      case 'linux':
        return '/usr/bin/microsoft-edge';
      default:
        throw new Error(`Unsupported platform for Edge: ${platform}`);
    }
  }

  /**
   * Get context options with authentication and stealth settings
   */
  private async getContextOptions(): Promise<BrowserContextOptions> {
    const options: BrowserContextOptions = {
      viewport: this.platformConfig.viewport || { width: 1280, height: 720 },
      userAgent: this.platformConfig.userAgent || this.getDefaultUserAgent(),
      timezoneId: this.platformConfig.timezone || 'America/New_York',
      locale: this.platformConfig.locale || 'en-US',
      geolocation: this.platformConfig.geolocation || { latitude: 40.7128, longitude: -74.0060 },
      permissions: this.platformConfig.permissions || ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...this.platformConfig.extraHeaders
      }
    };

    // Load authentication state if available
    const authState = await this.loadAuthStateFromFile();
    if (authState) {
      options.storageState = authState.storageState;
    }

    return options;
  }

  /**
   * Get default user agent
   */
  private getDefaultUserAgent(): string {
    if (this.platformConfig.edgeOnly) {
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0';
    }
    
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
  }

  /**
   * Set up page event listeners
   */
  private setupPageListeners(): void {
    if (!this.page) return;

    // Handle console messages
    this.page.on('console', (msg) => {
      this.emit('console_message', {
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });

    // Handle page errors
    this.page.on('pageerror', (error) => {
      this.emit('page_error', {
        error: error.message,
        timestamp: Date.now()
      });
    });

    // Handle request/response
    this.page.on('request', (request) => {
      this.emit('request', {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now()
      });
    });

    this.page.on('response', (response) => {
      this.emit('response', {
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: Date.now()
      });
    });
  }

  /**
   * Load authentication state from file
   */
  private async loadAuthStateFromFile(): Promise<AuthState | null> {
    const authDir = path.join(process.cwd(), 'auth');
    const authFile = path.join(authDir, `${this.platformConfig.name.toLowerCase()}.json`);

    try {
      if (fs.existsSync(authFile)) {
        const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
        
        // Check if auth state is still valid (less than 24 hours old)
        const age = Date.now() - authData.timestamp;
        if (age < 24 * 60 * 60 * 1000) {
          console.log(`📁 Loaded authentication state for ${this.platformConfig.name}`);
          return authData;
        } else {
          console.log(`⏰ Authentication state for ${this.platformConfig.name} is expired`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load authentication state:`, error);
    }

    return null;
  }

  /**
   * Load authentication state
   */
  private async loadAuthState(): Promise<void> {
    this.authState = await this.loadAuthStateFromFile();
    this.isAuthenticated = !!this.authState;
  }

  /**
   * Navigate to platform with retry logic
   */
  private async navigateToPlatform(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        console.log(`🌐 Navigating to ${this.platformConfig.name} (attempt ${attempt})...`);
        
        // Add human-like delay before navigation
        await this.humanDelay(1000, 3000);

        await this.page.goto(this.platformConfig.url, {
          waitUntil: 'networkidle',
          timeout: this.config.timeout
        });

        // Wait for platform-specific selector
        if (this.platformConfig.waitForSelector) {
          await this.page.waitForSelector(this.platformConfig.waitForSelector, {
            timeout: this.config.timeout
          });
        }

        console.log(`✅ Successfully navigated to ${this.platformConfig.name}`);
        break;
      } catch (error) {
        console.warn(`⚠️ Navigation attempt ${attempt} failed:`, error);
        
        if (attempt === this.config.retryAttempts) {
          throw new Error(`Failed to navigate to ${this.platformConfig.name} after ${this.config.retryAttempts} attempts`);
        }
        
        await this.humanDelay(this.config.retryDelay!, this.config.retryDelay! * 2);
      }
    }
  }

  /**
   * Authenticate with the platform
   */
  async authenticate(username?: string, password?: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    if (this.isAuthenticated) {
      console.log(`✅ Already authenticated with ${this.platformConfig.name}`);
      return true;
    }

    if (!this.platformConfig.authRequired) {
      console.log(`ℹ️ No authentication required for ${this.platformConfig.name}`);
      this.isAuthenticated = true;
      return true;
    }

    try {
      console.log(`🔐 Authenticating with ${this.platformConfig.name}...`);

      // Wait for login form
      const loginSelectors = this.platformConfig.loginSelectors;
      if (!loginSelectors) {
        throw new Error('Login selectors not configured');
      }

      // Fill username if provided
      if (username && loginSelectors.username) {
        await this.page.waitForSelector(loginSelectors.username);
        await this.page.fill(loginSelectors.username, username);
        await this.humanDelay(500, 1500);
      }

      // Fill password if provided
      if (password && loginSelectors.password) {
        await this.page.waitForSelector(loginSelectors.password);
        await this.page.fill(loginSelectors.password, password);
        await this.humanDelay(500, 1500);
      }

      // Handle captcha if present
      if (loginSelectors.captcha) {
        const captchaElement = await this.page.$(loginSelectors.captcha);
        if (captchaElement) {
          console.log(`⚠️ Captcha detected on ${this.platformConfig.name}`);
          this.emit('captcha_detected', {
            platform: this.platformConfig.name,
            timestamp: Date.now()
          });
          
          // Wait for manual captcha solving
          await this.page.waitForSelector(loginSelectors.captcha, { state: 'detached' });
        }
      }

      // Submit form
      if (loginSelectors.submit) {
        await this.page.click(loginSelectors.submit);
        await this.humanDelay(2000, 5000);
      }

      // Check if authentication was successful
      const isAuthenticated = await this.checkAuthenticationStatus();
      
      if (isAuthenticated) {
        this.isAuthenticated = true;
        await this.saveAuthState();
        console.log(`✅ Successfully authenticated with ${this.platformConfig.name}`);
        
        this.emit('authentication_successful', {
          platform: this.platformConfig.name,
          timestamp: Date.now()
        });
        
        return true;
      } else {
        console.error(`❌ Authentication failed for ${this.platformConfig.name}`);
        
        this.emit('authentication_failed', {
          platform: this.platformConfig.name,
          timestamp: Date.now()
        });
        
        return false;
      }
    } catch (error) {
      console.error(`❌ Authentication error for ${this.platformConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Check if authentication was successful
   */
  private async checkAuthenticationStatus(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Check for common authentication indicators
      const indicators = [
        // Check if we're redirected to a different URL
        this.page.url() !== this.platformConfig.url,
        // Check for user profile elements
        await this.page.$('[data-testid="user-avatar"]') !== null,
        await this.page.$('.user-profile') !== null,
        await this.page.$('[aria-label*="user"]') !== null,
        // Check for logout buttons
        await this.page.$('[data-testid="logout"]') !== null,
        await this.page.$('.logout') !== null
      ];

      return indicators.some(indicator => indicator);
    } catch (error) {
      console.warn('Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Save authentication state
   */
  private async saveAuthState(): Promise<void> {
    if (!this.context) return;

    try {
      const authDir = path.join(process.cwd(), 'auth');
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      const authFile = path.join(authDir, `${this.platformConfig.name.toLowerCase()}.json`);
      
      // Get storage state
      const storageState = await this.context.storageState();
      
      // Get cookies
      const cookies = await this.context.cookies();
      
      // Get localStorage and sessionStorage
      const localStorage = await this.page!.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data[key] = localStorage.getItem(key) || '';
          }
        }
        return data;
      });

      const sessionStorage = await this.page!.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            data[key] = sessionStorage.getItem(key) || '';
          }
        }
        return data;
      });

      const authState: AuthState = {
        platform: this.platformConfig.name,
        timestamp: Date.now(),
        storageState,
        cookies,
        localStorage,
        sessionStorage
      };

      fs.writeFileSync(authFile, JSON.stringify(authState, null, 2));
      console.log(`💾 Saved authentication state for ${this.platformConfig.name}`);
      
      this.authState = authState;
    } catch (error) {
      console.error('Failed to save authentication state:', error);
    }
  }

  /**
   * Send a message to the AI platform
   */
  async sendMessage(message: string): Promise<ChatMessage> {
    if (!this.page) throw new Error('Page not initialized');
    if (!this.isAuthenticated && this.platformConfig.authRequired) {
      throw new Error('Not authenticated');
    }

    try {
      console.log(`💬 Sending message to ${this.platformConfig.name}...`);

      const chatSelectors = this.platformConfig.chatSelectors;
      if (!chatSelectors) {
        throw new Error('Chat selectors not configured');
      }

      // Wait for input field
      await this.page.waitForSelector(chatSelectors.input);
      
      // Clear input field
      await this.page.click(chatSelectors.input);
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');
      
      // Type message with human-like delays
      await this.typeHumanLike(chatSelectors.input, message);
      
      // Wait before sending
      await this.humanDelay(500, 1500);
      
      // Send message
      await this.page.click(chatSelectors.send);
      
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userMessage: ChatMessage = {
        id: messageId,
        role: 'user',
        content: message,
        timestamp: Date.now(),
        metadata: {
          platform: this.platformConfig.name,
          sessionId: this.sessionId
        }
      };

      this.messageHistory.push(userMessage);
      
      // Wait for response
      const response = await this.waitForResponse();
      
      this.emit('message_sent', {
        message: userMessage,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error(`❌ Failed to send message to ${this.platformConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Wait for AI response
   */
  private async waitForResponse(): Promise<ChatMessage> {
    if (!this.page) throw new Error('Page not initialized');

    const chatSelectors = this.platformConfig.chatSelectors;
    if (!chatSelectors) {
      throw new Error('Chat selectors not configured');
    }

    const startTime = Date.now();
    const responseId = `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Wait for response to start appearing
      await this.page.waitForSelector(chatSelectors.messages, { timeout: this.config.timeout });
      
      // Wait for response to complete (no more typing indicators)
      await this.page.waitForFunction(() => {
        const typingIndicators = document.querySelectorAll('[data-testid*="typing"], .typing-indicator, [aria-label*="typing"]');
        return typingIndicators.length === 0;
      }, { timeout: this.config.timeout });

      // Extract response content
      const responseContent = await this.page.evaluate((selector) => {
        const messages = document.querySelectorAll(selector);
        const lastMessage = messages[messages.length - 1];
        return lastMessage ? lastMessage.textContent || '' : '';
      }, chatSelectors.messageContent);

      const responseTime = Date.now() - startTime;
      
      const response: ChatMessage = {
        id: responseId,
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
        metadata: {
          platform: this.platformConfig.name,
          sessionId: this.sessionId,
          responseTime
        }
      };

      this.messageHistory.push(response);
      
      this.emit('response_received', {
        response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error('Failed to wait for response:', error);
      throw error;
    }
  }

  /**
   * Type text with human-like delays
   */
  private async typeHumanLike(selector: string, text: string): Promise<void> {
    if (!this.page) return;

    await this.page.focus(selector);
    
    for (const char of text) {
      await this.page.keyboard.type(char);
      await this.humanDelay(50, 150); // Random delay between characters
    }
  }

  /**
   * Add human-like delay
   */
  private async humanDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get message history
   */
  getMessageHistory(): ChatMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Get session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      platform: this.platformConfig.name,
      isAuthenticated: this.isAuthenticated,
      messageCount: this.messageHistory.length,
      config: this.config
    };
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(path?: string): Promise<Buffer> {
    if (!this.page) throw new Error('Page not initialized');
    
    const screenshotPath = path || `screenshot-${this.sessionId}-${Date.now()}.png`;
    return await this.page.screenshot({ path: screenshotPath, fullPage: true });
  }

  /**
   * Close the session
   */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
      
      if (this.context) {
        await this.context.close();
      }
      
      if (this.browser) {
        await this.browser.close();
      }

      this.emit('session_closed', {
        sessionId: this.sessionId,
        timestamp: Date.now()
      });

      console.log(`🔒 Closed Playwright session for ${this.platformConfig.name}`);
    } catch (error) {
      console.error('Error closing session:', error);
    }
  }
} 