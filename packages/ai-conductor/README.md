# AI Conductor - Plugin & Adapter System

A modern TypeScript-first API for orchestrating AI agent conversations with a pluggable adapter system.

## 🚀 Features

- **🔌 Pluggable Adapter System**: Easy-to-use adapter interface for different AI platforms
- **🎭 Multi-Agent Dialogues**: Pipe agents together for automated conversations
- **💬 Interjection Support**: Inject prompts to guide conversations
- **🕵️ Stealth Mode**: Anti-detection capabilities for headless browser automation
- **📊 Observability**: Complete exchange recording and replay functionality
- **⚡ Rate Limiting**: Built-in rate limit management per platform
- **🎯 TypeScript-First**: Full type safety and modern async/await patterns

## 🔌 Adapter System

### Core Interface

```typescript
interface AgentAdapter {
  readonly id: string;
  readonly type: string;
  readonly config: AgentConfig;
  
  // Core lifecycle methods
  init(): Promise<void>;
  send(prompt: string): Promise<string>;
  close(): Promise<void>;
  
  // State management
  isInitialized(): boolean;
  isConnected(): boolean;
  
  // Statistics and monitoring
  getStats(): AgentStats;
  resetStats(): void;
  
  // Event emission
  on(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
}
```

### Built-in Adapters

#### ChatGPT Adapter
```typescript
import { ChatGPTAdapter } from '@chatpipes/ai-conductor';

const adapter = new ChatGPTAdapter('gpt-session', {
  model: 'gpt-4',
  temperature: 0.7,
  systemPrompt: 'You are a helpful AI assistant.',
  useStealth: true,
  rateLimitConfig: {
    requestsPerMinute: 20,
    cooldownPeriod: 60000
  }
});

await adapter.init();
const response = await adapter.send('What is AI?');
await adapter.close();
```

#### Claude Adapter
```typescript
import { ClaudeAdapter } from '@chatpipes/ai-conductor';

const adapter = new ClaudeAdapter('claude-session', {
  model: 'claude-3-sonnet',
  temperature: 0.7,
  systemPrompt: 'You are a thoughtful AI assistant.',
  useStealth: true,
  rateLimitConfig: {
    requestsPerMinute: 15,
    cooldownPeriod: 60000
  }
});

await adapter.init();
const response = await adapter.send('What is AI?');
await adapter.close();
```

### Adapter Factory System

```typescript
import { globalAdapterFactoryRegistry } from '@chatpipes/ai-conductor';

// List available adapters
const types = globalAdapterFactoryRegistry.getSupportedTypes();
// ['chatgpt', 'gpt', 'openai', 'claude', 'anthropic']

// Create adapter using factory
const adapter = globalAdapterFactoryRegistry.createAdapter('chatgpt', 'session-1', {
  model: 'gpt-4',
  useStealth: true
});

// Using aliases
const gptAdapter = globalAdapterFactoryRegistry.createAdapter('gpt', 'session-2', config);
const claudeAdapter = globalAdapterFactoryRegistry.createAdapter('anthropic', 'session-3', config);
```

### Custom Adapter Implementation

```typescript
import { BaseAgentAdapter, AdapterCapabilities } from '@chatpipes/ai-conductor';

class CustomAIAdapter extends BaseAgentAdapter {
  constructor(id: string, config: any) {
    super(id, 'custom-ai', config);
  }

  async init(): Promise<void> {
    // Initialize your custom AI service
    this.initialized = true;
    this.connected = true;
    this.emit('initialized', { adapterId: this.id, type: this.type });
  }

  async send(prompt: string): Promise<string> {
    // Send prompt to your custom AI service
    const response = await this.callCustomAIService(prompt);
    this.recordSuccess(1000, this.estimateTokens(response));
    return response;
  }

  async close(): Promise<void> {
    // Cleanup resources
    this.initialized = false;
    this.connected = false;
    this.emit('closed', { adapterId: this.id, type: this.type });
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportsStreaming: false,
      supportsInterjections: true,
      supportsRateLimiting: true,
      supportsStealth: false,
      maxTokensPerRequest: 1000,
      maxRequestsPerMinute: 10,
      supportedModels: ['custom-model'],
      features: ['custom_response']
    };
  }

  validateConfig(): boolean {
    return true;
  }
}

// Register custom adapter
import { globalAdapterRegistry } from '@chatpipes/ai-conductor';

class CustomAIAdapterFactory {
  createAdapter(id: string, config: any): AgentAdapter {
    return new CustomAIAdapter(id, config);
  }

  getSupportedTypes(): string[] {
    return ['custom-ai'];
  }

  validateConfig(type: string, config: any): boolean {
    return true;
  }
}

globalAdapterRegistry.registerFactory('custom-ai', new CustomAIAdapterFactory());
```

