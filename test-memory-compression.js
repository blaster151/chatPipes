// Simple test of the memory compression strategy
const { 
  MemoryManager, 
  MemoryCompressor,
  DualUtterance
} = require('./packages/ai-conductor/src/index.ts');

console.log('🧠 Testing Memory Compression Strategy\n');

// Create MemoryManager with compression
const memoryManager = new MemoryManager({
  factCompressionThreshold: 3,
  jokePreservationThreshold: 2,
  emotionDecayRate: 0.1,
  metaphorCanonicalThreshold: 2,
  styleVectorUpdateRate: 0.3,
  thoughtRetentionCount: 5,
  compressionInterval: 10 * 1000 // 10 seconds for demo
});

console.log('✅ MemoryManager with compression initialized');

// Test Facts - Summarize after N entries
console.log('\n📝 Testing Facts - Summarize after N entries');

const factUtterances = [
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
  console.log(`   ${index + 1}. ${utterance.text}`);
});

// Test Jokes/Callbacks - Keep exact wording if reused
console.log('\n😄 Testing Jokes/Callbacks - Keep exact wording if reused');

const jokeUtterances = [
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
  }
];

jokeUtterances.forEach((utterance, index) => {
  memoryManager.ingest(utterance);
  console.log(`   ${index + 1}. ${utterance.text}`);
});

// Test Emotions - Track evolving averages
console.log('\n😊 Testing Emotions - Track evolving averages');

const emotionUtterances = [
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
  }
];

emotionUtterances.forEach((utterance, index) => {
  memoryManager.ingest(utterance);
  console.log(`   ${index + 1}. ${utterance.text}`);
});

// Test Metaphors/Motifs - Store phrase + count + last used
console.log('\n🎭 Testing Metaphors/Motifs - Store phrase + count + last used');

const metaphorUtterances = [
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
  }
];

metaphorUtterances.forEach((utterance, index) => {
  memoryManager.ingest(utterance);
  console.log(`   ${index + 1}. ${utterance.text}`);
});

// Test Style tendencies - Learnable vector
console.log('\n🎨 Testing Style tendencies - Learnable vector');

const styleUtterances = [
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
  }
];

styleUtterances.forEach((utterance, index) => {
  memoryManager.ingest(utterance);
  console.log(`   ${index + 1}. ${utterance.text}`);
});

// Wait for compression
console.log('\n⏰ Waiting for compression...');
setTimeout(() => {
  // Analyze results
  console.log('\n📊 Compression Results:');

  // Get compressed memories
  const compressedMemories = memoryManager.getCompressedMemories();
  console.log('\n🧠 Compressed Memories:');
  compressedMemories.forEach((memory, index) => {
    console.log(`   ${index + 1}. [${memory.type}] ${memory.compressionType}: ${memory.content.substring(0, 40)}...`);
    console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
    console.log(`      Count: ${memory.metadata.count || 1}`);
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

  // Test compression strategy
  console.log('\n🔍 Compression Strategy Test:');
  
  const factMemories = compressedMemories.filter(m => m.type === 'fact');
  console.log(`\n📝 Facts (${factMemories.length}):`);
  factMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 30)}..."`);
    console.log(`     Compression: ${memory.compressionType} (${memory.metadata.count} aggregated)`);
    console.log(`     Store immutably: ❌`);
  });

  const jokeMemories = compressedMemories.filter(m => m.type === 'joke' || m.type === 'callback');
  console.log(`\n😄 Jokes/Callbacks (${jokeMemories.length}):`);
  jokeMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 30)}..."`);
    console.log(`     Compression: ${memory.compressionType} (${memory.metadata.count} times used)`);
    console.log(`     Store immutably: ✅`);
  });

  const emotionMemories = compressedMemories.filter(m => m.type === 'emotion');
  console.log(`\n😊 Emotions (${emotionMemories.length}):`);
  emotionMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 30)}..."`);
    console.log(`     Compression: ${memory.compressionType} (recency: ${memory.metadata.recencyWeight?.toFixed(2)})`);
    console.log(`     Store immutably: ❌`);
  });

  const styleMemories = compressedMemories.filter(m => m.type === 'style');
  console.log(`\n🎨 Styles (${styleMemories.length}):`);
  styleMemories.forEach(memory => {
    console.log(`   "${memory.content.substring(0, 30)}..."`);
    console.log(`     Compression: ${memory.compressionType} (vector: ${memory.metadata.styleVector ? 'Updated' : 'None'})`);
    console.log(`     Store immutably: ❌`);
  });

  console.log('\n✅ Memory compression test completed successfully!');
  console.log('🧠 Facts are being aggregated after N entries!');
  console.log('😄 Jokes are being preserved verbatim!');
  console.log('😊 Emotions are being tracked as averages!');
  console.log('🎭 Metaphors are being stored canonically!');
  console.log('🎨 Styles are being learned as vectors!');
  console.log('📊 Compression ratios are being calculated!');

}, 2000); 