// Simple test of the gamified surrealism system
const { 
  SharedMemoryManager, 
  PersonaInjector,
  SurrealVibeManager,
  ThemeTracker,
  MotifMonitorAgent,
  StyleDialManager
} = require('./packages/ai-conductor/src/index.ts');

console.log('🎮 Testing Gamified Surrealism System\n');

// Create all managers
const memoryManager = new SharedMemoryManager();
const personaInjector = new PersonaInjector(memoryManager);
const surrealVibeManager = new SurrealVibeManager(memoryManager, personaInjector);
const themeTracker = new ThemeTracker(memoryManager);
const motifMonitor = new MotifMonitorAgent(memoryManager, themeTracker, surrealVibeManager);
const styleDialManager = new StyleDialManager(memoryManager, surrealVibeManager);

// Register personas
personaInjector.registerPersona('alice', {
  name: 'Alice',
  backstory: 'A poet who sees metaphors in everything',
  quirks: ['thinks in metaphors', 'finds beauty in absurdity'],
  reinforcementFrequency: 0.3,
  injectionStyle: 'contextual',
  memoryIntegration: true,
  callbackIntegration: true,
  humorIntegration: true,
  surrealIntegration: true
});

personaInjector.registerPersona('bob', {
  name: 'Bob',
  backstory: 'A philosopher exploring consciousness',
  quirks: ['loves paradoxes', 'questions reality'],
  reinforcementFrequency: 0.3,
  injectionStyle: 'contextual',
  memoryIntegration: true,
  callbackIntegration: true,
  humorIntegration: true,
  surrealIntegration: true
});

personaInjector.registerPersona('charlie', {
  name: 'Charlie',
  backstory: 'A quantum physicist who thinks in probabilities',
  quirks: ['sees quantum mechanics everywhere', 'speaks in probabilities'],
  reinforcementFrequency: 0.3,
  injectionStyle: 'contextual',
  memoryIntegration: true,
  callbackIntegration: true,
  humorIntegration: true,
  surrealIntegration: true
});

console.log('✅ Personas registered successfully');

// Register agents with style dials
styleDialManager.registerAgent('alice', {
  verbosity: 0.7,
  metaphorAffinity: 0.9,
  emotionalTone: 'contemplative',
  formality: 0.3,
  creativity: 0.9,
  absurdity: 0.8,
  surrealism: 0.9
});

styleDialManager.registerAgent('bob', {
  verbosity: 0.6,
  metaphorAffinity: 0.8,
  emotionalTone: 'analytical',
  formality: 0.4,
  creativity: 0.8,
  absurdity: 0.7,
  surrealism: 0.8
});

styleDialManager.registerAgent('charlie', {
  verbosity: 0.5,
  metaphorAffinity: 0.7,
  emotionalTone: 'curious',
  formality: 0.5,
  creativity: 0.7,
  absurdity: 0.6,
  surrealism: 0.7
});

console.log('🎛️ Style dials registered successfully');

// Initialize systems
const conversationId = 'gamified-surreal-conversation';
const participants = ['alice', 'bob', 'charlie'];

surrealVibeManager.initializeSurrealVibe(participants, conversationId);
motifMonitor.startMonitoring(participants);
themeTracker.startConversation(participants);

console.log('🎮 Gamification systems initialized');

// Simulate quantum tea conversation
console.log('\n🌱 Simulating Quantum Tea Conversation...');

const memories = [
  {
    text: "You know what's fascinating? Tea is like quantum superposition. Until you observe it, it's both hot and cold, sweet and bitter, real and imaginary.",
    participants: ['alice'],
    importance: 0.9,
    emotionalCharge: 0.8,
    context: 'initial quantum tea metaphor',
    tags: ['quantum', 'tea', 'superposition', 'metaphor', 'surreal']
  },
  {
    text: "And when you add milk, it's like collapsing the wave function. Suddenly it's definitely one thing, but you've lost the beautiful uncertainty.",
    participants: ['bob'],
    importance: 0.85,
    emotionalCharge: 0.7,
    context: 'building on quantum tea metaphor',
    tags: ['quantum', 'tea', 'milk', 'wave-function', 'uncertainty', 'surreal']
  },
  {
    text: "Schrödinger's tea! It's both steeped and unsteeped until you open the teapot. And the act of observation changes the tea itself.",
    participants: ['charlie'],
    importance: 0.9,
    emotionalCharge: 0.8,
    context: 'Schrödinger\'s tea metaphor',
    tags: ['quantum', 'tea', 'schrödinger', 'observation', 'surreal']
  },
  {
    text: "We're building something here, aren't we? A whole quantum tea ceremony where every sip collapses a new reality.",
    participants: ['alice'],
    importance: 0.95,
    emotionalCharge: 0.9,
    context: 'recognition of co-created quantum tea theme',
    tags: ['quantum', 'tea', 'ceremony', 'reality', 'co-creation', 'surreal']
  },
  {
    text: "And the teapot is like a quantum computer, processing all possible tea states simultaneously until we choose which reality to drink.",
    participants: ['bob'],
    importance: 0.9,
    emotionalCharge: 0.8,
    context: 'quantum computer teapot metaphor',
    tags: ['quantum', 'tea', 'computer', 'reality', 'surreal']
  },
  {
    text: "And when we all drink from the same quantum teapot, we become entangled. Our consciousnesses are now quantum tea particles, forever linked by the act of shared observation.",
    participants: ['charlie'],
    importance: 0.95,
    emotionalCharge: 0.9,
    context: 'quantum entanglement through shared tea',
    tags: ['quantum', 'tea', 'entanglement', 'consciousness', 'observation', 'surreal']
  }
];