## 🎭 Agent Session

### Basic Usage

```typescript
import { AgentSession } from '@chatpipes/ai-conductor';

const session = new AgentSession({
  agentType: 'chatgpt',
  model: 'gpt-4',
  temperature: 0.7,
  systemPrompt: 'You are a helpful AI assistant.',
  useStealth: true
});

await session.init();

// Send prompt
const response = await session.sendPrompt('What is artificial intelligence?');

// Queue multiple prompts
const response1 = await session.queuePrompt('First question');
const response2 = await session.queuePrompt('Second question');

// Get statistics
const stats = session.getStats();
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Success rate: ${(stats.successfulRequests / stats.totalRequests * 100).toFixed(1)}%`);

await session.close();
```

### Event-Driven Usage

```typescript
session.on('initialized', (data) => {
  console.log('Session initialized:', data);
});

session.on('prompt_sent', (data) => {
  console.log('Prompt sent:', data.prompt);
});

session.on('response_received', (data) => {
  console.log('Response received:', data.response);
});

session.on('request_success', (data) => {
  console.log('Request successful:', data.responseTime);
});

session.on('rate_limit_hit', (data) => {
  console.log('Rate limit hit:', data.totalHits);
});
```

## 🔗 Dialogue Pipe

### Two-Agent Dialogue

```typescript
import { DialoguePipe } from '@chatpipes/ai-conductor';

const gptSession = new AgentSession({
  agentType: 'chatgpt',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful AI assistant.'
});

const claudeSession = new AgentSession({
  agentType: 'claude',
  model: 'claude-3-sonnet',
  systemPrompt: 'You are a thoughtful AI assistant.'
});

await gptSession.init();
await claudeSession.init();

const pipe = new DialoguePipe({
  agentA: gptSession,
  agentB: claudeSession,
  startWith: 'A',
  maxRounds: 5,
  turnDelay: 2000
});

// Listen for events
pipe.on('exchange', (exchange) => {
  console.log(`${exchange.from} → ${exchange.to}: ${exchange.response}`);
});

pipe.on('dialogue_started', () => {
  console.log('Dialogue started!');
});

pipe.on('dialogue_completed', () => {
  console.log('Dialogue completed!');
});

// Start dialogue
await pipe.start();

// Add interjection
pipe.addInterjection({
  id: 'interjection-1',
  interjection: 'Please be more concise.',
  targetAgentId: 'agent-b',
  timestamp: new Date()
});

// Pause and resume
await pipe.pause();
await pipe.resume();

// Stop dialogue
await pipe.stop();

// Get transcript
const transcript = pipe.getTranscript();
console.log('Dialogue transcript:', transcript);
```

## 💬 Interjection System

### Adding Interjections

```typescript
import { InterjectionManager } from '@chatpipes/ai-conductor';

const interjectionManager = new InterjectionManager();

// Add interjection
interjectionManager.addInterjection({
  id: 'interjection-1',
  interjection: 'Please be more concise in your response.',
  targetAgentId: 'agent-1',
  timestamp: new Date()
});

// Get next interjection
const nextInterjection = interjectionManager.getNextInterjection('agent-1');
if (nextInterjection) {
  const modifiedPrompt = interjectionManager.applyInterjection(
    originalPrompt, 
    nextInterjection.interjection
  );
  interjectionManager.markApplied(nextInterjection.id);
}
```

## 📊 Observability & Replay

### Recording Exchanges

```typescript
import { ObservabilityManager } from '@chatpipes/ai-conductor';

const observabilityManager = new ObservabilityManager({
  enableReplay: true,
  maxHistorySize: 10000,
  persistToFile: true,
  filePath: './exchanges.json',
  autoSaveInterval: 30000
});

// Record exchange
observabilityManager.recordExchange({
  id: 'exchange-1',
  from: 'GPT',
  to: 'Claude',
  prompt: 'What is AI?',
  response: 'Artificial Intelligence is...',
  round: 1,
  timestamp: new Date(),
  metadata: {
    duration: 2500,
    tokens: 150,
    platform: 'chatgpt',
    model: 'gpt-4'
  }
});
```

### Replay Sessions

```typescript
// Create replay session
const sessionId = observabilityManager.createReplaySession(exchanges, {
  speed: 'normal',
  enableInterjections: true,
  enableMetadata: true,
  autoAdvance: true,
  loop: false,
  sessionName: 'AI Discussion Replay'
});

