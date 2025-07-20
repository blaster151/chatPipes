import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { EventEmitter } from 'events';

export interface BrowserConfig {
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  viewport?: { width: number; height: number };
  userAgent?: string;
  extraArgs?: string[];
}

export interface SessionConfig {
  url: string;
  selectors: {
    chatInput: string;
    sendButton: string;
    responseContainer: string;
    responseText: string;
    loadingIndicator?: string;
    newChatButton?: string;
    modelSelector?: string;
    searchTypeSelector?: string;
    focusSelector?: string;
  };
  preActions?: Array<{
    type: 'click' | 'type' | 'select' | 'wait' | 'waitForSelector';
    selector?: string;
    value?: string;
    timeout?: number;
  }>;
  postActions?: Array<{
    type: 'click' | 'type' | 'select' | 'wait' | 'waitForSelector';
    selector?: string;
    value?: string;
    timeout?: number;
  }>;
  responseWaitStrategy: 'selector' | 'text' | 'network' | 'timeout';
  responseTimeout?: number;
  maxRetries?: number;
}

export interface SessionEvent {
  type: 'session_started' | 'message_sent' | 'response_received' | 'error' | 'session_closed';
  timestamp: Date;
  data?: any;
}

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

  constructor(sessionConfig: SessionConfig, config: BrowserConfig = {}) {
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
  }

  /**
   * Initialize the browser session
   */
  async init(): Promise<void> {
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
      const messageId = Date.now().toString();
      
      this.messageQueue.push({
        id: messageId,
        prompt,
        resolve,
        reject
      });

      this.processQueue();
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
      } catch (error) {
        message.reject(error instanceof Error ? error : new Error(String(error)));
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
      // Clear previous input
      await this.page.fill(this.sessionConfig.selectors.chatInput, '');
      
      // Type the prompt
      await this.page.type(this.sessionConfig.selectors.chatInput, prompt);
      
      this.emit('message_sent', {
        prompt,
        timestamp: new Date()
      });

      // Click send button
      await this.page.click(this.sessionConfig.selectors.sendButton);

      // Wait for response based on strategy
      const response = await this.waitForResponse();

      this.emit('response_received', {
        response,
        timestamp: new Date()
      });

      return response;

    } catch (error) {
      this.emit('error', {
        type: 'send_error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Wait for response based on configured strategy
   */
  private async waitForResponse(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const strategy = this.sessionConfig.responseWaitStrategy;
    const timeout = this.sessionConfig.responseTimeout || 60000;

    switch (strategy) {
      case 'selector':
        return await this.waitForResponseBySelector(timeout);
      
      case 'text':
        return await this.waitForResponseByText(timeout);
      
      case 'network':
        return await this.waitForResponseByNetwork(timeout);
      
      case 'timeout':
        return await this.waitForResponseByTimeout(timeout);
      
      default:
        return await this.waitForResponseBySelector(timeout);
    }
  }

  /**
   * Wait for response by waiting for a specific selector
   */
  private async waitForResponseBySelector(timeout: number): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    // Wait for response container to appear
    await this.page.waitForSelector(this.sessionConfig.selectors.responseContainer, { timeout });

    // Wait for loading to complete (if loading indicator exists)
    if (this.sessionConfig.selectors.loadingIndicator) {
      try {
        await this.page.waitForSelector(this.sessionConfig.selectors.loadingIndicator, { 
          state: 'hidden', 
          timeout: timeout / 2 
        });
      } catch (error) {
        // Loading indicator might not exist, continue
      }
    }

    // Extract response text
    const responseText = await this.page.textContent(this.sessionConfig.selectors.responseText);
    return responseText || '';
  }

  /**
   * Wait for response by waiting for text changes
   */
  private async waitForResponseByText(timeout: number): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = Date.now();
    let lastText = '';
    let currentText = '';

    while (Date.now() - startTime < timeout) {
      try {
        currentText = await this.page.textContent(this.sessionConfig.selectors.responseText) || '';
        
        if (currentText !== lastText) {
          lastText = currentText;
          // Wait a bit more to see if text is still changing
          await this.page.waitForTimeout(1000);
          
          const newText = await this.page.textContent(this.sessionConfig.selectors.responseText) || '';
          if (newText === currentText) {
            // Text has stabilized, response is complete
            return currentText;
          }
        }
        
        await this.page.waitForTimeout(500);
      } catch (error) {
        // Element might not exist yet, continue waiting
        await this.page.waitForTimeout(500);
      }
    }

    throw new Error('Response timeout exceeded');
  }

  /**
   * Wait for response by monitoring network activity
   */
  private async waitForResponseByNetwork(timeout: number): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout });

    // Extract response text
    const responseText = await this.page.textContent(this.sessionConfig.selectors.responseText);
    return responseText || '';
  }

  /**
   * Wait for response by simple timeout
   */
  private async waitForResponseByTimeout(timeout: number): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.waitForTimeout(timeout);

    // Extract response text
    const responseText = await this.page.textContent(this.sessionConfig.selectors.responseText);
    return responseText || '';
  }

  /**
   * Start a new chat session
   */
  async startNewChat(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    if (this.sessionConfig.selectors.newChatButton) {
      try {
        await this.page.click(this.sessionConfig.selectors.newChatButton);
        await this.page.waitForTimeout(1000);
      } catch (error) {
        console.warn('Failed to start new chat:', error);
      }
    }
  }

  /**
   * Switch model (if supported)
   */
  async switchModel(model: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    if (this.sessionConfig.selectors.modelSelector) {
      try {
        await this.page.selectOption(this.sessionConfig.selectors.modelSelector, model);
        await this.page.waitForTimeout(1000);
      } catch (error) {
        console.warn('Failed to switch model:', error);
      }
    }
  }

  /**
   * Switch search type (for Perplexity)
   */
  async switchSearchType(searchType: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    if (this.sessionConfig.selectors.searchTypeSelector) {
      try {
        await this.page.selectOption(this.sessionConfig.selectors.searchTypeSelector, searchType);
        await this.page.waitForTimeout(1000);
      } catch (error) {
        console.warn('Failed to switch search type:', error);
      }
    }
  }

  /**
   * Switch focus area (for Perplexity)
   */
  async switchFocus(focus: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    if (this.sessionConfig.selectors.focusSelector) {
      try {
        await this.page.selectOption(this.sessionConfig.selectors.focusSelector, focus);
        await this.page.waitForTimeout(1000);
      } catch (error) {
        console.warn('Failed to switch focus:', error);
      }
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(path?: string): Promise<Buffer> {
    if (!this.page) throw new Error('Page not initialized');

    const screenshotPath = path || `screenshot-${Date.now()}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Read the file and return as buffer
    const fs = require('fs');
    return fs.readFileSync(screenshotPath);
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
      // Execute post-actions if any
      if (this.sessionConfig.postActions) {
        await this.executeActions(this.sessionConfig.postActions);
      }

      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.isInitialized = false;
      this.emit('session_closed', { timestamp: new Date() });

    } catch (error) {
      this.emit('error', {
        type: 'close_error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      throw error;
    }
  }
} 