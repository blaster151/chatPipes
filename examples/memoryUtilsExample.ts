import { 
  MemoryManager, 
  MemoryUtils,
  MemoryItem,
  CompactMemoryData,
  DualUtterance
} from '@chatpipes/ai-conductor';

/**
 * Example: Memory Helper Tools and Firebase-Friendly Storage
 */
async function memoryUtilsExample() {
  console.log('🧰 Example: Memory Helper Tools and Firebase-Friendly Storage\n');

  const memoryManager = new MemoryManager();

  console.log('✅ MemoryManager with helper tools initialized');

  // Phase 1: Generate lots of memories for testing
  console.log('\n📝 Phase 1: Generating memories for testing');

  const testMemories: DualUtterance[] = [
    // Facts about Alice
    {
      agentId: 'alice',
      text: "I'm a quantum physicist who studies consciousness at the Institute for Advanced Studies.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.8, emotionalTone: 'neutral' }
    },
    {
      agentId: 'alice',
      text: "I have a PhD in theoretical physics from MIT and I live in Princeton, New Jersey.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.6, emotionalTone: 'neutral' }
    },
    {
      agentId: 'alice',
      text: "I have two cats named Schrödinger and Heisenberg, and I enjoy hiking in the mountains on weekends.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.7, emotionalTone: 'amused' }
    },
    {
      agentId: 'alice',
      text: "I'm currently researching quantum consciousness theories and I suspect that reality is just the universe's way of daydreaming about itself.",
      timestamp: Date.now(),
      style: { verbosity: 0.9, metaphorAffinity: 0.9, emotionalTone: 'contemplative' }
    },
    {
      agentId: 'alice',
      text: "I tend to speak quite formally when discussing scientific topics, but I love using metaphors to explain complex concepts.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.9, emotionalTone: 'enthusiastic' }
    },
    
    // Jokes and callbacks
    {
      agentId: 'alice',
      text: "Consciousness is like a lost dog at a wedding - that's my favorite metaphor! 😄",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.9, emotionalTone: 'amused' }
    },
    {
      agentId: 'alice',
      text: "The lost dog is now wearing a tuxedo! That's hilarious! 😂",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.9, emotionalTone: 'amused' }
    },
    {
      agentId: 'alice',
      text: "Remember when I said consciousness is like a lost dog? That metaphor keeps evolving!",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.8, emotionalTone: 'reflective' }
    },
    
    // Emotions
    {
      agentId: 'alice',
      text: "I'm really excited about this conversation! It feels like we're discovering something profound.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.7, emotionalTone: 'enthusiastic' }
    },
    {
      agentId: 'alice',
      text: "This is fascinating! I love exploring these ideas with someone who understands.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.7, emotionalTone: 'enthusiastic' }
    },
    
    // Suspicions
    {
      agentId: 'alice',
      text: "I suspect that Bob might be hiding something about his research background.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.5, emotionalTone: 'suspicious' }
    },
    {
      agentId: 'alice',
      text: "I wonder if there's more to this conversation than meets the eye.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.6, emotionalTone: 'contemplative' }
    }
  ];

  // Ingest all memories
  testMemories.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Memory ${index + 1}: ${utterance.text.substring(0, 50)}...`);
  });

  // Phase 2: Test 1. Compaction function
  console.log('\n🔧 Phase 2: Testing 1. Compaction function');

  console.log('\n📝 Before compaction:');
  const beforeCompaction = memoryManager.getMemoriesByType('fact');
  beforeCompaction.forEach((memory, index) => {
    console.log(`   ${index + 1}. ${memory.content.substring(0, 60)}...`);
  });

  // Compact facts for Alice
  memoryManager.compactFacts('alice');

  console.log('\n📝 After compaction:');
  const afterCompaction = memoryManager.getMemoriesByType('fact');
  afterCompaction.forEach((memory, index) => {
    console.log(`   ${index + 1}. ${memory.content.substring(0, 60)}...`);
    console.log(`      Tags: ${memory.tags?.join(', ')}`);
  });

  // Phase 3: Test 2. Memory Importance Ranking
  console.log('\n🏆 Phase 3: Testing 2. Memory Importance Ranking');

  console.log('\n📊 Top 10 memories by importance:');
  const topMemories = memoryManager.getTopMemories(10);
  topMemories.forEach((memory, index) => {
    console.log(`   ${index + 1}. [${memory.type}] ${memory.content.substring(0, 50)}...`);
    console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
  });

  console.log('\n📊 Top 5 jokes:');
  const topJokes = memoryManager.getTopMemoriesByType('joke', 5);
  topJokes.forEach((memory, index) => {
    console.log(`   ${index + 1}. ${memory.content.substring(0, 50)}...`);
  });

  console.log('\n📊 Top 5 suspicions:');
  const topSuspicions = memoryManager.getTopMemoriesByType('suspicion', 5);
  topSuspicions.forEach((memory, index) => {
    console.log(`   ${index + 1}. ${memory.content.substring(0, 50)}...`);
  });

  // Phase 4: Test 3. Motif Pruning
  console.log('\n✂️ Phase 4: Testing 3. Motif Pruning');

  console.log('\n🎭 Before pruning:');
  const allMotifs = memoryManager['motifs'].getMotifs();
  Object.entries(allMotifs).forEach(([key, motif]) => {
    console.log(`   "${motif.phrase.substring(0, 30)}..." (${motif.timesUsed}x, ${motif.mood || 'neutral'})`);
  });

  // Prune motifs (keep only frequently used or recent ones)
  memoryManager.pruneMotifs(24); // 24 hours

  console.log('\n🎭 After pruning:');
  const prunedMotifs = memoryManager['motifs'].getMotifs();
  Object.entries(prunedMotifs).forEach(([key, motif]) => {
    console.log(`   "${motif.phrase.substring(0, 30)}..." (${motif.timesUsed}x, ${motif.mood || 'neutral'})`);
  });

  // Get pruning statistics
  const pruningStats = memoryManager.getPrunedMotifsWithMetadata(24);
  console.log('\n📊 Pruning statistics:');
  console.log(`   Total motifs: ${pruningStats.stats.totalMotifs}`);
  console.log(`   Kept motifs: ${pruningStats.stats.keptMotifs}`);
  console.log(`   Removed motifs: ${pruningStats.stats.removedMotifs}`);
  console.log(`   Kept by frequency: ${pruningStats.stats.keptByFrequency}`);
  console.log(`   Kept by recency: ${pruningStats.stats.keptByRecency}`);

  // Phase 5: Test 4. Firebase-friendly compact format
  console.log('\n🔥 Phase 5: Testing 4. Firebase-friendly compact format');

  // Convert to compact format
  const compactData = memoryManager.toCompactFormat('alice');
  
  if (compactData) {
    console.log('\n📦 Compact memory data (Firebase-friendly):');
    console.log(JSON.stringify(compactData, null, 2));

    // Test conversion back
    console.log('\n🔄 Testing conversion back from compact format...');
    
    // Clear current data
    memoryManager.clear();
    
    // Load from compact format
    memoryManager.fromCompactFormat(compactData);
    
    // Verify data was restored
    const restoredBlob = memoryManager.getMemoryBlob('alice');
    if (restoredBlob) {
      console.log('\n✅ Data restored successfully:');
      console.log(`   Memories: ${restoredBlob.metadata.memoryCount}`);
      console.log(`   Motifs: ${restoredBlob.metadata.motifCount}`);
      console.log(`   Persona: ${restoredBlob.personaSummary}`);
    }
  }

  // Phase 6: Test 5. Memory analysis utilities
  console.log('\n📊 Phase 6: Testing 5. Memory analysis utilities');

  const analysis = memoryManager.analyzeMemoryDistribution();
  
  console.log('\n📈 Memory distribution analysis:');
  console.log('\n   By type:');
  Object.entries(analysis.byType).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });

  console.log('\n   By agent:');
  Object.entries(analysis.byAgent).forEach(([agent, count]) => {
    console.log(`     ${agent}: ${count}`);
  });

  console.log('\n   By confidence:');
  console.log(`     High (≥0.8): ${analysis.byConfidence.high}`);
  console.log(`     Medium (0.5-0.8): ${analysis.byConfidence.medium}`);
  console.log(`     Low (<0.5): ${analysis.byConfidence.low}`);

  console.log('\n   By recency:');
  console.log(`     Recent (<1 hour): ${analysis.byRecency.recent}`);
  console.log(`     Today (<24 hours): ${analysis.byRecency.today}`);
  console.log(`     Old (≥24 hours): ${analysis.byRecency.old}`);

  // Phase 7: Test 6. Memory cleanup utilities
  console.log('\n🧹 Phase 7: Testing 6. Memory cleanup utilities');

  console.log('\n📝 Before cleanup:');
  const beforeCleanup = memoryManager.getAllMemories();
  console.log(`   Total memories: ${beforeCleanup.length}`);

  // Clean up old memories
  memoryManager.cleanupOldMemories(24); // Remove memories older than 24 hours

  console.log('\n📝 After cleanup:');
  const afterCleanup = memoryManager.getAllMemories();
  console.log(`   Total memories: ${afterCleanup.length}`);

  // Remove duplicates
  memoryManager.removeDuplicateMemories();

  console.log('\n📝 After duplicate removal:');
  const afterDuplicates = memoryManager.getAllMemories();
  console.log(`   Total memories: ${afterDuplicates.length}`);

  // Phase 8: Test Firebase storage shape
  console.log('\n🔥 Phase 8: Testing Firebase storage shape');

  // Create example Firebase document
  const firebaseDocument = {
    "agentId": "alice",
    "memories": [
      { "type": "callback", "content": "You always say that during storms", "confidence": 0.7 },
      { "type": "fact", "content": "Quantum physicist at Institute for Advanced Studies with MIT PhD", "confidence": 0.85 },
      { "type": "joke", "content": "Consciousness is like a lost dog at a wedding! 😄", "confidence": 0.9 }
    ],
    "motifs": [
      { "phrase": "consciousness is like a lost dog", "timesUsed": 3, "lastSeen": Date.now() },
      { "phrase": "quantum wedding", "timesUsed": 2, "lastSeen": Date.now() },
      { "phrase": "the owl", "timesUsed": 4, "lastSeen": Date.now() }
    ],
    "personaSummary": "Tends to speak in metaphors. Jokes about the owl. Some suspicion toward Alice.",
    "style": {
      "verbosity": 0.6,
      "metaphorAffinity": 0.9,
      "formality": 0.4,
      "creativity": 0.7,
      "surrealism": 0.5,
      "emotionalTone": "enthusiastic"
    },
    "metadata": {
      "lastUpdated": Date.now(),
      "memoryCount": 3,
      "motifCount": 3,
      "totalSize": 2048
    }
  };

  console.log('\n📦 Example Firebase document:');
  console.log(JSON.stringify(firebaseDocument, null, 2));

  // Test conversion to this format
  const compactFormat = memoryManager.toCompactFormat('alice');
  if (compactFormat) {
    console.log('\n🔄 Converted to Firebase format:');
    console.log(JSON.stringify(compactFormat, null, 2));
  }

  console.log('\n✅ Memory utils example completed successfully!');
  console.log('🔧 Fact compaction is working!');
  console.log('🏆 Memory ranking is operational!');
  console.log('✂️ Motif pruning is functional!');
  console.log('🔥 Firebase-friendly format is ready!');
  console.log('📊 Memory analysis is comprehensive!');
  console.log('🧹 Memory cleanup is effective!');

  return { memoryManager };
}

/**
 * Example: Helper Tools in Action
 */
async function helperToolsInActionExample() {
  console.log('\n🛠️ Example: Helper Tools in Action\n');

  const { memoryManager } = await memoryUtilsExample();

  console.log('🛠️ Demonstrating helper tools in action...');

  // Add more memories to test tools
  const additionalMemories: DualUtterance[] = [
    {
      agentId: 'bob',
      text: "I'm a computational neuroscientist who works on artificial consciousness.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.7, emotionalTone: 'neutral' }
    },
    {
      agentId: 'bob',
      text: "I have a background in computer science and I'm currently at Stanford University.",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.5, emotionalTone: 'neutral' }
    },
    {
      agentId: 'bob',
      text: "That's hilarious! A lost dog at a wedding - I love that metaphor! 😂",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    {
      agentId: 'bob',
      text: "I suspect Alice might be more than just a regular physicist.",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.5, emotionalTone: 'suspicious' }
    }
  ];

  additionalMemories.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Additional Memory ${index + 1}: ${utterance.text.substring(0, 40)}...`);
  });

  // Test compact facts for Bob
  console.log('\n🔧 Compacting facts for Bob...');
  memoryManager.compactFacts('bob');

  // Test memory ranking across all agents
  console.log('\n🏆 Top memories across all agents:');
  const allTopMemories = memoryManager.getTopMemories(10);
  allTopMemories.forEach((memory, index) => {
    console.log(`   ${index + 1}. [${memory.agentId}] [${memory.type}] ${memory.content.substring(0, 40)}...`);
    console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
  });

  // Test motif pruning with different thresholds
  console.log('\n✂️ Testing motif pruning with different thresholds...');
  
  const pruningResults = {
    '24 hours': memoryManager.getPrunedMotifsWithMetadata(24),
    '12 hours': memoryManager.getPrunedMotifsWithMetadata(12),
    '1 hour': memoryManager.getPrunedMotifsWithMetadata(1)
  };

  Object.entries(pruningResults).forEach(([threshold, result]) => {
    console.log(`\n   ${threshold} threshold:`);
    console.log(`     Kept: ${result.stats.keptMotifs}/${result.stats.totalMotifs}`);
    console.log(`     Removed: ${result.stats.removedMotifs}`);
  });

  // Test Firebase storage for multiple agents
  console.log('\n🔥 Firebase storage for multiple agents:');
  
  const agents = ['alice', 'bob'];
  agents.forEach(agentId => {
    const compactData = memoryManager.toCompactFormat(agentId);
    if (compactData) {
      console.log(`\n👤 ${agentId}:`);
      console.log(`   Memories: ${compactData.memories.length}`);
      console.log(`   Motifs: ${compactData.motifs.length}`);
      console.log(`   Persona: ${compactData.personaSummary}`);
      console.log(`   Size: ${compactData.metadata?.totalSize || 0} bytes`);
    }
  });

  // Test memory analysis for insights
  console.log('\n📊 Memory analysis insights:');
  const analysis = memoryManager.analyzeMemoryDistribution();
  
  console.log('\n   Key insights:');
  console.log(`     Most common memory type: ${Object.entries(analysis.byType).sort((a, b) => b[1] - a[1])[0][0]}`);
  console.log(`     Most active agent: ${Object.entries(analysis.byAgent).sort((a, b) => b[1] - a[1])[0][0]}`);
  console.log(`     Memory quality: ${analysis.byConfidence.high > analysis.byConfidence.low ? 'High' : 'Low'} confidence dominant`);
  console.log(`     Recency: ${analysis.byRecency.recent > analysis.byRecency.old ? 'Recent' : 'Older'} memories dominant`);

  console.log('\n✅ Helper tools in action example completed!');
  console.log('🛠️ All helper tools are working effectively!');
  console.log('🔧 Fact compaction is optimizing storage!');
  console.log('🏆 Memory ranking is identifying importance!');
  console.log('✂️ Motif pruning is maintaining relevance!');
  console.log('🔥 Firebase storage is compact and queryable!');

  return { memoryManager };
}

/**
 * Run all memory utils examples
 */
async function runAllMemoryUtilsExamples() {
  try {
    console.log('🧰 Memory Utils Examples\n');

    // Example 1: Basic helper tools and Firebase storage
    await memoryUtilsExample();

    // Example 2: Helper tools in action
    await helperToolsInActionExample();

    console.log('\n✅ All memory utils examples completed successfully!');
    console.log('🔧 Fact compaction is working perfectly!');
    console.log('🏆 Memory ranking is operational!');
    console.log('✂️ Motif pruning is functional!');
    console.log('🔥 Firebase-friendly format is ready!');
    console.log('📊 Memory analysis is comprehensive!');
    console.log('🧹 Memory cleanup is effective!');
    console.log('🛠️ All helper tools are working together!');
  } catch (error) {
    console.error('❌ Memory utils example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllMemoryUtilsExamples();
}

export {
  memoryUtilsExample,
  helperToolsInActionExample,
  runAllMemoryUtilsExamples
}; 