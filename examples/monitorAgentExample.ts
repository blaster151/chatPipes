import { 
  AgentSession, 
  Environment, 
  ConvoThread, 
  World,
  MonitorAgent,
  createCoffeeShopEnvironment,
  createOfficeEnvironment,
  createParkEnvironment
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Basic Monitor Agent Setup
 */
async function basicMonitorAgentExample() {
  console.log('✨ Example 1: Basic Monitor Agent Setup\n');

  // Create world with monitor agent enabled
  const world = new World({
    id: 'monitor-demo-world',
    name: 'Monitor Agent Demo World',
    description: 'A world demonstrating AI-powered narrative monitoring.',
    globalClockSpeed: 2000,
    enableCrossTalk: true,
    enableMonitorAgent: true,
    monitorAgentConfig: {
      llmProvider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      capabilities: {
        canGenerateInterjections: true,
        canDecideCrossTalk: true,
        canNarrateAmbient: true,
        canControlNarrative: true,
        canAnalyzeEmotions: true,
        canPredictOutcomes: true,
        canSuggestEvents: true,
        maxConcurrentThreads: 5,
        maxInterjectionsPerMinute: 3
      },
      updateFrequency: 20000, // 20 seconds
      enableRealTimeMonitoring: true,
      enableInterjectionGeneration: true,
      enableCrossTalkDecision: true,
      enableAmbientNarration: true
    }
  });

  // Create coffee shop environment
  const cafe = createCoffeeShopEnvironment('monitor-cafe');
  world.registerEnvironment(cafe);

  // Create agents with distinct personalities
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Alice, a friendly barista who loves talking about coffee and art. You are observant and notice conversations around you.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Bob, a regular customer who enjoys deep conversations about philosophy. You are curious about other people\'s discussions.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Clara, a student studying for exams. You are focused but sometimes get distracted by interesting conversations.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Dev, a software developer working remotely. You are analytical and sometimes overhear technical discussions.',
      useStealth: true
    }).init()
  ]);

  // Create conversation threads
  const table1 = new ConvoThread({
    id: 'table1',
    name: 'Coffee Discussion',
    participants: [agents[0], agents[1]],
    environment: cafe,
    maxRounds: 4,
    turnDelay: 3000
  });

  const table2 = new ConvoThread({
    id: 'table2',
    name: 'Study Session',
    participants: [agents[2], agents[3]],
    environment: cafe,
    maxRounds: 4,
    turnDelay: 3000
  });

  // Register threads with world
  world.registerConvoThread(table1);
  world.registerConvoThread(table2);

  // Connect threads to environment
  world.connectConvoToEnv('table1', 'monitor-cafe');
  world.connectConvoToEnv('table2', 'monitor-cafe');

  // Listen for monitor agent events
  world.on('monitor_interjection_suggested', (data) => {
    console.log(`\n💡 Monitor suggests interjection:`);
    console.log(`   Target: ${data.suggestion.target}`);
    console.log(`   Content: ${data.suggestion.content}`);
    console.log(`   Priority: ${data.suggestion.priority}`);
    console.log(`   Reasoning: ${data.suggestion.reasoning}`);
  });

  world.on('monitor_narrative_suggestion', (data) => {
    console.log(`\n📝 Monitor narrative suggestion:`);
    console.log(`   Type: ${data.suggestion.type}`);
    console.log(`   Target: ${data.suggestion.target}`);
    console.log(`   Content: ${data.suggestion.content}`);
    console.log(`   Priority: ${data.suggestion.priority}`);
  });

  world.on('monitor_emotional_analysis', (data) => {
    console.log(`\n😊 Emotional analysis for ${data.analysis.threadId}:`);
    console.log(`   Mood: ${data.analysis.overallMood}`);
    console.log(`   Tension: ${data.analysis.tensionLevel.toFixed(2)}`);
    console.log(`   Engagement: ${data.analysis.engagementLevel.toFixed(2)}`);
    console.log(`   Emotions: ${data.analysis.dominantEmotions.join(', ')}`);
    console.log(`   Trajectory: ${data.analysis.emotionalTrajectory}`);
  });

  world.on('monitor_cross_talk_decided', (data) => {
    console.log(`\n🎭 Monitor decided cross-talk:`);
    console.log(`   From: ${data.sourceThread} → To: ${data.targetThread}`);
    console.log(`   Reasoning: ${data.reasoning}`);
    console.log(`   Confidence: ${data.confidence.toFixed(2)}`);
  });

  world.on('monitor_ambient_narration', (data) => {
    console.log(`\n🌿 Monitor ambient narration:`);
    console.log(`   Environment: ${data.environmentId}`);
    console.log(`   Event: ${data.event.description}`);
    console.log(`   Reasoning: ${data.reasoning}`);
  });

  // Start world simulation
  world.start();

  // Start conversations
  await Promise.all([table1.start(), table2.start()]);

  // Let the simulation run
  await new Promise(resolve => setTimeout(resolve, 40000));

  // Show monitor agent statistics
  console.log('\n📊 Monitor Agent Statistics:');
  console.log(world.getMonitorStats());

  console.log('\n📈 Narrative State:');
  console.log(world.getNarrativeState());

  console.log('\n💭 Narrative Suggestions:');
  const suggestions = world.getNarrativeSuggestions(10);
  suggestions.forEach(suggestion => {
    console.log(`   ${suggestion.type}: ${suggestion.content} (Priority: ${suggestion.priority})`);
  });

  console.log('\n😊 Emotional Analyses:');
  const analyses = world.getEmotionalAnalyses();
  analyses.forEach((analysis, threadId) => {
    console.log(`   ${threadId}: ${analysis.overallMood} (Tension: ${analysis.tensionLevel.toFixed(2)})`);
  });

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 2: Advanced Narrative Control
 */
