import { 
  AgentSession, 
  Environment, 
  ConvoThread, 
  World,
  createCoffeeShopEnvironment,
  createOfficeEnvironment,
  createParkEnvironment,
  createLibraryEnvironment,
  createPartyEnvironment
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Basic Environment and Conversation Thread
 */
async function basicSimulationExample() {
  console.log('🌍 Example 1: Basic Environment and Conversation Thread\n');

  // Create a coffee shop environment
  const coffeeShop = createCoffeeShopEnvironment('coffee-shop-1');
  
  // Create agent sessions
  const alice = new AgentSession({
    agentType: 'chatgpt',
    model: 'gpt-4',
    systemPrompt: 'You are Alice, a friendly barista who loves talking about coffee and art.',
    useStealth: true
  });

  const bob = new AgentSession({
    agentType: 'claude',
    model: 'claude-3-sonnet',
    systemPrompt: 'You are Bob, a regular customer who enjoys deep conversations about philosophy.',
    useStealth: true
  });

  // Initialize sessions
  await alice.init();
  await bob.init();

  // Create conversation thread
  const conversation = new ConvoThread({
    id: 'coffee-chat-1',
    name: 'Coffee Shop Conversation',
    participants: [alice, bob],
    environment: coffeeShop,
    pipingMode: 'roundRobin',
    maxRounds: 5,
    turnDelay: 3000
  });

  // Listen for events
  conversation.on('exchange', (exchange) => {
    console.log(`💬 ${exchange.from} → ${exchange.to}: ${exchange.response.substring(0, 80)}...`);
  });

  conversation.on('ambient_event', (data) => {
    console.log(`🌿 Ambient: ${data.event.description}`);
  });

  coffeeShop.on('ambient_event', (data) => {
    console.log(`☕ Coffee Shop: ${data.event.description}`);
  });

  // Start the environment and conversation
  coffeeShop.startAmbientLoop();
  await conversation.start();

  // Wait for conversation to complete
  await new Promise(resolve => setTimeout(resolve, 20000));

  // Clean up
  await conversation.stop();
  coffeeShop.stopAmbientLoop();
  await alice.close();
  await bob.close();
}

/**
 * Example 2: Multiple Environments and Cross-Talk
 */
async function multiEnvironmentExample() {
  console.log('\n🏢 Example 2: Multiple Environments and Cross-Talk\n');

  // Create multiple environments
  const coffeeShop = createCoffeeShopEnvironment('coffee-shop-2');
  const office = createOfficeEnvironment('office-1');
  const park = createParkEnvironment('park-1');

  // Create agent sessions for different environments
  const coffeeAgents = [
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a barista discussing coffee brewing methods.',
      useStealth: true
    }),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a coffee enthusiast learning about different beans.',
      useStealth: true
    })
  ];

  const officeAgents = [
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a project manager discussing deadlines.',
      useStealth: true
    }),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a developer explaining technical challenges.',
      useStealth: true
    })
  ];

  const parkAgents = [
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a nature enthusiast discussing local wildlife.',
      useStealth: true
    }),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a bird watcher sharing observations.',
      useStealth: true
    })
  ];

  // Initialize all agents
  await Promise.all([
    ...coffeeAgents.map(agent => agent.init()),
    ...officeAgents.map(agent => agent.init()),
    ...parkAgents.map(agent => agent.init())
  ]);

  // Create conversation threads
  const coffeeThread = new ConvoThread({
    id: 'coffee-thread',
    name: 'Coffee Shop Discussion',
    participants: coffeeAgents,
    environment: coffeeShop,
    maxRounds: 3
  });

  const officeThread = new ConvoThread({
    id: 'office-thread',
    name: 'Office Meeting',
    participants: officeAgents,
    environment: office,
    maxRounds: 3
  });

  const parkThread = new ConvoThread({
    id: 'park-thread',
    name: 'Park Conversation',
    participants: parkAgents,
    environment: park,
    maxRounds: 3
  });

  // Start all environments and threads
  coffeeShop.startAmbientLoop();
  office.startAmbientLoop();
  park.startAmbientLoop();

  await Promise.all([
    coffeeThread.start(),
    officeThread.start(),
    parkThread.start()
  ]);

  // Wait for conversations to complete
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Clean up
  await Promise.all([
    coffeeThread.stop(),
    officeThread.stop(),
    parkThread.stop()
  ]);

  coffeeShop.stopAmbientLoop();
  office.stopAmbientLoop();
  park.stopAmbientLoop();

  await Promise.all([
    ...coffeeAgents.map(agent => agent.close()),
    ...officeAgents.map(agent => agent.close()),
    ...parkAgents.map(agent => agent.close())
  ]);
}

