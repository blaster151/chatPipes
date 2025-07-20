# ChatPipes - AI Conversation Orchestration Platform

A monorepo for AI conversation orchestration with browser automation, multi-agent dialogues, and conversation management.

## 🏗️ Monorepo Structure

```
chatPipes/
├── packages/
│   ├── types/                    # Shared TypeScript types
│   ├── headless-bridges/         # Per-platform browser automation
│   └── ai-conductor/             # Core TS/Node library
├── apps/
│   ├── cli/                      # CLI application
│   └── web/                      # React (Next.js) web app
├── examples/                     # Usage examples
└── configs/                      # Configuration templates
```

## 📦 Packages

### `@chatpipes/types`
Shared TypeScript type definitions used across all packages.

```bash
cd packages/types
npm install
npm run build
```

### `@chatpipes/headless-bridges`
Per-platform browser automation using Playwright.

```bash
cd packages/headless-bridges
npm install
npm run build
```

**Features:**
- Playwright-based browser automation
- Platform-specific configurations (ChatGPT, Claude, Perplexity, DeepSeek)
- Robust selectors with fallbacks
- Session management and queue mechanisms
- Multiple response detection strategies

### `@chatpipes/ai-conductor`
Core TypeScript/Node.js library for AI conversation orchestration.

```bash
cd packages/ai-conductor
npm install
npm run build
```

**Features:**
- Multi-agent conversation orchestration
- Memory management and persistence
- Dialogue pipes for back-and-forth conversations
- Multi-agent round-robin dialogues
- Session recording and replay
- Emotional analysis and motif detection

## 🚀 Applications

### CLI App (`@chatpipes/cli`)
Command-line interface for managing AI conversations.

```bash
cd apps/cli
npm install
npm run build
npm start -- session --target chatgpt --interactive
```

**Commands:**
- `session` - Manage single AI agent sessions
- `conversation` - Multi-agent conversations
- `dialogue` - Back-and-forth dialogues
- `multi-dialogue` - Round-robin multi-agent dialogues

### Web App (`@chatpipes/web`)
React (Next.js) web application for visual conversation management.

```bash
cd apps/web
npm install
npm run dev
```

**Features:**
- Visual session management
- Real-time conversation monitoring
- Interactive chat interface
- Session state visualization

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm 8+

### Setup
```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Start development
npm run dev
```

### Workspace Commands
```bash
# Build all workspaces
npm run build

# Development mode for all workspaces
npm run dev

# Run CLI
npm run cli

# Run web app
npm run web

# Clean all builds
npm run clean
```

## 🎯 Core Features

### Browser Automation
- **Playwright-based**: Robust browser control with multiple engines
- **Platform Support**: ChatGPT, Claude, Perplexity, DeepSeek
- **Session Management**: Isolated browser contexts for each agent
- **Queue Mechanisms**: Serialized prompts to prevent UI clobbering
- **Response Detection**: Multiple strategies for detecting completion

### Conversation Patterns
- **Linear Flow**: User → Agent A → Agent B → Agent C → User
- **Circular Flow**: Agent A → Agent B → Agent C → Agent A
- **Back-and-Forth**: Agent A ↔ Agent B with interjections
- **Round-Robin**: Agent A → Agent B → Agent C → Agent A → ...

### Multi-Agent Dialogues
- **Context Synthesis**: "In reply to what A and B just said..."
- **Round-Robin Scheduling**: Automatic turn rotation
- **Agent Management**: Activate/deactivate agents dynamically
- **Event-Driven**: Real-time streaming and monitoring

### Memory Management
- **Persistent Storage**: File-based and SQLite storage
- **Emotional Analysis**: Track emotional tones across conversations
- **Motif Detection**: Identify recurring patterns
- **Summarization**: Automatic fact and emotion summarization

## 📚 Examples

### Basic Session
```typescript
import { BrowserAgentSession } from '@chatpipes/ai-conductor';

const session = new BrowserAgentSession('chatgpt', persona, {}, {
  useBrowser: true
});

await session.init();
const response = await session.sendPrompt('Hello!');
await session.close();
```

### Multi-Agent Dialogue
```typescript
import { MultiAgentDialogue } from '@chatpipes/ai-conductor';

const dialogue = new MultiAgentDialogue([
  { id: 'philosopher', name: 'Philosopher', session: agentA },
  { id: 'scientist', name: 'Scientist', session: agentB },
  { id: 'ethicist', name: 'Ethicist', session: agentC }
], {
  maxRounds: 4,
  contextWindow: 3,
  synthesisStrategy: 'recent'
});

await dialogue.runLoopUntilStopped();
```

### Back-and-Forth Dialogue
```typescript
import { DialoguePipe } from '@chatpipes/ai-conductor';

const dialogue = new DialoguePipe(agentA, agentB, {
  maxRounds: 10,
  enableStreaming: true
});

dialogue.on('streaming_chunk', (event) => {
  process.stdout.write(event.chunk);
});

dialogue.setWhoStarts('A');
await dialogue.runLoopUntilStopped();
```

## 🎮 CLI Usage

### Session Management
```bash
# Interactive session
npm run cli session --target chatgpt --browser --interactive

# With custom persona
npm run cli session --target claude --persona expert.json

# With platform config
npm run cli session --target perplexity --config platform.json
```

### Conversation Management
```bash
# Start conversation
npm run cli conversation --config debate.json --start

# Load conversation
npm run cli conversation --load saved.json

# Interactive conversation mode
npm run cli conversation --config research.json
```

### Dialogue Management
```bash
# Start dialogue between two agents
npm run cli dialogue --config philosophical-debate.json --start

# Interactive dialogue mode
npm run cli dialogue --interactive

# Multi-agent round-robin
npm run cli multi-dialogue --config ai-ethics-panel.json --start
```

## 🌐 Web Interface

### Development
```bash
cd apps/web
npm run dev
```

### Features
- **Session Management**: Create and manage AI agent sessions
- **Real-time Chat**: Interactive chat interface with streaming
- **Conversation Monitoring**: Visual conversation state tracking
- **Configuration**: Web-based configuration management

## 🔧 Configuration

### Persona Configuration
```json
{
  "name": "Expert Assistant",
  "description": "A knowledgeable expert in AI and technology",
  "instructions": "Provide detailed, accurate responses with examples",
  "temperature": 0.7,
  "maxTokens": 1000,
  "memoryContext": "You have 10 years of experience in AI research"
}
```

### Platform Configuration
```json
{
  "chatgpt": {
    "model": "gpt-4",
    "temperature": 0.8
  },
  "claude": {
    "model": "claude-3-sonnet",
    "maxTokens": 1000
  },
  "perplexity": {
    "searchType": "detailed",
    "focus": "academic"
  }
}
```

### Dialogue Configuration
```json
{
  "maxRounds": 10,
  "turnDelay": 1000,
  "enableStreaming": true,
  "contextWindow": 3,
  "synthesisStrategy": "recent",
  "skipInactiveAgents": true,
  "allowInterruptions": false
}
```

## 🚀 Roadmap

- [ ] React UI for session monitoring
- [ ] LangChain Python integration
- [ ] Advanced conversation patterns
- [ ] Real-time streaming responses
- [ ] Voice interaction support
- [ ] Advanced memory management
- [ ] Plugin system for custom behaviors
- [ ] Cloud deployment support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs` directory
- **Examples**: `/examples` directory

---

**ChatPipes**: Where AI conversations flow naturally! 🤖✨ 