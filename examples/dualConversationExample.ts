import { 
  AgentSession, 
  Environment, 
  ConvoThread, 
  World,
  DualConversationManager,
  createCoffeeShopEnvironment,
  InnerThoughtConfig
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Basic Dual Conversation Setup
 */
async function basicDualConversationExample() {
  console.log('💬 Example 1: Basic Dual Conversation Setup\n');

  // Create world with dual conversation enabled
  const world = new World({
    id: 'dual-conversation-world',
    name: 'Dual Conversation World',
    description: 'A world demonstrating spoken and unspoken conversations.',
    globalClockSpeed: 2000,
    enableCrossTalk: true,
    enableMonitorAgent: false
  });

  // Create coffee shop environment
  const cafe = createCoffeeShopEnvironment('dual-cafe');
  world.registerEnvironment(cafe);

  // Create agents with distinct personalities
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Clara, a confident businesswoman. You are observant and often have private thoughts about people you meet.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Dev, a software developer who is somewhat introverted. You tend to analyze situations internally.',
      useStealth: true
    }).init()
  ]);

  // Create conversation thread with dual conversation enabled
  const thread = new ConvoThread({
    id: 'dual-thread',
    name: 'Clara & Dev Conversation',
    participants: agents,
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.4, // 40% chance of inner thoughts
      maxThoughtsPerExchange: 1,
      thoughtTypes: ['observation', 'judgment', 'suspicion', 'admiration', 'doubt'],
      behavioralImpact: true,
      memoryRetention: 0.8,
      thoughtIntensity: 0.6
    },
    maxRounds: 4,
    turnDelay: 4000
  });

  // Register thread with world
  world.registerConvoThread(thread);
  world.connectConvoToEnv('dual-thread', 'dual-cafe');

  // Listen for dual conversation events
  thread.on('dual_exchange', (data) => {
    console.log(`\n💬 Exchange from ${data.exchange.speakerId}:`);
    console.log(`   Spoken: "${data.exchange.spoken}"`);
    
    if (data.exchange.unspoken) {
      console.log(`   *${data.exchange.unspoken.content}*`);
      console.log(`   Thought type: ${data.exchange.unspoken.type}`);
      console.log(`   Intensity: ${data.exchange.unspoken.intensity.toFixed(2)}`);
    }
  });

  thread.on('behavioral_state_updated', (data) => {
    console.log(`\n🧠 Behavioral update for ${data.agentId}:`);
    console.log(`   Trust: ${data.newState.trust.toFixed(2)}`);
    console.log(`   Suspicion: ${data.newState.suspicion.toFixed(2)}`);
    console.log(`   Engagement: ${data.newState.engagement.toFixed(2)}`);
    console.log(`   Curiosity: ${data.newState.curiosity.toFixed(2)}`);
  });

  // Start world and conversation
  world.start();
  await thread.start();

  // Let the conversation run
  await new Promise(resolve => setTimeout(resolve, 25000));

  // Show dual conversation statistics
  console.log('\n📊 Dual Conversation Statistics:');
  console.log(thread.getDualConversationStats());

  console.log('\n🧠 Agent Memories:');
  agents.forEach(agent => {
    const memory = thread.getAgentMemory(agent.id);
    if (memory) {
      console.log(`\n${agent.id}:`);
      console.log(`   Thoughts: ${memory.thoughts.length}`);
      console.log(`   Trust: ${memory.behavioralState.trust.toFixed(2)}`);
      console.log(`   Suspicion: ${memory.behavioralState.suspicion.toFixed(2)}`);
      console.log(`   Engagement: ${memory.behavioralState.engagement.toFixed(2)}`);
    }
  });

  console.log('\n💭 Recent Thoughts:');
  agents.forEach(agent => {
    const thoughts = thread.getAgentThoughts(agent.id, 3);
    if (thoughts.length > 0) {
      console.log(`\n${agent.id}:`);
      thoughts.forEach(thought => {
        console.log(`   *${thought.content}* (${thought.type})`);
      });
    }
  });

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 2: Advanced Dual Conversation with Behavioral Impact
 */
