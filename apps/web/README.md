# ChatPipes Web UI

A modern React web application for AI conversation orchestration with real-time messaging, persona management, and session persistence.

## 🚀 Features

### 🎮 **Session Management**
- **Start/Pause/Resume**: Full control over dialogue sessions
- **Real-time Status**: Live updates on session state and progress
- **Session History**: View and manage all past conversations
- **Export/Import**: Download sessions as JSON or import existing ones

### 👥 **Persona Management**
- **Visual Editor**: Drag-and-drop persona creation and editing
- **Color Coding**: Assign unique colors and avatars to each agent
- **Platform Support**: ChatGPT, Claude, Perplexity, DeepSeek
- **Behavior Customization**: Temperature, instructions, intro prompts

### 💬 **Real-time Messaging**
- **Live Streaming**: Real-time message updates with auto-scroll
- **Split Panes**: Chat bubbles and conversation flow
- **Message Types**: Distinguish between messages, interjections, and system events
- **Agent Avatars**: Visual representation with platform icons

### 💡 **Interjection System**
- **Smart Input**: Context-aware interjection suggestions
- **Target Selection**: Send to specific agents or both
- **Priority Levels**: Low, medium, high priority interjections
- **Quick Actions**: Pre-built interjection templates

### ⚙️ **Pipeline Configuration**
- **Dialogue Types**: Two-agent pipes or multi-agent round-robin
- **Synthesis Strategies**: Recent, all, or weighted context building
- **Performance Tuning**: Turn delays, round limits, streaming options
- **Visual Config**: Intuitive UI for complex dialogue settings

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎯 Usage

### Starting a New Dialogue

1. **Click "New Dialogue"** on the main page
2. **Configure Pipeline** settings (type, rounds, delays)
3. **Edit Personas** for each agent (optional)
4. **Start the Dialogue** and watch real-time conversation

### Managing Sessions

```typescript
// View all sessions
GET /api/sessions

// Create new session
POST /api/sessions
{
  "name": "Philosophy Debate",
  "type": "pipe",
  "agents": [...],
  "config": {...}
}

// Export session
GET /api/sessions/{id}/export

// Import session
POST /api/sessions (with JSON body)
```

### Adding Interjections

```typescript
// Add interjection during dialogue
POST /api/dialogue/{id}/start
{
  "action": "interjection",
  "text": "What are the ethical implications?",
  "target": "both",
  "priority": "high",
  "type": "side_question"
}
```

## 🏗️ Architecture

### **Frontend Components**

#### **Core Components**
- `DialogueInterface`: Main conversation interface
- `MessageBubble`: Individual message display
- `AgentAvatar`: Agent representation with colors
- `InterjectionInput`: Smart interjection interface
- `PersonaEditor`: Visual persona management
- `PipelineConfig`: Dialogue configuration

#### **State Management**
- **React Hooks**: Local component state
- **API Integration**: Server communication
- **Real-time Updates**: WebSocket-like updates
- **Session Persistence**: Local storage and server sync

### **Backend API Routes**

#### **Session Management**
```typescript
// /api/sessions
GET    - List all sessions
POST   - Create new session

// /api/sessions/[id]
GET    - Get session details
PUT    - Update session
DELETE - Delete session

// /api/sessions/[id]/export
GET    - Export session as JSON
```

#### **Dialogue Control**
```typescript
// /api/dialogue
POST   - Start new dialogue

// /api/dialogue/[id]
GET    - Get dialogue status
POST   - Control dialogue (start/pause/resume/interject)
DELETE - Stop and remove dialogue
```

### **Data Flow**

1. **User Action** → React Component
2. **API Call** → Next.js API Route
3. **TypeScript Library** → AI Conductor Package
4. **Response** → Real-time UI Update

## 🎨 UI/UX Features

### **Visual Design**
- **Modern Interface**: Clean, intuitive design
- **Color Coding**: Distinct colors for each agent
- **Responsive Layout**: Works on desktop and mobile
- **Dark/Light Mode**: Automatic theme detection

### **Interactive Elements**
- **Drag & Drop**: Persona management
- **Real-time Feedback**: Loading states and animations
- **Keyboard Shortcuts**: Power user controls
- **Tooltips**: Helpful guidance throughout

### **Accessibility**
- **Screen Reader Support**: ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Clear visual hierarchy
- **Focus Management**: Logical tab order

## 🔧 Configuration

### **Environment Variables**

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Session Storage
NEXT_PUBLIC_SESSION_STORAGE=local
NEXT_PUBLIC_AUTO_SAVE_INTERVAL=30000

# UI Configuration
NEXT_PUBLIC_THEME=auto
NEXT_PUBLIC_ANIMATIONS=enabled
```

### **Customization**

#### **Theme Colors**
```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  --accent-color: #f59e0b;
  --error-color: #ef4444;
}
```

#### **Agent Colors**
```typescript
const platformColors = {
  chatgpt: '#10a37f',
  claude: '#ff6b35',
  perplexity: '#6366f1',
  deepseek: '#059669'
};
```

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Mobile Features**
- **Touch-friendly**: Large touch targets
- **Swipe gestures**: Navigation and controls
- **Optimized layout**: Stacked components
- **Offline support**: Service worker caching

## 🔒 Security

### **API Security**
- **Input Validation**: Server-side validation
- **Rate Limiting**: Prevent abuse
- **CORS Configuration**: Cross-origin protection
- **Authentication**: Session-based auth (future)

### **Data Protection**
- **Local Storage**: Encrypted session data
- **HTTPS Only**: Secure communication
- **Input Sanitization**: XSS prevention
- **Content Security Policy**: CSP headers

## 🧪 Testing

### **Component Testing**
```bash
# Run component tests
npm run test:components

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### **Test Coverage**
- **Unit Tests**: Individual component testing
- **Integration Tests**: API route testing
- **E2E Tests**: Full user workflow testing
- **Visual Regression**: UI consistency testing

## 🚀 Deployment

### **Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Environment Setup**
```bash
# Production environment
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.chatpipes.com
NEXT_PUBLIC_WS_URL=wss://ws.chatpipes.com
```

## 🔮 Future Features

### **Planned Enhancements**
- **Real-time Collaboration**: Multiple users in same session
- **Voice Integration**: Speech-to-text and text-to-speech
- **Advanced Analytics**: Conversation insights and metrics
- **Plugin System**: Extensible agent capabilities
- **Mobile App**: Native iOS/Android applications

### **AI Enhancements**
- **Multi-modal**: Image and video support
- **Memory Systems**: Long-term conversation memory
- **Emotion Detection**: Sentiment analysis and response
- **Custom Models**: Fine-tuned model support

## 🤝 Contributing

### **Development Setup**
```bash
# Clone repository
git clone https://github.com/chatpipes/web.git

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

## 📄 License

MIT License - see LICENSE file for details.

---

**ChatPipes Web UI**: Where AI conversations come to life in the browser! 🎉 