/**
 * Example 3: World Coordination and Global Events
 */
async function worldCoordinationExample() {
  console.log('\n🌎 Example 3: World Coordination and Global Events\n');

  // Create world
  const world = new World({
    id: 'demo-world',
    name: 'Demo World',
    description: 'A simulated world with multiple environments and conversations.',
    globalClockSpeed: 2000, // 2 seconds per tick
    enableCrossTalk: true,
    crossTalkRange: 3,
    enableGlobalEvents: true,
    globalEventFrequency: 15000 // 15 seconds
  });

  // Create environments
  const library = createLibraryEnvironment('library-1');
  const party = createPartyEnvironment('party-1');

  // Register environments with world
  world.registerEnvironment(library);
  world.registerEnvironment(party);

  // Create agents
  const libraryAgents = [
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a librarian helping with research.',
      useStealth: true
    }),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a student studying for exams.',
      useStealth: true
    })
  ];

  const partyAgents = [
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a party host making everyone feel welcome.',
      useStealth: true
    }),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a guest enjoying the celebration.',
      useStealth: true
    })
  ];

  // Initialize agents
  await Promise.all([
    ...libraryAgents.map(agent => agent.init()),
    ...partyAgents.map(agent => agent.init())
  ]);

  // Create conversation threads
  const libraryThread = new ConvoThread({
    id: 'library-conversation',
    name: 'Library Discussion',
    participants: libraryAgents,
    environment: library,
    maxRounds: 4
  });

  const partyThread = new ConvoThread({
    id: 'party-conversation',
    name: 'Party Chat',
    participants: partyAgents,
    environment: party,
    maxRounds: 4
  });

  // Register threads with world
  world.registerConvoThread(libraryThread);
  world.registerConvoThread(partyThread);

  // Connect threads to environments
  world.connectConvoToEnv('library-conversation', 'library-1');
  world.connectConvoToEnv('party-conversation', 'party-1');

  // Listen for world events
  world.on('world_tick', (data) => {
    console.log(`⏰ World tick ${data.tick}: ${data.time.hour}:${data.time.minute}`);
  });

  world.on('global_event', (data) => {
    console.log(`🌍 Global event: ${data.event.description}`);
  });

  world.on('cross_talk', (data) => {
    console.log(`👂 Cross-talk: ${data.event.message.substring(0, 50)}...`);
  });

  // Start world simulation
  world.start();

  // Start conversations
  await Promise.all([
    libraryThread.start(),
    partyThread.start()
  ]);

  // Let the world run for a while
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Stop everything
  world.stop();
  await Promise.all([
    libraryThread.stop(),
    partyThread.stop()
  ]);

  await Promise.all([
    ...libraryAgents.map(agent => agent.close()),
    ...partyAgents.map(agent => agent.close())
  ]);

  // Get world statistics
  console.log('\n📊 World Statistics:');
  console.log(world.getStats());
}

/**
 * Example 4: Custom Environment and Interjection Rules
 */
