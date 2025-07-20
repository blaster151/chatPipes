import { 
  AgentSession, 
  Environment, 
  ConvoThread, 
  World,
  createCoffeeShopEnvironment,
  EntanglementConfig
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Basic Multi-Conversation Entanglement
 */
async function basicEntanglementExample() {
  console.log('🎭 Example 1: Basic Multi-Conversation Entanglement\n');

  // Create world with entanglement enabled
  const world = new World({
    id: 'entanglement-world',
    name: 'Multi-Conversation Entanglement World',
    description: 'A world demonstrating complex cross-conversation interactions.',
    globalClockSpeed: 2000,
    enableCrossTalk: true,
    enableMultiConvoEntanglement: true,
    entanglementConfig: {
      enabled: true,
      crossTalkProbability: 0.4,
      thoughtDiffusionProbability: 0.5,
      environmentalDiffusion: true,
      overhearingRange: 3,
      emotionalContagion: true,
      tensionPropagation: true,
      trustDiffusion: true,
      maxEntanglementDepth: 3,
      diffusionDecay: 0.7
    }
  });

  // Create coffee shop environment
  const cafe = createCoffeeShopEnvironment('entanglement-cafe');
  world.registerEnvironment(cafe);

  // Create agents with distinct personalities
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Alice, a detective. You are naturally suspicious and observant. You often have private thoughts about people\'s motives.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Bob, a journalist. You are curious and sometimes manipulative. You often think about how to get information from people.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Clara, a therapist. You are empathetic but also analytical. You often have thoughts about people\'s emotional states.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Dev, a salesman. You are charming but sometimes insincere. You often think about how to persuade people.',
      useStealth: true
    }).init()
  ]);

  // Create conversation threads with dual conversation enabled
  const thread1 = new ConvoThread({
    id: 'detective-journalist',
    name: 'Detective & Journalist',
    participants: [agents[0], agents[1]],
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.5,
      thoughtTypes: ['observation', 'judgment', 'suspicion', 'curiosity'],
      behavioralImpact: true
    },
    maxRounds: 4
  });

  const thread2 = new ConvoThread({
    id: 'therapist-salesman',
    name: 'Therapist & Salesman',
    participants: [agents[2], agents[3]],
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.5,
      thoughtTypes: ['observation', 'judgment', 'admiration', 'concern'],
      behavioralImpact: true
    },
    maxRounds: 4
  });

  // Register threads with world
  world.registerConvoThread(thread1);
  world.registerConvoThread(thread2);
  world.connectConvoToEnv('detective-journalist', 'entanglement-cafe');
  world.connectConvoToEnv('therapist-salesman', 'entanglement-cafe');

  // Listen for entanglement events
  world.on('entanglement_event', (data) => {
    const event = data.event;
    console.log(`\n🎭 Entanglement Event:`);
    console.log(`   Type: ${event.type}`);
    console.log(`   From: ${event.sourceThreadId} → ${event.targetThreadId || 'environment'}`);
    console.log(`   Content: ${event.content}`);
    console.log(`   Intensity: ${event.intensity.toFixed(2)}`);
    
    if (event.metadata.originalThought) {
      console.log(`   Original thought: *${event.metadata.originalThought.content}*`);
    }
  });

  world.on('thought_diffusion_applied', (data) => {
    console.log(`\n💭 Thought Diffusion Applied:`);
    console.log(`   Target: ${data.diffusedThought.speakerId}`);
    console.log(`   Content: *${data.diffusedThought.content}*`);
    console.log(`   Type: ${data.diffusedThought.type}`);
  });

  // Listen for dual conversation events
  thread1.on('dual_exchange', (data) => {
    console.log(`\n💬 ${data.exchange.speakerId}: "${data.exchange.spoken}"`);
    if (data.exchange.unspoken) {
      console.log(`   *${data.exchange.unspoken.content}*`);
    }
  });

  thread2.on('dual_exchange', (data) => {
    console.log(`\n💬 ${data.exchange.speakerId}: "${data.exchange.spoken}"`);
    if (data.exchange.unspoken) {
      console.log(`   *${data.exchange.unspoken.content}*`);
    }
  });

  // Start world and conversations
  world.start();
  await Promise.all([thread1.start(), thread2.start()]);

  // Let the entanglement unfold
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Show entanglement statistics
  console.log('\n📊 Entanglement Statistics:');
  console.log(world.getEntanglementStats());

  console.log('\n🌍 Environmental Moods:');
  const moods = world.getAllEnvironmentalMoods();
  moods.forEach((mood, envId) => {
    console.log(`\n${envId}:`);
    console.log(`   Overall mood: ${mood.overallMood}`);
    console.log(`   Tension: ${mood.tensionLevel.toFixed(2)}`);
    console.log(`   Trust: ${mood.trustLevel.toFixed(2)}`);
    console.log(`   Energy: ${mood.energyLevel.toFixed(2)}`);
    console.log(`   Contributing factors: ${mood.contributingFactors.join(', ')}`);
  });

  console.log('\n🎭 Entanglement History:');
  const history = world.getEntanglementHistory(10);
  history.forEach(event => {
    const icon = event.type === 'cross_talk' ? '🎭' :
                 event.type === 'thought_diffusion' ? '💭' :
                 event.type === 'emotional_contagion' ? '😊' :
                 event.type === 'tension_propagation' ? '😤' :
                 event.type === 'environmental_mood_shift' ? '🌍' : '🔗';
    console.log(`   ${icon} ${event.type}: ${event.content}`);
  });

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 2: Complex Entanglement Chain
 */
