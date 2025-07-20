import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { EventEmitter } from 'events';
import { BrowserConfig, SessionConfig, SessionEvent } from '@chatpipes/types';
import { StealthSession } from './StealthSession';
import { RateLimitManager } from './RateLimitManager';

export class PlaywrightSession extends EventEmitter {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BrowserConfig;
  private sessionConfig: SessionConfig;
  private isInitialized: boolean = false;
  private messageQueue: Array<{
    id: string;
    prompt: string;
    resolve: (response: string) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessingQueue: boolean = false;
  private currentMessageId: string | null = null;
  private stealthSession: StealthSession;
  private rateLimitManager: RateLimitManager;

  constructor(
    platform: 'chatgpt' | 'claude' | 'perplexity' | 'deepseek',
    persona: PersonaConfig,
    config: PlatformConfig,
    browserConfig: BrowserAgentConfig
  ) {
    super();
    this.sessionConfig = sessionConfig;
    this.config = {
      browserType: 'chromium',
      headless: true,
      slowMo: 100,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      ...config
    };
    
    this.stealthSession = new StealthSession(persona, {
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
      ],
      screenResolutions: [
        { width: 1920, height: 1080 },
        { width: 2560, height: 1440 },
        { width: 1366, height: 768 }
      ],
      viewportSizes: [
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 }
      ],
      typingDelays: { min: 50, max: 200 },
      domTransitionDelays: { min: 1000, max: 3000 },
      sessionRotationInterval: 300000, // 5 minutes
      maxRequestsPerSession: 50
    });
    
