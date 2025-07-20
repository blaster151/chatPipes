# ChatPipes CLI

A rich command-line interface for AI conversation orchestration with real-time streaming, TUI components, and session management.

## 🚀 Installation

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Make globally available
npm link
```

## 🎮 Usage

### Basic Dialogue Pipe

Create a dialogue between two AI agents:

```bash
# Basic dialogue
aichat pipe chatgpt claude

# With options
aichat pipe chatgpt claude --start-with chatgpt --rounds 5 --delay 2000

# With custom session name
aichat pipe chatgpt claude --name "Philosophy Debate" --no-streaming
```

**Options:**
- `--start-with <agent>`: Which agent starts (agent1 or agent2)
- `--rounds <number>`: Maximum number of rounds
- `--delay <ms>`: Delay between turns in milliseconds
- `--name <name>`: Session name
- `--no-streaming`: Disable real-time streaming
- `--headless`: Run in headless mode (no TUI)

### Multi-Agent Dialogue

Create a round-robin dialogue with 3+ agents:

```bash
# 3-agent dialogue
aichat multi chatgpt claude perplexity

# With synthesis strategy
aichat multi chatgpt claude perplexity deepseek --strategy weighted --rounds 8

# With custom configuration
aichat multi chatgpt claude perplexity --name "AI Ethics Panel" --delay 1500
```

**Options:**
- `--rounds <number>`: Maximum number of rounds
- `--delay <ms>`: Delay between turns
- `--strategy <strategy>`: Context synthesis strategy (recent, all, weighted)
- `--name <name>`: Session name
- `--no-streaming`: Disable real-time streaming

### Interjections

Add interjections to modify the conversation:

```bash
# Basic interjection
aichat interject "What are the ethical implications?"

# Targeted interjection
aichat interject "Can you elaborate on that point?" --target A --priority high

# Different types
aichat interject "Let's focus on practical applications" --type direction --target both
```

**Options:**
- `--target <target>`: Target agent (A, B, or both)
- `--priority <priority>`: Priority (low, medium, high)
- `--type <type>`: Type (side_question, correction, direction, pause, resume)

### Session Control

Control active dialogues:

```bash
# Pause dialogue
aichat pause

# Resume dialogue
aichat resume

# Stop dialogue
aichat stop
```

### Session Management

Manage saved sessions:

```bash
# List all sessions
aichat sessions --list

# Export session
aichat sessions --export session-id

# Import session
aichat sessions --import session.json

# Delete session
aichat sessions --delete session-id
```

### Session Replay

Replay saved sessions:

```bash
# Replay with normal speed
aichat replay session-id

# Replay with different speeds
aichat replay session-id --speed fast
aichat replay session-id --speed slow
aichat replay session-id --speed instant
```

### Session Monitoring

Monitor active sessions and system status:

```bash
# Open session monitor
aichat monitor
```

## 🖥️ TUI Features

### Rich Interface

The CLI includes a rich terminal user interface with:

- **Real-time streaming**: Live conversation display
- **Split-pane layout**: Chat, logs, and stats views
- **Progress indicators**: Visual feedback for operations
- **Color-coded output**: Different colors for different message types
- **Auto-scroll**: Automatic scrolling for long conversations

### Navigation

- **TAB**: Switch between chat, logs, and stats tabs
- **↑↓**: Navigate through sessions in monitor mode
- **←→**: Navigate through exchanges in replay mode
- **Home/End**: Jump to beginning/end in replay mode

### Controls

- **ESC**: Exit current view
- **Ctrl+P**: Pause/Resume dialogue
- **Ctrl+S**: Stop dialogue
- **Ctrl+I**: Add interjection
- **Ctrl+M**: Send message
- **Space**: Play/Pause replay
- **Ctrl+C**: Toggle controls display

## 📊 Session Persistence

### Automatic Saving

Sessions are automatically saved with:

- **Exchange history**: All messages and responses
- **Interjections**: Applied and pending interjections
- **Metadata**: Timing, tokens, and performance data
- **Configuration**: Dialogue settings and parameters

### Export/Import

Sessions can be exported and imported:

```bash
# Export to JSON
aichat sessions --export session-id > my-session.json

# Import from JSON
aichat sessions --import my-session.json
```

### Replay Functionality

Full replay support with:

- **Multiple speeds**: slow, normal, fast, instant
- **Navigation**: Forward/backward through exchanges
- **Progress tracking**: Visual progress indicators
- **Metadata display**: Timing and performance data

## 🎯 Examples

### Philosophy Debate

```bash
# Start a philosophy debate
aichat pipe chatgpt claude --name "Philosophy Debate" --rounds 10

# Add interjection during debate
aichat interject "How does this relate to modern technology?"

# Pause to think
aichat pause

# Resume debate
aichat resume
```

### AI Ethics Panel

```bash
# Start multi-agent ethics discussion
aichat multi chatgpt claude perplexity --name "AI Ethics Panel" --strategy weighted

# Monitor the discussion
aichat monitor

# Replay the discussion later
aichat replay session-id --speed normal
```

### Research Discussion

```bash
# Start research discussion
aichat pipe perplexity deepseek --name "Research Discussion" --delay 3000

# Add research questions
aichat interject "What are the latest developments in this field?" --priority high

# Export for later analysis
aichat sessions --export session-id > research-discussion.json
```

## 🔧 Configuration

### Environment Variables

```bash
# Session storage path
export CHATPIPES_SESSIONS_PATH="./sessions"

# Auto-save interval (ms)
export CHATPIPES_AUTO_SAVE_INTERVAL=30000

# Max log entries per session
export CHATPIPES_MAX_LOG_ENTRIES=1000
```

### Configuration File

Create `~/.chatpipes/config.json`:

```json
{
  "sessions": {
    "storagePath": "./sessions",
    "autoSave": true,
    "saveInterval": 30000,
    "maxLogEntries": 1000
  },
  "ui": {
    "theme": "dark",
    "autoScroll": true,
    "showTimestamps": true
  },
  "agents": {
    "defaultTemperature": 0.7,
    "defaultMaxTokens": 1000
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**Session not found:**
```bash
# Check available sessions
aichat sessions --list

# Verify session ID
aichat sessions --export session-id
```

**TUI not displaying correctly:**
```bash
# Check terminal size
echo $COLUMNS x $LINES

# Try headless mode
aichat pipe chatgpt claude --headless
```

**Performance issues:**
```bash
# Reduce auto-save frequency
export CHATPIPES_AUTO_SAVE_INTERVAL=60000

# Limit log entries
export CHATPIPES_MAX_LOG_ENTRIES=500
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=chatpipes:*

# Run with debug output
aichat pipe chatgpt claude --headless
```

## 📈 Performance

### Optimization Tips

- **Use headless mode** for automated scripts
- **Disable streaming** for faster execution
- **Limit rounds** for quick testing
- **Use instant replay** for fast playback
- **Clean old sessions** regularly

### Resource Usage

- **Memory**: ~50MB per active session
- **Storage**: ~1KB per exchange
- **CPU**: Minimal for TUI, moderate for browser automation
- **Network**: Only for browser-based agents

## 🤝 Contributing

### Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Adding New Features

1. **Commands**: Add to `src/index.ts`
2. **Components**: Create in `src/components/`
3. **Types**: Update shared types package
4. **Tests**: Add test coverage

## 📄 License

MIT License - see LICENSE file for details.

---

**ChatPipes CLI**: Where AI conversations come to life in the terminal! 🎉 