async function advancedNarrativeControlExample() {
  console.log('\n🎭 Example 2: Advanced Narrative Control\n');

  const world = new World({
    id: 'narrative-control-world',
    name: 'Narrative Control World',
    description: 'A world demonstrating advanced narrative control features.',
    enableMonitorAgent: true,
    monitorAgentConfig: {
      llmProvider: 'openai',
      model: 'gpt-4',
      temperature: 0.8, // Higher creativity
      capabilities: {
        canGenerateInterjections: true,
        canDecideCrossTalk: true,
        canNarrateAmbient: true,
        canControlNarrative: true,
        canAnalyzeEmotions: true,
        canPredictOutcomes: true,
        canSuggestEvents: true,
        maxConcurrentThreads: 8,
        maxInterjectionsPerMinute: 5
      },
      updateFrequency: 15000, // More frequent updates
      enableRealTimeMonitoring: true,
      enableNarrativeControl: true,
      enableInterjectionGeneration: true,
      enableCrossTalkDecision: true,
      enableAmbientNarration: true
    }
  });

  // Create multiple environments
  const cafe = createCoffeeShopEnvironment('narrative-cafe');
  const office = createOfficeEnvironment('narrative-office');
  const park = createParkEnvironment('narrative-park');

  world.registerEnvironment(cafe);
  world.registerEnvironment(office);
  world.registerEnvironment(park);

  // Create diverse agents
  const agents = await Promise.all([
    // Cafe agents
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a detective investigating a case. You are observant and notice subtle details in conversations.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a journalist looking for a story. You are always listening for interesting angles.',
      useStealth: true
    }).init(),
    
    // Office agents
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a stressed project manager dealing with deadlines. You are focused but easily distracted.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a creative designer who thinks outside the box. You bring artistic perspective to discussions.',
      useStealth: true
    }).init(),
    
    // Park agents
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a nature photographer who notices beauty in everything. You are peaceful and contemplative.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a fitness trainer who is energetic and motivational. You encourage others to be active.',
      useStealth: true
    }).init()
  ]);

  // Create conversation threads in different environments
  const cafeThread = new ConvoThread({
    id: 'cafe-investigation',
    name: 'Detective & Journalist',
    participants: [agents[0], agents[1]],
    environment: cafe,
    maxRounds: 5
  });

  const officeThread = new ConvoThread({
    id: 'office-creativity',
    name: 'Manager & Designer',
    participants: [agents[2], agents[3]],
    environment: office,
    maxRounds: 5
  });

  const parkThread = new ConvoThread({
    id: 'park-wellness',
    name: 'Photographer & Trainer',
    participants: [agents[4], agents[5]],
    environment: park,
    maxRounds: 5
  });

  // Register all threads
  world.registerConvoThread(cafeThread);
  world.registerConvoThread(officeThread);
  world.registerConvoThread(parkThread);

  // Connect threads to environments
  world.connectConvoToEnv('cafe-investigation', 'narrative-cafe');
  world.connectConvoToEnv('office-creativity', 'narrative-office');
  world.connectConvoToEnv('park-wellness', 'narrative-park');

  // Listen for advanced monitor events
  world.on('monitor_interjection_suggested', (data) => {
    console.log(`\n💡 Interjection for ${data.suggestion.target}:`);
    console.log(`   "${data.suggestion.content}"`);
    console.log(`   Priority: ${data.suggestion.priority}/10`);
  });

  world.on('monitor_narrative_suggestion', (data) => {
    console.log(`\n📝 Narrative intervention:`);
    console.log(`   Type: ${data.suggestion.type}`);
    console.log(`   Target: ${data.suggestion.target}`);
    console.log(`   Action: ${data.suggestion.content}`);
  });

  world.on('monitor_emotional_analysis', (data) => {
    const analysis = data.analysis;
    const emoji = analysis.overallMood === 'positive' ? '😊' : 
                  analysis.overallMood === 'negative' ? '😔' : '😐';
    
    console.log(`\n${emoji} ${analysis.threadId}:`);
    console.log(`   Mood: ${analysis.overallMood}`);
    console.log(`   Tension: ${'█'.repeat(Math.floor(analysis.tensionLevel * 10))}${'░'.repeat(10 - Math.floor(analysis.tensionLevel * 10))} ${(analysis.tensionLevel * 100).toFixed(0)}%`);
    console.log(`   Engagement: ${'█'.repeat(Math.floor(analysis.engagementLevel * 10))}${'░'.repeat(10 - Math.floor(analysis.engagementLevel * 10))} ${(analysis.engagementLevel * 100).toFixed(0)}%`);
    console.log(`   Emotions: ${analysis.dominantEmotions.join(', ')}`);
    console.log(`   Trajectory: ${analysis.emotionalTrajectory}`);
  });

  world.on('monitor_cross_talk_decided', (data) => {
    console.log(`\n🎭 Cross-talk initiated:`);
    console.log(`   ${data.sourceThread} → ${data.targetThread}`);
    console.log(`   Reason: ${data.reasoning}`);
  });

  world.on('monitor_ambient_narration', (data) => {
    console.log(`\n🌿 Ambient event in ${data.environmentId}:`);
    console.log(`   "${data.event.description}"`);
  });

  // Start world and conversations
  world.start();
  await Promise.all([
    cafeThread.start(),
    officeThread.start(),
    parkThread.start()
  ]);

  // Let the narrative unfold
  await new Promise(resolve => setTimeout(resolve, 60000));

  // Show comprehensive statistics
  console.log('\n📊 Advanced Narrative Statistics:');
  const stats = world.getStats();
  console.log(`Total exchanges: ${stats.state.totalExchanges}`);
  console.log(`Cross-talk events: ${stats.crossTalkEventCount}`);
  console.log(`Active threads: ${stats.state.activeConvoThreads}`);

  console.log('\n🎭 Narrative State:');
  const narrativeState = world.getNarrativeState();
  console.log(`Overall mood: ${narrativeState?.overallMood}`);
  console.log(`Narrative tension: ${narrativeState?.narrativeTension.toFixed(2)}`);
  console.log(`Story arcs: ${narrativeState?.storyArcs.join(', ')}`);

  console.log('\n💭 Recent Narrative Suggestions:');
  const suggestions = world.getNarrativeSuggestions(15);
  suggestions.forEach(suggestion => {
    const icon = suggestion.type === 'interjection' ? '💡' :
                 suggestion.type === 'cross_talk' ? '🎭' :
                 suggestion.type === 'ambient_event' ? '🌿' :
                 suggestion.type === 'narrative_control' ? '📝' : '😊';
    console.log(`   ${icon} ${suggestion.type}: ${suggestion.content} (Priority: ${suggestion.priority})`);
  });

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 3: Dynamic Monitor Agent Configuration
 */
