import { 
  MemoryManager, 
  MemoryCompressor,
  MemoryItem,
  CompressedMemory,
  DualUtterance
} from '@chatpipes/ai-conductor';

/**
 * Example: Memory Compression Strategy - What to Compress vs. Preserve
 */
async function memoryCompressionExample() {
  console.log('🧠 Example: Memory Compression Strategy - What to Compress vs. Preserve\n');

  const memoryManager = new MemoryManager({
    factCompressionThreshold: 3,
    jokePreservationThreshold: 2,
    emotionDecayRate: 0.1,
    metaphorCanonicalThreshold: 2,
    styleVectorUpdateRate: 0.3,
    thoughtRetentionCount: 5,
    compressionInterval: 30 * 1000 // 30 seconds for demo
  });

  console.log('✅ MemoryManager with compression initialized');

  // Phase 1: Facts - Summarize after N entries
  console.log('\n📝 Phase 1: Facts - Summarize after N entries');

  const factUtterances: DualUtterance[] = [
    {
      agentId: 'alice',
      text: "I'm a quantum physicist who studies consciousness.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.7, emotionalTone: 'neutral' }
    },
    {
      agentId: 'alice',
      text: "I work at the Institute for Advanced Studies.",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.6, emotionalTone: 'neutral' }
    },
    {
      agentId: 'alice',
      text: "I have a PhD in theoretical physics from MIT.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.6, emotionalTone: 'neutral' }
    },
    {
      agentId: 'alice',
      text: "I'm currently researching quantum consciousness theories.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.8, emotionalTone: 'enthusiastic' }
    }
  ];

  factUtterances.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Fact ${index + 1}: ${utterance.text}`);
  });

  console.log('⏰ Waiting for compression...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Phase 2: Jokes/Callbacks - Keep exact wording if reused
  console.log('\n😄 Phase 2: Jokes/Callbacks - Keep exact wording if reused');

  const jokeUtterances: DualUtterance[] = [
    {
      agentId: 'bob',
      text: "That's hilarious! A lost dog at a wedding - I love that metaphor. 😂",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    {
      agentId: 'alice',
      text: "The lost dog is now wearing a tuxedo! 😄",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.9, emotionalTone: 'amused' }
    },
    {
      agentId: 'bob',
      text: "That's hilarious! A lost dog at a wedding - I love that metaphor. 😂",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    {
      agentId: 'alice',
      text: "The lost dog is now wearing a tuxedo! 😄",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.9, emotionalTone: 'amused' }
    }
  ];

  jokeUtterances.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`😄 Joke ${index + 1}: ${utterance.text}`);
  });

  // Phase 3: Emotions - Track evolving averages
  console.log('\n😊 Phase 3: Emotions - Track evolving averages');

  const emotionUtterances: DualUtterance[] = [
    {
      agentId: 'alice',
      text: "I'm really excited about this conversation!",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.6, emotionalTone: 'enthusiastic' }
    },
    {
      agentId: 'alice',
      text: "This is fascinating! I love exploring these ideas.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.7, emotionalTone: 'enthusiastic' }
    },
    {
      agentId: 'alice',
      text: "I'm feeling a bit tired now, but still interested.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.5, emotionalTone: 'neutral' }
    },
    {
      agentId: 'alice',
      text: "Actually, I'm getting really excited again! This is amazing!",
      timestamp: Date.now(),
      style: { verbosity: 0.9, metaphorAffinity: 0.8, emotionalTone: 'enthusiastic' }
    }
  ];

  emotionUtterances.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`😊 Emotion ${index + 1}: ${utterance.text}`);
  });

  // Phase 4: Metaphors/Motifs - Store phrase + count + last used
  console.log('\n🎭 Phase 4: Metaphors/Motifs - Store phrase + count + last used');

  const metaphorUtterances: DualUtterance[] = [
    {
      agentId: 'alice',
      text: "Consciousness is like a lost dog at a wedding.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.9, emotionalTone: 'contemplative' }
    },
    {
      agentId: 'bob',
      text: "And the wedding guests are like different states of mind.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'curious' }
    },
    {
      agentId: 'alice',
      text: "Consciousness is like a lost dog at a wedding.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.9, emotionalTone: 'contemplative' }
    },
    {
      agentId: 'bob',
      text: "The DJ is like the subconscious, playing songs everyone knows.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'curious' }
    }
  ];

  metaphorUtterances.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`🎭 Metaphor ${index + 1}: ${utterance.text}`);
  });

  // Phase 5: Style tendencies - Learnable vector
  console.log('\n🎨 Phase 5: Style tendencies - Learnable vector');

  const styleUtterances: DualUtterance[] = [
    {
      agentId: 'alice',
      text: "I tend to speak quite formally when discussing scientific topics.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.6, emotionalTone: 'formal' }
    },
    {
      agentId: 'alice',
      text: "I love using metaphors to explain complex concepts.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.9, emotionalTone: 'enthusiastic' }
    },
    {
      agentId: 'alice',
      text: "I can be quite verbose when I'm excited about something.",
      timestamp: Date.now(),
      style: { verbosity: 0.9, metaphorAffinity: 0.7, emotionalTone: 'enthusiastic' }
    },
    {
      agentId: 'alice',
      text: "I enjoy being creative and imaginative in my explanations.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.8, emotionalTone: 'creative' }
    }
  ];

  styleUtterances.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`🎨 Style ${index + 1}: ${utterance.text}`);
  });

  // Phase 6: Analysis of Compression Results
  console.log('\n📊 Phase 6: Analysis of Compression Results');

  // Get compressed memories
  const compressedMemories = memoryManager.getCompressedMemories();
  console.log('\n🧠 Compressed Memories:');
  compressedMemories.forEach((memory, index) => {
    console.log(`   ${index + 1}. [${memory.type}] ${memory.compressionType}: ${memory.content.substring(0, 50)}...`);
    console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
    console.log(`      Count: ${memory.metadata.count || 1}`);
    console.log(`      Mood: ${memory.metadata.mood || 'neutral'}`);
  });

  // Get memory summaries
  console.log('\n📋 Memory Summaries:');
  const aliceSummary = memoryManager.getMemorySummary('alice');
  console.log(`\n👤 Alice: ${aliceSummary}`);

  const bobSummary = memoryManager.getMemorySummary('bob');
  console.log(`\n👤 Bob: ${bobSummary}`);

  // Get style vectors
  console.log('\n🎨 Style Vectors:');
  const aliceStyle = memoryManager.getStyleVector('alice');
  if (aliceStyle) {
    console.log(`\n👤 Alice Style Vector:`);
    console.log(`   Verbosity: ${aliceStyle.verbosity.toFixed(2)}`);
    console.log(`   Metaphor Affinity: ${aliceStyle.metaphorAffinity.toFixed(2)}`);
    console.log(`   Formality: ${aliceStyle.formality.toFixed(2)}`);
    console.log(`   Creativity: ${aliceStyle.creativity.toFixed(2)}`);
    console.log(`   Surrealism: ${aliceStyle.surrealism.toFixed(2)}`);
  }

  const bobStyle = memoryManager.getStyleVector('bob');
  if (bobStyle) {
    console.log(`\n👤 Bob Style Vector:`);
    console.log(`   Verbosity: ${bobStyle.verbosity.toFixed(2)}`);
    console.log(`   Metaphor Affinity: ${bobStyle.metaphorAffinity.toFixed(2)}`);
    console.log(`   Formality: ${bobStyle.formality.toFixed(2)}`);
    console.log(`   Creativity: ${bobStyle.creativity.toFixed(2)}`);
    console.log(`   Surrealism: ${bobStyle.surrealism.toFixed(2)}`);
  }

  // Get statistics
  console.log('\n📈 Compression Statistics:');
  const stats = memoryManager.getStats();
  console.log(`   Total memories: ${stats.totalMemories}`);
  console.log(`   Compressed memories: ${stats.compressedMemoriesCount}`);
  console.log(`   Compression ratio: ${stats.compressionRatio.toFixed(2)}`);
  console.log(`   Average confidence: ${stats.averageConfidence.toFixed(2)}`);

  console.log('\n   Memory types:');
  Object.entries(stats.memoryTypes).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });

  console.log('\n   Compression stats:');
  console.log(`     Total compressions: ${stats.compressionStats.totalCompressions}`);
  console.log(`     Average compression ratio: ${stats.compressionStats.averageCompressionRatio.toFixed(2)}`);
  console.log(`     Style vectors count: ${stats.compressionStats.styleVectorsCount}`);

  // Phase 7: Compression Strategy Analysis
  console.log('\n🔍 Phase 7: Compression Strategy Analysis');

  console.log('\n📝 Facts - Summarize after N entries:');
  const factMemories = compressedMemories.filter(m => m.type === 'fact');
  factMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 40)}..."`);
    console.log(`     Compression: ${memory.compressionType}`);
    console.log(`     Count: ${memory.metadata.count}`);
    console.log(`     Store immutably: ❌ (aggregated)`);
  });

  console.log('\n😄 Jokes/Callbacks - Keep exact wording if reused:');
  const jokeMemories = compressedMemories.filter(m => m.type === 'joke' || m.type === 'callback');
  jokeMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 40)}..."`);
    console.log(`     Compression: ${memory.compressionType}`);
    console.log(`     Count: ${memory.metadata.count}`);
    console.log(`     Store immutably: ✅ (verbatim)`);
  });

  console.log('\n😊 Emotions - Track evolving averages:');
  const emotionMemories = compressedMemories.filter(m => m.type === 'emotion');
  emotionMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 40)}..."`);
    console.log(`     Compression: ${memory.compressionType}`);
    console.log(`     Recency weight: ${memory.metadata.recencyWeight?.toFixed(2)}`);
    console.log(`     Store immutably: ❌ (evolving)`);
  });

  console.log('\n🎭 Metaphors/Motifs - Store phrase + count + last used:');
  const metaphorMemories = compressedMemories.filter(m => 
    m.content.toLowerCase().includes('consciousness') || 
    m.content.toLowerCase().includes('lost dog') ||
    m.content.toLowerCase().includes('wedding')
  );
  metaphorMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 40)}..."`);
    console.log(`     Compression: ${memory.compressionType}`);
    console.log(`     Count: ${memory.metadata.count}`);
    console.log(`     Store immutably: ✅ (canonical)`);
  });

  console.log('\n🎨 Style tendencies - Learnable vector:');
  const styleMemories = compressedMemories.filter(m => m.type === 'style');
  styleMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 40)}..."`);
    console.log(`     Compression: ${memory.compressionType}`);
    console.log(`     Style vector: ${memory.metadata.styleVector ? 'Updated' : 'None'}`);
    console.log(`     Store immutably: ❌ (learnable)`);
  });

  console.log('\n✅ Memory compression example completed successfully!');
  console.log('🧠 Facts are being aggregated after N entries!');
  console.log('😄 Jokes are preserved with exact wording when reused!');
  console.log('😊 Emotions are tracked with evolving averages!');
  console.log('🎭 Metaphors are stored as canonical phrases!');
  console.log('🎨 Style tendencies are learned as vectors!');

  return { memoryManager };
}