    this.rateLimitManager = new RateLimitManager();
  }

  /**
   * Initialize session with stealth capabilities
   */
  async init(browser: Browser): Promise<void> {
    try {
      // Launch browser
      const browserType = this.config.browserType || 'chromium';
      const browserLauncher = this.getBrowserLauncher(browserType);
      
      this.browser = await browserLauncher.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: this.config.extraArgs || []
      });

      // Create context with proper isolation
      this.context = await this.browser.newContext({
        viewport: this.config.viewport,
        userAgent: this.config.userAgent,
        // Enable session tracing for debugging
        recordVideo: { dir: './videos/' },
        recordHar: { path: './har/' }
      });

      // Create page
      this.page = await this.context.newPage();
      
      // Set timeout
      this.page.setDefaultTimeout(this.config.timeout || 30000);

      // Navigate to the target URL
      await this.page.goto(this.sessionConfig.url, { waitUntil: 'networkidle' });

      // Execute pre-actions (login, setup, etc.)
      if (this.sessionConfig.preActions) {
        await this.executeActions(this.sessionConfig.preActions);
      }

      this.isInitialized = true;
      this.emit('session_started', { timestamp: new Date() });

      await this.stealthSession.init(browser);
      
      // Register with rate limit manager
      const identity = this.stealthSession.getCurrentIdentity();
      if (identity) {
        this.rateLimitManager.registerSession(identity.id, identity);
      }

    } catch (error) {
      this.emit('error', {
        type: 'init_error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Get browser launcher based on type
   */
  private getBrowserLauncher(browserType: string) {
    switch (browserType) {
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        return chromium;
    }
  }

  /**
   * Execute a series of actions
   */
  private async executeActions(actions: Array<{
    type: 'click' | 'type' | 'select' | 'wait' | 'waitForSelector';
    selector?: string;
    value?: string;
    timeout?: number;
  }>): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'click':
            if (action.selector) {
              await this.page.click(action.selector, { timeout: action.timeout });
            }
            break;

          case 'type':
            if (action.selector && action.value) {
              await this.page.fill(action.selector, action.value, { timeout: action.timeout });
            }
            break;

          case 'select':
            if (action.selector && action.value) {
              await this.page.selectOption(action.selector, action.value, { timeout: action.timeout });
            }
            break;

          case 'wait':
            if (action.value) {
              await this.page.waitForTimeout(parseInt(action.value));
            }
            break;

          case 'waitForSelector':
            if (action.selector) {
              await this.page.waitForSelector(action.selector, { timeout: action.timeout });
            }
            break;
        }
      } catch (error) {
        console.warn(`Action failed: ${action.type} on ${action.selector}:`, error);
      }
    }
  }

  /**
   * Send a prompt and wait for response (queued)
   */
  async sendPrompt(prompt: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Session not initialized. Call init() first.');
    }

    return new Promise((resolve, reject) => {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.messageQueue.push({
        id: messageId,
        prompt,
        resolve,
        reject
      });

      this.emit('message_sent', {
        id: messageId,
        prompt,
        timestamp: new Date()
      });

      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the message queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (!message) continue;

      this.currentMessageId = message.id;
      
      try {
        const response = await this.sendPromptInternal(message.prompt);
        message.resolve(response);
        
        this.emit('response_received', {
          id: message.id,
          response,
          timestamp: new Date()
        });
      } catch (error) {
        message.reject(error instanceof Error ? error : new Error(String(error)));
        
        this.emit('error', {
          id: message.id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }

    this.isProcessingQueue = false;
    this.currentMessageId = null;
  }

  /**
   * Internal method to send prompt and wait for response
   */
  private async sendPromptInternal(prompt: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Clear input field
      await this.page.fill(this.sessionConfig.selectors.chatInput, '');
      
      // Type the prompt
      await this.page.type(this.sessionConfig.selectors.chatInput, prompt);
      
      // Click send button
      await this.page.click(this.sessionConfig.selectors.sendButton);
      
      // Wait for response
      const response = await this.waitForResponse();
      
      // Execute post-actions if any
      if (this.sessionConfig.postActions) {
        await this.executeActions(this.sessionConfig.postActions);
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to send prompt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wait for response based on configured strategy
   */
  private async waitForResponse(): Promise<string> {
    const timeout = this.sessionConfig.responseTimeout || 30000;
    
    switch (this.sessionConfig.responseWaitStrategy) {
      case 'selector':
        return this.waitForResponseBySelector(timeout);
      case 'text':
        return this.waitForResponseByText(timeout);
      case 'network':
        return this.waitForResponseByNetwork(timeout);
      case 'timeout':
        return this.waitForResponseByTimeout(timeout);
      default:
        return this.waitForResponseBySelector(timeout);
    }
  }

  /**
   * Wait for response by waiting for selector
   */
  private async waitForResponseBySelector(timeout: number): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Wait for response container to appear
      await this.page.waitForSelector(this.sessionConfig.selectors.responseContainer, { timeout });
      
      // Wait for loading to complete
      if (this.sessionConfig.selectors.loadingIndicator) {
        await this.page.waitForSelector(this.sessionConfig.selectors.loadingIndicator, { 
          state: 'hidden', 
          timeout 
        });
      }
      
      // Get response text
      const responseText = await this.page.textContent(this.sessionConfig.selectors.responseText);
      return responseText || '';
    } catch (error) {
      throw new Error(`Timeout waiting for response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wait for response by detecting text changes
   */
  private async waitForResponseByText(timeout: number): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = Date.now();
    let lastText = '';
    let stableCount = 0;
    const stableThreshold = 3; // Number of consecutive stable reads

    while (Date.now() - startTime < timeout) {
      try {
        const currentText = await this.page.textContent(this.sessionConfig.selectors.responseText) || '';
        
        if (currentText === lastText) {
          stableCount++;
          if (stableCount >= stableThreshold) {
            return currentText;
          }
        } else {
          stableCount = 0;
          lastText = currentText;
        }
        
        await this.page.waitForTimeout(500);
      } catch (error) {
        // Continue trying
      }
    }
    
    throw new Error('Timeout waiting for stable response text');
  }

  /**
   * Wait for response by monitoring network activity
   */
  private async waitForResponseByNetwork(timeout: number): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Wait for network to be idle
      await this.page.waitForLoadState('networkidle', { timeout });
      
      // Get response text
      const responseText = await this.page.textContent(this.sessionConfig.selectors.responseText);
      return responseText || '';
    } catch (error) {
      throw new Error(`Timeout waiting for network idle: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wait for response by simple timeout
   */
  private async waitForResponseByTimeout(timeout: number): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.waitForTimeout(timeout);
    
    const responseText = await this.page.textContent(this.sessionConfig.selectors.responseText);
    return responseText || '';
  }

  /**
   * Start a new chat session
   */
  async startNewChat(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    if (this.sessionConfig.selectors.newChatButton) {
      await this.page.click(this.sessionConfig.selectors.newChatButton);
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Switch model (for platforms that support it)
   */
  async switchModel(model: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    if (this.sessionConfig.selectors.modelSelector) {
      await this.page.selectOption(this.sessionConfig.selectors.modelSelector, model);
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Switch search type (for Perplexity)
   */
  async switchSearchType(searchType: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    if (this.sessionConfig.selectors.searchTypeSelector) {
      await this.page.selectOption(this.sessionConfig.selectors.searchTypeSelector, searchType);
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Switch focus (for Perplexity)
   */
  async switchFocus(focus: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    if (this.sessionConfig.selectors.focusSelector) {
      await this.page.selectOption(this.sessionConfig.selectors.focusSelector, focus);
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(path?: string): Promise<Buffer> {
    if (!this.page) throw new Error('Page not initialized');
    
    if (path) {
      await this.page.screenshot({ path });
    }
    
    return await this.page.screenshot();
  }

  /**
   * Get page content
   */
  async getPageContent(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    
    return await this.page.content();
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    
    return this.page.url();
  }

  /**
   * Get session state
   */
  getState(): {
    isInitialized: boolean;
    isProcessingQueue: boolean;
    queueLength: number;
    currentMessageId: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isProcessingQueue: this.isProcessingQueue,
      queueLength: this.messageQueue.length,
      currentMessageId: this.currentMessageId
    };
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
      
      this.emit('session_closed', { timestamp: new Date() });
    } catch (error) {
      console.error('Error closing session:', error);
    }
  }
} 