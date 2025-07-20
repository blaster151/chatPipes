# AgentSession

The `AgentSession` class provides a unified interface for interacting with different AI models while maintaining conversation memory and persona consistency.

## Features

- **Multi-Model Support**: Works with ChatGPT, Claude, Perplexity, and DeepSeek
- **Memory Integration**: Automatically stores conversations using MemoryManager
- **Persona Management**: Maintains consistent personality and behavior
- **Session Management**: Handles initialization, cleanup, and state management
- **Prompt Queuing**: Support for queuing multiple prompts
- **Context Building**: Automatically includes memory context in prompts

## Basic Usage

```typescript
import { AgentSession, PersonaConfig } from 'memory-manager';
import { MemoryManager } from 'memory-manager';
import { FileStore } from 'memory-manager';

// Create memory manager
const store = new FileStore();
const memoryManager = new MemoryManager(store, 'my-bot');
await memoryManager.init();

// Define persona
const persona: PersonaConfig = {
  name: 'Assistant',
  description: 'A helpful AI assistant',
  instructions: 'Be friendly and helpful in your responses.',
  temperature: 0.7,
  maxTokens: 1000
};

// Create session with platform configuration
const platformConfig: PlatformConfig = {
  chatgpt: {
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  }
};

const session = new AgentSession('chatgpt', persona, platformConfig);
session.setMemoryManager(memoryManager);

// Initialize and use
await session.init();

const response = await session.sendPrompt('Hello, how are you?');
console.log(response);

await session.close();
```

## Persona Configuration

The `PersonaConfig` interface allows you to define the AI's personality:

```typescript
interface PersonaConfig {
  name: string;                    // The AI's name
  description: string;             // General description
  instructions: string;            // Behavioral instructions
  memoryContext?: string;          // Initial memory context
  temperature?: number;            // Creativity level (0-1)
  maxTokens?: number;              // Maximum response length
}
```

## Platform Configuration

Each platform has unique behaviors and settings. The `PlatformConfig` interface allows you to configure platform-specific options:

```typescript
interface PlatformConfig {
  chatgpt?: {
    model?: 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo';
    apiKey?: string;
    organization?: string;
  };
  claude?: {
    model?: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
    apiKey?: string;
    maxTokens?: number;
  };
  perplexity?: {
    searchType?: 'concise' | 'detailed' | 'creative' | 'precise';
    focus?: 'web' | 'academic' | 'writing' | 'wolfram-alpha';
    apiKey?: string;
  };
  deepseek?: {
    model?: 'deepseek-chat' | 'deepseek-coder';
    apiKey?: string;
    temperature?: number;
  };
}
```

## Supported Targets

- `'chatgpt'` - OpenAI's ChatGPT
- `'claude'` - Anthropic's Claude
- `'perplexity'` - Perplexity AI
- `'deepseek'` - DeepSeek

## Memory Integration

The AgentSession automatically integrates with MemoryManager:

```typescript
// User prompts are stored as 'user' utterances
await session.sendPrompt('My name is Alice');

// AI responses are stored as 'agent' utterances
// The response is automatically stored in memory

// Memory context is included in subsequent prompts
const response = await session.sendPrompt('What is my name?');
// The AI will have access to the previous conversation
```

## Session Management

```typescript
// Initialize session
await session.init();

// Check if session is active
if (session.isSessionActive()) {
  // Session is ready
}

// Get session information
const sessionId = session.getSessionId();
const persona = session.getPersona();
const target = session.getTarget();

// Queue prompts for later processing
await session.queuePrompt('First question');
await session.queuePrompt('Second question');
const queued = session.getQueuedPrompts();

// Get latest response
const latestResponse = await session.readLatestResponse();

// Close session
await session.close();
```

## Advanced Usage

### Platform-Specific Behaviors

#### Claude "New Chat" Functionality

Claude requires explicit "New Chat" to start fresh conversations:

```typescript
const claudeSession = new AgentSession('claude', persona, {
  claude: { model: 'claude-3-sonnet' }
});

await claudeSession.init();

// First conversation
await claudeSession.sendPrompt('My name is Alice');
const response1 = await claudeSession.sendPrompt('What is my name?');
console.log(response1); // "Your name is Alice"

// Start new chat (simulates clicking "New Chat")
await claudeSession.startNewChat();
const response2 = await claudeSession.sendPrompt('What is my name?');
console.log(response2); // "I don't know your name yet"
```

#### Perplexity Search Type Switching

