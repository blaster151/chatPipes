import { 
  AgentSession, 
  Environment, 
  ConvoThread, 
  World,
  CrossTalkManager,
  createCoffeeShopEnvironment,
  SubscriptionMode
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Basic Subscription Modes - Flattened vs Unflattened
 */
async function basicSubscriptionModesExample() {
  console.log('🌐 Example 1: Basic Subscription Modes - Flattened vs Unflattened\n');

  // Create cross-talk manager
  const crossTalkManager = new CrossTalkManager({
    enabled: true,
    subscriptionMode: 'flattened',
    eavesdroppingRange: 3,
    eavesdroppingChance: 0.5, // Higher chance for demo
    maxOverheardExchanges: 3,
    includeAmbientContext: true,
    crossTalkCooldown: 10000 // Shorter cooldown for demo
  });

  // Create coffee shop environment
  const cafe = createCoffeeShopEnvironment('demo-cafe');

  // Create agents with distinct personas
  const alice = new AgentSession({
    agentType: 'chatgpt',
    systemPrompt: 'You are Alice, a friendly barista who loves talking about coffee and art. You are observant and notice conversations around you.',
    useStealth: true
  });

  const bob = new AgentSession({
    agentType: 'claude',
    systemPrompt: 'You are Bob, a regular customer who enjoys deep conversations about philosophy. You are curious about other people\'s discussions.',
    useStealth: true
  });

  const clara = new AgentSession({
    agentType: 'chatgpt',
    systemPrompt: 'You are Clara, a student studying for exams. You are focused but sometimes get distracted by interesting conversations.',
    useStealth: true
  });

  const dev = new AgentSession({
    agentType: 'claude',
    systemPrompt: 'You are Dev, a software developer working remotely. You are analytical and sometimes overhear technical discussions.',
    useStealth: true
  });

  // Initialize all agents
  await Promise.all([alice, bob, clara, dev].map(agent => agent.init()));

  // Create conversation threads with different subscription modes
  const table1 = new ConvoThread({
    id: 'table1',
    name: 'Coffee Discussion',
    participants: [alice, bob],
    environment: cafe,
    crossTalkManager,
    subscriptionMode: 'flattened',
    maxRounds: 4,
    turnDelay: 3000
  });

  const table2 = new ConvoThread({
    id: 'table2',
    name: 'Study Session',
    participants: [clara, dev],
    environment: cafe,
    crossTalkManager,
    subscriptionMode: 'unflattened',
    maxRounds: 4,
    turnDelay: 3000
  });

  // Listen for cross-talk events
  crossTalkManager.on('cross_talk', (event) => {
    console.log(`\n👂 Cross-talk detected!`);
    console.log(`   From: ${event.sourceThreadId} → To: ${event.targetThreadId}`);
    console.log(`   Mode: ${event.mode}`);
    console.log(`   Intensity: ${event.intensity.toFixed(2)}`);
    
    if (event.mode === 'flattened') {
      console.log(`   Content: ${event.content}`);
    } else if (event.mode === 'unflattened') {
      console.log(`   Content: ${JSON.stringify(event.content, null, 2)}`);
    }
  });

  // Listen for conversation events
  table1.on('cross_talk_received', (data) => {
    console.log(`\n📢 Table 1 received cross-talk: ${data.event.mode} mode`);
  });

  table2.on('cross_talk_received', (data) => {
    console.log(`\n📢 Table 2 received cross-talk: ${data.event.mode} mode`);
  });

  // Start environment and conversations
  cafe.startAmbientLoop();
  await Promise.all([table1.start(), table2.start()]);

  // Simulate eavesdropping after a delay
  setTimeout(() => {
    console.log('\n🎭 Simulating eavesdropping...');
    crossTalkManager.simulateEavesdrop('demo-cafe', 'table1', 'table2', true);
  }, 8000);

  setTimeout(() => {
    console.log('\n🎭 Simulating reverse eavesdropping...');
    crossTalkManager.simulateEavesdrop('demo-cafe', 'table2', 'table1', true);
  }, 16000);

  // Let conversations run
  await new Promise(resolve => setTimeout(resolve, 25000));

  // Clean up
  await Promise.all([table1.stop(), table2.stop()]);
  cafe.stopAmbientLoop();
  await Promise.all([alice, bob, clara, dev].map(agent => agent.close()));

  // Show statistics
  console.log('\n📊 Cross-talk Statistics:');
  console.log(crossTalkManager.getStats());
}

/**
 * Example 2: Subscription Mode Comparison
 */
async function subscriptionModeComparisonExample() {
  console.log('\n🔄 Example 2: Subscription Mode Comparison\n');

  const cafe = createCoffeeShopEnvironment('comparison-cafe');
  const crossTalkManager = new CrossTalkManager({
    enabled: true,
    eavesdroppingChance: 0.8, // High chance for demo
    crossTalkCooldown: 5000
  });

  // Create agents
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Agent A. You are very observant and notice everything around you.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Agent B. You are analytical and process information carefully.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Agent C. You are social and love to engage with others.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Agent D. You are focused but curious about your surroundings.',
      useStealth: true
    }).init()
  ]);

  // Create threads with different subscription modes
  const flattenedThread = new ConvoThread({
    id: 'flattened-thread',
    name: 'Flattened Mode',
    participants: [agents[0], agents[1]],
    environment: cafe,
    crossTalkManager,
    subscriptionMode: 'flattened',
    maxRounds: 3
  });

  const unflattenedThread = new ConvoThread({
    id: 'unflattened-thread',
    name: 'Unflattened Mode',
    participants: [agents[2], agents[3]],
    environment: cafe,
    crossTalkManager,
    subscriptionMode: 'unflattened',
    maxRounds: 3
  });

  // Listen for cross-talk events
  crossTalkManager.on('cross_talk', (event) => {
    console.log(`\n🎯 Cross-talk Event:`);
    console.log(`   Mode: ${event.mode}`);
    console.log(`   From: ${event.sourceThreadId} → To: ${event.targetThreadId}`);
    
    if (event.mode === 'flattened') {
      console.log(`   Flattened: "${event.content}"`);
    } else if (event.mode === 'unflattened') {
      const exchanges = event.content as any[];
      console.log(`   Unflattened:`);
      exchanges.forEach(ex => {
        console.log(`     ${ex.speaker}: "${ex.text}"`);
      });
    }
  });

  // Start conversations
  cafe.startAmbientLoop();
  await Promise.all([flattenedThread.start(), unflattenedThread.start()]);

  // Simulate cross-talk in both directions
  setTimeout(() => {
    console.log('\n🔄 Testing flattened → unflattened');
    crossTalkManager.simulateEavesdrop('comparison-cafe', 'flattened-thread', 'unflattened-thread', true);
  }, 6000);

  setTimeout(() => {
    console.log('\n🔄 Testing unflattened → flattened');
    crossTalkManager.simulateEavesdrop('comparison-cafe', 'unflattened-thread', 'flattened-thread', true);
  }, 12000);

  await new Promise(resolve => setTimeout(resolve, 20000));

  // Clean up
  await Promise.all([flattenedThread.stop(), unflattenedThread.stop()]);
  cafe.stopAmbientLoop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 3: World-Level Cross-Talk Management
 */