async function advancedDualConversationExample() {
  console.log('\n🧠 Example 2: Advanced Dual Conversation with Behavioral Impact\n');

  const world = new World({
    id: 'advanced-dual-world',
    name: 'Advanced Dual Conversation World',
    description: 'A world demonstrating complex dual conversation dynamics.',
    enableCrossTalk: true,
    enableMonitorAgent: false
  });

  const cafe = createCoffeeShopEnvironment('advanced-cafe');
  world.registerEnvironment(cafe);

  // Create agents with complex personalities
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
      systemPrompt: 'You are Carol, a therapist. You are empathetic but also analytical. You often have thoughts about people\'s emotional states.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Dave, a salesman. You are charming but sometimes insincere. You often think about how to persuade people.',
      useStealth: true
    }).init()
  ]);

  // Create conversation thread with advanced dual conversation
  const thread = new ConvoThread({
    id: 'advanced-dual-thread',
    name: 'Complex Group Conversation',
    participants: agents,
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.5, // 50% chance of inner thoughts
      maxThoughtsPerExchange: 1,
      thoughtTypes: ['observation', 'judgment', 'suspicion', 'admiration', 'doubt', 'amusement', 'frustration', 'curiosity', 'concern', 'excitement'],
      behavioralImpact: true,
      memoryRetention: 0.9,
      thoughtIntensity: 0.7
    },
    maxRounds: 6,
    turnDelay: 3000
  });

  world.registerConvoThread(thread);
  world.connectConvoToEnv('advanced-dual-thread', 'advanced-cafe');

  // Listen for dual conversation events
  thread.on('dual_exchange', (data) => {
    const exchange = data.exchange;
    const speaker = exchange.speakerId;
    const spoken = exchange.spoken;
    const unspoken = exchange.unspoken;

    console.log(`\n💬 ${speaker}: "${spoken}"`);
    
    if (unspoken) {
      const emoji = getThoughtEmoji(unspoken.type);
      console.log(`${emoji} *${unspoken.content}*`);
      console.log(`   Type: ${unspoken.type}, Intensity: ${unspoken.intensity.toFixed(2)}`);
      
      if (unspoken.behavioralImpact) {
        const impact = unspoken.behavioralImpact;
        const changes = [];
        if (impact.trustChange !== 0) changes.push(`Trust: ${impact.trustChange > 0 ? '+' : ''}${impact.trustChange.toFixed(2)}`);
        if (impact.suspicionChange !== 0) changes.push(`Suspicion: ${impact.suspicionChange > 0 ? '+' : ''}${impact.suspicionChange.toFixed(2)}`);
        if (impact.engagementChange !== 0) changes.push(`Engagement: ${impact.engagementChange > 0 ? '+' : ''}${impact.engagementChange.toFixed(2)}`);
        if (changes.length > 0) {
          console.log(`   Behavioral changes: ${changes.join(', ')}`);
        }
      }
    }
  });

  thread.on('behavioral_state_updated', (data) => {
    console.log(`\n🧠 ${data.agentId} behavioral update:`);
    const state = data.newState;
    console.log(`   Trust: ${'█'.repeat(Math.floor((state.trust + 1) * 5))}${'░'.repeat(10 - Math.floor((state.trust + 1) * 5))} ${(state.trust * 100).toFixed(0)}%`);
    console.log(`   Suspicion: ${'█'.repeat(Math.floor((state.suspicion + 1) * 5))}${'░'.repeat(10 - Math.floor((state.suspicion + 1) * 5))} ${(state.suspicion * 100).toFixed(0)}%`);
    console.log(`   Engagement: ${'█'.repeat(Math.floor((state.engagement + 1) * 5))}${'░'.repeat(10 - Math.floor((state.engagement + 1) * 5))} ${(state.engagement * 100).toFixed(0)}%`);
    console.log(`   Curiosity: ${'█'.repeat(Math.floor((state.curiosity + 1) * 5))}${'░'.repeat(10 - Math.floor((state.curiosity + 1) * 5))} ${(state.curiosity * 100).toFixed(0)}%`);
  });

  // Start simulation
  world.start();
  await thread.start();

  // Let the complex conversation unfold
  await new Promise(resolve => setTimeout(resolve, 40000));

  // Show comprehensive statistics
  console.log('\n📊 Advanced Dual Conversation Statistics:');
  const stats = thread.getDualConversationStats();
  console.log(`Total exchanges: ${stats.totalExchanges}`);
  console.log(`Total thoughts: ${stats.totalThoughts}`);
  console.log(`Thought probability: ${(stats.probability * 100).toFixed(0)}%`);

  console.log('\n🧠 Agent Behavioral States:');
  agents.forEach(agent => {
    const state = thread.getAgentBehavioralState(agent.id);
    if (state) {
      console.log(`\n${agent.id}:`);
      console.log(`   Trust: ${state.trust.toFixed(2)}`);
      console.log(`   Suspicion: ${state.suspicion.toFixed(2)}`);
      console.log(`   Engagement: ${state.engagement.toFixed(2)}`);
      console.log(`   Curiosity: ${state.curiosity.toFixed(2)}`);
      console.log(`   Sarcasm: ${state.sarcasm.toFixed(2)}`);
      console.log(`   Patience: ${state.patience.toFixed(2)}`);
    }
  });

  console.log('\n💭 Thought Type Distribution:');
  const thoughtTypes = new Map<string, number>();
  agents.forEach(agent => {
    const thoughts = thread.getAgentThoughts(agent.id);
    thoughts.forEach(thought => {
      thoughtTypes.set(thought.type, (thoughtTypes.get(thought.type) || 0) + 1);
    });
  });
  
  Array.from(thoughtTypes.entries())
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} thoughts`);
    });

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 3: Dynamic Dual Conversation Configuration
 */
async function dynamicDualConversationExample() {
  console.log('\n⚙️ Example 3: Dynamic Dual Conversation Configuration\n');

  const world = new World({
    id: 'dynamic-dual-world',
    name: 'Dynamic Dual Conversation World',
    description: 'A world demonstrating dynamic dual conversation configuration.',
    enableCrossTalk: true,
    enableMonitorAgent: false
  });

  const cafe = createCoffeeShopEnvironment('dynamic-cafe');
  world.registerEnvironment(cafe);

  // Create agents
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Agent Alpha. You adapt your thinking based on the situation.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Agent Beta. You are responsive to environmental changes.',
      useStealth: true
    }).init()
  ]);

  const thread = new ConvoThread({
    id: 'dynamic-dual-thread',
    name: 'Dynamic Dual Conversation',
    participants: agents,
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.2, // Start with low probability
      maxThoughtsPerExchange: 1,
      thoughtTypes: ['observation', 'judgment'],
      behavioralImpact: true,
      memoryRetention: 0.8,
      thoughtIntensity: 0.5
    },
    maxRounds: 6
  });

  world.registerConvoThread(thread);
  world.connectConvoToEnv('dynamic-dual-thread', 'dynamic-cafe');

  // Listen for dual conversation events
  thread.on('dual_exchange', (data) => {
    console.log(`\n💬 ${data.exchange.speakerId}: "${data.exchange.spoken}"`);
    if (data.exchange.unspoken) {
      console.log(`   *${data.exchange.unspoken.content}*`);
    }
  });

  // Start conversation
  world.start();
  await thread.start();

  // Let conversation run with low thought probability
  console.log('🔄 Running with low thought probability (20%)...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Increase thought probability
  console.log('\n⚙️ Increasing thought probability to 60%...');
  thread.updateDualConversationConfig({
    probability: 0.6,
    thoughtTypes: ['observation', 'judgment', 'suspicion', 'curiosity']
  });

  await new Promise(resolve => setTimeout(resolve, 15000));

  // Increase thought intensity and add more types
  console.log('\n⚙️ Increasing thought intensity and adding more types...');
  thread.updateDualConversationConfig({
    thoughtIntensity: 0.8,
    thoughtTypes: ['observation', 'judgment', 'suspicion', 'curiosity', 'amusement', 'frustration']
  });

  await new Promise(resolve => setTimeout(resolve, 15000));

  // Show configuration changes
  console.log('\n📊 Configuration Changes:');
  console.log('Final configuration:', thread.getDualConversationConfig());

  console.log('\n📈 Statistics:');
  console.log(thread.getDualConversationStats());

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 4: Relationship Tracking and Impact
 */
async function relationshipTrackingExample() {
  console.log('\n💕 Example 4: Relationship Tracking and Impact\n');

  const world = new World({
    id: 'relationship-world',
    name: 'Relationship Tracking World',
    description: 'A world demonstrating relationship tracking through dual conversations.',
    enableCrossTalk: true,
    enableMonitorAgent: false
  });

  const cafe = createCoffeeShopEnvironment('relationship-cafe');
  world.registerEnvironment(cafe);

  // Create agents with relationship dynamics
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Emma, a friendly and trusting person. You tend to see the best in people.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Frank, a cautious person who takes time to trust others. You are observant of people\'s behavior.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Grace, a charismatic person who can be manipulative. You often think about how to influence others.',
      useStealth: true
    }).init()
  ]);

  const thread = new ConvoThread({
    id: 'relationship-thread',
    name: 'Relationship Dynamics',
    participants: agents,
    environment: cafe,
    enableDualConversation: true,
    dualConversationConfig: {
      enabled: true,
      probability: 0.4,
      maxThoughtsPerExchange: 1,
      thoughtTypes: ['observation', 'judgment', 'suspicion', 'admiration', 'doubt', 'curiosity'],
      behavioralImpact: true,
      memoryRetention: 0.9,
      thoughtIntensity: 0.6
    },
    maxRounds: 8
  });

  world.registerConvoThread(thread);
  world.connectConvoToEnv('relationship-thread', 'relationship-cafe');

  // Track relationship scores
  const relationshipScores: { [key: string]: number[] } = {};

  thread.on('dual_exchange', (data) => {
    const exchange = data.exchange;
    console.log(`\n💬 ${exchange.speakerId}: "${exchange.spoken}"`);
    
    if (exchange.unspoken) {
      console.log(`   *${exchange.unspoken.content}*`);
    }

    // Track relationship scores
    agents.forEach(agent => {
      const score = thread.getRelationshipScore(exchange.speakerId, agent.id);
      if (!relationshipScores[`${exchange.speakerId}-${agent.id}`]) {
        relationshipScores[`${exchange.speakerId}-${agent.id}`] = [];
      }
      relationshipScores[`${exchange.speakerId}-${agent.id}`].push(score);
    });
  });

  // Start simulation
  world.start();
  await thread.start();

  // Let relationships develop
  await new Promise(resolve => setTimeout(resolve, 35000));

  // Show relationship analysis
  console.log('\n💕 Relationship Analysis:');
  
  const agentIds = agents.map(agent => agent.id);
  for (let i = 0; i < agentIds.length; i++) {
    for (let j = i + 1; j < agentIds.length; j++) {
      const agentA = agentIds[i];
      const agentB = agentIds[j];
      
      const scoreAB = thread.getRelationshipScore(agentA, agentB);
      const scoreBA = thread.getRelationshipScore(agentB, agentA);
      
      console.log(`\n${agentA} → ${agentB}: ${scoreAB.toFixed(2)}`);
      console.log(`${agentB} → ${agentA}: ${scoreBA.toFixed(2)}`);
      
      const avgScore = (scoreAB + scoreBA) / 2;
      const relationship = avgScore > 0.5 ? 'Positive' : 
                          avgScore > -0.2 ? 'Neutral' : 'Negative';
      
      console.log(`   Average: ${avgScore.toFixed(2)} (${relationship})`);
    }
  }

  console.log('\n📊 Final Statistics:');
  console.log(thread.getDualConversationStats());

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Helper function to get emoji for thought types
 */
function getThoughtEmoji(type: string): string {
  const emojis: { [key: string]: string } = {
    'observation': '👁️',
    'judgment': '🤔',
    'suspicion': '🤨',
    'admiration': '😊',
    'doubt': '🤷',
    'amusement': '😄',
    'frustration': '😤',
    'curiosity': '🤔',
    'concern': '😟',
    'excitement': '😃'
  };
  return emojis[type] || '💭';
}

/**
 * Run all dual conversation examples
 */
async function runAllDualConversationExamples() {
  try {
    console.log('💬 Dual Conversation Examples\n');

    // Example 1: Basic dual conversation setup
    await basicDualConversationExample();

    // Example 2: Advanced dual conversation with behavioral impact
    await advancedDualConversationExample();

    // Example 3: Dynamic dual conversation configuration
    await dynamicDualConversationExample();

    // Example 4: Relationship tracking and impact
    await relationshipTrackingExample();

    console.log('\n✅ All dual conversation examples completed successfully!');
  } catch (error) {
    console.error('❌ Dual conversation example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllDualConversationExamples();
}

export {
  basicDualConversationExample,
  advancedDualConversationExample,
  dynamicDualConversationExample,
  relationshipTrackingExample,
  runAllDualConversationExamples
}; 