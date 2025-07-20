import { AgentSession, DialoguePipe } from '@chatpipes/ai-conductor';

/**
 * Example 1: Minimal script usage
 */
async function minimalScriptExample() {
  console.log('🚀 Example 1: Minimal Script Usage\n');

  const session = new AgentSession({ 
    agentType: 'chatgpt',
    headless: true 
  });
  
  await session.init();

  const response = await session.sendPrompt("What is the square root of -1?");
  console.log("GPT says:", response);

  await session.close();
}

/**
 * Example 2: Queue usage with streaming feedback
 */
async function queueStreamingExample() {
  console.log('\n🔄 Example 2: Queue Usage with Streaming Feedback\n');

  const session = new AgentSession({ 
    agentType: 'claude',
    headless: true 
  });
  
  await session.init();

  // Listen for responses
  session.on('response', (event) => {
    console.log(`📨 Got response: ${event.text.substring(0, 100)}...`);
  });

  // Queue multiple prompts
  session.queuePrompt("Describe a platypus.");
  session.queuePrompt("Now do it in the style of a beat poet.");
  session.queuePrompt("Finally, explain it like you're talking to a 5-year-old.");

  // Wait for all responses
  await new Promise(resolve => setTimeout(resolve, 10000));
  await session.close();
}

/**
 * Example 3: Async generator streaming
 */
async function asyncGeneratorExample() {
  console.log('\n📡 Example 3: Async Generator Streaming\n');

  const session = new AgentSession({ 
    agentType: 'perplexity',
    headless: true 
  });
  
  await session.init();

  // Queue some prompts
  session.queuePrompt("What are the latest developments in quantum computing?");
  session.queuePrompt("How does this relate to cryptography?");

  // Use async generator to process responses
  let responseCount = 0;
  for await (const response of session.responseStream) {
    responseCount++;
    console.log(`📡 Response ${responseCount}: ${response.text.substring(0, 100)}...`);
    
    if (responseCount >= 2) break; // Stop after 2 responses
  }

  await session.close();
}

/**
 * Example 4: Piped dialogue with event listeners
 */
async function pipedDialogueExample() {
  console.log('\n🔗 Example 4: Piped Dialogue with Event Listeners\n');

  // Create two agent sessions
  const gptSession = new AgentSession({ 
    agentType: 'chatgpt',
    persona: {
      name: 'GPT Philosopher',
      description: 'A philosophical ChatGPT agent',
      instructions: 'You are a philosophical AI assistant. Focus on deep thinking and analysis.',
      introPrompt: 'You are a philosophical AI assistant.',
      behaviorStyle: 'thoughtful and analytical',
      temperature: 0.8
    },
    headless: true 
  });

  const claudeSession = new AgentSession({ 
    agentType: 'claude',
    persona: {
      name: 'Claude Ethicist',
      description: 'An ethical Claude agent',
      instructions: 'You are an ethical AI assistant. Focus on moral implications.',
      introPrompt: 'You are an ethical AI assistant.',
      behaviorStyle: 'ethical and principled',
      temperature: 0.7
    },
    headless: true 
  });

  // Initialize both sessions
  await gptSession.init();
  await claudeSession.init();

  // Create dialogue pipe
  const pipe = new DialoguePipe({
    agentA: gptSession,
    agentB: claudeSession,
    startWith: 'A',
    maxRounds: 3,
    turnDelay: 2000
  });

  // Listen for exchanges
  pipe.on('exchange', (exchange) => {
    console.log(`💬 ${exchange.from} → ${exchange.to}:`);
    console.log(`   Prompt: ${exchange.prompt.substring(0, 50)}...`);
    console.log(`   Response: ${exchange.response.substring(0, 100)}...`);
    console.log(`   Round: ${exchange.round}\n`);
  });

  // Listen for interjections
  pipe.on('interjection', (data) => {
    console.log(`💡 Interjection: "${data.interjection.text}"`);
  });

  // Listen for completion
  pipe.on('completed', (data) => {
    console.log(`✅ Dialogue completed after ${data.totalRounds} rounds`);
  });

  // Start the dialogue
  await pipe.start();

  // Get transcript
  const transcript = pipe.getTranscript();
  console.log(`\n📝 Transcript Summary:`);
  console.log(`   Total Exchanges: ${transcript.metadata.totalExchanges}`);
  console.log(`   Total Rounds: ${transcript.metadata.totalRounds}`);
  console.log(`   Interjections: ${transcript.interjections.length}`);

  // Clean up
  await gptSession.close();
  await claudeSession.close();
}