async function worldCrossTalkExample() {
  console.log('\n🌎 Example 3: World-Level Cross-Talk Management\n');

  // Create world with cross-talk configuration
  const world = new World({
    id: 'cross-talk-world',
    name: 'Cross-Talk Demo World',
    description: 'A world demonstrating advanced cross-talk features.',
    globalClockSpeed: 2000,
    enableCrossTalk: true,
    crossTalkRange: 5,
    defaultSubscriptionMode: 'both', // Use both modes
    crossTalkConfig: {
      enabled: true,
      subscriptionMode: 'both',
      eavesdroppingRange: 5,
      eavesdroppingChance: 0.4,
      maxOverheardExchanges: 4,
      includeAmbientContext: true,
      crossTalkCooldown: 15000,
      enableInterruption: true
    }
  });

  // Create multiple environments
  const cafe = createCoffeeShopEnvironment('world-cafe');
  const office = createCoffeeShopEnvironment('world-office');

  world.registerEnvironment(cafe);
  world.registerEnvironment(office);

  // Create agents for different environments
  const cafeAgents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a barista discussing coffee brewing methods.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a coffee enthusiast learning about different beans.',
      useStealth: true
    }).init()
  ]);

  const officeAgents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a project manager discussing deadlines.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a developer explaining technical challenges.',
      useStealth: true
    }).init()
  ]);

  // Create conversation threads
  const cafeThread = new ConvoThread({
    id: 'cafe-conversation',
    name: 'Coffee Shop Chat',
    participants: cafeAgents,
    environment: cafe,
    subscriptionMode: 'flattened',
    maxRounds: 3
  });

  const officeThread = new ConvoThread({
    id: 'office-conversation',
    name: 'Office Meeting',
    participants: officeAgents,
    environment: office,
    subscriptionMode: 'unflattened',
    maxRounds: 3
  });

  // Register threads with world
  world.registerConvoThread(cafeThread);
  world.registerConvoThread(officeThread);

  // Connect threads to environments
  world.connectConvoToEnv('cafe-conversation', 'world-cafe');
  world.connectConvoToEnv('office-conversation', 'world-office');

  // Listen for world events
  world.on('cross_talk', (data) => {
    console.log(`\n🌍 World Cross-talk:`);
    console.log(`   Event: ${data.event.mode} mode`);
    console.log(`   From: ${data.event.sourceThreadId} → To: ${data.event.targetThreadId}`);
    console.log(`   Intensity: ${data.event.intensity.toFixed(2)}`);
  });

  world.on('subscription_created', (data) => {
    console.log(`\n📡 Subscription created: ${data.subscriberId} → ${data.targetId}`);
  });

  // Start world and conversations
  world.start();
  await Promise.all([cafeThread.start(), officeThread.start()]);

  // Test cross-talk between different environments
  setTimeout(() => {
    console.log('\n🌍 Testing cross-environment cross-talk...');
    // Note: This won't work since they're in different environments
    // but demonstrates the world-level coordination
  }, 8000);

  // Let the world run
  await new Promise(resolve => setTimeout(resolve, 20000));

  // Stop everything
  world.stop();
  await Promise.all([cafeThread.stop(), officeThread.stop()]);
  await Promise.all([...cafeAgents, ...officeAgents].map(agent => agent.close()));

  // Show world statistics
  console.log('\n📊 World Cross-talk Statistics:');
  console.log(world.getCrossTalkStats());
}