Perplexity supports different search types and focus areas:

```typescript
const perplexitySession = new AgentSession('perplexity', persona, {
  perplexity: { 
    searchType: 'concise',
    focus: 'web'
  }
});

await perplexitySession.init();

// Switch search types dynamically
await perplexitySession.switchSearchType('detailed');
await perplexitySession.switchSearchType('creative');
await perplexitySession.switchSearchType('precise');

// Switch focus areas
await perplexitySession.switchFocus('academic');
await perplexitySession.switchFocus('writing');
await perplexitySession.switchFocus('wolfram-alpha');
```

#### ChatGPT Model Selection

ChatGPT supports different models with varying capabilities:

```typescript
const chatgptSession = new AgentSession('chatgpt', persona, {
  chatgpt: {
    model: 'gpt-4-turbo',  // Latest model
    apiKey: process.env.OPENAI_API_KEY
  }
});
```

#### DeepSeek Coding Focus

DeepSeek has specialized models for coding:

```typescript
const deepseekSession = new AgentSession('deepseek', persona, {
  deepseek: {
    model: 'deepseek-coder',  // Specialized for coding
    temperature: 0.3
  }
});
```

### Custom Memory Context

```typescript
const persona: PersonaConfig = {
  name: 'Expert',
  description: 'A domain expert',
  instructions: 'Provide detailed technical explanations',
  memoryContext: 'You are an expert in machine learning with 10 years of experience.',
  temperature: 0.3,
  maxTokens: 2000
};
```

### Multiple Sessions

```typescript
// Create different personas for different purposes
const friendlyBot = new AgentSession('chatgpt', friendlyPersona);
const technicalBot = new AgentSession('claude', technicalPersona);

await friendlyBot.init();
await technicalBot.init();

// Use them for different types of interactions
const casualResponse = await friendlyBot.sendPrompt('How are you?');
const technicalResponse = await technicalBot.sendPrompt('Explain neural networks');

await friendlyBot.close();
await technicalBot.close();
```

### Memory Context Retrieval

```typescript
// Get the current memory context
const context = await session.getMemoryContext();
console.log('Current memory context:', context);

// This includes:
// - Facts extracted from conversations
// - Emotional analysis
// - Recurring motifs/patterns
```

## Error Handling

```typescript
try {
  await session.init();
  const response = await session.sendPrompt('Hello');
} catch (error) {
  if (error.message.includes('Session not initialized')) {
    console.log('Session needs to be initialized first');
  } else if (error.message.includes('Session already initialized')) {
    console.log('Session is already active');
  }
} finally {
  await session.close();
}
```

## Integration with Existing Systems

The AgentSession can be easily integrated into existing chat applications:

```typescript
class ChatBot {
  private session: AgentSession;
  private memoryManager: MemoryManager;

  constructor(persona: PersonaConfig, target: string) {
    const store = new FileStore();
    this.memoryManager = new MemoryManager(store, persona.name);
    this.session = new AgentSession(target, persona);
    this.session.setMemoryManager(this.memoryManager);
  }

  async start() {
    await this.memoryManager.init();
    await this.session.init();
  }

  async chat(message: string): Promise<string> {
    return await this.session.sendPrompt(message);
  }

  async stop() {
    await this.session.close();
  }
}
```

## Platform-Specific Methods

### Conversation Management

```typescript
// Get conversation history
const history = session.getConversationHistory();
console.log('Conversation:', history);

// Get platform configuration
const config = session.getPlatformConfig();
console.log('Platform config:', config);
```

### Claude New Chat

```typescript
// Start a new chat (simulates Claude's "New Chat" button)
await session.startNewChat();
```

### Perplexity Search Types

```typescript
// Switch between search types
await session.switchSearchType('concise');   // Short answers
await session.switchSearchType('detailed');  // Comprehensive answers
await session.switchSearchType('creative');  // Creative responses
await session.switchSearchType('precise');   // Factual answers

// Switch focus areas
await session.switchFocus('web');           // General web search
await session.switchFocus('academic');      // Academic sources
await session.switchFocus('writing');       // Writing assistance
await session.switchFocus('wolfram-alpha'); // Computational answers
```

## Testing

The AgentSession includes comprehensive tests covering:

- Session initialization and cleanup
- Prompt sending and response handling
- Memory integration
- Multi-target support
- Error handling
- Persona configuration
- Platform-specific behaviors

Run tests with:
```bash
npm run test:run -- test/agentSession.test.ts
``` 