async function complexEntanglementChainExample() {
  console.log('\n🔗 Example 2: Complex Entanglement Chain\n');

  const world = new World({
    id: 'complex-entanglement-world',
    name: 'Complex Entanglement Chain World',
    description: 'A world demonstrating complex entanglement chains.',
    enableCrossTalk: true,
    enableMultiConvoEntanglement: true,
    entanglementConfig: {
      enabled: true,
      crossTalkProbability: 0.6, // Higher probability for demo
      thoughtDiffusionProbability: 0.7, // Higher probability for demo
      environmentalDiffusion: true,
      overhearingRange: 4,
      emotionalContagion: true,
      tensionPropagation: true,
      trustDiffusion: true,
      maxEntanglementDepth: 4,
      diffusionDecay: 0.8
    }
  });

  const cafe = createCoffeeShopEnvironment('complex-cafe');
  world.registerEnvironment(cafe);

  // Create more agents for complex interactions
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Emma, a detective investigating a case. You are very suspicious and notice everything.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Frank, a journalist looking for a story. You are manipulative and think about how to get information.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Grace, a therapist who is very empathetic. You analyze people\'s emotional states.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Henry, a salesman who is charming but insincere. You think about how to persuade people.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Iris, a student who is curious and observant. You notice social dynamics.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Jack, a businessman who is analytical and suspicious. You think about people\'s motives.',
      useStealth: true
    }).init()
  ]);

  // Create three conversation threads
  const thread1 = new ConvoThread({
    id: 'detective-journalist',
    name: 'Detective & Journalist',
    participants: [agents[0], agents[1]],
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.6,
      thoughtTypes: ['suspicion', 'judgment', 'curiosity'],
      behavioralImpact: true
    },
    maxRounds: 3
  });

  const thread2 = new ConvoThread({
    id: 'therapist-salesman',
    name: 'Therapist & Salesman',
    participants: [agents[2], agents[3]],
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.6,
      thoughtTypes: ['observation', 'admiration', 'concern'],
      behavioralImpact: true
    },
    maxRounds: 3
  });

  const thread3 = new ConvoThread({
    id: 'student-businessman',
    name: 'Student & Businessman',
    participants: [agents[4], agents[5]],
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.6,
      thoughtTypes: ['curiosity', 'judgment', 'suspicion'],
      behavioralImpact: true
    },
    maxRounds: 3
  });

  // Register all threads
  world.registerConvoThread(thread1);
  world.registerConvoThread(thread2);
  world.registerConvoThread(thread3);
  world.connectConvoToEnv('detective-journalist', 'complex-cafe');
  world.connectConvoToEnv('therapist-salesman', 'complex-cafe');
  world.connectConvoToEnv('student-businessman', 'complex-cafe');

  // Track entanglement chain
  let chainCount = 0;

  world.on('entanglement_event', (data) => {
    const event = data.event;
    chainCount++;
    
    console.log(`\n🔗 Chain ${chainCount} - ${event.type.toUpperCase()}:`);
    console.log(`   ${event.sourceThreadId} → ${event.targetThreadId || 'environment'}`);
    console.log(`   "${event.content}"`);
    console.log(`   Intensity: ${event.intensity.toFixed(2)}`);
    
    if (event.metadata.diffusionPath) {
      console.log(`   Path: ${event.metadata.diffusionPath.join(' → ')}`);
    }
  });

  // Start simulation
  world.start();
  await Promise.all([thread1.start(), thread2.start(), thread3.start()]);

  // Let complex entanglement unfold
  await new Promise(resolve => setTimeout(resolve, 40000));

  // Show complex entanglement analysis
  console.log('\n📊 Complex Entanglement Analysis:');
  console.log(`Total entanglement events: ${chainCount}`);

  console.log('\n🎭 Active Entanglement Chains:');
  const activeChains = world.getActiveEntanglementChains();
  activeChains.forEach(chain => {
    console.log(`\nChain ${chain.id}:`);
    console.log(`   Depth: ${chain.depth}`);
    console.log(`   Events: ${chain.events.length}`);
    console.log(`   Threads affected: ${chain.impact.threadsAffected.join(', ')}`);
    console.log(`   Total intensity: ${chain.impact.totalIntensity.toFixed(2)}`);
  });

  console.log('\n🌍 Environmental Impact:');
  const mood = world.getEnvironmentalMood('complex-cafe');
  if (mood) {
    console.log(`Overall mood: ${mood.overallMood}`);
    console.log(`Tension level: ${mood.tensionLevel.toFixed(2)}`);
    console.log(`Trust level: ${mood.trustLevel.toFixed(2)}`);
    console.log(`Energy level: ${mood.energyLevel.toFixed(2)}`);
    console.log(`Contributing factors: ${mood.contributingFactors.join(', ')}`);
  }

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 3: Environmental Mood Diffusion
 */
