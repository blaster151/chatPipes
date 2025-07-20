import { PlatformConfig } from '../PlaywrightSession';

export const ClaudeConfig: PlatformConfig = {
  name: 'Claude',
  url: 'https://claude.ai',
  authRequired: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
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
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  },
  waitForSelector: '[data-testid="send-button"]',
  loginSelectors: {
    username: 'input[name="email"]',
    password: 'input[name="password"]',
    submit: 'button[type="submit"]',
    captcha: '[data-testid="captcha"]'
  },
  chatSelectors: {
    input: '[data-testid="chat-input"]',
    send: '[data-testid="send-button"]',
    messages: '[data-testid="message"]',
    messageContent: '[data-testid="message-content"]'
  }
};

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  conversationId?: string;
  messageId?: string;
}

export interface ClaudeConversation {
  id: string;
  title: string;
  messages: ClaudeMessage[];
  createdAt: number;
  updatedAt: number;
}

export class ClaudePlatform {
  private config: PlatformConfig;

  constructor() {
    this.config = ClaudeConfig;
  }

  getConfig(): PlatformConfig {
    return this.config;
  }

  /**
   * Get conversation list
   */
  async getConversations(page: any): Promise<ClaudeConversation[]> {
    try {
      const conversations = await page.evaluate(() => {
        const conversationElements = document.querySelectorAll('[data-testid="conversation-item"]');
        return Array.from(conversationElements).map((element, index) => {
          const titleElement = element.querySelector('[data-testid="conversation-title"]');
          const title = titleElement ? titleElement.textContent || `Conversation ${index + 1}` : `Conversation ${index + 1}`;
          
          return {
            id: element.getAttribute('data-conversation-id') || `conv-${index}`,
            title,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
        });
      });

      return conversations;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  /**
   * Create new conversation
   */
  async createNewConversation(page: any): Promise<void> {
    try {
      const newChatButton = await page.$('[data-testid="new-chat-button"]');
      if (newChatButton) {
        await newChatButton.click();
        await page.waitForSelector('[data-testid="chat-input"]');
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }

  /**
   * Switch to conversation
   */
  async switchToConversation(page: any, conversationId: string): Promise<void> {
    try {
      const conversationElement = await page.$(`[data-conversation-id="${conversationId}"]`);
      if (conversationElement) {
        await conversationElement.click();
        await page.waitForSelector('[data-testid="chat-input"]');
      }
    } catch (error) {
      console.error('Failed to switch conversation:', error);
    }
  }

  /**
   * Get current conversation messages
   */
  async getCurrentMessages(page: any): Promise<ClaudeMessage[]> {
    try {
      const messages = await page.evaluate(() => {
        const messageElements = document.querySelectorAll('[data-testid="message"]');
        return Array.from(messageElements).map((element, index) => {
          const roleElement = element.querySelector('[data-testid="message-role"]');
          const contentElement = element.querySelector('[data-testid="message-content"]');
          
          const role = roleElement?.textContent?.toLowerCase() === 'user' ? 'user' : 'assistant';
          const content = contentElement?.textContent || '';
          
          return {
            role,
            content,
            timestamp: Date.now() - (messageElements.length - index) * 1000,
            messageId: element.getAttribute('data-message-id') || `msg-${index}`
          };
        });
      });

      return messages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Check if rate limited
   */
  async isRateLimited(page: any): Promise<boolean> {
    try {
      const rateLimitElement = await page.$('[data-testid="rate-limit-message"]');
      return !!rateLimitElement;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if maintenance mode
   */
  async isMaintenanceMode(page: any): Promise<boolean> {
    try {
      const maintenanceElement = await page.$('[data-testid="maintenance-message"]');
      return !!maintenanceElement;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for typing indicator to disappear
   */
  async waitForTypingComplete(page: any): Promise<void> {
    try {
      await page.waitForFunction(() => {
        const typingIndicators = document.querySelectorAll('[data-testid="typing-indicator"]');
        return typingIndicators.length === 0;
      }, { timeout: 60000 });
    } catch (error) {
      console.warn('Typing indicator wait timeout:', error);
    }
  }

  /**
   * Check if response is complete
   */
  async isResponseComplete(page: any): Promise<boolean> {
    try {
      const isComplete = await page.evaluate(() => {
        const typingIndicators = document.querySelectorAll('[data-testid="typing-indicator"]');
        const stopButton = document.querySelector('[data-testid="stop-button"]');
        return typingIndicators.length === 0 && !stopButton;
      });
      return isComplete;
    } catch (error) {
      return false;
    }
  }

  /**
   * Stop current response
   */
  async stopResponse(page: any): Promise<void> {
    try {
      const stopButton = await page.$('[data-testid="stop-button"]');
      if (stopButton) {
        await stopButton.click();
      }
    } catch (error) {
      console.error('Failed to stop response:', error);
    }
  }

  /**
   * Regenerate response
   */
  async regenerateResponse(page: any): Promise<void> {
    try {
      const regenerateButton = await page.$('[data-testid="regenerate-button"]');
      if (regenerateButton) {
        await regenerateButton.click();
        await this.waitForTypingComplete(page);
      }
    } catch (error) {
      console.error('Failed to regenerate response:', error);
    }
  }

  /**
   * Clear conversation
   */
  async clearConversation(page: any): Promise<void> {
    try {
      const clearButton = await page.$('[data-testid="clear-conversation-button"]');
      if (clearButton) {
        await clearButton.click();
        
        // Confirm clear
        const confirmButton = await page.$('[data-testid="confirm-clear-button"]');
        if (confirmButton) {
          await confirmButton.click();
        }
      }
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  }

  /**
   * Export conversation
   */
  async exportConversation(page: any): Promise<string> {
    try {
      const exportButton = await page.$('[data-testid="export-conversation-button"]');
      if (exportButton) {
        await exportButton.click();
        
        // Wait for download to start
        await page.waitForEvent('download');
        
        // Get download path
        const download = await page.waitForEvent('download');
        return download.path();
      }
    } catch (error) {
      console.error('Failed to export conversation:', error);
    }
    
    return '';
  }

  /**
   * Get model information
   */
  async getModelInfo(page: any): Promise<{ model: string; version: string } | null> {
    try {
      const modelInfo = await page.evaluate(() => {
        const modelElement = document.querySelector('[data-testid="model-selector"]');
        const model = modelElement?.textContent || '';
        return { model, version: 'Claude-3' };
      });
      
      return modelInfo;
    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  }

  /**
   * Switch model
   */
  async switchModel(page: any, model: string): Promise<void> {
    try {
      const modelSelector = await page.$('[data-testid="model-selector"]');
      if (modelSelector) {
        await modelSelector.click();
        
        const modelOption = await page.$(`[data-testid="model-option-${model}"]`);
        if (modelOption) {
          await modelOption.click();
        }
      }
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
  }
} 