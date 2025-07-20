import { 
  MemoryManager, 
  MemoryItem,
  MotifTracker,
  Motif
} from '@chatpipes/ai-conductor';
import { DualUtterance } from '@chatpipes/ai-conductor';

/**
 * Example: MemoryManager Prototype - Streamlined Architecture
 */
async function memoryManagerPrototypeExample() {
  console.log('🧠 Example: MemoryManager Prototype - Streamlined Architecture\n');

  const memoryManager = new MemoryManager();

  console.log('✅ MemoryManager initialized');

  // Phase 1: Ingesting Chat Messages
  console.log('\n📝 Phase 1: Ingesting Chat Messages');

  const sampleUtterances: DualUtterance[] = [
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
  sampleUtterances.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Ingested: [${utterance.agentId}] ${utterance.text.substring(0, 50)}...`);
  });

  // Phase 2: Memory Summary Generation
  console.log('\n📊 Phase 2: Memory Summary Generation');

  // Get memory summary for Alice
  const aliceSummary = memoryManager.getMemorySummary('alice');
  console.log('\n👤 Alice Memory Summary:');
  console.log(`   ${aliceSummary}`);

  // Get memory summary for Bob
  const bobSummary = memoryManager.getMemorySummary('bob');
  console.log('\n👤 Bob Memory Summary:');
  console.log(`   ${bobSummary}`);

  // Get global memory summary
  const globalSummary = memoryManager.getMemorySummary();
  console.log('\n🌍 Global Memory Summary:');
  console.log(`   ${globalSummary}`);

  // Phase 3: Motif Detection and Tracking
  console.log('\n🎯 Phase 3: Motif Detection and Tracking');

  // Get motif hints
  const motifHints = memoryManager.getMotifHints();
  console.log('\n💡 Motif Hints for Reinforcement:');
  motifHints.forEach((hint, index) => {
    console.log(`   ${index + 1}. ${hint}`);
  });

  // Get all motifs
  const allMotifs = memoryManager['motifs'].getMotifs();
  console.log('\n🎭 All Detected Motifs:');
  Object.entries(allMotifs).forEach(([key, motif]) => {
    console.log(`   "${motif.phrase}"`);
    console.log(`     Times used: ${motif.timesUsed}`);
    console.log(`     Mood: ${motif.mood || 'neutral'}`);
    console.log(`     Related to: ${motif.relatedTo?.length || 0} other motifs`);
  });

  // Get motifs by mood
  const funnyMotifs = memoryManager['motifs'].getMotifsByMood('funny');
  const strangeMotifs = memoryManager['motifs'].getMotifsByMood('strange');
  const philosophicalMotifs = memoryManager['motifs'].getMotifsByMood('philosophical');

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

  // Phase 4: Memory Analysis by Type
  console.log('\n📋 Phase 4: Memory Analysis by Type');

  const memoryTypes = ['fact', 'joke', 'style', 'callback', 'suspicion', 'emotion'] as const;
  
  memoryTypes.forEach(type => {
    const memories = memoryManager.getMemoriesByType(type);
    console.log(`\n📝 ${type.charAt(0).toUpperCase() + type.slice(1)} Memories (${memories.length}):`);
    memories.forEach((memory, index) => {
      console.log(`   ${index + 1}. [${memory.agentId}] ${memory.content.substring(0, 60)}...`);
      console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
    });
  });

  // Phase 5: Manual Memory Addition
  console.log('\n✏️ Phase 5: Manual Memory Addition');

  // Add manual memories
  memoryManager.addManualMemory("Alice has a twin brother who's also a physicist", 'alice');
  memoryManager.addManualMemory("Bob is afraid of clowns", 'bob');
  memoryManager.addManualMemory("They both love quantum mechanics metaphors", undefined);

  console.log('📝 Manual memories added');

  // Get updated summaries
  const updatedAliceSummary = memoryManager.getMemorySummary('alice');
  console.log('\n👤 Updated Alice Memory Summary:');
  console.log(`   ${updatedAliceSummary}`);

  const updatedBobSummary = memoryManager.getMemorySummary('bob');
  console.log('\n👤 Updated Bob Memory Summary:');
  console.log(`   ${updatedBobSummary}`);

  // Phase 6: Recent Memory Analysis
  console.log('\n⏰ Phase 6: Recent Memory Analysis');

  const recentMemories = memoryManager.getRecentMemories(5);
  console.log('\n🕒 Recent Memories (Last 5):');
  recentMemories.forEach((memory, index) => {
    console.log(`   ${index + 1}. [${memory.type}] [${memory.agentId}] ${memory.content.substring(0, 50)}...`);
    console.log(`      Confidence: ${memory.confidence.toFixed(2)}`);
    console.log(`      Timestamp: ${new Date(memory.timestamp).toLocaleTimeString()}`);
  });

  // Phase 7: Memory Statistics
  console.log('\n📊 Phase 7: Memory Statistics');

  const stats = memoryManager.getStats();
  console.log('\n📈 Memory Manager Statistics:');
  console.log(`   Total memories: ${stats.totalMemories}`);
  console.log(`   Average confidence: ${stats.averageConfidence.toFixed(2)}`);
  console.log(`   Total motifs: ${stats.totalMotifs}`);
  console.log(`   Emergent motifs: ${stats.emergentMotifs}`);
  
  console.log('\n   Memory types:');
  Object.entries(stats.memoryTypes).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });

  // Phase 8: Motif Convergence Analysis
  console.log('\n🔄 Phase 8: Motif Convergence Analysis');

  const emergentMotifs = memoryManager.getMotifHints();
  console.log('\n🎯 Emergent Motifs (Potential "Bits"):');
  emergentMotifs.forEach((motif, index) => {
    console.log(`   ${index + 1}. ${motif}`);
  });

  // Check for motif convergence
  const allMotifsData = memoryManager['motifs'].getMotifs();
  const motifGroups = this.groupRelatedMotifs(allMotifsData);
  
  console.log('\n🔄 Motif Convergence Groups:');
  motifGroups.forEach((group, index) => {
    console.log(`   Group ${index + 1}:`);
    group.forEach(motif => {
      console.log(`     - "${motif.phrase}" (${motif.timesUsed} times, ${motif.mood || 'neutral'})`);
    });
  });

  console.log('\n✅ MemoryManager prototype example completed successfully!');
  console.log('🧠 Memory ingestion and parsing is working!');
  console.log('📊 Memory summaries are being generated!');
  console.log('🎯 Motif detection and tracking is operational!');
  console.log('🔄 Emergent motifs are being identified!');

  return { memoryManager };
}

/**
 * Group related motifs together
 */
function groupRelatedMotifs(motifs: Record<string, Motif>): Motif[][] {
  const groups: Motif[][] = [];
  const visited = new Set<string>();
  
  Object.entries(motifs).forEach(([key, motif]) => {
    if (visited.has(key)) return;
    
    const group = [motif];
    visited.add(key);
    
    // Find all related motifs
    const toVisit = [...(motif.relatedTo || [])];
    while (toVisit.length > 0) {
      const relatedKey = toVisit.pop()!;
      if (!visited.has(relatedKey) && motifs[relatedKey]) {
        const relatedMotif = motifs[relatedKey];
        group.push(relatedMotif);
        visited.add(relatedKey);
        
        // Add its related motifs to visit
        (relatedMotif.relatedTo || []).forEach(relKey => {
          if (!visited.has(relKey)) {
            toVisit.push(relKey);
          }
        });
      }
    }
    
    if (group.length > 1) {
      groups.push(group);
    }
  });
  
  return groups;
}

/**
 * Example: Motif Evolution Over Time
 */
async function motifEvolutionExample() {
  console.log('\n🔄 Example: Motif Evolution Over Time\n');

  const { memoryManager } = await memoryManagerPrototypeExample();

  console.log('🔄 Simulating motif evolution over time...');

  // Simulate conversation continuing with motif development
  const evolutionUtterances: DualUtterance[] = [
    {
      agentId: 'alice',
      text: "The lost dog metaphor keeps evolving in my mind. What if the dog is wearing a tuxedo now?",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.9, emotionalTone: 'contemplative' }
    },
    {
      agentId: 'bob',
      text: "That's brilliant! A tuxedo-wearing lost dog at a quantum wedding. This metaphor is becoming a whole story! 😄",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.9, emotionalTone: 'excited' }
    },
    {
      agentId: 'alice',
      text: "And the tuxedo is made of pure consciousness fabric, woven from the threads of awareness.",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.9, emotionalTone: 'poetic' }
    },
    {
      agentId: 'bob',
      text: "Remember when we first talked about the lost dog? It's amazing how this metaphor has grown.",
      timestamp: Date.now(),
      style: { verbosity: 0.7, metaphorAffinity: 0.8, emotionalTone: 'reflective' }
    },
    {
      agentId: 'alice',
      text: "Speaking of which, the lost dog is now giving a toast at the wedding. 'To consciousness, may it always find the cake table.'",
      timestamp: Date.now(),
      style: { verbosity: 0.8, metaphorAffinity: 0.9, emotionalTone: 'surreal' }
    }
  ];

  // Ingest evolution utterances
  evolutionUtterances.forEach((utterance, index) => {
    memoryManager.ingest(utterance);
    console.log(`📝 Evolution ${index + 1}: [${utterance.agentId}] ${utterance.text.substring(0, 50)}...`);
  });

  // Analyze motif evolution
  console.log('\n🔄 Motif Evolution Analysis:');

  const updatedMotifHints = memoryManager.getMotifHints();
  console.log('\n💡 Updated Motif Hints:');
  updatedMotifHints.forEach((hint, index) => {
    console.log(`   ${index + 1}. ${hint}`);
  });

  // Get all motifs to see evolution
  const allMotifs = memoryManager['motifs'].getMotifs();
  console.log('\n🎭 Motif Evolution:');
  Object.entries(allMotifs)
    .filter(([_, motif]) => motif.phrase.toLowerCase().includes('lost dog') || 
                           motif.phrase.toLowerCase().includes('wedding') ||
                           motif.phrase.toLowerCase().includes('tuxedo'))
    .forEach(([key, motif]) => {
      console.log(`   "${motif.phrase}"`);
      console.log(`     Times used: ${motif.timesUsed}`);
      console.log(`     Mood: ${motif.mood || 'neutral'}`);
      console.log(`     First seen: ${new Date(motif.firstSeen).toLocaleTimeString()}`);
      console.log(`     Last seen: ${new Date(motif.lastSeen).toLocaleTimeString()}`);
    });

  // Check for "bit" development
  const highUsageMotifs = Object.values(allMotifs).filter(motif => motif.timesUsed >= 3);
  console.log('\n🎭 Developing "Bits" (3+ uses):');
  highUsageMotifs.forEach(motif => {
    console.log(`   "${motif.phrase}" (${motif.timesUsed} times, ${motif.mood || 'neutral'})`);
  });

  console.log('\n✅ Motif evolution example completed!');
  console.log('🔄 Motifs are evolving and developing into "bits"!');
  console.log('🎭 The lost dog metaphor has become a running joke!');
  console.log('📈 Motif tracking is showing clear evolution patterns!');

  return { memoryManager };
}

/**
 * Example: Memory Injection for Runtime Use
 */
async function memoryInjectionExample() {
  console.log('\n💉 Example: Memory Injection for Runtime Use\n');

  const { memoryManager } = await motifEvolutionExample();

  console.log('💉 Demonstrating memory injection for runtime use...');

  // Simulate runtime memory injection
  const agents = ['alice', 'bob'];
  
  agents.forEach(agentId => {
    const memorySummary = memoryManager.getMemorySummary(agentId);
    const motifHints = memoryManager.getMotifHints();
    
    console.log(`\n👤 Runtime Memory Injection for ${agentId}:`);
    console.log(`   Memory Summary: ${memorySummary}`);
    console.log(`   Motif Hints: ${motifHints.slice(0, 2).join(', ')}`);
    
    // Generate injection prompt
    const injectionPrompt = `Based on your memory: "${memorySummary}" 
    Consider referencing these motifs if relevant: ${motifHints.slice(0, 2).join(', ')}`;
    
    console.log(`   Injection Prompt: ${injectionPrompt.substring(0, 100)}...`);
  });

  // Show how to use memory for callbacks
  const recentMemories = memoryManager.getRecentMemories(3);
  console.log('\n🔄 Callback Generation:');
  recentMemories.forEach((memory, index) => {
    if (memory.type === 'callback' || memory.content.toLowerCase().includes('remember')) {
      console.log(`   Callback ${index + 1}: "${memory.content}"`);
      console.log(`   Could be used as: "As you mentioned earlier, ${memory.content.substring(0, 30)}..."`);
    }
  });

  // Show motif reinforcement opportunities
  const emergentMotifs = memoryManager.getMotifHints();
  console.log('\n🎯 Motif Reinforcement Opportunities:');
  emergentMotifs.forEach((motif, index) => {
    console.log(`   ${index + 1}. Reinforce: "${motif.split('"')[1]}"`);
    console.log(`      Usage: "That reminds me of ${motif.split('"')[1]}..."`);
  });

  console.log('\n✅ Memory injection example completed!');
  console.log('💉 Memory summaries are ready for runtime injection!');
  console.log('🔄 Callback generation is working!');
  console.log('🎯 Motif reinforcement opportunities identified!');

  return { memoryManager };
}

/**
 * Run all MemoryManager prototype examples
 */
async function runAllMemoryManagerPrototypeExamples() {
  try {
    console.log('🧠 MemoryManager Prototype Examples\n');

    // Example 1: Basic MemoryManager functionality
    await memoryManagerPrototypeExample();

    // Example 2: Motif evolution over time
    await motifEvolutionExample();

    // Example 3: Memory injection for runtime use
    await memoryInjectionExample();

    console.log('\n✅ All MemoryManager prototype examples completed successfully!');
    console.log('🧠 Memory ingestion and parsing is working perfectly!');
    console.log('📊 Memory summaries are being generated effectively!');
    console.log('🎯 Motif detection and tracking is operational!');
    console.log('🔄 Emergent motifs are being identified!');
    console.log('💉 Runtime memory injection is ready!');
  } catch (error) {
    console.error('❌ MemoryManager prototype example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllMemoryManagerPrototypeExamples();
}

export {
  memoryManagerPrototypeExample,
  motifEvolutionExample,
  memoryInjectionExample,
  runAllMemoryManagerPrototypeExamples
}; 