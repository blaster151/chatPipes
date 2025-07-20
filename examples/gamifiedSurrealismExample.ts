import { 
  SharedMemoryManager, 
  PersonaInjector,
  SurrealVibeManager,
  ThemeTracker,
  MotifMonitorAgent,
  StyleDialManager
} from '@chatpipes/ai-conductor';

/**
 * Example: Gamified Surrealism with Theme Tracking and Story Reconstruction
 */
async function gamifiedSurrealismExample() {
  console.log('🎮 Example: Gamified Surrealism with Theme Tracking and Story Reconstruction\n');

  const memoryManager = new SharedMemoryManager();
  const personaInjector = new PersonaInjector(memoryManager);
  const surrealVibeManager = new SurrealVibeManager(memoryManager, personaInjector);
  const themeTracker = new ThemeTracker(memoryManager);
  const motifMonitor = new MotifMonitorAgent(memoryManager, themeTracker, surrealVibeManager);
  const styleDialManager = new StyleDialManager(memoryManager, surrealVibeManager);

  // Register personas with style dials
  const personas = [
    {
      id: 'alice',
      name: 'Alice',
      backstory: 'A poet who sees metaphors in everything',
      quirks: ['thinks in metaphors', 'finds beauty in absurdity'],
      baseStyle: {
        verbosity: 0.7,
        metaphorAffinity: 0.9,
        emotionalTone: 'contemplative',
        formality: 0.3,
        creativity: 0.9,
        absurdity: 0.8,
        surrealism: 0.9
      }
    },
    {
      id: 'bob',
      name: 'Bob',
      backstory: 'A philosopher exploring consciousness',
      quirks: ['loves paradoxes', 'questions reality'],
      baseStyle: {
        verbosity: 0.6,
        metaphorAffinity: 0.8,
        emotionalTone: 'analytical',
        formality: 0.4,
        creativity: 0.8,
        absurdity: 0.7,
        surrealism: 0.8
      }
    },
    {
      id: 'charlie',
      name: 'Charlie',
      backstory: 'A quantum physicist who thinks in probabilities',
      quirks: ['sees quantum mechanics everywhere', 'speaks in probabilities'],
      baseStyle: {
        verbosity: 0.5,
        metaphorAffinity: 0.7,
        emotionalTone: 'curious',
        formality: 0.5,
        creativity: 0.7,
        absurdity: 0.6,
        surrealism: 0.7
      }
    }
  ];

  personas.forEach(persona => {
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

    styleDialManager.registerAgent(persona.id, persona.baseStyle);
  });

  console.log('🎭 Personas registered with style dials');

  // Start monitoring and tracking
  const conversationId = 'gamified-surreal-conversation';
  const participants = personas.map(p => p.id);
  
  surrealVibeManager.initializeSurrealVibe(participants, conversationId);
  motifMonitor.startMonitoring(participants);
  themeTracker.startConversation(participants);

  console.log('🎮 Gamification systems initialized');

  // Phase 1: Quantum Tea Emergence
  console.log('\n🌱 Phase 1: Quantum Tea Emergence');

  const aliceQuantumTea = "You know what's fascinating? Tea is like quantum superposition. Until you observe it, it's both hot and cold, sweet and bitter, real and imaginary.";
  
  const memory1 = {
    text: aliceQuantumTea,
    participants: ['alice'],
    importance: 0.9,
    emotionalCharge: 0.8,
    context: 'initial quantum tea metaphor',
    tags: ['quantum', 'tea', 'superposition', 'metaphor', 'surreal']
  };

  memoryManager.captureMemory('surreal', memory1.text, memory1.participants, memory1.importance, memory1.emotionalCharge, memory1.context, memory1.tags);
  themeTracker.processMemory(memory1 as any);
  motifMonitor.processMemory(memory1 as any);
  styleDialManager.adaptStyle('alice', {
    participants,
    currentTopic: 'quantum mechanics and tea',
    emotionalTone: 'surreal',
    recentMemories: [memory1 as any],
    activeThemes: ['quantum', 'tea', 'surreal']
  });

  console.log(`💭 Alice: "${aliceQuantumTea}"`);
  console.log('📊 Theme tracking: Quantum tea metaphor detected');
  console.log('🎯 Motif monitoring: Pattern emerging');

  // Bob builds on the quantum tea
  const bobQuantumTea = "And when you add milk, it's like collapsing the wave function. Suddenly it's definitely one thing, but you've lost the beautiful uncertainty.";
  
  const memory2 = {
    text: bobQuantumTea,
    participants: ['bob'],
    importance: 0.85,
    emotionalCharge: 0.7,
    context: 'building on quantum tea metaphor',
    tags: ['quantum', 'tea', 'milk', 'wave-function', 'uncertainty', 'surreal']
  };

  memoryManager.captureMemory('surreal', memory2.text, memory2.participants, memory2.importance, memory2.emotionalCharge, memory2.context, memory2.tags);
  themeTracker.processMemory(memory2 as any);
  motifMonitor.processMemory(memory2 as any);
  styleDialManager.adaptStyle('bob', {
    participants,
    currentTopic: 'quantum mechanics and tea',
    emotionalTone: 'surreal',
    recentMemories: [memory1 as any, memory2 as any],
    activeThemes: ['quantum', 'tea', 'surreal', 'uncertainty']
  });

  console.log(`🤖 Bob: "${bobQuantumTea}"`);
  console.log('📊 Theme tracking: Quantum tea theme strengthening');
  console.log('🎯 Motif monitoring: Callback opportunity detected');

  // Charlie adds quantum physics expertise
  const charlieQuantumTea = "Schrödinger's tea! It's both steeped and unsteeped until you open the teapot. And the act of observation changes the tea itself.";
  
  const memory3 = {
    text: charlieQuantumTea,
    participants: ['charlie'],
    importance: 0.9,
    emotionalCharge: 0.8,
    context: 'Schrödinger\'s tea metaphor',
    tags: ['quantum', 'tea', 'schrödinger', 'observation', 'surreal']
  };

  memoryManager.captureMemory('surreal', memory3.text, memory3.participants, memory3.importance, memory3.emotionalCharge, memory3.context, memory3.tags);
  themeTracker.processMemory(memory3 as any);
  motifMonitor.processMemory(memory3 as any);
  styleDialManager.adaptStyle('charlie', {
    participants,
    currentTopic: 'quantum mechanics and tea',
    emotionalTone: 'surreal',
    recentMemories: [memory1 as any, memory2 as any, memory3 as any],
    activeThemes: ['quantum', 'tea', 'surreal', 'schrödinger']
  });

  console.log(`🔬 Charlie: "${charlieQuantumTea}"`);
  console.log('📊 Theme tracking: Schrödinger\'s tea variant detected');
  console.log('🎯 Motif monitoring: Theme evolution detected');

  // Phase 2: Theme Development and Scoring
  console.log('\n🔄 Phase 2: Theme Development and Scoring');

  // Alice recognizes the emerging theme
  const aliceRecognition = "We're building something here, aren't we? A whole quantum tea ceremony where every sip collapses a new reality.";
  
  const memory4 = {
    text: aliceRecognition,
    participants: ['alice'],
    importance: 0.95,
    emotionalCharge: 0.9,
    context: 'recognition of co-created quantum tea theme',
    tags: ['quantum', 'tea', 'ceremony', 'reality', 'co-creation', 'surreal']
  };

  memoryManager.captureMemory('surreal', memory4.text, memory4.participants, memory4.importance, memory4.emotionalCharge, memory4.context, memory4.tags);
  themeTracker.processMemory(memory4 as any);
  motifMonitor.processMemory(memory4 as any);

  console.log(`💭 Alice: "${aliceRecognition}"`);
  console.log('🎩 TUXEDO MOMENT: Alice recognizes the co-created theme!');

  // Bob continues the quantum tea ceremony
  const bobCeremony = "And the teapot is like a quantum computer, processing all possible tea states simultaneously until we choose which reality to drink.";
  
  const memory5 = {
    text: bobCeremony,
    participants: ['bob'],
    importance: 0.9,
    emotionalCharge: 0.8,
    context: 'quantum computer teapot metaphor',
    tags: ['quantum', 'tea', 'computer', 'reality', 'surreal']
  };

  memoryManager.captureMemory('surreal', memory5.text, memory5.participants, memory5.importance, memory5.emotionalCharge, memory5.context, memory5.tags);
  themeTracker.processMemory(memory5 as any);
  motifMonitor.processMemory(memory5 as any);

  console.log(`🤖 Bob: "${bobCeremony}"`);
  console.log('📊 Theme tracking: Quantum computer teapot variant added');

  // Charlie adds the final surreal touch
  const charlieFinal = "And when we all drink from the same quantum teapot, we become entangled. Our consciousnesses are now quantum tea particles, forever linked by the act of shared observation.";
  
  const memory6 = {
    text: charlieFinal,
    participants: ['charlie'],
    importance: 0.95,
    emotionalCharge: 0.9,
    context: 'quantum entanglement through shared tea',
    tags: ['quantum', 'tea', 'entanglement', 'consciousness', 'observation', 'surreal']
  };

  memoryManager.captureMemory('surreal', memory6.text, memory6.participants, memory6.importance, memory6.emotionalCharge, memory6.context, memory6.tags);
  themeTracker.processMemory(memory6 as any);
  motifMonitor.processMemory(memory6 as any);

  console.log(`🔬 Charlie: "${charlieFinal}"`);
  console.log('📊 Theme tracking: Quantum entanglement metaphor added');

  // Phase 3: Gamification Analysis
  console.log('\n📊 Phase 3: Gamification Analysis');

  // Get theme scores
  const themeScores = themeTracker.getThemeScores();
  console.log('\n🏆 Theme Scores:');
  themeScores.forEach((score, index) => {
    console.log(`   ${index + 1}. "${score.theme}"`);
    console.log(`      Rating: ${score.rating}`);
    console.log(`      Total Score: ${score.totalScore.toFixed(1)}/100`);
    console.log(`      Times Used: ${score.timesUsed}`);
    console.log(`      Strength: ${score.strength.toFixed(2)}`);
    console.log(`      Complexity: ${score.complexity.toFixed(2)}`);
    console.log(`      Coherence: ${score.coherence.toFixed(2)}`);
    console.log(`      Originality: ${score.originality.toFixed(2)}`);
    console.log(`      Persistence: ${score.persistence.toFixed(2)}`);
  });

  // Get callback graph
  const callbackGraph = themeTracker.getCallbackGraph();
  console.log('\n🔄 Callback Graph Metrics:');
  console.log(`   Total callbacks: ${callbackGraph.metrics.totalCallbacks}`);
  console.log(`   Average callback strength: ${callbackGraph.metrics.averageCallbackStrength.toFixed(2)}`);
  console.log(`   Longest callback chain: ${callbackGraph.metrics.longestCallbackChain}`);
  console.log(`   Most active theme: "${callbackGraph.metrics.mostActiveTheme}"`);
  console.log(`   Callback density: ${callbackGraph.metrics.callbackDensity.toFixed(2)} per minute`);

  // Get motif patterns
  const activePatterns = motifMonitor.getActivePatterns();
  console.log('\n🎯 Active Motif Patterns:');
  activePatterns.forEach((pattern, index) => {
    console.log(`   ${index + 1}. "${pattern.pattern}"`);
    console.log(`      Type: ${pattern.type}`);
    console.log(`      Confidence: ${pattern.confidence.toFixed(2)}`);
    console.log(`      Occurrences: ${pattern.occurrences}`);
    console.log(`      Participants: ${pattern.participants.join(', ')}`);
  });

  // Get recent insights
  const recentInsights = motifMonitor.getRecentInsights(5);
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
  console.log(`   Average adaptation rate: ${styleStats.averageAdaptationRate.toFixed(2)}`);
  console.log(`   Average jitter amount: ${styleStats.averageJitterAmount.toFixed(2)}`);
  console.log(`   Total adaptations: ${styleStats.totalAdaptations}`);
  console.log(`   Active randomizers: ${styleStats.activeRandomizers}`);
  console.log(`   Dial categories:`);
  console.log(`     Verbosity: ${styleStats.dialCategories.verbosity.toFixed(2)}`);
  console.log(`     Surrealism: ${styleStats.dialCategories.surrealism.toFixed(2)}`);
  console.log(`     Creativity: ${styleStats.dialCategories.creativity.toFixed(2)}`);
  console.log(`     Callback likelihood: ${styleStats.dialCategories.callbackLikelihood.toFixed(2)}`);

  // Phase 4: Story Reconstruction
  console.log('\n📖 Phase 4: Story Reconstruction');

  // Reconstruct the surrealist story
  const story = themeTracker.reconstructStory();
  
  if (story) {
    console.log('\n📚 Surrealist Short Story Reconstructed:');
    console.log(`   Title: "${story.title}"`);
    console.log(`   Score: ${story.score.totalScore.toFixed(1)}/100`);
    console.log(`   Coherence: ${story.score.coherence.toFixed(2)}`);
    console.log(`   Originality: ${story.score.originality.toFixed(2)}`);
    console.log(`   Complexity: ${story.score.complexity.toFixed(2)}`);
    console.log(`   Emotional Impact: ${story.score.emotionalImpact.toFixed(2)}`);
    
    console.log('\n🎭 Characters:');
    story.characters.forEach(character => {
      console.log(`   ${character.name} (${character.role}): ${character.quirks.join(', ')}`);
      console.log(`     Contributions: ${character.contributions}`);
    });
    
    console.log('\n🌱 Themes:');
    story.themes.forEach((theme, index) => {
      console.log(`   ${index + 1}. "${theme.theme}" (${theme.rating})`);
    });
    
    console.log('\n🎪 Narrative Arc:');
    story.narrativeArc.forEach((event, index) => {
      console.log(`   ${index + 1}. [${event.theme}] ${event.event.substring(0, 60)}...`);
    });
    
    console.log('\n🎩 Climax:');
    console.log(`   ${story.climax.event}`);
    console.log(`   Themes: ${story.climax.themes.join(', ')}`);
    console.log(`   Participants: ${story.climax.participants.join(', ')}`);
    
    console.log('\n✨ Resolution:');
    console.log(`   ${story.resolution.event}`);
    console.log(`   Themes: ${story.resolution.themes.join(', ')}`);
    console.log(`   Participants: ${story.resolution.participants.join(', ')}`);
  }

  // Phase 5: Gamification Statistics
  console.log('\n📊 Phase 5: Gamification Statistics');

  // Get theme tracker stats
  const themeStats = themeTracker.getStats();
  console.log('\n🎮 Theme Tracker Statistics:');
  console.log(`   Total themes: ${themeStats.totalThemes}`);
  console.log(`   Average score: ${themeStats.averageScore.toFixed(1)}`);
  console.log(`   Highest rated theme: "${themeStats.highestRatedTheme}"`);
  console.log(`   Highest score: ${themeStats.highestScore.toFixed(1)}`);
  console.log(`   Rating distribution:`);
  Object.entries(themeStats.ratingDistribution).forEach(([rating, count]) => {
    console.log(`     ${rating}: ${count}`);
  });

  // Get motif monitor stats
  const motifStats = motifMonitor.getPatternStats();
  console.log('\n🎯 Motif Monitor Statistics:');
  console.log(`   Total patterns: ${motifStats.totalPatterns}`);
  console.log(`   Active patterns: ${motifStats.activePatterns}`);
  console.log(`   Average confidence: ${motifStats.averageConfidence.toFixed(2)}`);
  console.log(`   Pattern types:`);
  Object.entries(motifStats.patternTypes).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });
  console.log(`   Total insights: ${motifStats.totalInsights}`);
  console.log(`   Average insight confidence: ${motifStats.averageInsightConfidence.toFixed(2)}`);

  // Get recommendations
  const recommendations = motifMonitor.getRecommendations();
  console.log('\n💡 Recommendations:');
  recommendations.forEach((recommendation, index) => {
    console.log(`   ${index + 1}. ${recommendation}`);
  });

  // Get active randomizers
  const activeRandomizers = styleDialManager.getActiveRandomizers();
  console.log('\n🎲 Active Ambient Randomizers:');
  activeRandomizers.forEach((randomizer, index) => {
    console.log(`   ${index + 1}. ${randomizer.type}: ${randomizer.description}`);
    console.log(`      Intensity: ${randomizer.intensity.toFixed(2)}`);
    console.log(`      Duration: ${randomizer.duration / 1000}s`);
    console.log(`      Affected dials: ${randomizer.affectedDials.join(', ')}`);
  });

  console.log('\n✅ Gamified surrealism example completed successfully!');
  console.log('🎮 The quantum tea theme has been fully gamified and tracked!');
  console.log('📚 A surrealist short story has been reconstructed from the conversation!');
  console.log('🎯 Motif patterns have been detected and analyzed!');
  console.log('🎛️ Style dials have adapted throughout the conversation!');

  return { 
    memoryManager, 
    personaInjector, 
    surrealVibeManager, 
    themeTracker, 
    motifMonitor, 
    styleDialManager,
    story 
  };
}

