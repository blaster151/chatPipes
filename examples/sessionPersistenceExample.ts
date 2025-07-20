import { 
  SessionManager,
  DialoguePipe,
  MultiAgentDialogue,
  BrowserAgentSession,
  PersonaConfig,
  Spectator
} from '@chatpipes/ai-conductor';
import { v4 as uuidv4 } from 'uuid';

// Example 1: Basic session persistence with DialoguePipe
async function basicSessionPersistenceExample() {
  console.log('💾 Starting Basic Session Persistence Example...');

  // Create session manager
  const sessionManager = new SessionManager({
    storagePath: './sessions',
    autoSave: true,
    saveInterval: 10000, // Save every 10 seconds
    maxLogEntries: 500
  });

  await sessionManager.init();

  // Create personas
  const philosopher: PersonaConfig = {
    name: 'Philosopher',
    description: 'A deep-thinking philosopher',
    instructions: 'You are a philosopher who thinks deeply about ethical and moral questions.',
    introPrompt: 'You are Socrates, engaging in philosophical dialogue.',
    behaviorStyle: 'contemplative and questioning',
    temperature: 0.8
  };

  const scientist: PersonaConfig = {
    name: 'Scientist',
    description: 'A practical scientist',
    instructions: 'You are a scientist who values evidence and practical solutions.',
    introPrompt: 'You are a research scientist focused on empirical evidence.',
    behaviorStyle: 'analytical and evidence-based',
    temperature: 0.6
  };

  // Create mock agent sessions
  const agentA = new BrowserAgentSession('chatgpt', philosopher, {}, { useBrowser: false });
  const agentB = new BrowserAgentSession('claude', scientist, {}, { useBrowser: false });

  // Create DialoguePipe with session manager
  const dialogue = new DialoguePipe(agentA, agentB, {
    maxRounds: 3,
    turnDelay: 1000,
    enableStreaming: true,
    sessionManager,
    sessionName: 'Philosophy vs Science Debate'
  });

  // Add spectator for live logging
  const loggingSpectator: Spectator = {
    id: 'logging-1',
    type: 'cli',
    name: 'Logging Observer',
    onTurnEvent: (event) => {
      console.log(`📝 [${event.round}] ${event.agentName}: ${event.message?.substring(0, 80)}...`);
    },
    onDialogueEvent: (event) => {
      console.log(`📊 Event: ${event.type}`);
    },
    onError: (error) => {
      console.error(`❌ Error: ${error.message}`);
    }
  };

  dialogue.addSpectator(loggingSpectator);

  // Add interjection
  const interjection = {
    id: uuidv4(),
    type: 'side_question' as const,
    text: 'How does this relate to modern AI development?',
    target: 'both' as const,
    priority: 'medium' as const,
    timestamp: new Date()
  };

  dialogue.addInterjection(interjection);

  // Run dialogue
  try {
    await dialogue.runLoopUntilStopped();
    
    // Export session
    const exportedSession = dialogue.exportSession();
    if (exportedSession) {
      console.log('\n📄 Exported Session JSON:');
      console.log(exportedSession.substring(0, 500) + '...');
    }
    
    // Get session stats
    const stats = dialogue.getSessionStats();
    if (stats) {
      console.log('\n📊 Session Statistics:');
      console.log(`Total Exchanges: ${stats.totalExchanges}`);
      console.log(`Total Interjections: ${stats.totalInterjections}`);
      console.log(`Average Response Length: ${Math.round(stats.averageResponseLength)} chars`);
      console.log(`Total Duration: ${stats.totalDuration}ms`);
    }
    
  } catch (error) {
    console.error('Dialogue error:', error);
  }

  await sessionManager.close();
}