/**
 * Example 5: Advanced interjection usage
 */
async function interjectionExample() {
  console.log('\n💡 Example 5: Advanced Interjection Usage\n');

  const session = new AgentSession({ 
    agentType: 'deepseek',
    headless: true 
  });
  
  await session.init();

  // Listen for responses
  session.on('response', (event) => {
    console.log(`🤖 Response: ${event.text.substring(0, 100)}...`);
  });

  // Send initial prompt
  session.queuePrompt("Explain the concept of machine learning.");

  // Add interjection after a delay
  setTimeout(() => {
    session.addInterjection({
      id: 'interjection-1',
      type: 'side_question',
      text: 'How does this relate to human learning?',
      target: 'both',
      priority: 'high',
      timestamp: new Date()
    });
    console.log('💡 Added interjection about human learning');
  }, 2000);

  // Add another interjection
  setTimeout(() => {
    session.addInterjection({
      id: 'interjection-2',
      type: 'direction',
      text: 'Focus on practical applications rather than theory.',
      target: 'both',
      priority: 'medium',
      timestamp: new Date()
    });
    console.log('💡 Added interjection to focus on applications');
  }, 4000);

  // Wait for responses
  await new Promise(resolve => setTimeout(resolve, 15000));
  await session.close();
}

/**
 * Example 6: Error handling and recovery
 */
async function errorHandlingExample() {
  console.log('\n⚠️ Example 6: Error Handling and Recovery\n');

  const session = new AgentSession({ 
    agentType: 'chatgpt',
    headless: true 
  });

  // Listen for errors
  session.on('error', (errorEvent) => {
    console.log(`❌ Error: ${errorEvent.error.message}`);
    console.log(`   Prompt: ${errorEvent.prompt || 'N/A'}`);
    console.log(`   Job ID: ${errorEvent.jobId || 'N/A'}`);
  });

  // Listen for responses
  session.on('response', (event) => {
    console.log(`✅ Success: ${event.text.substring(0, 50)}...`);
  });

  try {
    await session.init();

    // Send multiple prompts
    session.queuePrompt("What is 2 + 2?");
    session.queuePrompt("Explain quantum physics.");
    session.queuePrompt("What's the weather like?");

    // Wait for responses
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.log(`💥 Fatal error: ${error}`);
  } finally {
    await session.close();
  }
}

/**
 * Example 7: Session statistics and monitoring
 */
async function statisticsExample() {
  console.log('\n📊 Example 7: Session Statistics and Monitoring\n');

  const session = new AgentSession({ 
    agentType: 'claude',
    headless: true 
  });

  await session.init();

  // Monitor session stats
  const monitorStats = () => {
    const stats = session.getStats();
    console.log(`📊 Session Stats:`);
    console.log(`   Initialized: ${stats.isInitialized}`);
    console.log(`   Processing: ${stats.isProcessing}`);
    console.log(`   Queue Length: ${stats.queueLength}`);
    console.log(`   Browser Stats: ${JSON.stringify(stats.browserStats, null, 2)}`);
  };

  // Check stats periodically
  const statsInterval = setInterval(monitorStats, 2000);

  // Send some prompts
  session.queuePrompt("Hello, how are you?");
  session.queuePrompt("Tell me a joke.");
  session.queuePrompt("What's your favorite color?");

  // Wait and check final stats
  await new Promise(resolve => setTimeout(resolve, 8000));
  clearInterval(statsInterval);
  monitorStats();

  await session.close();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await minimalScriptExample();
    await queueStreamingExample();
    await asyncGeneratorExample();
    await pipedDialogueExample();
    await interjectionExample();
    await errorHandlingExample();
    await statisticsExample();
    
    console.log('\n🎉 All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  minimalScriptExample,
  queueStreamingExample,
  asyncGeneratorExample,
  pipedDialogueExample,
  interjectionExample,
  errorHandlingExample,
  statisticsExample,
  runAllExamples
}; 