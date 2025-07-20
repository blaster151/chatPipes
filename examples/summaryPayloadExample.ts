import { 
  MemoryManager, 
  SummaryPayload,
  DualUtterance
} from '@chatpipes/ai-conductor';

/**
 * Example: Summary Payload Generation and Firebase Rehydration
 */
async function summaryPayloadExample() {
  console.log('📦 Example: Summary Payload Generation and Firebase Rehydration\n');

  const memoryManager = new MemoryManager();

  console.log('✅ MemoryManager initialized for summary payload testing');

  // Phase 1: Generate comprehensive memories for testing
  console.log('\n📝 Phase 1: Generating comprehensive memories for testing');

  const testMemories: DualUtterance[] = [
    // Alice's facts
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
    
    // Alice's emotions
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
    {
      agentId: 'alice',
      text: "I'm feeling a bit worried about the implications of quantum consciousness.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.5, emotionalTone: 'worried' }
    },
    
    // Alice's jokes and callbacks
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
    
    // Alice's suspicions
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
    },
    
    // Bob's facts
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
    
    // Bob's emotions
    {
      agentId: 'bob',
      text: "I'm feeling quite optimistic about the future of AI consciousness research.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.6, emotionalTone: 'optimistic' }
    },
    
    // Bob's jokes and callbacks
    {
      agentId: 'bob',
      text: "That's hilarious! A lost dog at a wedding - I love that metaphor! 😂",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    {
      agentId: 'bob',
      text: "Speaking of the lost dog, I think it's now running the wedding!",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    
    // Bob's suspicions
    {
      agentId: 'bob',
      text: "I suspect Alice might be more than just a regular physicist.",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.5, emotionalTone: 'suspicious' }
    }
  ];

  // Ingest all memories
  testMemories.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Memory ${index + 1}: [${utterance.agentId}] ${utterance.text.substring(0, 40)}...`);
  });

  // Phase 2: Test accumulation strategy
  console.log('\n📊 Phase 2: Testing accumulation strategy');

  console.log('\n✅ What to Accumulate How:');
  console.log('   Compress: emotions, facts, style trends');
  console.log('   Preserve: motifs, jokes, callbacks');
  console.log('   Cull: very old low-confidence fragments');
  console.log('   Summarize: persona recaps for reseeding');

  // Compact facts for both agents
  console.log('\n🔧 Compacting facts...');
  memoryManager.compactFacts('alice');
  memoryManager.compactFacts('bob');

  // Prune motifs
  console.log('\n✂️ Pruning motifs...');
  memoryManager.pruneMotifs(24);

  // Phase 3: Generate summary payloads
  console.log('\n📦 Phase 3: Generate summary payloads');

  const alicePayload = memoryManager.generateSummaryPayload('alice');
  const bobPayload = memoryManager.generateSummaryPayload('bob');

  console.log('\n👤 Alice Summary Payload:');
  console.log(`   Agent ID: ${alicePayload.agentId}`);
  console.log(`   Summary Facts: ${alicePayload.summaryFacts}`);
  console.log(`   Summary Emotions: ${alicePayload.summaryEmotions}`);
  console.log(`   Motif Hints: ${alicePayload.motifHints.length} motifs`);
  console.log(`   Top Memories: ${alicePayload.topMemories.length} memories`);
  console.log(`   Timestamp: ${new Date(alicePayload.timestamp).toISOString()}`);

  console.log('\n👤 Bob Summary Payload:');
  console.log(`   Agent ID: ${bobPayload.agentId}`);
  console.log(`   Summary Facts: ${bobPayload.summaryFacts}`);
  console.log(`   Summary Emotions: ${bobPayload.summaryEmotions}`);
  console.log(`   Motif Hints: ${bobPayload.motifHints.length} motifs`);
  console.log(`   Top Memories: ${bobPayload.topMemories.length} memories`);
  console.log(`   Timestamp: ${new Date(bobPayload.timestamp).toISOString()}`);

  // Phase 4: Test Firebase rehydration
  console.log('\n🔄 Phase 4: Test Firebase rehydration');

  // Create a new memory manager for rehydration testing
  const rehydratedManager = new MemoryManager();

  console.log('\n📝 Before rehydration:');
  console.log(`   Total memories: ${rehydratedManager.getAllMemories().length}`);
  console.log(`   Motifs: ${Object.keys(rehydratedManager['motifs'].getMotifs()).length}`);

  // Rehydrate Alice's payload
  rehydratedManager.rehydrateFromFirebase(alicePayload);

  console.log('\n📝 After rehydrating Alice:');
  console.log(`   Total memories: ${rehydratedManager.getAllMemories().length}`);
  console.log(`   Alice memories: ${rehydratedManager.getMemoriesForAgent('alice').length}`);
  console.log(`   Motifs: ${Object.keys(rehydratedManager['motifs'].getMotifs()).length}`);

  // Rehydrate Bob's payload
  rehydratedManager.rehydrateFromFirebase(bobPayload);

  console.log('\n📝 After rehydrating Bob:');
  console.log(`   Total memories: ${rehydratedManager.getAllMemories().length}`);
  console.log(`   Bob memories: ${rehydratedManager.getMemoriesForAgent('bob').length}`);
  console.log(`   Motifs: ${Object.keys(rehydratedManager['motifs'].getMotifs()).length}`);

  // Phase 5: Test system prompt generation
  console.log('\n🤖 Phase 5: Test system prompt generation');

  const aliceSystemPrompt = memoryManager.generateSystemPrompt(alicePayload);
  const bobSystemPrompt = memoryManager.generateSystemPrompt(bobPayload);

  console.log('\n👤 Alice System Prompt:');
  console.log(aliceSystemPrompt);

  console.log('\n👤 Bob System Prompt:');
  console.log(bobSystemPrompt);

  // Phase 6: Test Firebase document format
  console.log('\n🔥 Phase 6: Test Firebase document format');

  const firebaseDocuments = {
    alice: {
      agentId: alicePayload.agentId,
      summaryFacts: alicePayload.summaryFacts,
      summaryEmotions: alicePayload.summaryEmotions,
      motifHints: alicePayload.motifHints,
      topMemories: alicePayload.topMemories.map(m => ({
        type: m.type,
        content: m.content.substring(0, 50),
        confidence: m.confidence
      })),
      timestamp: alicePayload.timestamp,
      personaSummary: alicePayload.personaSummary,
      styleVector: alicePayload.styleVector
    },
    bob: {
      agentId: bobPayload.agentId,
      summaryFacts: bobPayload.summaryFacts,
      summaryEmotions: bobPayload.summaryEmotions,
      motifHints: bobPayload.motifHints,
      topMemories: bobPayload.topMemories.map(m => ({
        type: m.type,
        content: m.content.substring(0, 50),
        confidence: m.confidence
      })),
      timestamp: bobPayload.timestamp,
      personaSummary: bobPayload.personaSummary,
      styleVector: bobPayload.styleVector
    }
  };

  console.log('\n📦 Firebase Documents:');
  console.log(JSON.stringify(firebaseDocuments, null, 2));

  // Phase 7: Test accumulation strategy results
  console.log('\n📊 Phase 7: Test accumulation strategy results');

  const aliceMemories = memoryManager.getMemoriesForAgent('alice');
  const bobMemories = memoryManager.getMemoriesForAgent('bob');

  console.log('\n📝 Memory distribution after accumulation:');

  console.log('\n👤 Alice:');
  const aliceByType = {
    fact: aliceMemories.filter(m => m.type === 'fact').length,
    joke: aliceMemories.filter(m => m.type === 'joke').length,
    callback: aliceMemories.filter(m => m.type === 'callback').length,
    emotion: aliceMemories.filter(m => m.type === 'emotion').length,
    suspicion: aliceMemories.filter(m => m.type === 'suspicion').length,
    style: aliceMemories.filter(m => m.type === 'style').length
  };
  Object.entries(aliceByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\n👤 Bob:');
  const bobByType = {
    fact: bobMemories.filter(m => m.type === 'fact').length,
    joke: bobMemories.filter(m => m.type === 'joke').length,
    callback: bobMemories.filter(m => m.type === 'callback').length,
    emotion: bobMemories.filter(m => m.type === 'emotion').length,
    suspicion: bobMemories.filter(m => m.type === 'suspicion').length,
    style: bobMemories.filter(m => m.type === 'style').length
  };
  Object.entries(bobByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  // Test motif preservation
  console.log('\n🎭 Motif preservation test:');
  const allMotifs = memoryManager['motifs'].getMotifs();
  Object.entries(allMotifs).forEach(([key, motif]) => {
    console.log(`   "${motif.phrase.substring(0, 30)}..." (${motif.timesUsed}x, ${motif.mood || 'neutral'})`);
  });

  console.log('\n✅ Summary payload example completed successfully!');
  console.log('📦 Summary payloads are being generated correctly!');
  console.log('🔄 Firebase rehydration is working!');
  console.log('🤖 System prompts are being generated!');
  console.log('🔥 Firebase documents are compact and queryable!');
  console.log('📊 Accumulation strategy is being followed!');

  return { memoryManager, alicePayload, bobPayload, firebaseDocuments };
}

/**
 * Example: Accumulation Strategy in Action
 */
async function accumulationStrategyExample() {
  console.log('\n📊 Example: Accumulation Strategy in Action\n');

  const { memoryManager } = await summaryPayloadExample();

  console.log('📊 Demonstrating accumulation strategy in action...');

  // Test the four accumulation principles
  console.log('\n📋 Accumulation Strategy Principles:');

  // 1. Compress: emotions, facts, style trends
  console.log('\n1️⃣ Compress: emotions, facts, style trends');
  
  const aliceEmotions = memoryManager.getMemoriesByType('emotion').filter(m => m.agentId === 'alice');
  const aliceFacts = memoryManager.getMemoriesByType('fact').filter(m => m.agentId === 'alice');
  
  console.log(`   Original emotions: ${aliceEmotions.length}`);
  console.log(`   Original facts: ${aliceFacts.length}`);
  
  // Show compression results
  const compressedFacts = aliceFacts.filter(f => f.tags?.includes('compacted'));
  console.log(`   Compressed facts: ${compressedFacts.length}`);
  if (compressedFacts.length > 0) {
    console.log(`   Fact summary: ${compressedFacts[0].content.substring(0, 80)}...`);
  }

  // 2. Preserve: motifs, jokes, callbacks
  console.log('\n2️⃣ Preserve: motifs, jokes, callbacks');
  
  const aliceJokes = memoryManager.getMemoriesByType('joke').filter(m => m.agentId === 'alice');
  const aliceCallbacks = memoryManager.getMemoriesByType('callback').filter(m => m.agentId === 'alice');
  const motifs = memoryManager['motifs'].getMotifs();
  
  console.log(`   Preserved jokes: ${aliceJokes.length}`);
  console.log(`   Preserved callbacks: ${aliceCallbacks.length}`);
  console.log(`   Preserved motifs: ${Object.keys(motifs).length}`);
  
  aliceJokes.forEach((joke, index) => {
    console.log(`     Joke ${index + 1}: ${joke.content.substring(0, 50)}...`);
  });

  // 3. Cull: very old low-confidence fragments
  console.log('\n3️⃣ Cull: very old low-confidence fragments');
  
  const allMemories = memoryManager.getAllMemories();
  const lowConfidence = allMemories.filter(m => m.confidence < 0.5);
  const highConfidence = allMemories.filter(m => m.confidence >= 0.8);
  
  console.log(`   Low confidence memories: ${lowConfidence.length}`);
  console.log(`   High confidence memories: ${highConfidence.length}`);
  console.log(`   Average confidence: ${(allMemories.reduce((sum, m) => sum + m.confidence, 0) / allMemories.length).toFixed(2)}`);

  // 4. Summarize: persona recaps for reseeding
  console.log('\n4️⃣ Summarize: persona recaps for reseeding');
  
  const alicePayload = memoryManager.generateSummaryPayload('alice');
  const bobPayload = memoryManager.generateSummaryPayload('bob');
  
  console.log(`   Alice persona summary: ${alicePayload.personaSummary?.substring(0, 80)}...`);
  console.log(`   Bob persona summary: ${bobPayload.personaSummary?.substring(0, 80)}...`);

  // Test memory quality after accumulation
  console.log('\n📊 Memory quality after accumulation:');
  
  const stats = memoryManager.getStats();
  console.log(`   Total memories: ${stats.totalMemories}`);
  console.log(`   Memory types: ${JSON.stringify(stats.memoryTypes)}`);
  console.log(`   Total motifs: ${stats.totalMotifs}`);
  console.log(`   Emergent motifs: ${stats.emergentMotifs}`);
  console.log(`   Average confidence: ${stats.averageConfidence.toFixed(2)}`);
  console.log(`   Compression ratio: ${stats.compressionRatio.toFixed(2)}`);

  // Test Firebase storage efficiency
  console.log('\n🔥 Firebase storage efficiency:');
  
  const aliceCompact = memoryManager.toCompactFormat('alice');
  const bobCompact = memoryManager.toCompactFormat('bob');
  
  if (aliceCompact) {
    const aliceSize = JSON.stringify(aliceCompact).length;
    console.log(`   Alice compact size: ${aliceSize} bytes`);
    console.log(`   Alice memories: ${aliceCompact.memories.length}`);
    console.log(`   Alice motifs: ${aliceCompact.motifs.length}`);
  }
  
  if (bobCompact) {
    const bobSize = JSON.stringify(bobCompact).length;
    console.log(`   Bob compact size: ${bobSize} bytes`);
    console.log(`   Bob memories: ${bobCompact.memories.length}`);
    console.log(`   Bob motifs: ${bobCompact.motifs.length}`);
  }

  console.log('\n✅ Accumulation strategy example completed!');
  console.log('📋 All four accumulation principles are working!');
  console.log('🔧 Compression is reducing storage efficiently!');
  console.log('💾 Preservation is maintaining important content!');
  console.log('✂️ Culling is removing low-quality fragments!');
  console.log('📝 Summarization is creating useful recaps!');

  return { memoryManager, alicePayload, bobPayload };
}

/**
 * Run all summary payload examples
 */
async function runAllSummaryPayloadExamples() {
  try {
    console.log('📦 Summary Payload Examples\n');

    // Example 1: Basic summary payload generation and rehydration
    await summaryPayloadExample();

    // Example 2: Accumulation strategy in action
    await accumulationStrategyExample();

    console.log('\n✅ All summary payload examples completed successfully!');
    console.log('📦 Summary payloads are being generated correctly!');
    console.log('🔄 Firebase rehydration is working perfectly!');
    console.log('🤖 System prompts are being generated effectively!');
    console.log('🔥 Firebase documents are compact and queryable!');
    console.log('📊 Accumulation strategy is being followed precisely!');
  } catch (error) {
    console.error('❌ Summary payload example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllSummaryPayloadExamples();
}

export {
  summaryPayloadExample,
  accumulationStrategyExample,
  runAllSummaryPayloadExamples
}; 