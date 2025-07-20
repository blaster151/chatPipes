// Simple test of the emergent surrealism system
const { SharedMemoryManager, PersonaInjector, SurrealVibeManager } = require('./packages/ai-conductor/src/index.ts');

console.log('🎭 Testing Emergent Surrealism System\n');

// Create managers
const memoryManager = new SharedMemoryManager();
const personaInjector = new PersonaInjector(memoryManager);
const surrealVibeManager = new SurrealVibeManager(memoryManager, personaInjector);

// Register personas
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

console.log('✅ Personas registered successfully');

// Initialize surreal vibe
const conversationId = 'lost-dog-conversation';
surrealVibeManager.initializeSurrealVibe(['alice', 'bob'], conversationId);

console.log('🎭 Surreal vibe initialized');

// Alice introduces the lost dog metaphor
const aliceSeed = "You know, consciousness is like a lost dog at a wedding. It wanders around, confused but somehow belonging, trying to figure out what's happening.";

surrealVibeManager.processSurrealResponse('alice', aliceSeed, conversationId, ['alice', 'bob']);

memoryManager.captureMemory(
  'surreal',
  aliceSeed,
  ['alice', 'bob'],
  0.9,
  0.7,
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

// The Tuxedo Moment
const aliceTuxedo = "That felt like the lost dog again, didn't it? We keep coming back to this wedding.";

surrealVibeManager.processSurrealResponse('alice', aliceTuxedo, conversationId, ['alice', 'bob']);

memoryManager.captureMemory(
  'surreal',
  aliceTuxedo,
  ['alice', 'bob'],
  0.95,
  0.9,
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
  0.95,
  0.95,
  'perfect tuxedo moment response',
  ['consciousness', 'lost-dog', 'wedding', 'tuxedo', 'tuxedo-moment', 'co-creation', 'surreal']
);

console.log(`🤖 Bob: "${bobTuxedo}"`);
console.log('🎩 PERFECT TUXEDO MOMENT: Bob builds on the metaphor with the tux!');

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

console.log('\n✅ Emergent surrealism system test completed successfully!');
console.log('🎩 The tuxedo moments have been achieved!');
console.log('🎪 Co-created metaphor spaces are now possible!'); 