// Start replay
await observabilityManager.startReplay(sessionId);

// Control replay
observabilityManager.pauseReplay(sessionId);
observabilityManager.resumeReplay(sessionId);
observabilityManager.jumpToExchange(sessionId, 5);
observabilityManager.stopReplay(sessionId);

// Listen for replay events
observabilityManager.on('replay_exchange', (event) => {
  console.log(`Replay exchange ${event.index}: ${event.exchange?.from} → ${event.exchange?.to}`);
});

observabilityManager.on('replay_completed', (data) => {
  console.log('Replay completed:', data.sessionId);
});
```

### Filtering and Querying

```typescript
// Filter exchanges
const gptExchanges = observabilityManager.getExchangesByFilter({ agentId: 'GPT' });
const round1Exchanges = observabilityManager.getExchangesByFilter({ round: 1 });
const interjectionExchanges = observabilityManager.getExchangesByFilter({ hasInterjection: true });

// Export/Import
const exportedData = observabilityManager.exportReplaySession(sessionId);
const importedSessionId = observabilityManager.importReplaySession(exportedData);
```

## 🕵️ Stealth & Rate Limiting

### Stealth Configuration

```typescript
const session = new AgentSession({
  agentType: 'chatgpt',
  useStealth: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  viewport: { width: 1920, height: 1080 },
  stealthConfig: {
    enableAntiDetection: true,
    randomizeUserAgent: true,
    randomizeViewport: true,
    typingDelay: { min: 50, max: 150 },
    domTransitionDelay: { min: 100, max: 300 }
  }
});
```

### Rate Limiting

```typescript
const session = new AgentSession({
  agentType: 'chatgpt',
  rateLimitConfig: {
    requestsPerMinute: 20,
    cooldownPeriod: 60000,
    retryDelays: [1000, 2000, 5000],
    maxRetries: 3
  }
});

// Listen for rate limit events
session.on('rate_limit_hit', (data) => {
  console.log(`Rate limit hit! Total hits: ${data.totalHits}`);
  console.log(`Last hit: ${data.timestamp}`);
});
```

## 🎯 Advanced Usage

### Streaming Responses

```typescript
// Adapters can support streaming (if implemented)
const session = new AgentSession({
  agentType: 'chatgpt',
  supportsStreaming: true
});

session.on('stream_chunk', (chunk) => {
  process.stdout.write(chunk);
});

session.on('stream_complete', (fullResponse) => {
  console.log('\nStream complete:', fullResponse);
});
```

### Session Persistence

```typescript
import { SessionManager } from '@chatpipes/ai-conductor';

const sessionManager = new SessionManager({
  storagePath: './sessions',
  autoSave: true
});

const session = new AgentSession({
  agentType: 'chatgpt',
  sessionManager,
  sessionId: 'my-session'
});

// Session will be automatically saved
await session.sendPrompt('Hello');

// Load existing session
const existingSession = sessionManager.getSession('my-session');
```

### Multi-Agent Orchestration

```typescript
const agents = [
  new AgentSession({ agentType: 'chatgpt', model: 'gpt-4' }),
  new AgentSession({ agentType: 'claude', model: 'claude-3-sonnet' }),
  new AgentSession({ agentType: 'chatgpt', model: 'gpt-3.5-turbo' })
];

// Initialize all agents
await Promise.all(agents.map(agent => agent.init()));

// Create multi-agent dialogue
const multiDialogue = new MultiAgentDialogue({
  agents,
  maxRounds: 10,
  turnDelay: 1000
});

await multiDialogue.start();
```

## 📦 Installation

```bash
npm install @chatpipes/ai-conductor
```

## 🔧 Configuration

### Environment Variables

```bash
# Optional API keys (for direct API access)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Browser automation settings
PLAYWRIGHT_BROWSER_PATH=/path/to/browser
PLAYWRIGHT_HEADLESS=true
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "Adapter"
npm test -- --grep "DialoguePipe"
npm test -- --grep "Observability"

# Run with coverage
npm run test:coverage
```

## 📚 Examples

See the `examples/` directory for comprehensive usage examples:

- `adapterSystemExample.ts` - Adapter system usage
- `modernApiExample.ts` - Modern API patterns
- `interjectionExample.ts` - Interjection system
- `observabilityExample.ts` - Observability and replay

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- 📖 [Documentation](https://github.com/chatpipes/ai-conductor)
- 🐛 [Issues](https://github.com/chatpipes/ai-conductor/issues)
- 💬 [Discussions](https://github.com/chatpipes/ai-conductor/discussions) 