async function dynamicMonitorConfigurationExample() {
  console.log('\n⚙️ Example 3: Dynamic Monitor Agent Configuration\n');

  const world = new World({
    id: 'dynamic-monitor-world',
    name: 'Dynamic Monitor World',
    description: 'A world demonstrating dynamic monitor agent configuration.',
    enableCrossTalk: true,
    enableMonitorAgent: false // Start without monitor agent
  });

  const cafe = createCoffeeShopEnvironment('dynamic-cafe');
  world.registerEnvironment(cafe);

  // Create agents
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are Agent Alpha. You adapt your behavior based on the environment.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are Agent Beta. You are responsive to external influences.',
      useStealth: true
    }).init()
  ]);

  const thread = new ConvoThread({
    id: 'dynamic-thread',
    name: 'Dynamic Conversation',
    participants: agents,
    environment: cafe,
    maxRounds: 6
  });

  world.registerConvoThread(thread);
  world.connectConvoToEnv('dynamic-thread', 'dynamic-cafe');

  // Start world and conversation
  world.start();
  await thread.start();

  // Let conversation run for a while without monitor
  console.log('🔄 Running without monitor agent...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Enable monitor agent with specific configuration
  console.log('\n✨ Enabling monitor agent...');
  await world.enableMonitorAgent({
    llmProvider: 'openai',
    model: 'gpt-4',
    temperature: 0.9, // High creativity
    capabilities: {
      canGenerateInterjections: true,
      canDecideCrossTalk: false, // Disable cross-talk decisions
      canNarrateAmbient: true,
      canControlNarrative: true,
      canAnalyzeEmotions: true,
      canPredictOutcomes: true,
      canSuggestEvents: true,
      maxConcurrentThreads: 2,
      maxInterjectionsPerMinute: 2
    },
    updateFrequency: 10000, // Fast updates
    enableInterjectionGeneration: true,
    enableCrossTalkDecision: false,
    enableAmbientNarration: true
  });

  // Listen for monitor events
  world.on('monitor_interjection_suggested', (data) => {
    console.log(`\n💡 Dynamic interjection: "${data.suggestion.content}"`);
  });

  world.on('monitor_emotional_analysis', (data) => {
    console.log(`\n😊 Dynamic analysis: ${data.analysis.overallMood} mood, ${data.analysis.emotionalTrajectory} trajectory`);
  });

  // Let conversation continue with monitor
  console.log('🔄 Running with monitor agent...');
  await new Promise(resolve => setTimeout(resolve, 20000));

  // Show monitor statistics
  console.log('\n📊 Dynamic Monitor Statistics:');
  console.log(world.getMonitorStats());

  // Disable monitor agent
  console.log('\n🔄 Disabling monitor agent...');
  await world.disableMonitorAgent();

  // Let conversation continue without monitor
  console.log('🔄 Running without monitor agent again...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Example 4: LangChain Integration Simulation
 */
async function langChainIntegrationExample() {
  console.log('\n🔗 Example 4: LangChain Integration Simulation\n');

  const world = new World({
    id: 'langchain-world',
    name: 'LangChain Integration World',
    description: 'A world simulating LangChain agent supervision patterns.',
    enableMonitorAgent: true,
    monitorAgentConfig: {
      llmProvider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      capabilities: {
        canGenerateInterjections: true,
        canDecideCrossTalk: true,
        canNarrateAmbient: true,
        canControlNarrative: true,
        canAnalyzeEmotions: true,
        canPredictOutcomes: true,
        canSuggestEvents: true,
        maxConcurrentThreads: 10,
        maxInterjectionsPerMinute: 8
      },
      updateFrequency: 12000,
      enableRealTimeMonitoring: true,
      enableNarrativeControl: true,
      enableInterjectionGeneration: true,
      enableCrossTalkDecision: true,
      enableAmbientNarration: true
    }
  });

  const cafe = createCoffeeShopEnvironment('langchain-cafe');
  world.registerEnvironment(cafe);

  // Create agents representing different LangChain agent types
  const agents = await Promise.all([
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a Research Agent. You gather information and ask probing questions.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a Planning Agent. You think strategically and suggest next steps.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'chatgpt',
      systemPrompt: 'You are a Creative Agent. You generate ideas and think outside the box.',
      useStealth: true
    }).init(),
    new AgentSession({
      agentType: 'claude',
      systemPrompt: 'You are a Critique Agent. You evaluate ideas and provide feedback.',
      useStealth: true
    }).init()
  ]);

  // Create conversation threads
  const researchThread = new ConvoThread({
    id: 'research-planning',
    name: 'Research & Planning',
    participants: [agents[0], agents[1]],
    environment: cafe,
    maxRounds: 4
  });

  const creativeThread = new ConvoThread({
    id: 'creative-critique',
    name: 'Creative & Critique',
    participants: [agents[2], agents[3]],
    environment: cafe,
    maxRounds: 4
  });

  world.registerConvoThread(researchThread);
  world.registerConvoThread(creativeThread);
  world.connectConvoToEnv('research-planning', 'langchain-cafe');
  world.connectConvoToEnv('creative-critique', 'langchain-cafe');

  // Simulate LangChain-style supervision events
  world.on('monitor_interjection_suggested', (data) => {
    console.log(`\n🔗 LangChain Supervision:`);
    console.log(`   Agent: ${data.suggestion.target}`);
    console.log(`   Intervention: "${data.suggestion.content}"`);
    console.log(`   Type: ${data.suggestion.metadata?.interjectionType || 'general'}`);
  });

  world.on('monitor_narrative_suggestion', (data) => {
    console.log(`\n🔗 LangChain Coordination:`);
    console.log(`   Action: ${data.suggestion.type}`);
    console.log(`   Target: ${data.suggestion.target}`);
    console.log(`   Instruction: ${data.suggestion.content}`);
  });

  world.on('monitor_emotional_analysis', (data) => {
    console.log(`\n🔗 LangChain Agent State:`);
    console.log(`   Agent: ${data.analysis.threadId}`);
    console.log(`   Status: ${data.analysis.overallMood}`);
    console.log(`   Performance: ${data.analysis.engagementLevel > 0.7 ? 'High' : data.analysis.engagementLevel > 0.4 ? 'Medium' : 'Low'}`);
    console.log(`   Suggestions: ${data.analysis.suggestions.join(', ')}`);
  });

  world.on('monitor_cross_talk_decided', (data) => {
    console.log(`\n🔗 LangChain Agent Communication:`);
    console.log(`   From: ${data.sourceThread}`);
    console.log(`   To: ${data.targetThread}`);
    console.log(`   Purpose: ${data.reasoning}`);
  });

  // Start simulation
  world.start();
  await Promise.all([researchThread.start(), creativeThread.start()]);

  // Let LangChain-style supervision run
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Show LangChain-style statistics
  console.log('\n📊 LangChain Integration Statistics:');
  const monitorStats = world.getMonitorStats();
  console.log(`Supervised agents: ${monitorStats?.monitoredThreads || 0}`);
  console.log(`Interventions: ${monitorStats?.narrativeSuggestions || 0}`);
  console.log(`Agent analyses: ${monitorStats?.emotionalAnalyses || 0}`);

  console.log('\n🔗 Agent Performance Summary:');
  const analyses = world.getEmotionalAnalyses();
  analyses.forEach((analysis, agentId) => {
    const performance = analysis.engagementLevel > 0.7 ? 'Excellent' :
                       analysis.engagementLevel > 0.4 ? 'Good' : 'Needs attention';
    console.log(`   ${agentId}: ${performance} (${(analysis.engagementLevel * 100).toFixed(0)}% engagement)`);
  });

  // Stop everything
  world.stop();
  await Promise.all(agents.map(agent => agent.close()));
}

/**
 * Run all monitor agent examples
 */
async function runAllMonitorAgentExamples() {
  try {
    console.log('✨ Monitor Agent and Narrative Control Examples\n');

    // Example 1: Basic monitor agent setup
    await basicMonitorAgentExample();

    // Example 2: Advanced narrative control
    await advancedNarrativeControlExample();

    // Example 3: Dynamic monitor configuration
    await dynamicMonitorConfigurationExample();

    // Example 4: LangChain integration simulation
    await langChainIntegrationExample();

    console.log('\n✅ All monitor agent examples completed successfully!');
  } catch (error) {
    console.error('❌ Monitor agent example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllMonitorAgentExamples();
}

export {
  basicMonitorAgentExample,
  advancedNarrativeControlExample,
  dynamicMonitorConfigurationExample,
  langChainIntegrationExample,
  runAllMonitorAgentExamples
}; 