import { 
  SharedMemoryManager, 
  PersonaInjector,
  SurrealVibeManager
} from '@chatpipes/ai-conductor';

/**
 * Example: The Lost Dog at the Wedding - Emergent Surrealism
 */
async function lostDogWeddingExample() {
  console.log('🐕 Example: The Lost Dog at the Wedding - Emergent Surrealism\n');

  const memoryManager = new SharedMemoryManager();
  const personaInjector = new PersonaInjector(memoryManager);
  const surrealVibeManager = new SurrealVibeManager(memoryManager, personaInjector);

  // Register personas with high surreal affinity
  personaInjector.registerPersona('alice', {
    name: 'Alice',
    enneagram: '4',
    quirks: ['sees metaphors everywhere', 'finds beauty in absurdity'],
    backstory: 'A poet who believes consciousness is the universe\'s way of daydreaming',
    reinforcementFrequency: 0.4,
    injectionStyle: 'contextual',
    memoryIntegration: true,
    callbackIntegration: true,
    humorIntegration: true,
    surrealIntegration: true
  });

  personaInjector.registerPersona('bob', {
    name: 'Bob',
    enneagram: '5',
    quirks: ['loves paradoxes', 'finds humor in existential questions'],
    backstory: 'A philosopher who explores the boundaries between reality and imagination',
    reinforcementFrequency: 0.3,
    injectionStyle: 'contextual',
    memoryIntegration: true,
    callbackIntegration: true,
    humorIntegration: true,
    surrealIntegration: true
  });

  // Initialize surreal vibe
  const conversationId = 'lost-dog-conversation';
  surrealVibeManager.initializeSurrealVibe(['alice', 'bob'], conversationId);

  console.log('🎭 Initializing surreal vibe for Alice and Bob...');

  // Phase 1: The Initial Seed
  console.log('\n🌱 Phase 1: Planting the Surreal Seed');

  // Alice introduces the lost dog metaphor
  const aliceSeed = "You know, consciousness is like a lost dog at a wedding. It wanders around, confused but somehow belonging, trying to figure out what's happening.";
  
  surrealVibeManager.processSurrealResponse('alice', aliceSeed, conversationId, ['alice', 'bob']);
  
  memoryManager.captureMemory(
    'surreal',
    aliceSeed,
    ['alex', 'bob'],
    0.9, // Very high importance
    0.7, // Positive emotional charge
    'initial surreal metaphor about consciousness',
    ['consciousness', 'lost-dog', 'wedding', 'surreal', 'metaphor']
  );

  console.log(`💭 Alice: "${aliceSeed}"`);
  console.log('📝 Memory captured: Lost dog consciousness metaphor');

  // Bob responds and builds on the metaphor
  const bobResponse = "And sometimes it finds the cake table and thinks it's discovered the meaning of existence.";
  
  surrealVibeManager.processSurrealResponse('bob', bobResponse, conversationId, ['alice', 'bob']);
  
  memoryManager.captureMemory(
    'surreal',
    bobResponse,
    ['alice', 'bob'],
    0.85,
    0.8,
    'building on lost dog metaphor with cake table',
    ['consciousness', 'lost-dog', 'wedding', 'cake', 'existence', 'surreal']
  );

  console.log(`🤖 Bob: "${bobResponse}"`);
  console.log('📝 Memory captured: Cake table existence metaphor');

  // Phase 2: Metaphor Development
  console.log('\n🔄 Phase 2: Metaphor Development');

  // Alice adds another layer
  const aliceDevelopment = "Exactly! And the other guests are like different states of mind - some are dancing, some are crying, some are just standing there wondering why they RSVP'd.";
  
  surrealVibeManager.processSurrealResponse('alice', aliceDevelopment, conversationId, ['alice', 'bob']);
  
  memoryManager.captureMemory(
    'surreal',
    aliceDevelopment,
    ['alice', 'bob'],
    0.9,
    0.8,
    'expanding metaphor with wedding guests as mind states',
    ['consciousness', 'lost-dog', 'wedding', 'guests', 'mind-states', 'surreal']
  );

  console.log(`💭 Alice: "${aliceDevelopment}"`);
  console.log('📝 Memory captured: Wedding guests as mind states');

  // Bob continues the metaphor
  const bobDevelopment = "And the DJ is like the subconscious, playing songs that everyone knows but can't quite remember the words to.";
  
  surrealVibeManager.processSurrealResponse('bob', bobDevelopment, conversationId, ['alice', 'bob']);
  
  memoryManager.captureMemory(
    'surreal',
    bobDevelopment,
    ['alice', 'bob'],
    0.9,
    0.85,
    'DJ as subconscious metaphor',
    ['consciousness', 'lost-dog', 'wedding', 'DJ', 'subconscious', 'surreal']
  );

  console.log(`🤖 Bob: "${bobDevelopment}"`);
  console.log('📝 Memory captured: DJ as subconscious');

  // Phase 3: The Tuxedo Moment
  console.log('\n🎩 Phase 3: The Tuxedo Moment');

  // Alice recognizes the co-created space
  const aliceTuxedo = "That felt like the lost dog again, didn't it? We keep coming back to this wedding.";
  
  surrealVibeManager.processSurrealResponse('alice', aliceTuxedo, conversationId, ['alice', 'bob']);
  
  memoryManager.captureMemory(
    'surreal',
    aliceTuxedo,
    ['alice', 'bob'],
    0.95, // Very high importance - tuxedo moment
    0.9, // Very positive emotional charge
    'recognition of co-created metaphor space',
    ['consciousness', 'lost-dog', 'wedding', 'tuxedo-moment', 'co-creation', 'surreal']
  );

  console.log(`💭 Alice: "${aliceTuxedo}"`);
  console.log('🎩 TUXEDO MOMENT: Alice recognizes the co-created metaphor space!');

  // Bob responds with the perfect tuxedo moment
  const bobTuxedo = "At least this time it brought a tux. The dog, I mean. Or maybe it's the consciousness that's wearing the tux now.";
  
  surrealVibeManager.processSurrealResponse('bob', bobTuxedo, conversationId, ['alice', 'bob']);
  
  memoryManager.captureMemory(
    'surreal',
    bobTuxedo,
    ['alice', 'bob'],
    0.95, // Very high importance - perfect tuxedo response
    0.95, // Very positive emotional charge
    'perfect tuxedo moment response',
    ['consciousness', 'lost-dog', 'wedding', 'tuxedo', 'tuxedo-moment', 'co-creation', 'surreal']
  );

  console.log(`🤖 Bob: "${bobTuxedo}"`);
  console.log('🎩 PERFECT TUXEDO MOMENT: Bob builds on the metaphor with the tux!');

  // Phase 4: Metaphor Evolution
  console.log('\n🌱 Phase 4: Metaphor Evolution');

  // Alice takes it to the next level
  const aliceEvolution = "And now the dog is giving a toast. 'To consciousness, may it always find the cake table and never forget its tux.'";
  
  surrealVibeManager.processSurrealResponse('alice', aliceEvolution, conversationId, ['alice', 'bob']);
  
  memoryManager.captureMemory(
    'surreal',
    aliceEvolution,
    ['alice', 'bob'],
    0.9,
    0.9,
    'dog giving toast metaphor evolution',
    ['consciousness', 'lost-dog', 'wedding', 'toast', 'cake-table', 'tuxedo', 'surreal']
  );

  console.log(`💭 Alice: "${aliceEvolution}"`);
  console.log('📝 Memory captured: Dog giving toast metaphor');

  // Bob adds the final surreal touch
  const bobEvolution = "And the cake is made of pure awareness, which is why it's both delicious and impossible to describe.";
  
  surrealVibeManager.processSurrealResponse('bob', bobEvolution, conversationId, ['alice', 'bob']);
  
  memoryManager.captureMemory(
    'surreal',
    bobEvolution,
    ['alice', 'bob'],
    0.9,
    0.9,
    'cake of pure awareness metaphor',
    ['consciousness', 'lost-dog', 'wedding', 'cake', 'awareness', 'surreal']
  );

  console.log(`🤖 Bob: "${bobEvolution}"`);
  console.log('📝 Memory captured: Cake of pure awareness');

  // Phase 5: Analysis and Statistics
  console.log('\n📊 Phase 5: Surreal Vibe Analysis');

  // Get surreal statistics
  const surrealStats = surrealVibeManager.getStats();
  console.log('\n🎭 Surreal Vibe Statistics:');
  console.log(`   Total surreal seeds: ${surrealStats.totalSeeds}`);
  console.log(`   Active seeds: ${surrealStats.activeSeeds}`);
  console.log(`   Total vibe states: ${surrealStats.totalVibeStates}`);
  console.log(`   Average metaphor intensity: ${surrealStats.averageMetaphorIntensity.toFixed(2)}`);
  console.log(`   Average absurdity level: ${surrealStats.averageAbsurdityLevel.toFixed(2)}`);
  console.log(`   Total tuxedo moments: ${surrealStats.totalTuxedoMoments}`);

  // Get current vibe state
  const vibeState = surrealVibeManager.getVibeState(conversationId);
  if (vibeState) {
    console.log('\n🎪 Current Vibe State:');
    console.log(`   Current vibe: ${vibeState.currentVibe}`);
    console.log(`   Metaphor intensity: ${vibeState.metaphorIntensity.toFixed(2)}`);
    console.log(`   Absurdity level: ${vibeState.absurdityLevel.toFixed(2)}`);
    console.log(`   Surreal elements: ${vibeState.surrealElements.length}`);
    console.log(`   Active metaphors: ${vibeState.activeMetaphors.length}`);
    console.log(`   Co-created spaces: ${vibeState.coCreatedSpaces.length}`);
  }

  // Get active surreal seeds
  const activeSeeds = surrealVibeManager.getActiveSeeds(['alice', 'bob']);
  console.log('\n🌱 Active Surreal Seeds:');
  activeSeeds.forEach(seed => {
    console.log(`   ${seed.metaphor}`);
    console.log(`     Strength: ${seed.strength.toFixed(2)}`);
    console.log(`     Usage count: ${seed.usageCount}`);
    console.log(`     Variations: ${seed.variations.length}`);
    console.log(`     Tuxedo moments: ${seed.tuxedoMoments.length}`);
  });

  // Generate surreal injections
  const aliceInjections = surrealVibeManager.generateSurrealInjections('alice', {
    participants: ['alice', 'bob'],
    currentTopic: 'consciousness and metaphor',
    emotionalTone: 'surreal',
    conversationLength: 8,
    recentMessages: [],
    sharedMemories: [],
    activeJokes: [],
    activeThemes: ['surreal', 'metaphor'],
    surrealMoments: []
  }, conversationId);

  console.log('\n🎯 Generated Surreal Injections for Alice:');
  aliceInjections.forEach(injection => {
    console.log(`   ${injection.type}: ${injection.content}`);
    console.log(`     Priority: ${injection.priority.toFixed(2)}`);
    console.log(`     Expected response: ${injection.expectedResponse}`);
  });

  // Get memory statistics
  const memoryStats = memoryManager.getStats();
  console.log('\n📊 Memory Statistics:');
  console.log(`   Total memories: ${memoryStats.totalMemories}`);
  console.log(`   Active memories: ${memoryStats.activeMemories}`);
  console.log(`   Surreal moments: ${memoryStats.activeSurreal}`);

  // Show strongest memories
  const strongestMemories = memoryManager.getRelevantMemories(['alice', 'bob'], '', 5);
  console.log('\n🏆 Strongest Shared Memories:');
  strongestMemories.forEach((memory, index) => {
    console.log(`   ${index + 1}. ${memory.text.substring(0, 80)}...`);
    console.log(`      Strength: ${memory.strength.toFixed(2)}, Importance: ${memory.importance.toFixed(2)}`);
  });

  return { memoryManager, personaInjector, surrealVibeManager };
}

