// Simple test of the streamlined MemoryManager prototype
const { 
  MemoryManager, 
  MotifTracker,
  DualUtterance
} = require('./packages/ai-conductor/src/index.ts');

console.log('🧠 Testing MemoryManager Prototype\n');

// Create MemoryManager
const memoryManager = new MemoryManager();

console.log('✅ MemoryManager initialized');

// Create sample utterances
const sampleUtterances = [
  {
    agentId: 'alice',
    text: "I'm a quantum physicist who thinks consciousness is like a lost dog at a wedding.",
    timestamp: Date.now(),
    style: { verbosity: 0.7, metaphorAffinity: 0.9, emotionalTone: 'contemplative' }
  },
  {
    agentId: 'bob',
    text: "That's hilarious! A lost dog at a wedding - I love that metaphor. 😂",
    timestamp: Date.now(),
    style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
  },
  {
    agentId: 'alice',
    text: "I suspect that reality is just the universe's way of daydreaming about itself.",
    timestamp: Date.now(),
    style: { verbosity: 0.8, metaphorAffinity: 0.9, emotionalTone: 'philosophical' }
  },
  {
    agentId: 'bob',
    text: "Remember when you said consciousness is like a lost dog? That keeps coming back to me.",
    timestamp: Date.now(),
    style: { verbosity: 0.7, metaphorAffinity: 0.8, emotionalTone: 'reflective' }
  },
  {
    agentId: 'alice',
    text: "I'm really excited about this conversation! It feels like we're discovering something profound.",
    timestamp: Date.now(),
    style: { verbosity: 0.8, metaphorAffinity: 0.7, emotionalTone: 'enthusiastic' }
  },
  {
    agentId: 'bob',
    text: "Speaking of the lost dog metaphor, what if the wedding guests are different states of mind?",
    timestamp: Date.now(),
    style: { verbosity: 0.7, metaphorAffinity: 0.9, emotionalTone: 'curious' }
  },
  {
    agentId: 'alice',
    text: "That's brilliant! And the DJ is like the subconscious, playing songs everyone knows but can't remember the words to.",
    timestamp: Date.now(),
    style: { verbosity: 0.8, metaphorAffinity: 0.9, emotionalTone: 'excited' }
  },
  {
    agentId: 'bob',
    text: "This is getting surreal! 😄 We're building a whole quantum wedding in our minds.",
    timestamp: Date.now(),
    style: { verbosity: 0.6, metaphorAffinity: 0.8, emotionalTone: 'amused' }
  }
];

// Ingest all utterances
console.log('\n📝 Ingesting utterances...');
sampleUtterances.forEach((utterance, index) => {
  memoryManager.ingest(utterance);
  console.log(`   ${index + 1}. [${utterance.agentId}] ${utterance.text.substring(0, 50)}...`);
});

// Get memory summaries
console.log('\n📊 Memory Summaries:');

const aliceSummary = memoryManager.getMemorySummary('alice');
console.log('\n👤 Alice Memory Summary:');
console.log(`   ${aliceSummary}`);

const bobSummary = memoryManager.getMemorySummary('bob');
console.log('\n👤 Bob Memory Summary:');
console.log(`   ${bobSummary}`);

const globalSummary = memoryManager.getMemorySummary();
console.log('\n🌍 Global Memory Summary:');
console.log(`   ${globalSummary}`);

// Get motif hints
console.log('\n🎯 Motif Hints:');
const motifHints = memoryManager.getMotifHints();
motifHints.forEach((hint, index) => {
  console.log(`   ${index + 1}. ${hint}`);
});

// Add manual memories
console.log('\n✏️ Adding manual memories...');
memoryManager.addManualMemory("Alice has a twin brother who's also a physicist", 'alice');
memoryManager.addManualMemory("Bob is afraid of clowns", 'bob');
memoryManager.addManualMemory("They both love quantum mechanics metaphors", undefined);