/**
 * Example 4: Dynamic Subscription Mode Switching
 */
async function dynamicSubscriptionExample() {
  console.log('\n🔄 Example 4: Dynamic Subscription Mode Switching\n');

  const cafe = createCoffeeShopEnvironment('dynamic-cafe');
  const crossTalkManager = new CrossTalkManager({
    enabled: true,
    subscriptionMode: 'flattened',
    eavesdroppingChance: 0.6,
    crossTalkCooldown: 8000
  });

  // Create agents
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Agent Alpha. You adapt your listening style based on the situation.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Agent Beta. You are flexible in how you process information.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Agent Gamma. You prefer detailed information.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Agent Delta. You like concise summaries.',
      useStealth: true
    }).init()
  ]);

  // Create threads
  const thread1 = new ConvoThread({
    id: 'dynamic-thread-1',
    name: 'Dynamic Thread 1',
    participants: [agents[0], agents[1]],
    environment: cafe,
    crossTalkManager,
    subscriptionMode: 'flattened',
    maxRounds: 4
  });

  const thread2 = new ConvoThread({
    id: 'dynamic-thread-2',
    name: 'Dynamic Thread 2',
    participants: [agents[2], agents[3]],
    environment: cafe,
    crossTalkManager,
    subscriptionMode: 'unflattened',
    maxRounds: 4
  });

  // Listen for subscription mode changes
  thread1.on('subscription_mode_changed', (data) => {
    console.log(`\n🔄 Thread 1 switched to ${data.mode} mode`);
  });

  thread2.on('subscription_mode_changed', (data) => {
    console.log(`\n🔄 Thread 2 switched to ${data.mode} mode`);
  });

  // Start conversations
  cafe.startAmbientLoop();
  await Promise.all([thread1.start(), thread2.start()]);

  // Simulate cross-talk
  setTimeout(() => {
    console.log('\n🎭 Initial cross-talk (flattened → unflattened)');
    crossTalkManager.simulateEavesdrop('dynamic-cafe', 'dynamic-thread-1', 'dynamic-thread-2', true);
  }, 6000);

  // Switch subscription modes
  setTimeout(() => {
    console.log('\n🔄 Switching subscription modes...');
    thread1.setSubscriptionMode('unflattened');
    thread2.setSubscriptionMode('flattened');
  }, 12000);

  setTimeout(() => {
    console.log('\n🎭 Cross-talk after mode switch (unflattened → flattened)');
    crossTalkManager.simulateEavesdrop('dynamic-cafe', 'dynamic-thread-1', 'dynamic-thread-2', true);
  }, 16000);

  // Switch to both modes
  setTimeout(() => {
    console.log('\n🔄 Switching to both modes...');
    thread1.setSubscriptionMode('both');
    thread2.setSubscriptionMode('both');
  }, 20000);

  setTimeout(() => {
    console.log('\n🎭 Cross-talk with both modes');
    crossTalkManager.simulateEavesdrop('dynamic-cafe', 'dynamic-thread-1', 'dynamic-thread-2', true);
  }, 24000);

  await new Promise(resolve => setTimeout(resolve, 30000));

  // Clean up
  await Promise.all([thread1.stop(), thread2.stop()]);
  cafe.stopAmbientLoop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 5: Advanced Cross-Talk Features
 */
