import { BrowserContext, Page, Browser } from 'playwright';
import { PlatformConfig, BrowserAgentConfig } from '@chatpipes/types';

export interface StealthConfig {
  userAgents: string[];
  screenResolutions: Array<{ width: number; height: number }>;
  viewportSizes: Array<{ width: number; height: number }>;
  typingDelays: { min: number; max: number };
  domTransitionDelays: { min: number; max: number };
  sessionRotationInterval: number;
  maxRequestsPerSession: number;
}

export interface SessionIdentity {
  id: string;
  userAgent: string;
  screenResolution: { width: number; height: number };
  viewportSize: { width: number; height: number };
  timezone: string;
  language: string;
  platform: string;
  createdAt: Date;
  requestCount: number;
}

export class StealthSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private currentIdentity: SessionIdentity | null = null;
  private stealthConfig: StealthConfig;
  private sessionStartTime: Date = new Date();

  constructor(private platformConfig: PlatformConfig, config?: Partial<StealthConfig>) {
    this.stealthConfig = {
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
      ],
      screenResolutions: [
        { width: 1920, height: 1080 },
        { width: 2560, height: 1440 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 }
      ],
      viewportSizes: [
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 }
      ],
      typingDelays: { min: 50, max: 200 },
      domTransitionDelays: { min: 1000, max: 3000 },
      sessionRotationInterval: 300000, // 5 minutes
      maxRequestsPerSession: 50,
      ...config
    };
  }

  /**
   * Initialize stealth session with random identity
   */
  async init(browser: Browser): Promise<void> {
    this.browser = browser;
    this.currentIdentity = this.generateIdentity();
    
    this.context = await browser.newContext({
      userAgent: this.currentIdentity.userAgent,
      viewport: this.currentIdentity.viewportSize,
      timezoneId: this.currentIdentity.timezone,
      locale: this.currentIdentity.language,
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    // Add stealth scripts
    await this.injectStealthScripts();
    
    this.page = await this.context.newPage();
    
    // Set additional stealth properties
    await this.page.addInitScript(() => {
      // Override webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
  }

  /**
   * Generate random session identity
   */
  private generateIdentity(): SessionIdentity {
    const userAgent = this.stealthConfig.userAgents[
      Math.floor(Math.random() * this.stealthConfig.userAgents.length)
    ];
    
    const screenResolution = this.stealthConfig.screenResolutions[
      Math.floor(Math.random() * this.stealthConfig.screenResolutions.length)
    ];
    
    const viewportSize = this.stealthConfig.viewportSizes[
      Math.floor(Math.random() * this.stealthConfig.viewportSizes.length)
    ];

    const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'];
    const languages = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
    const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];

    return {
      id: `identity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userAgent,
      screenResolution,
      viewportSize,
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      language: languages[Math.floor(Math.random() * languages.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      createdAt: new Date(),
      requestCount: 0
    };
  }

  /**
   * Inject stealth scripts to avoid detection
   */
  private async injectStealthScripts(): Promise<void> {
    if (!this.context) return;

    await this.context.addInitScript(() => {
      // Remove automation indicators
      delete (window as any).__webdriver_evaluate;
      delete (window as any).__selenium_evaluate;
      delete (window as any).__webdriver_script_fn;
      delete (window as any).__webdriver_script_func;
      delete (window as any).__webdriver_script_func_args;
      delete (window as any).__webdriver_script_func_result;
      delete (window as any).__fxdriver_evaluate;
      delete (window as any).__phantom;
      delete (window as any).__nightmare;
      delete (window as any)._phantom;
      delete (window as any).phantom;
      delete (window as any).callPhantom;
      delete (window as any).callSelenium;
      delete (window as any)._Selenium_IDE_Recorder;
      delete (window as any)._selenium;
      delete (window as any).calledSelenium;
      delete (window as any).$chrome_asyncScriptInfo;
      delete (window as any).$cdc_asdjflasutopfhvcZLmcfl_;
      delete (window as any).$chrome_asyncScriptInfo;
      delete (window as any).$cdc_asdjflasutopfhvcZLmcfl_;

      // Override chrome runtime
      if (window.chrome && window.chrome.runtime) {
        delete (window.chrome as any).runtime;
      }

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
  }

  /**
   * Check if session needs rotation
   */
  private shouldRotateSession(): boolean {
    if (!this.currentIdentity) return true;

    const now = new Date();
    const sessionAge = now.getTime() - this.sessionStartTime.getTime();
    const requestCount = this.currentIdentity.requestCount;

    return sessionAge > this.stealthConfig.sessionRotationInterval || 
           requestCount > this.stealthConfig.maxRequestsPerSession;
  }

  /**
   * Rotate session with new identity
   */
  async rotateSession(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }

    this.currentIdentity = this.generateIdentity();
    this.sessionStartTime = new Date();

    if (this.browser) {
      await this.init(this.browser);
    }
  }

  /**
   * Navigate to URL with stealth measures
   */
  async navigateTo(url: string): Promise<void> {
    if (!this.page) throw new Error('Session not initialized');

    // Check if rotation is needed
    if (this.shouldRotateSession()) {
      await this.rotateSession();
    }

    // Add random delay before navigation
    await this.randomDelay(this.stealthConfig.domTransitionDelays);

    await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Increment request count
    if (this.currentIdentity) {
      this.currentIdentity.requestCount++;
    }

    // Add random delay after navigation
    await this.randomDelay(this.stealthConfig.domTransitionDelays);
  }

  /**
   * Type text with human-like delays
   */
  async typeText(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('Session not initialized');

    await this.page.click(selector);
    
    for (const char of text) {
      await this.page.type(selector, char, {
        delay: this.getRandomDelay(this.stealthConfig.typingDelays)
      });
    }
  }

  /**
   * Click element with human-like behavior
   */
  async clickElement(selector: string): Promise<void> {
    if (!this.page) throw new Error('Session not initialized');

    // Move mouse to element first
    await this.page.hover(selector);
    
    // Random delay before click
    await this.randomDelay({ min: 100, max: 500 });
    
    await this.page.click(selector);
    
    // Random delay after click
    await this.randomDelay(this.stealthConfig.domTransitionDelays);
  }

  /**
   * Get random delay within range
   */
  private getRandomDelay(range: { min: number; max: number }): number {
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  /**
   * Wait for random delay
   */
  private async randomDelay(range: { min: number; max: number }): Promise<void> {
    const delay = this.getRandomDelay(range);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get current session identity
   */
  getCurrentIdentity(): SessionIdentity | null {
    return this.currentIdentity;
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    if (!this.currentIdentity) return null;

    const now = new Date();
    const sessionAge = now.getTime() - this.sessionStartTime.getTime();

    return {
      identityId: this.currentIdentity.id,
      sessionAge: Math.floor(sessionAge / 1000), // seconds
      requestCount: this.currentIdentity.requestCount,
      userAgent: this.currentIdentity.userAgent,
      viewportSize: this.currentIdentity.viewportSize,
      timezone: this.currentIdentity.timezone,
      language: this.currentIdentity.language,
      platform: this.currentIdentity.platform
    };
  }

  /**
   * Close session
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    this.currentIdentity = null;
  }
} 