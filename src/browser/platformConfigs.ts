import { SessionConfig } from './BrowserSession';

export const PLATFORM_CONFIGS: Record<string, SessionConfig> = {
  chatgpt: {
    url: 'https://chat.openai.com/',
    selectors: {
      input: '[data-id="root"] textarea, [data-testid="send-button"] + div textarea',
      submit: '[data-testid="send-button"]',
      response: '[data-testid="conversation-turn-2"] [data-message-author-role="assistant"]',
      newChat: '[data-testid="new-chat-button"]'
    },
    waitFor: '[data-testid="send-button"]',
    preActions: [
      // Add login actions if needed
      // { type: 'click', selector: '[data-testid="login-button"]' },
      // { type: 'type', selector: '[data-testid="email-input"]', value: 'your-email@example.com' },
      // { type: 'type', selector: '[data-testid="password-input"]', value: 'your-password' },
      // { type: 'click', selector: '[data-testid="login-submit"]' },
      // { type: 'wait', selector: '[data-testid="send-button"]', delay: 3000 }
    ]
  },

  claude: {
    url: 'https://claude.ai/',
    selectors: {
      input: '[data-testid="composer-input"] textarea, .claude-composer textarea',
      submit: '[data-testid="send-button"], .claude-composer button[type="submit"]',
      response: '[data-testid="message-content"], .claude-message-content',
      newChat: '[data-testid="new-chat-button"], .new-chat-button'
    },
    waitFor: '[data-testid="composer-input"]',
    preActions: [
      // Add login actions if needed
      // { type: 'click', selector: '[data-testid="login-button"]' },
      // { type: 'type', selector: '[data-testid="email-input"]', value: 'your-email@example.com' },
      // { type: 'type', selector: '[data-testid="password-input"]', value: 'your-password' },
      // { type: 'click', selector: '[data-testid="login-submit"]' },
      // { type: 'wait', selector: '[data-testid="composer-input"]', delay: 3000 }
    ]
  },

  perplexity: {
    url: 'https://www.perplexity.ai/',
    selectors: {
      input: '[data-testid="search-input"], .search-input, textarea[placeholder*="search"]',
      submit: '[data-testid="search-button"], .search-button, button[type="submit"]',
      response: '[data-testid="answer-content"], .answer-content, .prose',
      searchType: '[data-testid="search-type-selector"], .search-type-selector',
      focus: '[data-testid="focus-selector"], .focus-selector'
    },
    waitFor: '[data-testid="search-input"]',
    preActions: [
      // Dismiss any initial modals or popups
      { type: 'wait', selector: '[data-testid="search-input"]', delay: 2000 }
    ]
  },

  deepseek: {
    url: 'https://chat.deepseek.com/',
    selectors: {
      input: '[data-testid="composer-input"] textarea, .chat-input textarea',
      submit: '[data-testid="send-button"], .send-button, button[type="submit"]',
      response: '[data-testid="message-content"], .message-content, .prose',
      newChat: '[data-testid="new-chat-button"], .new-chat-button'
    },
    waitFor: '[data-testid="composer-input"]',
    preActions: [
      // Add login actions if needed
      // { type: 'click', selector: '[data-testid="login-button"]' },
      // { type: 'type', selector: '[data-testid="email-input"]', value: 'your-email@example.com' },
      // { type: 'type', selector: '[data-testid="password-input"]', value: 'your-password' },
      // { type: 'click', selector: '[data-testid="login-submit"]' },
      // { type: 'wait', selector: '[data-testid="composer-input"]', delay: 3000 }
    ]
  }
};

export function getPlatformConfig(platform: string): SessionConfig {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return config;
}

export function updatePlatformConfig(platform: string, updates: Partial<SessionConfig>): void {
  if (!PLATFORM_CONFIGS[platform]) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  
  PLATFORM_CONFIGS[platform] = {
    ...PLATFORM_CONFIGS[platform],
    ...updates
  };
} 