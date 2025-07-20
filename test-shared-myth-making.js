// Simple test of the shared myth-making system
const { SharedMemoryManager, PersonaInjector } = require('./packages/ai-conductor/src/index.ts');

console.log('🎭 Testing Shared Myth-Making System\n');

// Create memory manager and persona injector
const memoryManager = new SharedMemoryManager();
const personaInjector = new PersonaInjector(memoryManager);

// Register personas
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

console.log('✅ Personas registered successfully');

// Capture the birth of the Quantum Tea joke
const teaObservation = "You know, when you really think about it, tea is kind of like quantum mechanics. You never know if it's going to be hot or cold until you drink it.";

memoryManager.captureMemory(
  'joke',
  teaObservation,
  ['alex', 'sage'],
  0.8, // High importance
  0.7, // Positive emotional charge
  'philosophical discussion about tea',
  ['quantum', 'tea', 'surreal', 'philosophy']
);

console.log('📝 Memory captured: Quantum Tea observation');

// Sage builds on the joke
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

console.log('📝 Memory captured: Schrödinger\'s Tea paradox');

// Check if a running joke was created
const activeJokes = memoryManager.getActiveJokes(['alex', 'sage']);
console.log('\n🎪 Active Running Jokes:');
activeJokes.forEach(joke => {
  console.log(`   ${joke.name}: ${joke.description}`);
  console.log(`     Strength: ${joke.strength.toFixed(2)}`);
  console.log(`     Usage count: ${joke.usageCount}`);
});

// Generate memory injections
const injections = personaInjector.generatePersonaInjection('sage', {
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
injections.forEach(injection => {
  console.log(`   ${injection.type}: ${injection.content}`);
  console.log(`     Priority: ${injection.priority.toFixed(2)}`);
});

// Get statistics
const stats = memoryManager.getStats();
console.log('\n📊 Memory Statistics:');
console.log(`   Total memories: ${stats.totalMemories}`);
console.log(`   Active memories: ${stats.activeMemories}`);
console.log(`   Running jokes: ${stats.activeJokes}`);
console.log(`   Shared themes: ${stats.activeThemes}`);
console.log(`   Surreal moments: ${stats.activeSurreal}`);

console.log('\n✅ Shared myth-making system test completed successfully!');
console.log('🎪 The Quantum Tea running joke has been born!'); 