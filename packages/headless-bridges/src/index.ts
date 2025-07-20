// Core Playwright session management
export { PlaywrightSession, type SessionConfig, type PlatformConfig, type AuthState, type ChatMessage } from './PlaywrightSession';

// Browser profile management system
export { BrowserProfileManager, type BrowserProfile, type StealthSettings, type AuthState as ProfileAuthState, type ProfileStats, type ProfileRotationConfig } from './BrowserProfileManager';

// Agent session with profile management
export { AgentSession, type AgentSessionConfig, type AgentSessionState } from './AgentSession';

// Auth Manager with encrypted storage and periodic verification
export { AuthManager, type AuthManagerConfig, type LoginStep, type LoginFlow, type AuthSession, type VerificationResult } from './AuthManager';

// Auth Manager UI
export { AuthUI, type AuthUIConfig, type LoginRequest, type LoginResponse, type UISession } from './AuthUI';

// Platform-specific implementations
export { ChatGPTPlatform, type ChatGPTMessage, type ChatGPTConversation } from './platforms/ChatGPTPlatform';
export { ClaudePlatform, type ClaudeMessage, type ClaudeConversation } from './platforms/ClaudePlatform';
export { BingChatPlatform, type BingChatMessage, type BingChatConversation } from './platforms/BingChatPlatform';

// Platform configurations
export { ChatGPTConfig } from './platforms/ChatGPTPlatform';
export { ClaudeConfig } from './platforms/ClaudePlatform';
export { BingChatConfig } from './platforms/BingChatPlatform';

// Re-export types from shared package
export type { BrowserConfig, SessionEvent } from '@chatpipes/types'; 