// Example 2: Session replay functionality
async function sessionReplayExample() {
  console.log('🔄 Starting Session Replay Example...');

  const sessionManager = new SessionManager({
    storagePath: './sessions',
    autoSave: false
  });

  await sessionManager.init();

  // Create a session with some exchanges
  const session = sessionManager.createSession(
    'Sample Debate',
    'dialogue',
    [
      {
        id: 'agent1',
        name: 'Debater A',
        persona: {
          name: 'Debater A',
          description: 'A skilled debater',
          instructions: 'You are a skilled debater.',
          introPrompt: 'You are a debate champion.',
          behaviorStyle: 'persuasive',
          temperature: 0.7
        },
        platform: 'chatgpt'
      },
      {
        id: 'agent2',
        name: 'Debater B',
        persona: {
          name: 'Debater B',
          description: 'A critical thinker',
          instructions: 'You are a critical thinker.',
          introPrompt: 'You are a critical analyst.',
          behaviorStyle: 'analytical',
          temperature: 0.6
        },
        platform: 'claude'
      }
    ]
  );

  // Add some sample exchanges
  sessionManager.addExchange(
    session.id,
    'Debater A',
    'Debater B',
    'What is your position on AI regulation?',
    'I believe we need comprehensive AI regulation to ensure safety and ethical use. The rapid advancement of AI technology requires careful oversight.',
    1,
    { duration: 2000, tokens: 150 }
  );

  sessionManager.addExchange(
    session.id,
    'Debater B',
    'Debater A',
    'How do you propose we implement such regulation?',
    'I propose a multi-stakeholder approach involving government, industry, and academia. We need clear guidelines for AI development and deployment.',
    2,
    { duration: 1800, tokens: 140 }
  );

  sessionManager.addExchange(
    session.id,
    'Debater A',
    'Debater B',
    'What about the risk of over-regulation stifling innovation?',
    'That\'s a valid concern. We need to balance safety with innovation. The key is to create flexible frameworks that adapt to technological changes.',
    3,
    { duration: 2200, tokens: 160 }
  );

  // Start replay
  console.log('\n🎬 Starting replay...');
  const replay = sessionManager.startReplay(session.id, 'normal');
  
  // Add replay spectator
  const replaySpectator: Spectator = {
    id: 'replay-1',
    type: 'cli',
    name: 'Replay Observer',
    onTurnEvent: (event) => {
      // This won't be called during replay, but we'll see replay events
    },
    onDialogueEvent: (event) => {
      // This won't be called during replay, but we'll see replay events
    },
    onError: (error) => {
      console.error(`Replay error: ${error.message}`);
    }
  };

  // Listen for replay events
  sessionManager.on('replay_started', (replay) => {
    console.log(`🎬 Replay started: ${replay.replayId}`);
  });

  sessionManager.on('replay_exchange', (data) => {
    const { exchange, index } = data;
    console.log(`📺 [${index + 1}] ${exchange.from} → ${exchange.to}: ${exchange.response.substring(0, 60)}...`);
  });

  sessionManager.on('replay_completed', (replay) => {
    console.log(`✅ Replay completed: ${replay.replayId}`);
  });

  // Play the replay
  await sessionManager.playReplay(replay.replayId);

  await sessionManager.close();
}

// Example 3: Live logging and monitoring
async function liveLoggingExample() {
  console.log('📊 Starting Live Logging Example...');

  const sessionManager = new SessionManager({
    storagePath: './sessions',
    maxLogEntries: 100
  });

  await sessionManager.init();

  // Create a session
  const session = sessionManager.createSession(
    'Live Logging Demo',
    'multi-agent',
    [
      {
        id: 'agent1',
        name: 'Agent Alpha',
        persona: {
          name: 'Agent Alpha',
          description: 'An AI agent',
          instructions: 'You are an AI agent.',
          introPrompt: 'You are Agent Alpha.',
          behaviorStyle: 'helpful',
          temperature: 0.7
        },
        platform: 'chatgpt'
      }
    ]
  );

  // Add various log entries
  sessionManager.addLogEntry(session.id, 'info', 'system', 'Session initialized');
  sessionManager.addLogEntry(session.id, 'info', 'turn', 'Agent Alpha started turn 1');
  sessionManager.addLogEntry(session.id, 'warning', 'system', 'Response time exceeded threshold');
  sessionManager.addLogEntry(session.id, 'info', 'interjection', 'User added side question');
  sessionManager.addLogEntry(session.id, 'error', 'error', 'Network connection lost');
  sessionManager.addLogEntry(session.id, 'info', 'system', 'Connection restored');

  // Get live logs
  const logs = sessionManager.getLiveLogs(session.id);
  console.log('\n📋 Live Logs:');
  logs.forEach(log => {
    const timestamp = log.timestamp.toLocaleTimeString();
    const level = log.level.toUpperCase().padEnd(5);
    const category = log.category.padEnd(12);
    console.log(`[${timestamp}] ${level} [${category}] ${log.message}`);
  });

  // Get logs by level
  const errorLogs = logs.filter(log => log.level === 'error');
  const warningLogs = logs.filter(log => log.level === 'warning');
  
  console.log(`\n📈 Log Summary:`);
  console.log(`Total Logs: ${logs.length}`);
  console.log(`Errors: ${errorLogs.length}`);
  console.log(`Warnings: ${warningLogs.length}`);

  await sessionManager.close();
}

// Example 4: Import/Export functionality
async function importExportExample() {
  console.log('📦 Starting Import/Export Example...');

  const sessionManager = new SessionManager({
    storagePath: './sessions'
  });

  await sessionManager.init();

  // Create a session
  const originalSession = sessionManager.createSession(
    'Export Test',
    'dialogue',
    [
      {
        id: 'agent1',
        name: 'Test Agent',
        persona: {
          name: 'Test Agent',
          description: 'A test agent',
          instructions: 'You are a test agent.',
          introPrompt: 'You are a test agent.',
          behaviorStyle: 'test',
          temperature: 0.5
        },
        platform: 'chatgpt'
      }
    ]
  );

  // Add some exchanges
  sessionManager.addExchange(
    originalSession.id,
    'Test Agent',
    'User',
    'Hello, how are you?',
    'I am doing well, thank you for asking!',
    1
  );

  sessionManager.addExchange(
    originalSession.id,
    'User',
    'Test Agent',
    'What is your favorite color?',
    'I don\'t have personal preferences, but I find blue to be quite pleasant.',
    2
  );

  // Export the session
  const exportedJson = sessionManager.exportSession(originalSession.id);
  console.log('\n📄 Exported Session:');
  console.log(exportedJson.substring(0, 300) + '...');

  // Create a new session manager and import
  const newSessionManager = new SessionManager({
    storagePath: './sessions-import'
  });
  await newSessionManager.init();

  // Import the session
  const importedSession = newSessionManager.importSession(exportedJson);
  console.log(`\n✅ Imported Session: ${importedSession.name} (ID: ${importedSession.id})`);
  console.log(`Exchanges: ${importedSession.exchanges.length}`);
  console.log(`Agents: ${importedSession.agents.length}`);

  // Verify the imported session
  const importedExchanges = importedSession.exchanges;
  console.log('\n🔍 Imported Exchanges:');
  importedExchanges.forEach((exchange, index) => {
    console.log(`${index + 1}. ${exchange.from} → ${exchange.to}: ${exchange.response.substring(0, 50)}...`);
  });

  await sessionManager.close();
  await newSessionManager.close();
}

