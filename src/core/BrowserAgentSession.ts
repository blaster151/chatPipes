import { AgentSession, PersonaConfig, PlatformConfig } from './AgentSession';
import { PlaywrightSession, BrowserConfig } from '../browser/PlaywrightSession';
import { getPlatformConfig } from '../browser/playwrightPlatformConfigs';
import { MemoryManager } from './MemoryManager';

export interface BrowserAgentConfig {
  useBrowser: boolean;
  browserConfig?: BrowserConfig;
  customSelectors?: Record<string, string>;
}

export class BrowserAgentSession extends AgentSession {
  private browserSession: PlaywrightSession | null = null;
  private browserConfig: BrowserAgentConfig;
  private sessionEvents: Array<{
    timestamp: Date;
    type: 'prompt' | 'response' | 'error' | 'action';
    data: any;
  }> = [];

  constructor(
    target: 'chatgpt' | 'claude' | 'perplexity' | 'deepseek',
    persona: PersonaConfig,
    platformConfig: PlatformConfig = {},
    browserConfig: BrowserAgentConfig = { useBrowser: false }
  ) {
    super(target, persona, platformConfig);
    this.browserConfig = browserConfig;
  }

  async init(): Promise<void> {
    await super.init();

    if (this.browserConfig.useBrowser) {
      try {
        const platformConfig = getPlatformConfig(this.target);
        
        // Apply custom selectors if provided
        if (this.browserConfig.customSelectors) {
          Object.assign(platformConfig.selectors, this.browserConfig.customSelectors);
        }

        this.browserSession = new PlaywrightSession(
          platformConfig,
          this.browserConfig.browserConfig
        );

        await this.browserSession.init();
        this.logEvent('action', { action: 'browser_initialized', target: this.target });
        
      } catch (error) {
        console.error(`Failed to initialize browser session for ${this.target}:`, error);
        this.logEvent('error', { error: error instanceof Error ? error.message : String(error), target: this.target });
        throw error;
      }
    }
  }

  async sendPrompt(text: string): Promise<string> {
    this.logEvent('prompt', { text, target: this.target });

    let response: string;

    if (this.browserSession && this.browserConfig.useBrowser) {
      // Use browser automation
      try {
        response = await this.browserSession.sendPrompt(text);
        this.logEvent('response', { response, target: this.target, method: 'browser' });
      } catch (error) {
        console.error(`Browser prompt failed for ${this.target}, falling back to mock:`, error);
        this.logEvent('error', { error: error instanceof Error ? error.message : String(error), target: this.target, method: 'browser' });
        
        // Fallback to mock response
        response = await super.sendPrompt(text);
        this.logEvent('response', { response, target: this.target, method: 'mock' });
      }
    } else {
      // Use mock/API response
      response = await super.sendPrompt(text);
      this.logEvent('response', { response, target: this.target, method: 'mock' });
    }

    return response;
  }

  async startNewChat(): Promise<void> {
    if (this.browserSession && this.browserConfig.useBrowser) {
      await this.browserSession.startNewChat();
      this.logEvent('action', { action: 'new_chat', target: this.target });
    }
    await super.startNewChat();
  }

  async switchSearchType(searchType: 'concise' | 'detailed' | 'creative' | 'precise'): Promise<void> {
    if (this.browserSession && this.browserConfig.useBrowser) {
      await this.browserSession.switchSearchType(searchType);
      this.logEvent('action', { action: 'switch_search_type', searchType, target: this.target });
    }
    await super.switchSearchType(searchType);
  }

  async switchFocus(focus: 'web' | 'academic' | 'writing' | 'wolfram-alpha'): Promise<void> {
    if (this.browserSession && this.browserConfig.useBrowser) {
      await this.browserSession.switchFocus(focus);
      this.logEvent('action', { action: 'switch_focus', focus, target: this.target });
    }
    await super.switchFocus(focus);
  }

  async takeScreenshot(path?: string): Promise<Buffer | null> {
    if (this.browserSession && this.browserConfig.useBrowser) {
      return await this.browserSession.takeScreenshot(path);
    }
    return null;
  }

  async getPageContent(): Promise<string | null> {
    if (this.browserSession && this.browserConfig.useBrowser) {
      return await this.browserSession.getPageContent();
    }
    return null;
  }

  async close(): Promise<void> {
    if (this.browserSession) {
      await this.browserSession.close();
      this.logEvent('action', { action: 'browser_closed', target: this.target });
    }
    await super.close();
  }

  // Session recording and replay
  getSessionEvents(): Array<{timestamp: Date; type: 'prompt' | 'response' | 'error' | 'action'; data: any}> {
    return [...this.sessionEvents];
  }

  async replaySession(events: Array<{timestamp: Date; type: 'prompt' | 'response' | 'error' | 'action'; data: any}>): Promise<void> {
    console.log(`Replaying ${events.length} events for ${this.target}`);
    
    for (const event of events) {
      if (event.type === 'prompt') {
        await this.sendPrompt(event.data.text);
      } else if (event.type === 'action') {
        switch (event.data.action) {
          case 'new_chat':
            await this.startNewChat();
            break;
          case 'switch_search_type':
            await this.switchSearchType(event.data.searchType);
            break;
          case 'switch_focus':
            await this.switchFocus(event.data.focus);
            break;
        }
      }
      
      // Add delay to simulate real-time interaction
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Export session for persistence
  async exportSession(): Promise<{
    target: string;
    persona: PersonaConfig;
    platformConfig: PlatformConfig;
    browserConfig: BrowserAgentConfig;
    events: Array<{timestamp: Date; type: 'prompt' | 'response' | 'error' | 'action'; data: any}>;
    memoryContext: string;
  }> {
    return {
      target: this.target,
      persona: this.getPersona(),
      platformConfig: this.getPlatformConfig(),
      browserConfig: this.browserConfig,
      events: this.sessionEvents,
      memoryContext: await this.getMemoryContext() || ''
    };
  }

  // Import session from persistence
  static async importSession(sessionData: {
    target: 'chatgpt' | 'claude' | 'perplexity' | 'deepseek';
    persona: PersonaConfig;
    platformConfig: PlatformConfig;
    browserConfig: BrowserAgentConfig;
    events: Array<{timestamp: Date; type: 'prompt' | 'response' | 'error' | 'action'; data: any}>;
    memoryContext: string;
  }, memoryManager?: MemoryManager): Promise<BrowserAgentSession> {
    const session = new BrowserAgentSession(
      sessionData.target,
      sessionData.persona,
      sessionData.platformConfig,
      sessionData.browserConfig
    );

    if (memoryManager) {
      session.setMemoryManager(memoryManager);
    }

    await session.init();
    
    // Restore session events
    session.sessionEvents = sessionData.events;

    return session;
  }

  private logEvent(type: 'prompt' | 'response' | 'error' | 'action', data: any): void {
    this.sessionEvents.push({
      timestamp: new Date(),
      type,
      data
    });
  }

  // Getters
  getBrowserSession(): PlaywrightSession | null {
    return this.browserSession;
  }

  isUsingBrowser(): boolean {
    return this.browserConfig.useBrowser && this.browserSession !== null;
  }

  getBrowserConfig(): BrowserAgentConfig {
    return { ...this.browserConfig };
  }
} 