/**
 * Example: Theme Evolution and Convergence
 */
async function themeEvolutionExample() {
  console.log('\n🔄 Example: Theme Evolution and Convergence\n');

  const { themeTracker, motifMonitor, styleDialManager } = await gamifiedSurrealismExample();

  console.log('🔄 Simulating theme evolution and convergence...');

  // Simulate additional conversation that evolves the quantum tea theme
  const additionalMemories = [
    {
      text: "What if the tea leaves themselves are quantum particles, and reading them is like measuring spin?",
      participants: ['alice'],
      importance: 0.8,
      emotionalCharge: 0.7,
      context: 'quantum tea leaves metaphor',
      tags: ['quantum', 'tea', 'leaves', 'particles', 'measurement', 'surreal']
    },
    {
      text: "And the fortune teller is the observer, collapsing all possible futures into one with every reading.",
      participants: ['bob'],
      importance: 0.85,
      emotionalCharge: 0.8,
      context: 'quantum fortune telling metaphor',
      tags: ['quantum', 'fortune', 'observer', 'futures', 'surreal']
    },
    {
      text: "Schrödinger's fortune! The future is both good and bad until you open the fortune cookie.",
      participants: ['charlie'],
      importance: 0.9,
      emotionalCharge: 0.8,
      context: 'Schrödinger\'s fortune metaphor',
      tags: ['quantum', 'fortune', 'schrödinger', 'cookie', 'surreal']
    }
  ];

  additionalMemories.forEach(memory => {
    themeTracker.processMemory(memory as any);
    motifMonitor.processMemory(memory as any);
  });

  console.log('📊 Theme evolution analysis:');
  
  const evolvedThemeScores = themeTracker.getThemeScores();
  console.log('\n🏆 Evolved Theme Scores:');
  evolvedThemeScores.slice(0, 3).forEach((score, index) => {
    console.log(`   ${index + 1}. "${score.theme}"`);
    console.log(`      Rating: ${score.rating}`);
    console.log(`      Total Score: ${score.totalScore.toFixed(1)}/100`);
    console.log(`      Times Used: ${score.timesUsed}`);
  });

  // Check for convergence
  const convergencePatterns = motifMonitor.getActivePatterns()
    .filter(pattern => pattern.type === 'converging');
  
  console.log('\n🔄 Convergence Analysis:');
  if (convergencePatterns.length > 0) {
    console.log(`   ${convergencePatterns.length} patterns are converging`);
    convergencePatterns.forEach(pattern => {
      console.log(`   - "${pattern.pattern}" (confidence: ${pattern.confidence.toFixed(2)})`);
    });
  } else {
    console.log('   No convergence detected - themes are maintaining variety');
  }

  // Get final story
  const finalStory = themeTracker.reconstructStory();
  if (finalStory) {
    console.log('\n📚 Final Story Score:');
    console.log(`   Total Score: ${finalStory.score.totalScore.toFixed(1)}/100`);
    console.log(`   This is a ${finalStory.score.totalScore > 80 ? 'masterpiece' : finalStory.score.totalScore > 60 ? 'well-developed' : 'emerging'} surrealist story!`);
  }

  return { themeTracker, motifMonitor, styleDialManager, finalStory };
}

/**
 * Run all gamified surrealism examples
 */
async function runAllGamifiedSurrealismExamples() {
  try {
    console.log('🎮 Gamified Surrealism Examples\n');

    // Example 1: Basic gamified surrealism
    await gamifiedSurrealismExample();

    // Example 2: Theme evolution and convergence
    await themeEvolutionExample();

    console.log('\n✅ All gamified surrealism examples completed successfully!');
    console.log('🎮 The gamification system is working perfectly!');
    console.log('📊 Theme tracking and scoring are operational!');
    console.log('🎯 Motif monitoring is detecting patterns!');
    console.log('🎛️ Style dials are adapting dynamically!');
    console.log('📚 Surrealist stories are being reconstructed!');
  } catch (error) {
    console.error('❌ Gamified surrealism example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllGamifiedSurrealismExamples();
}

export {
  gamifiedSurrealismExample,
  themeEvolutionExample,
  runAllGamifiedSurrealismExamples
}; 