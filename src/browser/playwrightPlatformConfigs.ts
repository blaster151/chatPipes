import { SessionConfig } from './PlaywrightSession';

export const playwrightPlatformConfigs: Record<string, SessionConfig> = {
  chatgpt: {
    url: 'https://chat.openai.com',
    selectors: {
      chatInput: '[data-id="root"] textarea, [data-testid="send-button"] + div textarea, .stretch textarea',
      sendButton: '[data-testid="send-button"], button[data-testid="send-button"]',
      responseContainer: '[data-testid="conversation-turn-2"], [data-testid="conversation-turn-3"], .markdown',
      responseText: '[data-testid="conversation-turn-2"] .markdown, [data-testid="conversation-turn-3"] .markdown, .markdown',
      loadingIndicator: '[data-testid="conversation-turn-2"] .animate-spin, .animate-spin',
      newChatButton: '[data-testid="new-chat-button"], a[href="/"]',
      modelSelector: 'select[data-testid="model-selector"], [data-testid="model-selector"]'
    },
    preActions: [
      { type: 'waitForSelector', selector: '[data-testid="send-button"]', timeout: 10000 },
      { type: 'wait', value: '2000' }
    ],
    postActions: [
      { type: 'wait', value: '1000' }
    ],
    responseWaitStrategy: 'selector',
    responseTimeout: 60000,
    maxRetries: 3
  },

  claude: {
    url: 'https://claude.ai',
    selectors: {
      chatInput: '[data-testid="composer-input"], .claude-composer textarea, [contenteditable="true"]',
      sendButton: '[data-testid="composer-send-button"], button[aria-label="Send message"]',
      responseContainer: '[data-testid="message-content"], .claude-message-content',
      responseText: '[data-testid="message-content"] .prose, .claude-message-content .prose',
      loadingIndicator: '[data-testid="message-content"] .animate-pulse, .animate-pulse',
      newChatButton: '[data-testid="new-chat-button"], a[href="/new"]',
      modelSelector: 'select[data-testid="model-selector"], [data-testid="model-selector"]'
    },
    preActions: [
      { type: 'waitForSelector', selector: '[data-testid="composer-input"]', timeout: 10000 },
      { type: 'wait', value: '2000' }
    ],
    postActions: [
      { type: 'wait', value: '1000' }
    ],
    responseWaitStrategy: 'selector',
    responseTimeout: 60000,
    maxRetries: 3
  },

  perplexity: {
    url: 'https://www.perplexity.ai',
    selectors: {
      chatInput: '[data-testid="search-input"], .search-input, textarea[placeholder*="search"]',
      sendButton: '[data-testid="search-button"], button[aria-label="Search"], .search-button',
      responseContainer: '[data-testid="answer"], .answer-content, .search-result',
      responseText: '[data-testid="answer"] .prose, .answer-content .prose, .search-result .prose',
      loadingIndicator: '[data-testid="answer"] .animate-spin, .animate-spin',
      newChatButton: '[data-testid="new-chat"], a[href="/"], .new-chat-button',
      searchTypeSelector: 'select[data-testid="search-type"], [data-testid="search-type"]',
      focusSelector: 'select[data-testid="focus"], [data-testid="focus"]'
    },
    preActions: [
      { type: 'waitForSelector', selector: '[data-testid="search-input"]', timeout: 10000 },
      { type: 'wait', value: '2000' }
    ],
    postActions: [
      { type: 'wait', value: '1000' }
    ],
    responseWaitStrategy: 'selector',
    responseTimeout: 60000,
    maxRetries: 3
  },

  deepseek: {
    url: 'https://chat.deepseek.com',
    selectors: {
      chatInput: '[data-testid="chat-input"], .chat-input, textarea[placeholder*="message"]',
      sendButton: '[data-testid="send-button"], button[aria-label="Send"], .send-button',
      responseContainer: '[data-testid="message-content"], .message-content, .chat-message',
      responseText: '[data-testid="message-content"] .prose, .message-content .prose, .chat-message .prose',
      loadingIndicator: '[data-testid="message-content"] .animate-spin, .animate-spin',
      newChatButton: '[data-testid="new-chat"], a[href="/"], .new-chat-button',
      modelSelector: 'select[data-testid="model-selector"], [data-testid="model-selector"]'
    },
    preActions: [
      { type: 'waitForSelector', selector: '[data-testid="chat-input"]', timeout: 10000 },
      { type: 'wait', value: '2000' }
    ],
    postActions: [
      { type: 'wait', value: '1000' }
    ],
    responseWaitStrategy: 'selector',
    responseTimeout: 60000,
    maxRetries: 3
  }
};

