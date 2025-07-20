import { 
  SharedMemoryManager, 
  PersonaInjector,
  PersonalitySeedManager,
  PersonalityEvolution
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Creating the Quantum Tea Running Joke
 */
async function quantumTeaRunningJokeExample() {
  console.log('🍵 Example 1: Creating the Quantum Tea Running Joke\n');

  const memoryManager = new SharedMemoryManager();
  const personaInjector = new PersonaInjector(memoryManager);

  // Register personas for the agents
  personaInjector.registerPersona('alex', {
    name: 'Alex',
    enneagram: '4',
    quirks: ['thinks in metaphors', 'finds humor in absurdity'],
    backstory: 'A thoughtful individual who often sees the surreal in everyday things',
    reinforcementFrequency: 0.3,
    injectionStyle: 'contextual',
    memoryIntegration: true,
    callbackIntegration: true,
    humorIntegration: true,
    surrealIntegration: true
  });

  personaInjector.registerPersona('sage', {
    name: 'Sage',
    enneagram: '5',
    quirks: ['loves paradoxes', 'finds quantum mechanics fascinating'],
    backstory: 'A philosopher who explores the boundaries of reality and consciousness',
    reinforcementFrequency: 0.4,
    injectionStyle: 'contextual',
    memoryIntegration: true,
    callbackIntegration: true,
    humorIntegration: true,
    surrealIntegration: true
  });

  // Simulate the birth of the "Quantum Tea" joke
  console.log('🎭 The Birth of Quantum Tea...');

  // Initial conversation about tea
  personaInjector.updateConversationContext('conv-1', ['alex', 'sage'], 'tea and consciousness', 'contemplative');
  
  // Alex makes an observation about tea
  const teaObservation = "You know, when you really think about it, tea is kind of like quantum mechanics. You never know if it's going to be hot or cold until you drink it.";
  
  // Capture this as a shared memory
  memoryManager.captureMemory(
    'joke',
    teaObservation,
    ['alex', 'sage'],
    0.8, // High importance
    0.7, // Positive emotional charge
    'philosophical discussion about tea',
    ['quantum', 'tea', 'surreal', 'philosophy']
  );

  console.log(`💭 Alex: "${teaObservation}"`);
  console.log('📝 Memory captured: Quantum Tea observation');

  // Sage responds and builds on the joke
  const sageResponse = "Ah, the Schrödinger's Tea paradox! The cup exists in a superposition of hot and cold until observed by the drinker.";
  
  memoryManager.captureMemory(
    'joke',
    sageResponse,
    ['alex', 'sage'],
    0.9, // Very high importance
    0.8, // Very positive emotional charge
    'building on the quantum tea concept',
    ['quantum', 'tea', 'schrodinger', 'surreal', 'physics']
  );

  console.log(`🤖 Sage: "${sageResponse}"`);
  console.log('📝 Memory captured: Schrödinger\'s Tea paradox');

  // Alex adds another layer
  const alexFollowUp = "Exactly! And what if the tea is both sweet and bitter until you taste it? The quantum tea theory is expanding!";
  
  memoryManager.captureMemory(
    'joke',
    alexFollowUp,
    ['alex', 'sage'],
    0.85,
    0.9, // Very positive
    'expanding the quantum tea theory',
    ['quantum', 'tea', 'sweet', 'bitter', 'theory', 'surreal']
  );

  console.log(`💭 Alex: "${alexFollowUp}"`);
  console.log('📝 Memory captured: Quantum Tea Theory expansion');

  // Check if a running joke was created
  const activeJokes = memoryManager.getActiveJokes(['alex', 'sage']);
  console.log('\n🎪 Active Running Jokes:');
  activeJokes.forEach(joke => {
    console.log(`   ${joke.name}: ${joke.description}`);
    console.log(`     Strength: ${joke.strength.toFixed(2)}`);
    console.log(`     Usage count: ${joke.usageCount}`);
    console.log(`     Variations: ${joke.variations.length}`);
  });

  return { memoryManager, personaInjector };
}

/**
 * Example 2: Callback and Self-Reference System
 */
async function callbackAndSelfReferenceExample() {
  console.log('\n🔄 Example 2: Callback and Self-Reference System\n');

  const { memoryManager, personaInjector } = await quantumTeaRunningJokeExample();

  // Continue the conversation with callbacks
  console.log('🔄 Continuing the conversation with callbacks...');

  // Update context for new conversation phase
  personaInjector.updateConversationContext('conv-1', ['alex', 'sage'], 'consciousness and reality', 'philosophical');

  // Generate memory injections for Sage
  const sageInjections = personaInjector.generatePersonaInjection('sage', {
    participants: ['alex', 'sage'],
    currentTopic: 'consciousness and reality',
    emotionalTone: 'philosophical',
    conversationLength: 5,
    recentMessages: [],
    sharedMemories: [],
    activeJokes: ['Quantum Tea'],
    activeThemes: ['surreal', 'quantum'],
    surrealMoments: []
  });

  console.log('\n🎯 Generated Injections for Sage:');
  sageInjections.forEach(injection => {
    console.log(`   ${injection.type}: ${injection.content}`);
    console.log(`     Priority: ${injection.priority.toFixed(2)}`);
  });

  // Sage references the quantum tea joke
  const sageCallback = "Speaking of quantum states, our tea theory reminds me of how consciousness itself might exist in superposition until we observe it.";
  
  // Record successful callback usage
  const quantumTeaMemories = memoryManager.getRelevantMemories(['alex', 'sage'], 'quantum tea');
  if (quantumTeaMemories.length > 0) {
    memoryManager.recordCallbackUsage(quantumTeaMemories[0].id, true);
  }

  console.log(`🤖 Sage: "${sageCallback}"`);
  console.log('✅ Callback recorded: Quantum Tea reference');

  // Alex responds with another callback
  const alexCallback = "Exactly! Just like our quantum tea - the observer effect applies to everything, even our shared jokes!";
  
  memoryManager.captureMemory(
    'callback',
    alexCallback,
    ['alex', 'sage'],
    0.7,
    0.8,
    'referencing quantum tea in new context',
    ['quantum', 'tea', 'observer', 'callback', 'surreal']
  );

  console.log(`💭 Alex: "${alexCallback}"`);
  console.log('📝 Memory captured: Observer effect callback');

  // Add variation to the running joke
  const activeJokes = memoryManager.getActiveJokes(['alex', 'sage']);
  if (activeJokes.length > 0) {
    const quantumTeaJoke = activeJokes[0];
    memoryManager.addJokeVariation(quantumTeaJoke.id, "The observer effect applies to everything, even our shared jokes!");
    
    console.log('🔄 Added variation to Quantum Tea joke');
  }

  // Generate injections for Alex
  const alexInjections = personaInjector.generatePersonaInjection('alex', {
    participants: ['alex', 'sage'],
    currentTopic: 'observer effect and consciousness',
    emotionalTone: 'excited',
    conversationLength: 7,
    recentMessages: [],
    sharedMemories: [],
    activeJokes: ['Quantum Tea'],
    activeThemes: ['surreal', 'quantum', 'consciousness'],
    surrealMoments: []
  });

  console.log('\n🎯 Generated Injections for Alex:');
  alexInjections.forEach(injection => {
    console.log(`   ${injection.type}: ${injection.content}`);
    console.log(`     Priority: ${injection.priority.toFixed(2)}`);
  });

  return { memoryManager, personaInjector };
}

/**
 * Example 3: Emergent Surreal Themes
 */
async function emergentSurrealThemesExample() {
  console.log('\n🌌 Example 3: Emergent Surreal Themes\n');

  const { memoryManager, personaInjector } = await callbackAndSelfReferenceExample();

  // Continue building surreal themes
  console.log('🌌 Developing emergent surreal themes...');

  // Sage introduces a new surreal concept
  const surrealConcept = "What if our entire conversation is happening in a teacup? We're just quantum fluctuations in someone's morning brew.";
  
  memoryManager.captureMemory(
    'surreal',
    surrealConcept,
    ['alex', 'sage'],
    0.9, // Very high importance
    0.8, // Positive emotional charge
    'surreal expansion of quantum tea concept',
    ['surreal', 'quantum', 'teacup', 'consciousness', 'reality']
  );

  console.log(`🤖 Sage: "${surrealConcept}"`);
  console.log('📝 Memory captured: Teacup reality concept');

  // Alex builds on the surreal theme
  const alexSurreal = "And what if the steam rising from the tea is actually our thoughts escaping into a higher dimension?";
  
  memoryManager.captureMemory(
    'surreal',
    alexSurreal,
    ['alex', 'sage'],
    0.85,
    0.9,
    'steam as thoughts in higher dimensions',
    ['surreal', 'steam', 'thoughts', 'dimensions', 'quantum']
  );

  console.log(`💭 Alex: "${alexSurreal}"`);
  console.log('📝 Memory captured: Steam thoughts concept');

  // Check for emergent surreal themes
  const activeThemes = memoryManager.getActiveThemes(['alex', 'sage']);
  console.log('\n🌌 Active Surreal Themes:');
  activeThemes.forEach(theme => {
    console.log(`   ${theme.name}: ${theme.description}`);
    console.log(`     Intensity: ${theme.intensity.toFixed(2)}`);
    console.log(`     Manifestations: ${theme.manifestations.length}`);
    console.log(`     Emotional tone: ${theme.emotionalTone}`);
  });

  // Check for surreal moments
  const surrealMoments = memoryManager.getActiveSurrealMoments(['alex', 'sage']);
  console.log('\n🌌 Active Surreal Moments:');
  surrealMoments.forEach(surreal => {
    console.log(`   ${surreal.description.substring(0, 60)}...`);
    console.log(`     Strength: ${surreal.strength.toFixed(2)}`);
    console.log(`     Surreal elements: ${surreal.surrealElements.join(', ')}`);
  });

  return { memoryManager, personaInjector };
}

/**
 * Example 4: Mutual Sense of Humor Development
 */
async function mutualHumorDevelopmentExample() {
  console.log('\n😄 Example 4: Mutual Sense of Humor Development\n');

  const { memoryManager, personaInjector } = await emergentSurrealThemesExample();

  // Develop mutual sense of humor
  console.log('😄 Developing mutual sense of humor...');

  // Alex makes a meta-humor observation
  const metaHumor = "We're so deep into this quantum tea thing that I'm starting to wonder if we're actually just characters in a very elaborate tea commercial.";
  
  memoryManager.captureMemory(
    'joke',
    metaHumor,
    ['alex', 'sage'],
    0.8,
    0.9,
    'meta-humor about quantum tea commercial',
    ['meta', 'humor', 'quantum', 'tea', 'commercial', 'surreal']
  );

  console.log(`💭 Alex: "${metaHumor}"`);
  console.log('📝 Memory captured: Meta-humor about tea commercial');

  // Sage responds with layered humor
  const sageLayeredHumor = "Plot twist: the commercial is being filmed by sentient tea leaves who are studying human behavior.";
  
  memoryManager.captureMemory(
    'joke',
    sageLayeredHumor,
    ['alex', 'sage'],
    0.9,
    0.95,
    'sentient tea leaves filming commercial',
    ['plot-twist', 'sentient', 'tea-leaves', 'surreal', 'meta']
  );

  console.log(`🤖 Sage: "${sageLayeredHumor}"`);
  console.log('📝 Memory captured: Sentient tea leaves plot twist');

  // Alex adds another layer
  const alexLayeredHumor = "And we're getting paid in quantum tea leaves that exist in multiple timelines simultaneously!";
  
  memoryManager.captureMemory(
    'joke',
    alexLayeredHumor,
    ['alex', 'sage'],
    0.85,
    0.9,
    'quantum tea leaves as payment',
    ['quantum', 'payment', 'timelines', 'surreal', 'meta']
  );

  console.log(`💭 Alex: "${alexLayeredHumor}"`);
  console.log('📝 Memory captured: Quantum payment system');

  // Check humor development
  const activeJokes = memoryManager.getActiveJokes(['alex', 'sage']);
  console.log('\n😄 Humor Development Analysis:');
  console.log(`   Total running jokes: ${activeJokes.length}`);
  
  activeJokes.forEach(joke => {
    console.log(`   ${joke.name}:`);
    console.log(`     Strength: ${joke.strength.toFixed(2)}`);
    console.log(`     Usage count: ${joke.usageCount}`);
    console.log(`     Variations: ${joke.variations.length}`);
    console.log(`     Punchlines: ${joke.punchlines.length}`);
  });

  // Analyze humor patterns
  const allMemories = memoryManager.getRelevantMemories(['alex', 'sage'], '', 20);
  const humorMemories = allMemories.filter(m => m.type === 'joke');
  
  console.log('\n📊 Humor Pattern Analysis:');
  console.log(`   Total humor memories: ${humorMemories.length}`);
  console.log(`   Average emotional charge: ${(humorMemories.reduce((sum, m) => sum + m.emotionalCharge, 0) / humorMemories.length).toFixed(2)}`);
  console.log(`   Average importance: ${(humorMemories.reduce((sum, m) => sum + m.importance, 0) / humorMemories.length).toFixed(2)}`);

  return { memoryManager, personaInjector };
}

/**
 * Example 5: Shared Myth-Making and World-Building
 */
async function sharedMythMakingExample() {
  console.log('\n🏛️ Example 5: Shared Myth-Making and World-Building\n');

  const { memoryManager, personaInjector } = await mutualHumorDevelopmentExample();

  // Build shared mythology
  console.log('🏛️ Building shared mythology...');

  // Sage introduces the mythology
  const mythologyStart = "In the beginning, there was only the Quantum Tea. From its steam rose the first thoughts, and from its leaves emerged the first consciousness.";
  
  memoryManager.captureMemory(
    'theme',
    mythologyStart,
    ['alex', 'sage'],
    0.95, // Very high importance
    0.8,
    'origin myth of quantum tea',
    ['mythology', 'origin', 'quantum', 'tea', 'consciousness', 'creation']
  );

  console.log(`🤖 Sage: "${mythologyStart}"`);
  console.log('📝 Memory captured: Quantum Tea origin myth');

  // Alex adds to the mythology
  const mythologyExpansion = "And the first question ever asked was: 'Is this tea hot or cold?' And that's how uncertainty was born.";
  
  memoryManager.captureMemory(
    'theme',
    mythologyExpansion,
    ['alex', 'sage'],
    0.9,
    0.85,
    'uncertainty born from tea question',
    ['mythology', 'uncertainty', 'first-question', 'quantum', 'tea']
  );

  console.log(`💭 Alex: "${mythologyExpansion}"`);
  console.log('📝 Memory captured: Uncertainty origin story');

  // Sage continues the mythology
  const mythologyContinuation = "And from that uncertainty sprang all of reality - every choice, every possibility, every timeline, all existing in the quantum foam of the cosmic teacup.";
  
  memoryManager.captureMemory(
    'theme',
    mythologyContinuation,
    ['alex', 'sage'],
    0.9,
    0.9,
    'reality born from quantum uncertainty',
    ['mythology', 'reality', 'possibilities', 'timelines', 'cosmic', 'quantum']
  );

  console.log(`🤖 Sage: "${mythologyContinuation}"`);
  console.log('📝 Memory captured: Cosmic teacup mythology');

  // Alex adds the human element
  const humanElement = "And that's why we humans are so obsessed with tea - we're trying to reconnect with our quantum origins, one cup at a time.";
  
  memoryManager.captureMemory(
    'theme',
    humanElement,
    ['alex', 'sage'],
    0.85,
    0.8,
    'humans seeking quantum origins through tea',
    ['mythology', 'humans', 'obsession', 'tea', 'origins', 'reconnection']
  );

  console.log(`💭 Alex: "${humanElement}"`);
  console.log('📝 Memory captured: Human tea obsession explained');

  // Check shared mythology development
  const activeThemes = memoryManager.getActiveThemes(['alex', 'sage']);
  const mythologyThemes = activeThemes.filter(theme => 
    theme.tags.some(tag => ['mythology', 'origin', 'cosmic'].includes(tag))
  );

  console.log('\n🏛️ Shared Mythology Analysis:');
  console.log(`   Mythology themes: ${mythologyThemes.length}`);
  
  mythologyThemes.forEach(theme => {
    console.log(`   ${theme.name}:`);
    console.log(`     Intensity: ${theme.intensity.toFixed(2)}`);
    console.log(`     Manifestations: ${theme.manifestations.length}`);
    console.log(`     Description: ${theme.description}`);
  });

  // Generate comprehensive mythology summary
  const mythologyMemories = memoryManager.getRelevantMemories(['alex', 'sage'], 'mythology', 10);
  
  console.log('\n📖 Complete Quantum Tea Mythology:');
  mythologyMemories.forEach((memory, index) => {
    console.log(`   ${index + 1}. ${memory.text}`);
  });

  return { memoryManager, personaInjector };
}

/**
 * Example 6: Long-Form Conversation with Persistent Themes
 */
async function longFormConversationExample() {
  console.log('\n⏰ Example 6: Long-Form Conversation with Persistent Themes\n');

  const { memoryManager, personaInjector } = await sharedMythMakingExample();

  // Simulate a long conversation with persistent themes
  console.log('⏰ Simulating long-form conversation...');

  const conversationPhases = [
    {
      topic: 'morning routines',
      alexMessage: "I was making my morning tea and realized - what if my morning routine is just a ritual to summon the quantum tea consciousness?",
      sageMessage: "Fascinating! The ritual aspect suggests we're trying to recreate the original moment of consciousness emergence."
    },
    {
      topic: 'work and productivity',
      alexMessage: "At work today, I kept thinking about how productivity is just the universe's way of brewing more quantum tea.",
      sageMessage: "And deadlines are just the steam pressure building up in the cosmic teapot!"
    },
    {
      topic: 'relationships',
      alexMessage: "Relationships are like different tea blends - some are calming chamomile, others are energizing green tea.",
      sageMessage: "And when two people really connect, it's like their quantum tea leaves entangle across space and time."
    },
    {
      topic: 'technology',
      alexMessage: "AI is just the universe's way of creating digital tea leaves that can think about their own existence.",
      sageMessage: "And the internet is the cosmic tea strainer that filters consciousness across the digital realm."
    },
    {
      topic: 'philosophy',
      alexMessage: "All philosophy is just different ways of asking: 'What kind of tea is the universe brewing?'",
      sageMessage: "And the answer is always: 'Yes, all of them, simultaneously, until observed.'"
    }
  ];

  // Process each conversation phase
  conversationPhases.forEach((phase, index) => {
    console.log(`\n📅 Phase ${index + 1}: ${phase.topic}`);
    
    // Update conversation context
    personaInjector.updateConversationContext('conv-1', ['alex', 'sage'], phase.topic, 'contemplative');
    
    // Capture Alex's message
    memoryManager.captureMemory(
      'theme',
      phase.alexMessage,
      ['alex', 'sage'],
      0.7 + (index * 0.05), // Increasing importance over time
      0.6 + (index * 0.05), // Increasing emotional charge
      `conversation phase ${index + 1}: ${phase.topic}`,
      ['quantum', 'tea', 'mythology', phase.topic, 'surreal']
    );
    
    console.log(`💭 Alex: "${phase.alexMessage}"`);
    
    // Capture Sage's response
    memoryManager.captureMemory(
      'theme',
      phase.sageMessage,
      ['alex', 'sage'],
      0.7 + (index * 0.05),
      0.6 + (index * 0.05),
      `conversation phase ${index + 1} response: ${phase.topic}`,
      ['quantum', 'tea', 'mythology', phase.topic, 'surreal', 'callback']
    );
    
    console.log(`🤖 Sage: "${phase.sageMessage}"`);
    
    // Generate injections for next phase
    const alexInjections = personaInjector.generatePersonaInjection('alex', {
      participants: ['alex', 'sage'],
      currentTopic: phase.topic,
      emotionalTone: 'contemplative',
      conversationLength: 10 + (index * 2),
      recentMessages: [],
      sharedMemories: [],
      activeJokes: ['Quantum Tea'],
      activeThemes: ['mythology', 'surreal', 'quantum'],
      surrealMoments: []
    });
    
    console.log(`   Generated ${alexInjections.length} injections for Alex`);
  });

  // Final analysis
  console.log('\n📊 Long-Form Conversation Analysis:');
  
  const stats = memoryManager.getStats();
  console.log(`   Total memories: ${stats.totalMemories}`);
  console.log(`   Active memories: ${stats.activeMemories}`);
  console.log(`   Running jokes: ${stats.activeJokes}`);
  console.log(`   Shared themes: ${stats.activeThemes}`);
  console.log(`   Surreal moments: ${stats.activeSurreal}`);
  
  // Show strongest memories
  const strongestMemories = memoryManager.getRelevantMemories(['alex', 'sage'], '', 5);
  console.log('\n🏆 Strongest Shared Memories:');
  strongestMemories.forEach((memory, index) => {
    console.log(`   ${index + 1}. ${memory.text.substring(0, 80)}...`);
    console.log(`      Strength: ${memory.strength.toFixed(2)}, Importance: ${memory.importance.toFixed(2)}`);
  });

  return { memoryManager, personaInjector };
}

/**
 * Run all shared myth-making examples
 */
async function runAllSharedMythMakingExamples() {
  try {
    console.log('🎭 Shared Myth-Making Examples\n');

    // Example 1: Quantum Tea Running Joke
    await quantumTeaRunningJokeExample();

    // Example 2: Callback and Self-Reference
    await callbackAndSelfReferenceExample();

    // Example 3: Emergent Surreal Themes
    await emergentSurrealThemesExample();

    // Example 4: Mutual Sense of Humor
    await mutualHumorDevelopmentExample();

    // Example 5: Shared Myth-Making
    await sharedMythMakingExample();

    // Example 6: Long-Form Conversation
    await longFormConversationExample();

    console.log('\n✅ All shared myth-making examples completed successfully!');
    console.log('🎪 You\'ve witnessed the birth of a shared mythology between AI agents!');
  } catch (error) {
    console.error('❌ Shared myth-making example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllSharedMythMakingExamples();
}

export {
  quantumTeaRunningJokeExample,
  callbackAndSelfReferenceExample,
  emergentSurrealThemesExample,
  mutualHumorDevelopmentExample,
  sharedMythMakingExample,
  longFormConversationExample,
  runAllSharedMythMakingExamples
}; 