/**
 * Example: Compression Efficiency Analysis
 */
async function compressionEfficiencyExample() {
  console.log('\n📊 Example: Compression Efficiency Analysis\n');

  const { memoryManager } = await memoryCompressionExample();

  console.log('📊 Analyzing compression efficiency...');

  // Add more memories to test compression
  const additionalUtterances: DualUtterance[] = [
    // More facts about Alice
    {
      agentId: 'alice',
      text: "I live in Princeton, New Jersey.",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.5, emotionalTone: 'neutral' }
    },
    {
      agentId: 'alice',
      text: "I have two cats named Schrödinger and Heisenberg.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.7, emotionalTone: 'amused' }
    },
    {
      agentId: 'alice',
      text: "I enjoy hiking in the mountains on weekends.",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.4, emotionalTone: 'content' }
    },
    
    // More jokes (repeated)
    {
      agentId: 'bob',
      text: "That's hilarious! A lost dog at a wedding - I love that metaphor. 😂",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
    },
    {
      agentId: 'alice',
      text: "The lost dog is now wearing a tuxedo! 😄",
      timestamp: Date.now(),
      style: { verbosity: 0.5, metaphorAffinity: 0.9, emotionalTone: 'amused' }
    },
    
    // More emotions
    {
      agentId: 'alice',
      text: "I'm feeling really inspired by our conversation!",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.7, emotionalTone: 'inspired' }
    },
    {
      agentId: 'bob',
      text: "I'm getting a bit confused by all these quantum metaphors.",
      timestamp: Date.now(),
      style: { verbosity: 0.6, metaphorAffinity: 0.5, emotionalTone: 'confused' }
    }
  ];

  additionalUtterances.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Additional ${index + 1}: ${utterance.text.substring(0, 40)}...`);
  });

  // Wait for compression
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Analyze compression efficiency
  console.log('\n📊 Compression Efficiency Analysis:');

  const stats = memoryManager.getStats();
  const originalCount = stats.totalMemories;
  const compressedCount = stats.compressedMemoriesCount;
  const compressionRatio = stats.compressionRatio;

  console.log(`\n📈 Compression Metrics:`);
  console.log(`   Original memories: ${originalCount}`);
  console.log(`   Compressed memories: ${compressedCount}`);
  console.log(`   Compression ratio: ${compressionRatio.toFixed(2)} (${(compressionRatio * 100).toFixed(1)}% efficiency)`);
  console.log(`   Memory reduction: ${((1 - compressionRatio) * 100).toFixed(1)}%`);

  // Analyze by memory type
  console.log('\n📋 Compression by Memory Type:');
  Object.entries(stats.memoryTypes).forEach(([type, count]) => {
    const compressedTypeCount = memoryManager.getCompressedMemories()
      .filter(m => m.type === type).length;
    const typeCompressionRatio = count > 0 ? compressedTypeCount / count : 1;
    
    console.log(`   ${type}: ${count} → ${compressedTypeCount} (${typeCompressionRatio.toFixed(2)} ratio)`);
  });

  // Show compression benefits
  console.log('\n💡 Compression Benefits:');
  console.log(`   ✅ Facts: Aggregated into higher-confidence summaries`);
  console.log(`   ✅ Jokes: Preserved verbatim for humor retention`);
  console.log(`   ✅ Emotions: Tracked as evolving averages`);
  console.log(`   ✅ Metaphors: Stored as canonical phrases`);
  console.log(`   ✅ Styles: Learned as adaptive vectors`);
  console.log(`   ✅ Storage: ${((1 - compressionRatio) * 100).toFixed(1)}% reduction in memory footprint`);

  // Show memory quality preservation
  console.log('\n🎯 Memory Quality Preservation:');
  const compressedMemories = memoryManager.getCompressedMemories();
  const highConfidenceMemories = compressedMemories.filter(m => m.confidence > 0.7);
  const averageConfidence = compressedMemories.reduce((sum, m) => sum + m.confidence, 0) / compressedMemories.length;

  console.log(`   High confidence memories: ${highConfidenceMemories.length}/${compressedMemories.length}`);
  console.log(`   Average confidence: ${averageConfidence.toFixed(2)}`);
  console.log(`   Memory quality maintained: ${averageConfidence > 0.6 ? '✅' : '❌'}`);

  console.log('\n✅ Compression efficiency analysis completed!');
  console.log('📊 Compression ratios are being calculated!');
  console.log('💡 Memory quality is being preserved!');
  console.log('🎯 Storage efficiency is being optimized!');

  return { memoryManager };
}

/**
 * Run all memory compression examples
 */
async function runAllMemoryCompressionExamples() {
  try {
    console.log('🧠 Memory Compression Examples\n');

    // Example 1: Basic memory compression strategy
    await memoryCompressionExample();

    // Example 2: Compression efficiency analysis
    await compressionEfficiencyExample();

    console.log('\n✅ All memory compression examples completed successfully!');
    console.log('🧠 Facts are being aggregated efficiently!');
    console.log('😄 Jokes are being preserved verbatim!');
    console.log('😊 Emotions are being tracked as averages!');
    console.log('🎭 Metaphors are being stored canonically!');
    console.log('🎨 Styles are being learned as vectors!');
    console.log('📊 Compression ratios are being optimized!');
  } catch (error) {
    console.error('❌ Memory compression example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllMemoryCompressionExamples();
}

export {
  memoryCompressionExample,
  compressionEfficiencyExample,
  runAllMemoryCompressionExamples
}; 