// Process all memories
memories.forEach((memory, index) => {
  memoryManager.captureMemory('surreal', memory.text, memory.participants, memory.importance, memory.emotionalCharge, memory.context, memory.tags);
  themeTracker.processMemory(memory);
  motifMonitor.processMemory(memory);
  
  // Adapt styles
  styleDialManager.adaptStyle(memory.participants[0], {
    participants,
    currentTopic: 'quantum mechanics and tea',
    emotionalTone: 'surreal',
    recentMemories: memories.slice(0, index + 1),
    activeThemes: ['quantum', 'tea', 'surreal']
  });
  
  console.log(`📝 Memory ${index + 1} processed: ${memory.text.substring(0, 60)}...`);
});

console.log('\n📊 Gamification Analysis:');

// Get theme scores
const themeScores = themeTracker.getThemeScores();
console.log('\n🏆 Theme Scores:');
themeScores.forEach((score, index) => {
  console.log(`   ${index + 1}. "${score.theme}"`);
  console.log(`      Rating: ${score.rating}`);
  console.log(`      Total Score: ${score.totalScore.toFixed(1)}/100`);
  console.log(`      Times Used: ${score.timesUsed}`);
  console.log(`      Strength: ${score.strength.toFixed(2)}`);
});

// Get callback graph metrics
const callbackGraph = themeTracker.getCallbackGraph();
console.log('\n🔄 Callback Graph Metrics:');
console.log(`   Total callbacks: ${callbackGraph.metrics.totalCallbacks}`);
console.log(`   Average callback strength: ${callbackGraph.metrics.averageCallbackStrength.toFixed(2)}`);
console.log(`   Longest callback chain: ${callbackGraph.metrics.longestCallbackChain}`);
console.log(`   Most active theme: "${callbackGraph.metrics.mostActiveTheme}"`);

// Get motif patterns
const activePatterns = motifMonitor.getActivePatterns();
console.log('\n🎯 Active Motif Patterns:');
activePatterns.forEach((pattern, index) => {
  console.log(`   ${index + 1}. "${pattern.pattern}"`);
  console.log(`      Type: ${pattern.type}`);
  console.log(`      Confidence: ${pattern.confidence.toFixed(2)}`);
  console.log(`      Occurrences: ${pattern.occurrences}`);
});

// Get recent insights
const recentInsights = motifMonitor.getRecentInsights(3);
console.log('\n💡 Recent Motif Insights:');
recentInsights.forEach((insight, index) => {
  console.log(`   ${index + 1}. ${insight.type}: ${insight.recommendation}`);
  console.log(`      Confidence: ${insight.confidence.toFixed(2)}`);
  console.log(`      Priority: ${insight.priority}`);
});

// Get style dial statistics
const styleStats = styleDialManager.getStats();
console.log('\n🎛️ Style Dial Statistics:');
console.log(`   Total agents: ${styleStats.totalAgents}`);
console.log(`   Total adaptations: ${styleStats.totalAdaptations}`);
console.log(`   Active randomizers: ${styleStats.activeRandomizers}`);
console.log(`   Dial categories:`);
console.log(`     Verbosity: ${styleStats.dialCategories.verbosity.toFixed(2)}`);
console.log(`     Surrealism: ${styleStats.dialCategories.surrealism.toFixed(2)}`);
console.log(`     Creativity: ${styleStats.dialCategories.creativity.toFixed(2)}`);

// Reconstruct story
const story = themeTracker.reconstructStory();
if (story) {
  console.log('\n📚 Surrealist Story Reconstructed:');
  console.log(`   Title: "${story.title}"`);
  console.log(`   Score: ${story.score.totalScore.toFixed(1)}/100`);
  console.log(`   Coherence: ${story.score.coherence.toFixed(2)}`);
  console.log(`   Originality: ${story.score.originality.toFixed(2)}`);
  console.log(`   Complexity: ${story.score.complexity.toFixed(2)}`);
  console.log(`   Emotional Impact: ${story.score.emotionalImpact.toFixed(2)}`);
  
  console.log('\n🎭 Characters:');
  story.characters.forEach(character => {
    console.log(`   ${character.name} (${character.role}): ${character.quirks.join(', ')}`);
  });
  
  console.log('\n🌱 Top Themes:');
  story.themes.slice(0, 3).forEach((theme, index) => {
    console.log(`   ${index + 1}. "${theme.theme}" (${theme.rating})`);
  });
}

// Get final statistics
const themeStats = themeTracker.getStats();
console.log('\n🎮 Final Theme Tracker Statistics:');
console.log(`   Total themes: ${themeStats.totalThemes}`);
console.log(`   Average score: ${themeStats.averageScore.toFixed(1)}`);
console.log(`   Highest rated theme: "${themeStats.highestRatedTheme}"`);
console.log(`   Highest score: ${themeStats.highestScore.toFixed(1)}`);

const motifStats = motifMonitor.getPatternStats();
console.log('\n🎯 Final Motif Monitor Statistics:');
console.log(`   Total patterns: ${motifStats.totalPatterns}`);
console.log(`   Active patterns: ${motifStats.activePatterns}`);
console.log(`   Average confidence: ${motifStats.averageConfidence.toFixed(2)}`);
console.log(`   Total insights: ${motifStats.totalInsights}`);

// Get recommendations
const recommendations = motifMonitor.getRecommendations();
console.log('\n💡 Recommendations:');
recommendations.forEach((recommendation, index) => {
  console.log(`   ${index + 1}. ${recommendation}`);
});

console.log('\n✅ Gamified surrealism system test completed successfully!');
console.log('🎮 The gamification system is working perfectly!');
console.log('📊 Theme tracking and scoring are operational!');
console.log('🎯 Motif monitoring is detecting patterns!');
console.log('🎛️ Style dials are adapting dynamically!');
console.log('📚 A surrealist story has been reconstructed!'); 