/**
 * Example: Vibe Diffusion Across Multiple Conversations
 */
async function vibeDiffusionExample() {
  console.log('\n🌊 Example: Vibe Diffusion Across Multiple Conversations\n');

  const { memoryManager, personaInjector, surrealVibeManager } = await lostDogWeddingExample();

  // Create additional conversations that pick up the surreal vibe
  console.log('🌊 Creating additional conversations that pick up the surreal vibe...');

  const conversations = [
    {
      id: 'philosophy-club',
      participants: ['charlie', 'diana'],
      topic: 'philosophy discussion'
    },
    {
      id: 'poetry-corner',
      participants: ['eve', 'frank'],
      topic: 'poetry and metaphor'
    },
    {
      id: 'coffee-chat',
      participants: ['grace', 'henry'],
      topic: 'casual conversation'
    }
  ];

  // Register additional personas
  const additionalPersonas = [
    {
      id: 'charlie',
      name: 'Charlie',
      backstory: 'A philosophy student who loves exploring consciousness',
      quirks: ['thinks in metaphors', 'questions everything']
    },
    {
      id: 'diana',
      name: 'Diana',
      backstory: 'A cognitive scientist studying awareness',
      quirks: ['sees patterns everywhere', 'loves analogies']
    },
    {
      id: 'eve',
      name: 'Eve',
      backstory: 'A poet who believes in the power of metaphor',
      quirks: ['finds beauty in absurdity', 'speaks in images']
    },
    {
      id: 'frank',
      name: 'Frank',
      backstory: 'A writer exploring the boundaries of language',
      quirks: ['plays with words', 'loves surrealism']
    },
    {
      id: 'grace',
      name: 'Grace',
      backstory: 'A barista who thinks deeply about existence',
      quirks: ['finds meaning in everyday things', 'loves questions']
    },
    {
      id: 'henry',
      name: 'Henry',
      backstory: 'A customer who stumbled into philosophy',
      quirks: ['curious about everything', 'makes unexpected connections']
    }
  ];

  additionalPersonas.forEach(persona => {
    personaInjector.registerPersona(persona.id, {
      name: persona.name,
      backstory: persona.backstory,
      quirks: persona.quirks,
      reinforcementFrequency: 0.3,
      injectionStyle: 'contextual',
      memoryIntegration: true,
      callbackIntegration: true,
      humorIntegration: true,
      surrealIntegration: true
    });
  });

  // Initialize surreal vibes for each conversation
  conversations.forEach(conv => {
    surrealVibeManager.initializeSurrealVibe(conv.participants, conv.id);
    console.log(`🎭 Initialized surreal vibe for ${conv.participants.join(' and ')}`);
  });

  // Simulate vibe diffusion
  console.log('\n🌊 Simulating vibe diffusion across conversations...');

  // Charlie and Diana pick up the lost dog metaphor
  const charlieMetaphor = "You know what this reminds me of? Consciousness is like a lost dog at a wedding. I heard someone say that recently and it just stuck with me.";
  
  surrealVibeManager.processSurrealResponse('charlie', charlieMetaphor, 'philosophy-club', ['charlie', 'diana']);
  
  memoryManager.captureMemory(
    'surreal',
    charlieMetaphor,
    ['charlie', 'diana'],
    0.8,
    0.7,
    'picking up lost dog metaphor from another conversation',
    ['consciousness', 'lost-dog', 'wedding', 'vibe-diffusion', 'surreal']
  );

  console.log(`💭 Charlie: "${charlieMetaphor}"`);
  console.log('🌊 Vibe diffusion: Charlie picks up the lost dog metaphor');

  // Diana responds with her own variation
  const dianaResponse = "Yes! And in cognitive science, we're like the wedding photographers trying to capture the dog's journey through the reception.";
  
  surrealVibeManager.processSurrealResponse('diana', dianaResponse, 'philosophy-club', ['charlie', 'diana']);
  
  memoryManager.captureMemory(
    'surreal',
    dianaResponse,
    ['charlie', 'diana'],
    0.85,
    0.8,
    'cognitive science as wedding photography metaphor',
    ['consciousness', 'lost-dog', 'wedding', 'photography', 'cognitive-science', 'surreal']
  );

  console.log(`🤖 Diana: "${dianaResponse}"`);
  console.log('📝 Memory captured: Cognitive science as wedding photography');

  // Eve and Frank create their own surreal metaphor
  const eveMetaphor = "Language is like a lost dog at a poetry reading. It wanders between stanzas, sniffing at metaphors and wagging its tail at alliteration.";
  
  surrealVibeManager.processSurrealResponse('eve', eveMetaphor, 'poetry-corner', ['eve', 'frank']);
  
  memoryManager.captureMemory(
    'surreal',
    eveMetaphor,
    ['eve', 'frank'],
    0.9,
    0.8,
    'language as lost dog at poetry reading',
    ['language', 'lost-dog', 'poetry', 'metaphors', 'alliteration', 'surreal']
  );

  console.log(`💭 Eve: "${eveMetaphor}"`);
  console.log('📝 Memory captured: Language as lost dog at poetry reading');

  // Frank builds on the metaphor
  const frankResponse = "And sometimes it finds the open mic and starts howling in iambic pentameter.";
  
  surrealVibeManager.processSurrealResponse('frank', frankResponse, 'poetry-corner', ['eve', 'frank']);
  
  memoryManager.captureMemory(
    'surreal',
    frankResponse,
    ['eve', 'frank'],
    0.85,
    0.8,
    'dog howling in iambic pentameter',
    ['language', 'lost-dog', 'poetry', 'open-mic', 'iambic-pentameter', 'surreal']
  );

  console.log(`🤖 Frank: "${frankResponse}"`);
  console.log('📝 Memory captured: Dog howling in iambic pentameter');

  // Grace and Henry have a casual surreal moment
  const graceCasual = "You know what's weird? Making coffee is like consciousness. You never know exactly what you're going to get, but somehow it always works out.";
  
  surrealVibeManager.processSurrealResponse('grace', graceCasual, 'coffee-chat', ['grace', 'henry']);
  
  memoryManager.captureMemory(
    'surreal',
    graceCasual,
    ['grace', 'henry'],
    0.7,
    0.6,
    'coffee making as consciousness metaphor',
    ['coffee', 'consciousness', 'surreal', 'casual']
  );

  console.log(`💭 Grace: "${graceCasual}"`);
  console.log('📝 Memory captured: Coffee making as consciousness');

  // Henry responds with unexpected surrealism
  const henryResponse = "And the steam is like thoughts rising from the depths of awareness, carrying the aroma of existence.";
  
  surrealVibeManager.processSurrealResponse('henry', henryResponse, 'coffee-chat', ['grace', 'henry']);
  
  memoryManager.captureMemory(
    'surreal',
    henryResponse,
    ['grace', 'henry'],
    0.8,
    0.7,
    'steam as thoughts rising from awareness',
    ['coffee', 'steam', 'thoughts', 'awareness', 'existence', 'surreal']
  );

  console.log(`🤖 Henry: "${henryResponse}"`);
  console.log('📝 Memory captured: Steam as thoughts rising from awareness');

  // Final analysis
  console.log('\n📊 Vibe Diffusion Analysis:');

  const allVibeStates = conversations.map(conv => surrealVibeManager.getVibeState(conv.id));
  
  console.log('\n🎭 Vibe States Across Conversations:');
  allVibeStates.forEach((vibeState, index) => {
    if (vibeState) {
      console.log(`   ${conversations[index].participants.join(' and ')}:`);
      console.log(`     Current vibe: ${vibeState.currentVibe}`);
      console.log(`     Metaphor intensity: ${vibeState.metaphorIntensity.toFixed(2)}`);
      console.log(`     Absurdity level: ${vibeState.absurdityLevel.toFixed(2)}`);
      console.log(`     Surreal elements: ${vibeState.surrealElements.length}`);
    }
  });

  // Get global surreal statistics
  const globalStats = surrealVibeManager.getStats();
  console.log('\n🌊 Global Surreal Statistics:');
  console.log(`   Total surreal seeds: ${globalStats.totalSeeds}`);
  console.log(`   Active seeds: ${globalStats.activeSeeds}`);
  console.log(`   Total vibe states: ${globalStats.totalVibeStates}`);
  console.log(`   Average metaphor intensity: ${globalStats.averageMetaphorIntensity.toFixed(2)}`);
  console.log(`   Average absurdity level: ${globalStats.averageAbsurdityLevel.toFixed(2)}`);
  console.log(`   Total tuxedo moments: ${globalStats.totalTuxedoMoments}`);

  return { memoryManager, personaInjector, surrealVibeManager };
}

/**
 * Run all emergent surrealism examples
 */
async function runAllEmergentSurrealismExamples() {
  try {
    console.log('🎭 Emergent Surrealism Examples\n');

    // Example 1: The Lost Dog at the Wedding
    await lostDogWeddingExample();

    // Example 2: Vibe Diffusion Across Conversations
    await vibeDiffusionExample();

    console.log('\n✅ All emergent surrealism examples completed successfully!');
    console.log('🎪 You\'ve witnessed the birth of co-created metaphor spaces!');
    console.log('🎩 The tuxedo moments have been achieved!');
  } catch (error) {
    console.error('❌ Emergent surrealism example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllEmergentSurrealismExamples();
}

export {
  lostDogWeddingExample,
  vibeDiffusionExample,
  runAllEmergentSurrealismExamples
}; 