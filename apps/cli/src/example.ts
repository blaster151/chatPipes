#!/usr/bin/env node

import { 
  DialoguePipe, 
  SessionManager,
  BrowserAgentSession,
  PersonaConfig,
  Spectator
} from '@chatpipes/ai-conductor';

// Simple example to test CLI functionality
async function testCLI() {
  console.log('🧪 Testing CLI functionality...');

  // Initialize session manager
  const sessionManager = new SessionManager({
    storagePath: './test-sessions',
    autoSave: true
  });
  await sessionManager.init();

  // Create personas
  const gptPersona: PersonaConfig = {
    name: 'GPT Agent',
    description: 'A ChatGPT agent',
    instructions: 'You are a helpful AI assistant. Keep responses concise.',
    introPrompt: 'You are a helpful AI assistant.',
    behaviorStyle: 'helpful and concise',
    temperature: 0.7
  };

  const claudePersona: PersonaConfig = {
    name: 'Claude Agent',
    description: 'A Claude agent',
    instructions: 'You are a helpful AI assistant. Provide thoughtful responses.',
    introPrompt: 'You are a helpful AI assistant.',
    behaviorStyle: 'thoughtful and detailed',
    temperature: 0.7
  };

  // Create mock agent sessions (no browser)
  const gptSession = new BrowserAgentSession('chatgpt', gptPersona, {}, { useBrowser: false });
  const claudeSession = new BrowserAgentSession('claude', claudePersona, {}, { useBrowser: false });

  // Create dialogue pipe
  const dialogue = new DialoguePipe(gptSession, claudeSession, {
    maxRounds: 3,
    turnDelay: 1000,
    enableStreaming: true,
    sessionManager,
    sessionName: 'CLI Test Dialogue'
  });

  // Set who starts
  dialogue.setWhoStarts('A');

  // Add spectator
  const spectator: Spectator = {
    id: 'test-spectator',
    type: 'cli',
    name: 'Test Observer',
    onTurnEvent: (event) => {
      if (event.type === 'turn_start') {
        console.log(`🔄 ${event.agentName} is thinking...`);
      } else if (event.type === 'turn_end' && event.message) {
        console.log(`💬 ${event.agentName}: ${event.message}`);
      }
    },
    onDialogueEvent: (event) => {
      console.log(`📢 Event: ${event.type}`);
    },
    onError: (error) => {
      console.error(`❌ Error: ${error.message}`);
    }
  };

  dialogue.addSpectator(spectator);

  // Add interjection
  const interjection = {
    id: 'test-interjection',
    type: 'side_question' as const,
    text: 'What are the ethical implications?',
    target: 'both' as const,
    priority: 'medium' as const,
    timestamp: new Date()
  };

  dialogue.addInterjection(interjection);

  console.log('🚀 Starting test dialogue...');
  
  try {
    await dialogue.runLoopUntilStopped();
    
    console.log('\n✅ Test completed successfully!');
    
    // Export session
    const exported = dialogue.exportSession();
    if (exported) {
      console.log('\n📄 Session exported successfully');
    }
    
    // Get stats
    const stats = dialogue.getSessionStats();
    if (stats) {
      console.log('\n📊 Session Statistics:');
      console.log(`Total Exchanges: ${stats.totalExchanges}`);
      console.log(`Total Interjections: ${stats.totalInterjections}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  await sessionManager.close();
}

// Run test if this file is executed directly
if (require.main === module) {
  testCLI().catch(console.error);
}

export { testCLI }; 