async function environmentalMoodDiffusionExample() {
  console.log('\n🌍 Example 3: Environmental Mood Diffusion\n');

  const world = new World({
    id: 'mood-diffusion-world',
    name: 'Environmental Mood Diffusion World',
    description: 'A world demonstrating how moods diffuse through environments.',
    enableCrossTalk: true,
    enableMultiConvoEntanglement: true,
    entanglementConfig: {
      enabled: true,
      crossTalkProbability: 0.3,
      thoughtDiffusionProbability: 0.5,
      environmentalDiffusion: true,
      overhearingRange: 3,
      emotionalContagion: true,
      tensionPropagation: true,
      trustDiffusion: true,
      maxEntanglementDepth: 3,
      diffusionDecay: 0.6
    }
  });

  const cafe = createCoffeeShopEnvironment('mood-cafe');
  world.registerEnvironment(cafe);

  // Create agents with contrasting emotional states
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Alice, a very suspicious and paranoid person. You think everyone is hiding something.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Bob, a very trusting and optimistic person. You see the best in everyone.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Clara, a very anxious and worried person. You are concerned about everything.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Dev, a very confident and charismatic person. You are excited about everything.',
      useStealth: true
    }).init()
  ]);

  // Create conversation threads
  const thread1 = new ConvoThread({
    id: 'suspicious-trusting',
    name: 'Suspicious & Trusting',
    participants: [agents[0], agents[1]],
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.7,
      thoughtTypes: ['suspicion', 'judgment', 'doubt'],
      behavioralImpact: true
    },
    maxRounds: 4
  });

  const thread2 = new ConvoThread({
    id: 'anxious-confident',
    name: 'Anxious & Confident',
    participants: [agents[2], agents[3]],
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.7,
      thoughtTypes: ['concern', 'excitement', 'admiration'],
      behavioralImpact: true
    },
    maxRounds: 4
  });

  world.registerConvoThread(thread1);
  world.registerConvoThread(thread2);
  world.connectConvoToEnv('suspicious-trusting', 'mood-cafe');
  world.connectConvoToEnv('anxious-confident', 'mood-cafe');

  // Track environmental mood changes
  let moodUpdates = 0;

  world.on('entanglement_event', (data) => {
    const event = data.event;
    
    if (event.type === 'environmental_mood_shift') {
      moodUpdates++;
      console.log(`\n🌍 Mood Update ${moodUpdates}:`);
      console.log(`   New mood: ${event.metadata.environmentalImpact}`);
      console.log(`   Tension: ${event.metadata.tensionLevel?.toFixed(2)}`);
      console.log(`   Trust: ${event.metadata.trustLevel?.toFixed(2)}`);
      console.log(`   Triggered by: ${event.sourceAgentId}`);
    }
  });

  // Start simulation
  world.start();
  await Promise.all([thread1.start(), thread2.start()]);

  // Let mood diffusion occur
  await new Promise(resolve => setTimeout(resolve, 35000));

  // Show final environmental state
  console.log('\n🌍 Final Environmental State:');
  const finalMood = world.getEnvironmentalMood('mood-cafe');
  if (finalMood) {
    console.log(`Overall mood: ${finalMood.overallMood}`);
    console.log(`Tension level: ${finalMood.tensionLevel.toFixed(2)}`);
    console.log(`Trust level: ${finalMood.trustLevel.toFixed(2)}`);
    console.log(`Energy level: ${finalMood.energyLevel.toFixed(2)}`);
    console.log(`Curiosity level: ${finalMood.curiosityLevel.toFixed(2)}`);
    console.log(`Suspicion level: ${finalMood.suspicionLevel.toFixed(2)}`);
    console.log(`Contributing factors: ${finalMood.contributingFactors.join(', ')}`);
  }

  console.log(`\n📊 Total mood updates: ${moodUpdates}`);

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 4: Dynamic Entanglement Configuration
 */
