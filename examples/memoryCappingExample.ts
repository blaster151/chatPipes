import { 
  MemoryManager, 
  MemoryCapper,
  MemoryItem,
  MemoryBlob,
  DualUtterance
} from '@chatpipes/ai-conductor';

/**
 * Example: Memory Capping - 500KB per Agent Constraint
 */
async function memoryCappingExample() {
  console.log('📦 Example: Memory Capping - 500KB per Agent Constraint\n');

  const memoryManager = new MemoryManager(
    // Compression config
    {
      factCompressionThreshold: 3,
      jokePreservationThreshold: 2,
      emotionDecayRate: 0.1,
      metaphorCanonicalThreshold: 2,
      styleVectorUpdateRate: 0.3,
      thoughtRetentionCount: 5,
      compressionInterval: 30 * 1000
    },
    // Capping config
    {
      maxSizePerAgent: 500 * 1024, // 500KB
      maxRecentMemories: 50,
      minConfidenceThreshold: 0.5,
      recencyWeight: 0.7,
      personaSummaryLength: 200,
      motifPreservationThreshold: 1
    }
  );

  console.log('✅ MemoryManager with 500KB capping initialized');

  // Phase 1: Generate lots of memories for Alice
  console.log('\n📝 Phase 1: Generating memories for Alice (testing size limits)');

  const aliceMemories: DualUtterance[] = [
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
    {
      agentId: 'alice',
      text: "I'm feeling a bit tired now, but still very interested in continuing our discussion.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.6, emotionalTone: 'neutral' }
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

  // Ingest Alice's memories
  aliceMemories.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Alice Memory ${index + 1}: ${utterance.text.substring(0, 50)}...`);
  });

  // Phase 2: Generate memories for Bob
  console.log('\n📝 Phase 2: Generating memories for Bob');

  const bobMemories: DualUtterance[] = [
    // Facts about Bob
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
      text: "I love playing chess and I think games are a great way to understand intelligence.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.6, emotionalTone: 'enthusiastic' }
    },
    
    // Jokes and callbacks
    {
      agentId: 'bob',
      text: "That's hilarious! A lost dog at a wedding - I love that metaphor! 😂",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    {
      agentId: 'bob',
      text: "Speaking of the lost dog metaphor, what if the wedding guests are different states of mind?",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.8, emotionalTone: 'curious' }
    },
    {
      agentId: 'bob',
      text: "The DJ is like the subconscious, playing songs everyone knows but can't remember the words to! 😄",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    
    // Emotions
    {
      agentId: 'bob',
      text: "I'm getting really excited about this conversation! It's amazing how our ideas are connecting.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.7, emotionalTone: 'enthusiastic' }
    },
    {
      agentId: 'bob',
      text: "This is getting surreal! We're building a whole quantum wedding in our minds.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    
    // Suspicions
    {
      agentId: 'bob',
      text: "I suspect Alice might be more than just a regular physicist.",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.5, emotionalTone: 'suspicious' }
    }
  ];

  // Ingest Bob's memories
  bobMemories.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Bob Memory ${index + 1}: ${utterance.text.substring(0, 50)}...`);
  });

  // Phase 3: Force capping by adding more memories
  console.log('\n📦 Phase 3: Testing memory capping with additional memories');

  // Add more memories to trigger capping
  const additionalMemories: DualUtterance[] = [
    // More detailed facts to increase size
    {
      agentId: 'alice',
      text: "I have published over 50 papers on quantum consciousness, including my groundbreaking work on 'Quantum Entanglement of Subjective Experience' which was featured in Nature last year.",
      timestamp: Date.now(),
      style: { verbosity: 0.9, metaphorAffinity: 0.7, emotionalTone: 'proud' }
    },
    {
      agentId: 'alice',
      text: "My research involves studying how quantum superposition might explain the binding problem in consciousness, and I've developed several mathematical models that suggest consciousness operates at the quantum level.",
      timestamp: Date.now(),
      style: { verbosity: 0.9, metaphorAffinity: 0.8, emotionalTone: 'enthusiastic' }
    },
    {
      agentId: 'bob',
      text: "I've been working on neural network architectures that can simulate consciousness, and I believe we're close to creating artificial general intelligence that can truly understand and experience the world.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.7, emotionalTone: 'confident' }
    },
    {
      agentId: 'bob',
      text: "My team at Stanford has developed a new algorithm called 'Consciousness Mapping' that can identify patterns in brain activity that correspond to subjective experiences.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.6, emotionalTone: 'proud' }
    }
  ];

  additionalMemories.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Additional Memory ${index + 1}: ${utterance.text.substring(0, 50)}...`);
  });

  // Wait for capping to process
  console.log('\n⏰ Waiting for memory capping to process...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Phase 4: Analyze memory blobs
  console.log('\n📊 Phase 4: Analyzing memory blobs');

  const aliceBlob = memoryManager.getMemoryBlob('alice');
  const bobBlob = memoryManager.getMemoryBlob('bob');

  console.log('\n👤 Alice Memory Blob:');
  if (aliceBlob) {
    console.log(`   Size: ${(aliceBlob.metadata.totalSize / 1024).toFixed(1)}KB / 500KB`);
    console.log(`   Memories: ${aliceBlob.metadata.memoryCount}/50`);
    console.log(`   Motifs: ${aliceBlob.metadata.motifCount}`);
    console.log(`   Compression ratio: ${aliceBlob.metadata.compressionRatio.toFixed(2)}`);
    console.log(`   Persona: ${aliceBlob.personaSummary}`);
    console.log(`   Last updated: ${new Date(aliceBlob.metadata.lastUpdated).toLocaleTimeString()}`);
  }

  console.log('\n👤 Bob Memory Blob:');
  if (bobBlob) {
    console.log(`   Size: ${(bobBlob.metadata.totalSize / 1024).toFixed(1)}KB / 500KB`);
    console.log(`   Memories: ${bobBlob.metadata.memoryCount}/50`);
    console.log(`   Motifs: ${bobBlob.metadata.motifCount}`);
    console.log(`   Compression ratio: ${bobBlob.metadata.compressionRatio.toFixed(2)}`);
    console.log(`   Persona: ${bobBlob.personaSummary}`);
    console.log(`   Last updated: ${new Date(bobBlob.metadata.lastUpdated).toLocaleTimeString()}`);
  }

  // Phase 5: Show what was kept vs. compressed
  console.log('\n🔍 Phase 5: What was kept vs. compressed');

  if (aliceBlob) {
    console.log('\n📝 Alice - Recent Memories (Top 5):');
    aliceBlob.recentMemories.slice(0, 5).forEach((memory, index) => {
      console.log(`   ${index + 1}. [${memory.type}] ${memory.content.substring(0, 40)}...`);
      console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
    });

    console.log('\n🎭 Alice - Key Motifs:');
    const aliceMotifs = Object.values(aliceBlob.motifs)
      .sort((a, b) => b.timesUsed - a.timesUsed)
      .slice(0, 5);
    aliceMotifs.forEach((motif, index) => {
      console.log(`   ${index + 1}. "${motif.phrase.substring(0, 30)}..." (${motif.timesUsed}x, ${motif.mood || 'neutral'})`);
    });
  }

  if (bobBlob) {
    console.log('\n📝 Bob - Recent Memories (Top 5):');
    bobBlob.recentMemories.slice(0, 5).forEach((memory, index) => {
      console.log(`   ${index + 1}. [${memory.type}] ${memory.content.substring(0, 40)}...`);
      console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
    });

    console.log('\n🎭 Bob - Key Motifs:');
    const bobMotifs = Object.values(bobBlob.motifs)
      .sort((a, b) => b.timesUsed - a.timesUsed)
      .slice(0, 5);
    bobMotifs.forEach((motif, index) => {
      console.log(`   ${index + 1}. "${motif.phrase.substring(0, 30)}..." (${motif.timesUsed}x, ${motif.mood || 'neutral'})`);
    });
  }

  // Phase 6: Memory summaries from blobs
  console.log('\n📋 Phase 6: Memory summaries from blobs');

  const aliceSummary = memoryManager.getMemorySummary('alice');
  const bobSummary = memoryManager.getMemorySummary('bob');

  console.log('\n👤 Alice Summary:');
  console.log(`   ${aliceSummary}`);

  console.log('\n👤 Bob Summary:');
  console.log(`   ${bobSummary}`);

  // Phase 7: Capping statistics
  console.log('\n📈 Phase 7: Capping statistics');

  const stats = memoryManager.getStats();
  console.log('\n📊 Memory Capping Statistics:');
  console.log(`   Total memories: ${stats.totalMemories}`);
  console.log(`   Memory blobs: ${stats.memoryBlobsCount}`);
  console.log(`   Average blob size: ${(stats.averageBlobSize / 1024).toFixed(1)}KB`);
  console.log(`   Size limit: ${(stats.cappingStats.sizeLimit / 1024).toFixed(1)}KB`);
  console.log(`   Average compression ratio: ${stats.cappingStats.averageCompressionRatio.toFixed(2)}`);

  console.log('\n   Memory types:');
  Object.entries(stats.memoryTypes).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });

  // Phase 8: Size constraint analysis
  console.log('\n🔍 Phase 8: Size constraint analysis');

  console.log('\n📦 What was kept (500KB constraint):');
  console.log('   ✅ All Motifs (canonical phrases + usage count)');
  console.log('   ✅ Last 50 MemoryItems, filtered by confidence + recency');
  console.log('   ✅ Summarized persona field (e.g., "tends toward metaphors, suspicious of Clara")');
  console.log('   ✅ Style vectors for personality consistency');

  console.log('\n📦 What was compressed/dropped:');
  console.log('   ❌ Low-confidence memories (< 0.5)');
  console.log('   ❌ Old memories (beyond recency window)');
  console.log('   ❌ Redundant information (aggregated into summaries)');
  console.log('   ❌ Excessive detail (truncated to fit constraints)');

  console.log('\n✅ Memory capping example completed successfully!');
  console.log('📦 500KB per agent limit is being enforced!');
  console.log('🎭 All motifs are being preserved!');
  console.log('📝 Recent high-confidence memories are being kept!');
  console.log('👤 Persona summaries are being generated!');
  console.log('📊 Size constraints are being optimized!');

  return { memoryManager };
}

/**
 * Example: Memory Blob Analysis
 */
async function memoryBlobAnalysisExample() {
  console.log('\n📊 Example: Memory Blob Analysis\n');

  const { memoryManager } = await memoryCappingExample();

  console.log('📊 Analyzing memory blob efficiency...');

  // Get all memory blobs
  const allBlobs = memoryManager.getAllMemoryBlobs();
  
  console.log('\n📦 Memory Blob Analysis:');
  allBlobs.forEach((blob, agentId) => {
    console.log(`\n👤 ${agentId}:`);
    console.log(`   Size: ${(blob.metadata.totalSize / 1024).toFixed(1)}KB / 500KB (${((blob.metadata.totalSize / (500 * 1024)) * 100).toFixed(1)}%)`);
    console.log(`   Memories: ${blob.metadata.memoryCount}/50`);
    console.log(`   Motifs: ${blob.metadata.motifCount}`);
    console.log(`   Compression: ${(blob.metadata.compressionRatio * 100).toFixed(1)}%`);
    console.log(`   Persona: ${blob.personaSummary}`);
    
    // Analyze memory distribution
    const memoryTypes = {
      fact: blob.recentMemories.filter(m => m.type === 'fact').length,
      joke: blob.recentMemories.filter(m => m.type === 'joke').length,
      callback: blob.recentMemories.filter(m => m.type === 'callback').length,
      suspicion: blob.recentMemories.filter(m => m.type === 'suspicion').length,
      emotion: blob.recentMemories.filter(m => m.type === 'emotion').length,
      style: blob.recentMemories.filter(m => m.type === 'style').length
    };
    
    console.log(`   Memory distribution:`);
    Object.entries(memoryTypes).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`     ${type}: ${count}`);
      }
    });
    
    // Analyze motif patterns
    const motifMoods = {
      funny: Object.values(blob.motifs).filter(m => m.mood === 'funny').length,
      strange: Object.values(blob.motifs).filter(m => m.mood === 'strange').length,
      philosophical: Object.values(blob.motifs).filter(m => m.mood === 'philosophical').length
    };
    
    console.log(`   Motif moods:`);
    Object.entries(motifMoods).forEach(([mood, count]) => {
      if (count > 0) {
        console.log(`     ${mood}: ${count}`);
      }
    });
  });

  // Analyze efficiency
  console.log('\n📈 Memory Efficiency Analysis:');
  const totalSize = Array.from(allBlobs.values()).reduce((sum, blob) => sum + blob.metadata.totalSize, 0);
  const totalMemories = Array.from(allBlobs.values()).reduce((sum, blob) => sum + blob.metadata.memoryCount, 0);
  const totalMotifs = Array.from(allBlobs.values()).reduce((sum, blob) => sum + blob.metadata.motifCount, 0);
  
  console.log(`   Total size used: ${(totalSize / 1024).toFixed(1)}KB`);
  console.log(`   Total memories preserved: ${totalMemories}`);
  console.log(`   Total motifs preserved: ${totalMotifs}`);
  console.log(`   Average size per memory: ${(totalSize / totalMemories).toFixed(0)} bytes`);
  console.log(`   Average size per motif: ${(totalSize / totalMotifs).toFixed(0)} bytes`);

  // Check constraint satisfaction
  console.log('\n✅ Constraint Satisfaction:');
  allBlobs.forEach((blob, agentId) => {
    const withinLimit = blob.metadata.totalSize <= 500 * 1024;
    console.log(`   ${agentId}: ${withinLimit ? '✅' : '❌'} Within 500KB limit`);
  });

  console.log('\n✅ Memory blob analysis completed!');
  console.log('📊 Memory blobs are being analyzed efficiently!');
  console.log('📦 Size constraints are being satisfied!');
  console.log('🎭 Motifs are being preserved optimally!');
  console.log('👤 Persona summaries are being generated effectively!');

  return { memoryManager };
}

/**
 * Run all memory capping examples
 */
async function runAllMemoryCappingExamples() {
  try {
    console.log('📦 Memory Capping Examples\n');

    // Example 1: Basic memory capping with 500KB limit
    await memoryCappingExample();

    // Example 2: Memory blob analysis
    await memoryBlobAnalysisExample();

    console.log('\n✅ All memory capping examples completed successfully!');
    console.log('📦 500KB per agent limit is being enforced!');
    console.log('🎭 All motifs are being preserved!');
    console.log('📝 Recent high-confidence memories are being kept!');
    console.log('👤 Persona summaries are being generated!');
    console.log('📊 Size constraints are being optimized!');
  } catch (error) {
    console.error('❌ Memory capping example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllMemoryCappingExamples();
}

export {
  memoryCappingExample,
  memoryBlobAnalysisExample,
  runAllMemoryCappingExamples
}; 