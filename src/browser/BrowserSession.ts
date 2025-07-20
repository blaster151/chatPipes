import puppeteer, { Browser, Page } from 'puppeteer';

export interface BrowserConfig {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  userAgent?: string;
}

export interface SessionConfig {
  url: string;
  selectors: {
    input: string;
    submit: string;
    response: string;
    newChat?: string;
    searchType?: string;
    focus?: string;
  };
  waitFor?: string;
  preActions?: Array<{
    type: 'click' | 'type' | 'wait' | 'select';
    selector: string;
    value?: string;
    delay?: number;
  }>;
}

export class BrowserSession {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: SessionConfig;
  private isInitialized: boolean = false;
  private sessionId: string;

  constructor(
    private target: 'chatgpt' | 'claude' | 'perplexity' | 'deepseek',
    config: SessionConfig,
    private browserConfig: BrowserConfig = {}
  ) {
    this.config = config;
    this.sessionId = this.generateSessionId();
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Browser session already initialized');
    }

    try {
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: this.browserConfig.headless ?? true,
        slowMo: this.browserConfig.slowMo ?? 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      // Create new page
      this.page = await this.browser.newPage();
      
      // Set user agent
      if (this.browserConfig.userAgent) {
        await this.page.setUserAgent(this.browserConfig.userAgent);
      }

      // Set timeout
      if (this.browserConfig.timeout) {
        this.page.setDefaultTimeout(this.browserConfig.timeout);
      }

      // Navigate to target URL
      await this.page.goto(this.config.url, { waitUntil: 'networkidle2' });

      // Wait for page to load
      if (this.config.waitFor) {
        await this.page.waitForSelector(this.config.waitFor);
      }

      // Execute pre-actions (login, setup, etc.)
      if (this.config.preActions) {
        for (const action of this.config.preActions) {
          await this.executeAction(action);
        }
      }

      this.isInitialized = true;
      console.log(`Browser session initialized for ${this.target}`);

    } catch (error) {
      console.error(`Failed to initialize browser session for ${this.target}:`, error);
      throw error;
    }
  }

  async sendPrompt(text: string): Promise<string> {
    if (!this.isInitialized || !this.page) {
      throw new Error('Browser session not initialized');
    }

    try {
      // Wait for input field to be available
      await this.page.waitForSelector(this.config.selectors.input);

      // Clear input field
      await this.page.click(this.config.selectors.input);
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');

      // Type the prompt
      await this.page.type(this.config.selectors.input, text);

      // Submit the prompt
      await this.page.click(this.config.selectors.submit);

      // Wait for response
      await this.page.waitForSelector(this.config.selectors.response, { timeout: 30000 });

      // Extract response
      const response = await this.page.$eval(
        this.config.selectors.response,
        (el) => el.textContent || ''
      );

      return response.trim();

    } catch (error) {
      console.error(`Failed to send prompt to ${this.target}:`, error);
      throw error;
    }
  }

  async startNewChat(): Promise<void> {
    if (!this.isInitialized || !this.page) {
      throw new Error('Browser session not initialized');
    }

    if (this.config.selectors.newChat) {
      try {
        await this.page.click(this.config.selectors.newChat);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for new chat to load
        console.log(`Started new chat for ${this.target}`);
      } catch (error) {
        console.error(`Failed to start new chat for ${this.target}:`, error);
        throw error;
      }
    }
  }

  async switchSearchType(searchType: string): Promise<void> {
    if (this.target !== 'perplexity') {
      throw new Error('Search type switching is only available for Perplexity');
    }

    if (!this.isInitialized || !this.page) {
      throw new Error('Browser session not initialized');
    }

    if (this.config.selectors.searchType) {
      try {
        // Click on search type selector
        await this.page.click(this.config.selectors.searchType);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Select the desired search type
        const searchTypeSelector = `[data-value="${searchType}"]`;
        await this.page.click(searchTypeSelector);
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log(`Switched ${this.target} search type to: ${searchType}`);
      } catch (error) {
        console.error(`Failed to switch search type for ${this.target}:`, error);
        throw error;
      }
    }
  }

  async switchFocus(focus: string): Promise<void> {
    if (this.target !== 'perplexity') {
      throw new Error('Focus switching is only available for Perplexity');
    }

    if (!this.isInitialized || !this.page) {
      throw new Error('Browser session not initialized');
    }

    if (this.config.selectors.focus) {
      try {
        // Click on focus selector
        await this.page.click(this.config.selectors.focus);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Select the desired focus
        const focusSelector = `[data-value="${focus}"]`;
        await this.page.click(focusSelector);
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log(`Switched ${this.target} focus to: ${focus}`);
      } catch (error) {
        console.error(`Failed to switch focus for ${this.target}:`, error);
        throw error;
      }
    }
  }

  async takeScreenshot(path?: string): Promise<Buffer> {
    if (!this.isInitialized || !this.page) {
      throw new Error('Browser session not initialized');
    }

    const screenshot = await this.page.screenshot({ 
      fullPage: true,
      path: path || `screenshots/${this.target}-${Date.now()}.png`
    }) as Buffer;

    return screenshot;
  }

  async getPageContent(): Promise<string> {
    if (!this.isInitialized || !this.page) {
      throw new Error('Browser session not initialized');
    }

    return await this.page.content();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
      console.log(`Browser session closed for ${this.target}`);
    }
  }

  private async executeAction(action: {
    type: 'click' | 'type' | 'wait' | 'select';
    selector: string;
    value?: string;
    delay?: number;
  }): Promise<void> {
    if (!this.page) return;

    switch (action.type) {
      case 'click':
        await this.page.click(action.selector);
        break;
      case 'type':
        if (action.value) {
          await this.page.type(action.selector, action.value);
        }
        break;
      case 'wait':
        await this.page.waitForSelector(action.selector);
        break;
      case 'select':
        if (action.value) {
          await this.page.select(action.selector, action.value);
        }
        break;
    }

    if (action.delay) {
      await new Promise(resolve => setTimeout(resolve, action.delay));
    }
  }

  private generateSessionId(): string {
    return `${this.target}-browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getSessionId(): string {
    return this.sessionId;
  }

  getTarget(): string {
    return this.target;
  }

  isSessionActive(): boolean {
    return this.isInitialized;
  }

  getConfig(): SessionConfig {
    return { ...this.config };
  }
} 