async function dynamicEntanglementConfigurationExample() {
  console.log('\n⚙️ Example 4: Dynamic Entanglement Configuration\n');

  const world = new World({
    id: 'dynamic-entanglement-world',
    name: 'Dynamic Entanglement Configuration World',
    description: 'A world demonstrating dynamic entanglement configuration.',
    enableCrossTalk: true,
    enableMultiConvoEntanglement: false // Start without entanglement
  });

  const cafe = createCoffeeShopEnvironment('dynamic-cafe');
  world.registerEnvironment(cafe);

  // Create agents
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Agent Alpha. You adapt to the environment around you.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Agent Beta. You are responsive to social dynamics.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Agent Gamma. You notice changes in atmosphere.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Agent Delta. You are sensitive to emotional shifts.',
      useStealth: true
    }).init()
  ]);

  const thread1 = new ConvoThread({
    id: 'alpha-beta',
    name: 'Alpha & Beta',
    participants: [agents[0], agents[1]],
    environment: cafe,
    enableDualConversation: true,
    maxRounds: 3
  });

  const thread2 = new ConvoThread({
    id: 'gamma-delta',
    name: 'Gamma & Delta',
    participants: [agents[2], agents[3]],
    environment: cafe,
    enableDualConversation: true,
    maxRounds: 3
  });

  world.registerConvoThread(thread1);
  world.registerConvoThread(thread2);
  world.connectConvoToEnv('alpha-beta', 'dynamic-cafe');
  world.connectConvoToEnv('gamma-delta', 'dynamic-cafe');

  // Start world and conversations
  world.start();
  await Promise.all([thread1.start(), thread2.start()]);

  // Let conversations run without entanglement
  console.log('🔄 Running without entanglement...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Enable entanglement with low settings
  console.log('\n⚙️ Enabling entanglement with low settings...');
  await world.enableMultiConvoEntanglement({
    crossTalkProbability: 0.2,
    thoughtDiffusionProbability: 0.3,
    environmentalDiffusion: true,
    emotionalContagion: true,
    tensionPropagation: false,
    trustDiffusion: false
  });

  await new Promise(resolve => setTimeout(resolve, 15000));

  // Increase entanglement intensity
  console.log('\n⚙️ Increasing entanglement intensity...');
  const entanglement = world.getMultiConvoEntanglement();
  if (entanglement) {
    entanglement.updateConfig({
      crossTalkProbability: 0.6,
      thoughtDiffusionProbability: 0.7,
      tensionPropagation: true,
      trustDiffusion: true
    });
  }

  await new Promise(resolve => setTimeout(resolve, 15000));

  // Show configuration changes
  console.log('\n📊 Final Entanglement Configuration:');
  console.log(world.getEntanglementStats());

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Run all multi-conversation entanglement examples
 */
async function runAllMultiConvoEntanglementExamples() {
  try {
    console.log('🎭 Multi-Conversation Entanglement Examples\n');

    // Example 1: Basic multi-conversation entanglement
    await basicEntanglementExample();

    // Example 2: Complex entanglement chain
    await complexEntanglementChainExample();

    // Example 3: Environmental mood diffusion
    await environmentalMoodDiffusionExample();

    // Example 4: Dynamic entanglement configuration
    await dynamicEntanglementConfigurationExample();

    console.log('\n✅ All multi-conversation entanglement examples completed successfully!');
  } catch (error) {
    console.error('❌ Multi-conversation entanglement example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllMultiConvoEntanglementExamples();
}

export {
  basicEntanglementExample,
  complexEntanglementChainExample,
  environmentalMoodDiffusionExample,
  dynamicEntanglementConfigurationExample,
  runAllMultiConvoEntanglementExamples
}; 