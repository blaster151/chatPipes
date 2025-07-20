import { 
  AgentSession, 
  DialoguePipe, 
  ObservabilityManager,
  DialogueExchange,
  ReplayOptions 
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Basic Observability - Recording Exchanges
 */
async function basicObservabilityExample() {
  console.log('📊 Example 1: Basic Observability - Recording Exchanges\n');

  const observabilityManager = new ObservabilityManager({
    enableReplay: true,
    maxHistorySize: 1000,
    persistToFile: true,
    filePath: './observability-data.json',
    autoSaveInterval: 10000,
    enableLiveStreaming: true
  });

  // Listen for exchange events
  observabilityManager.on('exchange', (exchange: DialogueExchange) => {
    console.log(`📝 Exchange recorded: ${exchange.from} → ${exchange.to} (Round ${exchange.round})`);
  });

  observabilityManager.on('exchange_recorded', (data) => {
    console.log(`💾 Total exchanges: ${data.totalExchanges}`);
  });

  // Create sample exchanges
  const sampleExchanges: DialogueExchange[] = [
    {
      id: 'exchange-1',
      from: 'GPT',
      to: 'Claude',
      prompt: 'What is the meaning of life?',
      response: 'The meaning of life is a philosophical question that has been debated for centuries...',
      round: 1,
      timestamp: new Date(),
      metadata: {
        duration: 2500,
        tokens: 150,
        platform: 'chatgpt',
        model: 'gpt-4',
        interjectionId: undefined
      }
    },
    {
      id: 'exchange-2',
      from: 'Claude',
      to: 'GPT',
      prompt: 'How does this relate to artificial intelligence?',
      response: 'Artificial intelligence raises similar existential questions about consciousness and purpose...',
      round: 1,
      timestamp: new Date(),
      metadata: {
        duration: 3000,
        tokens: 200,
        platform: 'claude',
        model: 'claude-3',
        interjectionId: 'interjection-1'
      }
    }
  ];

  // Record exchanges
  sampleExchanges.forEach(exchange => {
    observabilityManager.recordExchange(exchange);
  });

  // Get statistics
  const stats = observabilityManager.getStats();
  console.log('\n📊 Observability Statistics:');
  console.log(`Total Exchanges: ${stats.totalExchanges}`);
  console.log(`Active Replays: ${stats.activeReplays}`);
  console.log(`Replay Sessions: ${stats.replaySessions}`);

  return observabilityManager;
}

/**
 * Example 2: Replay Session Creation and Management
 */
async function replaySessionExample(observabilityManager: ObservabilityManager) {
  console.log('\n🎬 Example 2: Replay Session Creation and Management\n');

  // Get all exchanges
  const exchanges = observabilityManager.getAllExchanges();
  console.log(`Creating replay session with ${exchanges.length} exchanges`);

  // Create replay session with different options
  const replayOptions: ReplayOptions = {
    speed: 'normal',
    enableInterjections: true,
    enableMetadata: true,
    autoAdvance: true,
    loop: false,
    sessionName: 'Philosophy Discussion Replay'
  };

  const sessionId = observabilityManager.createReplaySession(exchanges, replayOptions);
  console.log(`Replay session created: ${sessionId}`);

  // Get replay session
  const session = observabilityManager.getReplaySession(sessionId);
  if (session) {
    console.log('\n📋 Replay Session Details:');
    console.log(`Session ID: ${session.id}`);
    console.log(`Session Name: ${session.metadata.sessionName}`);
    console.log(`Total Exchanges: ${session.metadata.totalExchanges}`);
    console.log(`Agent Count: ${session.metadata.agentCount}`);
    console.log(`Start Time: ${session.metadata.startTime.toLocaleString()}`);
    console.log(`End Time: ${session.metadata.endTime?.toLocaleString() || 'Ongoing'}`);
    console.log(`Speed: ${session.config.speed}`);
    console.log(`Auto Advance: ${session.config.autoAdvance}`);
    console.log(`Loop: ${session.config.loop}`);
  }

  return sessionId;
}

/**
 * Example 3: Replay Control and Events
 */
async function replayControlExample(observabilityManager: ObservabilityManager, sessionId: string) {
  console.log('\n🎮 Example 3: Replay Control and Events\n');

  // Listen for replay events
  observabilityManager.on('replay_started', (data) => {
    console.log(`🎬 Replay started: ${data.sessionId}`);
  });

  observabilityManager.on('replay_exchange', (event) => {
    console.log(`📺 Replay exchange ${event.index + 1}: ${event.exchange?.from} → ${event.exchange?.to}`);
  });

  observabilityManager.on('replay_playing', (data) => {
    console.log(`▶️  Replay playing: ${data.sessionId}`);
  });

  observabilityManager.on('replay_paused', (data) => {
    console.log(`⏸️  Replay paused: ${data.sessionId}`);
  });

  observabilityManager.on('replay_completed', (data) => {
    console.log(`✅ Replay completed: ${data.sessionId}`);
  });

  // Start replay
  console.log('Starting replay...');
  await observabilityManager.startReplay(sessionId);

  // Simulate replay control
  setTimeout(() => {
    console.log('\nPausing replay...');
    observabilityManager.pauseReplay(sessionId);
  }, 2000);

  setTimeout(() => {
    console.log('Resuming replay...');
    observabilityManager.resumeReplay(sessionId);
  }, 4000);

  setTimeout(() => {
    console.log('Jumping to exchange 0...');
    observabilityManager.jumpToExchange(sessionId, 0);
  }, 6000);

  setTimeout(() => {
    console.log('Stopping replay...');
    observabilityManager.stopReplay(sessionId);
  }, 8000);
}

/**
 * Example 4: Filtering and Querying Exchanges
 */
async function filteringExample(observabilityManager: ObservabilityManager) {
  console.log('\n🔍 Example 4: Filtering and Querying Exchanges\n');

  // Add more exchanges for filtering
  const additionalExchanges: DialogueExchange[] = [
    {
      id: 'exchange-3',
      from: 'GPT',
      to: 'Claude',
      prompt: 'What about machine learning?',
      response: 'Machine learning is a subset of AI that focuses on algorithms...',
      round: 2,
      timestamp: new Date(),
      metadata: {
        duration: 1800,
        tokens: 120,
        platform: 'chatgpt',
        model: 'gpt-4'
      }
    },
    {
      id: 'exchange-4',
      from: 'Claude',
      to: 'GPT',
      prompt: 'How does this affect society?',
      response: 'The societal impact of AI and ML is profound and multifaceted...',
      round: 2,
      timestamp: new Date(),
      metadata: {
        duration: 3500,
        tokens: 250,
        platform: 'claude',
        model: 'claude-3',
        interjectionId: 'interjection-2'
      }
    }
  ];

  additionalExchanges.forEach(exchange => {
    observabilityManager.recordExchange(exchange);
  });

  // Filter exchanges
  console.log('🔍 Filtering Examples:');

  // By agent
  const gptExchanges = observabilityManager.getExchangesByFilter({ agentId: 'GPT' });
  console.log(`Exchanges involving GPT: ${gptExchanges.length}`);

  // By round
  const round1Exchanges = observabilityManager.getExchangesByFilter({ round: 1 });
  console.log(`Round 1 exchanges: ${round1Exchanges.length}`);

  // With interjections
  const interjectionExchanges = observabilityManager.getExchangesByFilter({ hasInterjection: true });
  console.log(`Exchanges with interjections: ${interjectionExchanges.length}`);

  // By time range
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recentExchanges = observabilityManager.getExchangesByFilter({ 
    startTime: oneHourAgo,
    endTime: now 
  });
  console.log(`Recent exchanges (last hour): ${recentExchanges.length}`);

  // All exchanges
  const allExchanges = observabilityManager.getAllExchanges();
  console.log(`Total exchanges: ${allExchanges.length}`);
}

/**
 * Example 5: Export and Import Replay Sessions
 */
async function exportImportExample(observabilityManager: ObservabilityManager) {
  console.log('\n📤 Example 5: Export and Import Replay Sessions\n');

  // Create a replay session
  const exchanges = observabilityManager.getAllExchanges();
  const sessionId = observabilityManager.createReplaySession(exchanges, {
    sessionName: 'Export Test Session',
    speed: 'fast',
    enableInterjections: true,
    enableMetadata: true,
    autoAdvance: true,
    loop: false
  });

  // Export session
  const exportedData = observabilityManager.exportReplaySession(sessionId);
  console.log('📤 Exported replay session:');
  console.log(exportedData.substring(0, 200) + '...');

  // Import session
  const importedSessionId = observabilityManager.importReplaySession(exportedData);
  console.log(`📥 Imported replay session: ${importedSessionId}`);

  // Verify import
  const importedSession = observabilityManager.getReplaySession(importedSessionId);
  if (importedSession) {
    console.log(`✅ Imported session name: ${importedSession.metadata.sessionName}`);
    console.log(`✅ Imported session exchanges: ${importedSession.exchanges.length}`);
  }
}

/**
 * Example 6: Integration with DialoguePipe
 */
async function dialoguePipeIntegrationExample() {
  console.log('\n🔗 Example 6: Integration with DialoguePipe\n');

  // Create agent sessions
  const gptSession = new AgentSession({ 
    agentType: 'chatgpt',
    headless: true 
  });

  const claudeSession = new AgentSession({ 
    agentType: 'claude',
    headless: true 
  });

  // Initialize sessions
  await gptSession.init();
  await claudeSession.init();

  // Create dialogue pipe
  const pipe = new DialoguePipe({
    agentA: gptSession,
    agentB: claudeSession,
    startWith: 'A',
    maxRounds: 2,
    turnDelay: 1000
  });

  // Listen for exchanges
  pipe.on('exchange', (exchange) => {
    console.log(`💬 Dialogue exchange: ${exchange.from} → ${exchange.to}`);
    console.log(`   Prompt: ${exchange.prompt.substring(0, 50)}...`);
    console.log(`   Response: ${exchange.response.substring(0, 50)}...`);
  });

  // Start dialogue
  console.log('Starting dialogue with observability...');
  await pipe.start();

  // Create replay session from dialogue
  const replaySessionId = pipe.createReplaySession({
    speed: 'normal',
    enableInterjections: true,
    enableMetadata: true,
    autoAdvance: true,
    loop: false,
    sessionName: 'Dialogue Replay'
  });

  console.log(`Created replay session: ${replaySessionId}`);

  // Get all exchanges from dialogue
  const exchanges = pipe.getAllExchanges();
  console.log(`Total exchanges recorded: ${exchanges.length}`);

  // Get exchanges by filter
  const gptExchanges = pipe.getExchangesByFilter({ agentId: 'A' });
  console.log(`GPT exchanges: ${gptExchanges.length}`);

  const claudeExchanges = pipe.getExchangesByFilter({ agentId: 'B' });
  console.log(`Claude exchanges: ${claudeExchanges.length}`);

  // Clean up
  await gptSession.close();
  await claudeSession.close();
}

/**
 * Example 7: Advanced Replay Features
 */
async function advancedReplayExample(observabilityManager: ObservabilityManager) {
  console.log('\n🚀 Example 7: Advanced Replay Features\n');

  // Create multiple replay sessions with different speeds
  const exchanges = observabilityManager.getAllExchanges();
  
  const fastSessionId = observabilityManager.createReplaySession(exchanges, {
    speed: 'fast',
    enableInterjections: true,
    enableMetadata: true,
    autoAdvance: true,
    loop: true,
    sessionName: 'Fast Loop Replay'
  });

  const slowSessionId = observabilityManager.createReplaySession(exchanges, {
    speed: 'slow',
    enableInterjections: true,
    enableMetadata: true,
    autoAdvance: false, // Manual advance
    loop: false,
    sessionName: 'Slow Manual Replay'
  });

  console.log(`Created fast replay session: ${fastSessionId}`);
  console.log(`Created slow replay session: ${slowSessionId}`);

  // Get replay states
  const fastState = observabilityManager.getReplayState(fastSessionId);
  const slowState = observabilityManager.getReplayState(slowSessionId);

  console.log('\n📊 Replay States:');
  console.log(`Fast session playing: ${fastState?.isPlaying || false}`);
  console.log(`Slow session playing: ${slowState?.isPlaying || false}`);

  // Get all replay sessions
  const allSessions = observabilityManager.getAllReplaySessions();
  console.log(`\n📋 All replay sessions: ${allSessions.length}`);
  allSessions.forEach(session => {
    console.log(`  - ${session.metadata.sessionName} (${session.exchanges.length} exchanges)`);
  });
}

/**
 * Run all examples
 */
async function runAllObservabilityExamples() {
  try {
    console.log('🧠 Observability and Replay Examples\n');

    // Example 1: Basic observability
    const observabilityManager = await basicObservabilityExample();

    // Example 2: Replay session creation
    const sessionId = await replaySessionExample(observabilityManager);

    // Example 3: Replay control
    await replayControlExample(observabilityManager, sessionId);

    // Example 4: Filtering
    await filteringExample(observabilityManager);

    // Example 5: Export/Import
    await exportImportExample(observabilityManager);

    // Example 6: DialoguePipe integration
    await dialoguePipeIntegrationExample();

    // Example 7: Advanced features
    await advancedReplayExample(observabilityManager);

    // Clean up
    observabilityManager.close();

    console.log('\n✅ All observability examples completed successfully!');
  } catch (error) {
    console.error('❌ Observability example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllObservabilityExamples();
}

export {
  basicObservabilityExample,
  replaySessionExample,
  replayControlExample,
  filteringExample,
  exportImportExample,
  dialoguePipeIntegrationExample,
  advancedReplayExample,
  runAllObservabilityExamples
}; 