/**
 * Get platform configuration with fallback selectors
 */
export function getPlatformConfig(platform: string): SessionConfig {
  const config = playwrightPlatformConfigs[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return config;
}

/**
 * Get robust selector with multiple fallbacks
 */
export function getRobustSelector(selectors: string[]): string {
  return selectors.join(', ');
}

/**
 * Enhanced platform configurations with robust selectors
 */
export const robustPlatformConfigs: Record<string, SessionConfig> = {
  chatgpt: {
    ...playwrightPlatformConfigs.chatgpt,
    selectors: {
      ...playwrightPlatformConfigs.chatgpt.selectors,
      chatInput: getRobustSelector([
        '[data-id="root"] textarea',
        '[data-testid="send-button"] + div textarea',
        '.stretch textarea',
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="Send"]'
      ]),
      sendButton: getRobustSelector([
        '[data-testid="send-button"]',
        'button[data-testid="send-button"]',
        'button[aria-label="Send message"]',
        'button:has-text("Send")'
      ]),
      responseContainer: getRobustSelector([
        '[data-testid="conversation-turn-2"]',
        '[data-testid="conversation-turn-3"]',
        '.markdown',
        '[data-testid="message-content"]'
      ]),
      responseText: getRobustSelector([
        '[data-testid="conversation-turn-2"] .markdown',
        '[data-testid="conversation-turn-3"] .markdown',
        '.markdown',
        '[data-testid="message-content"] .prose'
      ])
    }
  },

  claude: {
    ...playwrightPlatformConfigs.claude,
    selectors: {
      ...playwrightPlatformConfigs.claude.selectors,
      chatInput: getRobustSelector([
        '[data-testid="composer-input"]',
        '.claude-composer textarea',
        '[contenteditable="true"]',
        'textarea[placeholder*="message"]'
      ]),
      sendButton: getRobustSelector([
        '[data-testid="composer-send-button"]',
        'button[aria-label="Send message"]',
        'button:has-text("Send")'
      ]),
      responseContainer: getRobustSelector([
        '[data-testid="message-content"]',
        '.claude-message-content',
        '.prose'
      ]),
      responseText: getRobustSelector([
        '[data-testid="message-content"] .prose',
        '.claude-message-content .prose',
        '.prose'
      ])
    }
  },

  perplexity: {
    ...playwrightPlatformConfigs.perplexity,
    selectors: {
      ...playwrightPlatformConfigs.perplexity.selectors,
      chatInput: getRobustSelector([
        '[data-testid="search-input"]',
        '.search-input',
        'textarea[placeholder*="search"]',
        'input[placeholder*="search"]'
      ]),
      sendButton: getRobustSelector([
        '[data-testid="search-button"]',
        'button[aria-label="Search"]',
        '.search-button',
        'button:has-text("Search")'
      ]),
      responseContainer: getRobustSelector([
        '[data-testid="answer"]',
        '.answer-content',
        '.search-result',
        '.prose'
      ]),
      responseText: getRobustSelector([
        '[data-testid="answer"] .prose',
        '.answer-content .prose',
        '.search-result .prose',
        '.prose'
      ])
    }
  },

  deepseek: {
    ...playwrightPlatformConfigs.deepseek,
    selectors: {
      ...playwrightPlatformConfigs.deepseek.selectors,
      chatInput: getRobustSelector([
        '[data-testid="chat-input"]',
        '.chat-input',
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="Send"]'
      ]),
      sendButton: getRobustSelector([
        '[data-testid="send-button"]',
        'button[aria-label="Send"]',
        '.send-button',
        'button:has-text("Send")'
      ]),
      responseContainer: getRobustSelector([
        '[data-testid="message-content"]',
        '.message-content',
        '.chat-message',
        '.prose'
      ]),
      responseText: getRobustSelector([
        '[data-testid="message-content"] .prose',
        '.message-content .prose',
        '.chat-message .prose',
        '.prose'
      ])
    }
  }
}; 