// Example 5: Multi-agent session with persistence
async function multiAgentSessionExample() {
  console.log('🔷 Starting Multi-Agent Session Example...');

  const sessionManager = new SessionManager({
    storagePath: './sessions',
    autoSave: true
  });

  await sessionManager.init();

  // Create personas for 3 agents
  const ethicist: PersonaConfig = {
    name: 'Ethicist',
    description: 'An AI ethics expert',
    instructions: 'You are an expert in AI ethics.',
    introPrompt: 'You are an AI ethics researcher.',
    behaviorStyle: 'morally conscious',
    temperature: 0.7
  };

  const technologist: PersonaConfig = {
    name: 'Technologist',
    description: 'A technology innovator',
    instructions: 'You are a technology innovator.',
    introPrompt: 'You are a tech entrepreneur.',
    behaviorStyle: 'innovative',
    temperature: 0.8
  };

  const policymaker: PersonaConfig = {
    name: 'Policymaker',
    description: 'A government policy expert',
    instructions: 'You are a policy expert.',
    introPrompt: 'You are a government official.',
    behaviorStyle: 'pragmatic',
    temperature: 0.6
  };

  // Create agent sessions
  const agent1 = new BrowserAgentSession('chatgpt', ethicist, {}, { useBrowser: false });
  const agent2 = new BrowserAgentSession('claude', technologist, {}, { useBrowser: false });
  const agent3 = new BrowserAgentSession('perplexity', policymaker, {}, { useBrowser: false });

  // Create MultiAgentDialogue with session manager
  const multiDialogue = new MultiAgentDialogue([agent1, agent2, agent3], {
    maxRounds: 3,
    turnDelay: 1000,
    synthesisStrategy: 'recent'
  });

  // Add spectator for monitoring
  const monitoringSpectator: Spectator = {
    id: 'monitoring-1',
    type: 'ui',
    name: 'Monitoring Observer',
    onTurnEvent: (event) => {
      console.log(`🎯 [${event.round}] ${event.agentName}: ${event.message?.substring(0, 60)}...`);
      
      // Add to session manager manually (since MultiAgentDialogue doesn't have built-in integration yet)
      if (sessionManager) {
        const session = sessionManager.getAllSessions().find(s => s.name.includes('Multi-Agent'));
        if (session && event.message) {
          sessionManager.addExchange(
            session.id,
            event.agentName,
            'Other Agents',
            'Context prompt',
            event.message,
            event.round
          );
        }
      }
    },
    onDialogueEvent: (event) => {
      console.log(`📡 Multi-Agent Event: ${event.type}`);
    },
    onError: (error) => {
      console.error(`🚨 Multi-Agent Error: ${error.message}`);
    }
  };

  multiDialogue.addSpectator(monitoringSpectator);

  // Run the dialogue
  try {
    await multiDialogue.runLoopUntilStopped();
    
    // Get all sessions
    const allSessions = sessionManager.getAllSessions();
    console.log(`\n📊 Total Sessions: ${allSessions.length}`);
    
    allSessions.forEach(session => {
      console.log(`- ${session.name}: ${session.exchanges.length} exchanges, ${session.interjections.length} interjections`);
    });
    
  } catch (error) {
    console.error('Multi-agent dialogue error:', error);
  }

  await sessionManager.close();
}

// Main function to run all examples
async function runAllPersistenceExamples() {
  console.log('🚀 ChatPipes Session Persistence Examples\n');
  
  try {
    await basicSessionPersistenceExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await sessionReplayExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await liveLoggingExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await importExportExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await multiAgentSessionExample();
    
    console.log('\n✅ All persistence examples completed successfully!');
  } catch (error) {
    console.error('❌ Persistence example execution failed:', error);
  }
}

// Export for use in other files
export {
  basicSessionPersistenceExample,
  sessionReplayExample,
  liveLoggingExample,
  importExportExample,
  multiAgentSessionExample,
  runAllPersistenceExamples
};

// Run if this file is executed directly
if (require.main === module) {
  runAllPersistenceExamples();
} 