async function customEnvironmentExample() {
  console.log('\n🎨 Example 4: Custom Environment and Interjection Rules\n');

  // Create a custom sci-fi environment
  const sciFiEnvironment = new Environment({
    id: 'spaceship-bridge',
    name: 'Spaceship Bridge',
    description: 'The command bridge of a starship, filled with holographic displays and the hum of advanced technology.',
    initialState: {
      time: { hour: 14, minute: 30, day: 1, season: 'space' },
      weather: { condition: 'artificial', temperature: 22, humidity: 40, windSpeed: 0 },
      atmosphere: { mood: 'focused', noiseLevel: 0.4, lighting: 'blue', activity: 'moderate' },
      social: { nearbyConversations: 2, crowdDensity: 0.3, socialTension: 0.2, recentEvents: [] },
      physical: {
        temperature: 22,
        smells: ['ozone', 'metal', 'cleaner'],
        sounds: ['holographic_displays', 'life_support', 'computer_beeps'],
        visualElements: ['holograms', 'control_panels', 'starfield', 'status_displays']
      },
      ship: {
        status: 'normal',
        alertLevel: 'green',
        course: 'Alpha Centauri',
        speed: 'warp_3'
      }
    },
    ambientEventFrequencyMs: 20000,
    ambientEventGenerator: (state, timestamp) => {
      const events = [
        {
          description: 'A holographic display flickers and recalibrates, casting blue light across the bridge.',
          type: 'ambient' as const,
          affects: ['lighting', 'sounds']
        },
        {
          description: 'The computer announces, "Course correction complete. ETA to destination: 3.2 light years."',
          type: 'environmental' as const,
          affects: ['sounds', 'mood']
        },
        {
          description: 'A proximity alert sounds briefly, then silences as the threat passes.',
          type: 'environmental' as const,
          affects: ['sounds', 'mood', 'ship']
        },
        {
          description: 'The life support system cycles, creating a gentle whoosh of air.',
          type: 'ambient' as const,
          affects: ['sounds', 'temperature']
        }
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      
      return {
        id: `spaceship-${Date.now()}`,
        type: event.type,
        description: event.description,
        intensity: Math.random() * 0.4 + 0.2,
        duration: 3000,
        affects: event.affects,
        timestamp
      };
    },
    stateUpdateRules: [
      {
        condition: (state, event) => event.type === 'environmental' && event.affects.includes('ship'),
        update: (state, event) => ({
          ...state,
          ship: { ...state.ship, alertLevel: 'yellow' }
        }),
        priority: 1
      }
    ]
  });

  // Create space crew agents
  const captain = new AgentSession({
    agentType: 'chatgpt',
    systemPrompt: 'You are Captain Sarah Chen, commanding officer of the starship Horizon. You are decisive and care about your crew.',
    useStealth: true
  });

  const engineer = new AgentSession({
    agentType: 'claude',
    systemPrompt: 'You are Chief Engineer Marcus Rodriguez. You are practical and focused on keeping the ship running smoothly.',
    useStealth: true
  });

  // Initialize agents
  await captain.init();
  await engineer.init();

  // Create interjection rules
  const interjectionRules = [
    {
      condition: (exchange, state) => 
        state.ship?.alertLevel === 'yellow' && 
        exchange.response.toLowerCase().includes('course'),
      interjection: 'Captain, I recommend we increase alert level to yellow and scan for potential threats.',
      priority: 1,
      cooldownMs: 30000
    },
    {
      condition: (exchange, state) => 
        state.ship?.status === 'normal' && 
        Math.random() < 0.3, // 30% chance
      interjection: (state) => `Status report: ${state.ship?.status}, Alert Level: ${state.ship?.alertLevel}`,
      priority: 2,
      cooldownMs: 45000
    }
  ];

  // Create conversation thread
  const bridgeConversation = new ConvoThread({
    id: 'bridge-conversation',
    name: 'Bridge Discussion',
    participants: [captain, engineer],
    environment: sciFiEnvironment,
    interjectionRules,
    pipingMode: 'turnTaking',
    maxRounds: 6,
    turnDelay: 4000
  });

  // Listen for events
  bridgeConversation.on('exchange', (exchange) => {
    console.log(`🚀 ${exchange.from} → ${exchange.to}: ${exchange.response.substring(0, 80)}...`);
  });

  bridgeConversation.on('interjection_applied', (data) => {
    console.log(`⚠️ Interjection: ${data.interjection}`);
  });

  sciFiEnvironment.on('ambient_event', (data) => {
    console.log(`🛸 Spaceship: ${data.event.description}`);
  });

  // Start environment and conversation
  sciFiEnvironment.startAmbientLoop();
  await bridgeConversation.start();

  // Let it run
  await new Promise(resolve => setTimeout(resolve, 25000));

  // Clean up
  await bridgeConversation.stop();
  sciFiEnvironment.stopAmbientLoop();
  await captain.close();
  await engineer.close();
}

/**
 * Example 5: Complex Multi-Environment World
 */
async function complexWorldExample() {
  console.log('\n🏗️ Example 5: Complex Multi-Environment World\n');

  // Create world
  const world = new World({
    id: 'complex-world',
    name: 'Complex Simulation World',
    description: 'A complex world with multiple interconnected environments and conversations.',
    globalClockSpeed: 3000,
    enableCrossTalk: true,
    crossTalkRange: 5,
    enableGlobalEvents: true,
    globalEventFrequency: 20000
  });

  // Create multiple environments
  const environments = [
    createCoffeeShopEnvironment('coffee-main'),
    createOfficeEnvironment('office-main'),
    createParkEnvironment('park-main'),
    createLibraryEnvironment('library-main'),
    createPartyEnvironment('party-main')
  ];

  // Register all environments
  environments.forEach(env => world.registerEnvironment(env));

  // Create agents for each environment
  const agentsPerEnv = 2;
  const allAgents: AgentSession[] = [];

  for (let i = 0; i < environments.length; i++) {
    const envAgents = [
      new AgentSession({
        agentType: 'chatgpt',
        systemPrompt: `You are Agent A in ${environments[i].name}. Be engaging and contextually aware.`,
        useStealth: true
      }),
      new AgentSession({
        agentType: 'claude',
        systemPrompt: `You are Agent B in ${environments[i].name}. Be thoughtful and responsive to your environment.`,
        useStealth: true
      })
    ];
    allAgents.push(...envAgents);
  }

  // Initialize all agents
  await Promise.all(allAgents.map(agent => agent.init()));

  // Create conversation threads for each environment
  const threads: ConvoThread[] = [];
  
  for (let i = 0; i < environments.length; i++) {
    const thread = new ConvoThread({
      id: `thread-${i}`,
      name: `Conversation in ${environments[i].name}`,
      participants: allAgents.slice(i * agentsPerEnv, (i + 1) * agentsPerEnv),
      environment: environments[i],
      maxRounds: 3,
      turnDelay: 2000
    });
    
    threads.push(thread);
    world.registerConvoThread(thread);
    world.connectConvoToEnv(thread.id, environments[i].id);
  }

  // Listen for world events
  world.on('world_tick', (data) => {
    if (data.tick % 5 === 0) { // Log every 5th tick
      console.log(`⏰ World tick ${data.tick}: ${data.time.hour}:${data.time.minute}`);
    }
  });

  world.on('global_event', (data) => {
    console.log(`🌍 Global: ${data.event.description}`);
  });

  world.on('cross_talk', (data) => {
    console.log(`👂 Cross-talk detected between ${data.event.sourceThreadId} and ${data.event.targetThreadId}`);
  });

  // Start world
  world.start();

  // Start all conversations
  await Promise.all(threads.map(thread => thread.start()));

  // Let the world run
  await new Promise(resolve => setTimeout(resolve, 45000));

  // Stop everything
  world.stop();
  await Promise.all(threads.map(thread => thread.stop()));
  await Promise.all(allAgents.map(agent => agent.close()));

  // Final statistics
  console.log('\n📊 Final World Statistics:');
  const stats = world.getStats();
  console.log(`Total ticks: ${stats.tick}`);
  console.log(`Environments: ${stats.environmentCount}`);
  console.log(`Conversation threads: ${stats.threadCount}`);
  console.log(`Global events: ${stats.globalEventCount}`);
  console.log(`Cross-talk events: ${stats.crossTalkEventCount}`);
}

/**
 * Run all simulation examples
 */
async function runAllSimulationExamples() {
  try {
    console.log('🌍 AI Conductor Simulation Engine Examples\n');

    // Example 1: Basic simulation
    await basicSimulationExample();

    // Example 2: Multiple environments
    await multiEnvironmentExample();

    // Example 3: World coordination
    await worldCoordinationExample();

    // Example 4: Custom environment
    await customEnvironmentExample();

    // Example 5: Complex world
    await complexWorldExample();

    console.log('\n✅ All simulation examples completed successfully!');
  } catch (error) {
    console.error('❌ Simulation example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllSimulationExamples();
}

export {
  basicSimulationExample,
  multiEnvironmentExample,
  worldCoordinationExample,
  customEnvironmentExample,
  complexWorldExample,
  runAllSimulationExamples
}; 