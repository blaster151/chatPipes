import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';
import { DefaultSummarizer } from '../src/core/DefaultSummarizer';
import { DefaultMotifDetector } from '../src/core/DefaultMotifDetector';
import { DefaultEmotionalAnalyzer } from '../src/core/DefaultEmotionalAnalyzer';

async function seedData() {
  console.log('🌱 Seeding MemoryManager with example data...\n');

  // Initialize components
  const storage = new FileStore('./data/seed-example');

  const manager = new MemoryManager(
    storage,
    new DefaultSummarizer(),
    new DefaultMotifDetector(),
    new DefaultEmotionalAnalyzer(),
    {
      maxMemorySize: 100,
      summarizationThreshold: 50,
      motifDetectionThreshold: 2,
      emotionalTrackingEnabled: true,
      motifTrackingEnabled: true
    },
    'seed-example'
  );

  await manager.initialize();

  // Sample utterances from different sources
  const sampleUtterances = [
    {
      text: "I'm really happy about the new project we started today!",
      source: "agentA",
      tags: ["work", "positive", "project"],
      metadata: { context: "team meeting" }
    },
    {
      text: "The weather is absolutely terrible today, I can't believe it's raining again.",
      source: "agentB",
      tags: ["weather", "negative", "complaint"],
      metadata: { context: "casual conversation" }
    },
    {
      text: "I love working on this codebase, it's so well structured and clean.",
      source: "agentA",
      tags: ["work", "positive", "code"],
      metadata: { context: "development" }
    },
    {
      text: "I'm feeling quite anxious about the upcoming presentation tomorrow.",
      source: "agentB",
      tags: ["work", "anxiety", "presentation"],
      metadata: { context: "preparation" }
    },
    {
      text: "The team did an amazing job on the latest release!",
      source: "agentA",
      tags: ["work", "positive", "team", "release"],
      metadata: { context: "celebration" }
    },
    {
      text: "I'm really frustrated with the current development process.",
      source: "agentB",
      tags: ["work", "negative", "frustration"],
      metadata: { context: "process review" }
    },
    {
      text: "I love working on this codebase, it's so well structured and clean.",
      source: "agentA",
      tags: ["work", "positive", "code"],
      metadata: { context: "development" }
    },
    {
      text: "The weather is absolutely terrible today, I can't believe it's raining again.",
      source: "agentB",
      tags: ["weather", "negative", "complaint"],
      metadata: { context: "casual conversation" }
    }
  ];

  // Ingest all utterances
  console.log('📝 Ingesting utterances...');
  for (const utterance of sampleUtterances) {
    const memory = await manager.ingestUtterance(
      utterance.text,
      utterance.source,
      utterance.tags,
      utterance.metadata
    );
    console.log(`  ✓ Ingested: "${utterance.text.substring(0, 50)}..." (${memory.importance.toFixed(2)} importance)`);
  }

  console.log('\n📊 Generating summaries...\n');

  // Get overall summary
  const summary = await manager.getSummary();
  console.log('📈 Overall Summary:');
  console.log(`  Total memories: ${summary.totalMemories}`);
  console.log(`  Recent memories (24h): ${summary.recentMemories}`);
  console.log(`  Average importance: ${summary.averageImportance.toFixed(2)}`);
  console.log(`  Time range: ${summary.timeRange.earliest.toLocaleString()} to ${summary.timeRange.latest.toLocaleString()}`);

  // Sources breakdown
  console.log('\n👥 Sources:');
  for (const source of summary.sources) {
    console.log(`  ${source.source}: ${source.count} memories`);
  }

  // Dominant emotions
  console.log('\n😊 Dominant Emotions:');
  for (const emotion of summary.dominantEmotions) {
    console.log(`  ${emotion.emotion}: ${(emotion.frequency * 100).toFixed(1)}% (valence: ${emotion.averageValence.toFixed(2)})`);
  }

  // Top motifs
  console.log('\n🔄 Top Motifs:');
  for (const motif of summary.topMotifs) {
    console.log(`  "${motif.motif}": ${motif.frequency} occurrences`);
  }

  // Get specific summaries
  console.log('\n📋 Factual Summary:');
  const facts = await manager.summarizeFacts();
  console.log(`  ${facts}`);

  console.log('\n💭 Emotional Summary:');
  const emotions = await manager.summarizeEmotions();
  console.log(`  ${emotions}`);

  // Query examples
  console.log('\n🔍 Query Examples:');
  
  // Query by source
  const agentAMemories = await manager.queryMemories({ source: 'agentA' });
  console.log(`  agentA memories: ${agentAMemories.memories.length} found`);

  // Query by importance
  const importantMemories = await manager.queryMemories({ minImportance: 0.7 });
  console.log(`  High importance memories: ${importantMemories.memories.length} found`);

  // Query by tags
  const workMemories = await manager.queryMemories({ tags: ['work'] });
  console.log(`  Work-related memories: ${workMemories.memories.length} found`);

  // Get motifs
  console.log('\n🎯 Detected Motifs:');
  const motifs = await manager.getMotifs();
  for (const motif of motifs) {
    console.log(`  "${motif.pattern}" (strength: ${motif.strength.toFixed(2)}, frequency: ${motif.frequency})`);
  }

  console.log('\n✅ Seeding completed successfully!');
  console.log('\n💡 Try running the server with: npm run start:server');
  console.log('💡 Or use the CLI with: npm run start:cli');
}

// Run the seed function
seedData().catch(error => {
  console.error('❌ Error seeding data:', error);
  process.exit(1);
}); 