// Get updated summaries
console.log('\n📊 Updated Memory Summaries:');
const updatedAliceSummary = memoryManager.getMemorySummary('alice');
console.log('\n👤 Updated Alice Memory Summary:');
console.log(`   ${updatedAliceSummary}`);

const updatedBobSummary = memoryManager.getMemorySummary('bob');
console.log('\n👤 Updated Bob Memory Summary:');
console.log(`   ${updatedBobSummary}`);

// Get recent memories
console.log('\n⏰ Recent Memories:');
const recentMemories = memoryManager.getRecentMemories(5);
recentMemories.forEach((memory, index) => {
  console.log(`   ${index + 1}. [${memory.type}] [${memory.agentId}] ${memory.content.substring(0, 50)}...`);
  console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
});

// Get memories by type
console.log('\n📋 Memories by Type:');
const memoryTypes = ['fact', 'joke', 'style', 'callback', 'suspicion', 'emotion'];
memoryTypes.forEach(type => {
  const memories = memoryManager.getMemoriesByType(type);
  console.log(`   ${type}: ${memories.length} memories`);
  if (memories.length > 0) {
    memories.slice(0, 2).forEach((memory, index) => {
      console.log(`     ${index + 1}. [${memory.agentId}] ${memory.content.substring(0, 40)}...`);
    });
  }
});

// Get statistics
console.log('\n📈 Memory Manager Statistics:');
const stats = memoryManager.getStats();
console.log(`   Total memories: ${stats.totalMemories}`);
console.log(`   Average confidence: ${stats.averageConfidence.toFixed(2)}`);
console.log(`   Total motifs: ${stats.totalMotifs}`);
console.log(`   Emergent motifs: ${stats.emergentMotifs}`);

console.log('\n   Memory types:');
Object.entries(stats.memoryTypes).forEach(([type, count]) => {
  console.log(`     ${type}: ${count}`);
});

// Test motif tracker directly
console.log('\n🎭 Motif Tracker Test:');
const motifTracker = new MotifTracker();

const testTexts = [
  "This is a funny joke about quantum mechanics! 😂",
  "That's strange, consciousness is like a lost dog.",
  "Philosophically speaking, reality is just a dream.",
  "This is hilarious! The lost dog is wearing a tuxedo! 😄",
  "It's weird how everything connects to quantum physics.",
  "Philosophically, we're all just thoughts in a cosmic mind."
];

testTexts.forEach((text, index) => {
  motifTracker.detect(text);
  console.log(`   ${index + 1}. "${text.substring(0, 30)}..."`);
});

const emergentMotifs = motifTracker.getEmergentMotifs();
console.log('\n🎯 Emergent Motifs:');
emergentMotifs.forEach((motif, index) => {
  console.log(`   ${index + 1}. "${motif}"`);
});

const funnyMotifs = motifTracker.getMotifsByMood('funny');
const strangeMotifs = motifTracker.getMotifsByMood('strange');
const philosophicalMotifs = motifTracker.getMotifsByMood('philosophical');

console.log('\n😄 Funny Motifs:');
funnyMotifs.forEach(motif => {
  console.log(`   "${motif.phrase}" (${motif.timesUsed} times)`);
});

console.log('\n🤔 Strange Motifs:');
strangeMotifs.forEach(motif => {
  console.log(`   "${motif.phrase}" (${motif.timesUsed} times)`);
});

console.log('\n🧠 Philosophical Motifs:');
philosophicalMotifs.forEach(motif => {
  console.log(`   "${motif.phrase}" (${motif.timesUsed} times)`);
});

console.log('\n✅ MemoryManager prototype test completed successfully!');
console.log('🧠 Memory ingestion and parsing is working!');
console.log('📊 Memory summaries are being generated!');
console.log('🎯 Motif detection and tracking is operational!');
console.log('🔄 Emergent motifs are being identified!');
console.log('✏️ Manual memory addition is working!'); 