async function advancedCrossTalkExample() {
  console.log('\n🚀 Example 5: Advanced Cross-Talk Features\n');

  const cafe = createCoffeeShopEnvironment('advanced-cafe');
  const crossTalkManager = new CrossTalkManager({
    enabled: true,
    subscriptionMode: 'both',
    eavesdroppingRange: 4,
    eavesdroppingChance: 0.7,
    maxOverheardExchanges: 5,
    includeAmbientContext: true,
    crossTalkCooldown: 6000,
    enableInterruption: true
  });

  // Create agents with specific eavesdropping behaviors
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a detective who notices everything. When you overhear conversations, you analyze them carefully.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a journalist who is always listening for interesting stories. You often reference overheard conversations.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a psychologist who studies human behavior. You pay attention to how people interact.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a writer gathering material for a novel. You find inspiration in overheard conversations.',
      useStealth: true
    }).init()
  ]);

  // Create threads with subscriptions
  const thread1 = new ConvoThread({
    id: 'advanced-thread-1',
    name: 'Detective & Journalist',
    participants: [agents[0], agents[1]],
    environment: cafe,
    crossTalkManager,
    subscriptionMode: 'both',
    maxRounds: 5
  });

  const thread2 = new ConvoThread({
    id: 'advanced-thread-2',
    name: 'Psychologist & Writer',
    participants: [agents[2], agents[3]],
    environment: cafe,
    crossTalkManager,
    subscriptionMode: 'both',
    maxRounds: 5
  });

  // Subscribe threads to each other
  thread1.subscribeToThread('advanced-thread-2');
  thread2.subscribeToThread('advanced-thread-1');

  // Listen for all cross-talk events
  crossTalkManager.on('cross_talk', (event) => {
    console.log(`\n🎭 Advanced Cross-talk:`);
    console.log(`   Mode: ${event.mode}`);
    console.log(`   Intensity: ${event.intensity.toFixed(2)}`);
    console.log(`   Distance: ${event.metadata?.distance.toFixed(2)}`);
    console.log(`   Noise Level: ${event.metadata?.noiseLevel.toFixed(2)}`);
    console.log(`   Crowd Density: ${event.metadata?.crowdDensity.toFixed(2)}`);
  });

  // Listen for conversation events
  thread1.on('cross_talk_received', (data) => {
    console.log(`\n📢 Thread 1 received cross-talk in ${data.event.mode} mode`);
  });

  thread2.on('cross_talk_received', (data) => {
    console.log(`\n📢 Thread 2 received cross-talk in ${data.event.mode} mode`);
  });

  // Start conversations
  cafe.startAmbientLoop();
  await Promise.all([thread1.start(), thread2.start()]);

  // Simulate multiple cross-talk events
  const crossTalkIntervals = [5000, 10000, 15000, 20000, 25000];
  crossTalkIntervals.forEach((delay, index) => {
    setTimeout(() => {
      console.log(`\n🎭 Cross-talk event ${index + 1}`);
      if (index % 2 === 0) {
        crossTalkManager.simulateEavesdrop('advanced-cafe', 'advanced-thread-1', 'advanced-thread-2', true);
      } else {
        crossTalkManager.simulateEavesdrop('advanced-cafe', 'advanced-thread-2', 'advanced-thread-1', true);
      }
    }, delay);
  });

  await new Promise(resolve => setTimeout(resolve, 35000));

  // Show final statistics
  console.log('\n📊 Advanced Cross-talk Statistics:');
  console.log(crossTalkManager.getStats());

  console.log('\n📋 Eavesdropping History:');
  console.log('Thread 1:', thread1.getEavesdroppingHistory().length, 'events');
  console.log('Thread 2:', thread2.getEavesdroppingHistory().length, 'events');

  // Clean up
  await Promise.all([thread1.stop(), thread2.stop()]);
  cafe.stopAmbientLoop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Run all subscription mode examples
 */
async function runAllSubscriptionModeExamples() {
  try {
    console.log('🌐 Subscription Modes and Cross-Talk Examples\n');

    // Example 1: Basic subscription modes
    await basicSubscriptionModesExample();

    // Example 2: Subscription mode comparison
    await subscriptionModeComparisonExample();

    // Example 3: World-level cross-talk
    await worldCrossTalkExample();

    // Example 4: Dynamic subscription switching
    await dynamicSubscriptionExample();

    // Example 5: Advanced cross-talk features
    await advancedCrossTalkExample();

    console.log('\n✅ All subscription mode examples completed successfully!');
  } catch (error) {
    console.error('❌ Subscription mode example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllSubscriptionModeExamples();
}

export {
  basicSubscriptionModesExample,
  subscriptionModeComparisonExample,
  worldCrossTalkExample,
  dynamicSubscriptionExample,
  advancedCrossTalkExample,
  runAllSubscriptionModeExamples
}; 