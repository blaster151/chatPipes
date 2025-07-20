import { MemoryItem } from '../types';

export function summarizeFacts(memories: MemoryItem[]): string {
  if (memories.length === 0) {
    return "No memories to summarize.";
  }

  // Group by source
  const sourceGroups = new Map<string, MemoryItem[]>();
  memories.forEach(memory => {
    const source = memory.utterance.source;
    if (!sourceGroups.has(source)) {
      sourceGroups.set(source, []);
    }
    sourceGroups.get(source)!.push(memory);
  });

  const summaries: string[] = [];

  // Create summary for each source
  for (const [source, sourceMemories] of sourceGroups) {
    const recentMemories = sourceMemories
      .sort((a, b) => b.utterance.timestamp.getTime() - a.utterance.timestamp.getTime())
      .slice(0, 10); // Top 10 most recent

    const importantMemories = sourceMemories
      .filter(m => m.importance > 0.7)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5); // Top 5 most important

    const summary = `${source} has ${sourceMemories.length} total memories. `;
    
    if (importantMemories.length > 0) {
      const keyPoints = importantMemories
        .map(m => m.utterance.text.substring(0, 100))
        .join('; ');
      summaries.push(summary + `Key points: ${keyPoints}`);
    } else {
      summaries.push(summary + `Recent activity: ${recentMemories.length} recent interactions.`);
    }
  }

  return summaries.join(' ');
}

export function extractKeyFacts(memories: MemoryItem[]): string[] {
  const facts: string[] = [];
  
  // Extract facts from high-importance memories
  const importantMemories = memories
    .filter(m => m.importance > 0.6)
    .sort((a, b) => b.importance - a.importance);

  for (const memory of importantMemories.slice(0, 10)) {
    const text = memory.utterance.text;
    const source = memory.utterance.source;
    facts.push(`[${source}] ${text}`);
  }

  return facts;
}

export function summarizeByTopic(memories: MemoryItem[]): Map<string, string[]> {
  const topicGroups = new Map<string, MemoryItem[]>();
  
  // Group by tags
  memories.forEach(memory => {
    const tags = memory.utterance.tags || [];
    if (tags.length === 0) {
      const defaultTag = 'general';
      if (!topicGroups.has(defaultTag)) {
        topicGroups.set(defaultTag, []);
      }
      topicGroups.get(defaultTag)!.push(memory);
    } else {
      for (const tag of tags) {
        if (!topicGroups.has(tag)) {
          topicGroups.set(tag, []);
        }
        topicGroups.get(tag)!.push(memory);
      }
    }
  });

  const summaries = new Map<string, string[]>();
  
  for (const [topic, topicMemories] of topicGroups) {
    const keyPoints = topicMemories
      .filter(m => m.importance > 0.5)
      .map(m => m.utterance.text.substring(0, 80))
      .slice(0, 5);
    
    summaries.set(topic, keyPoints);
  }

  return summaries;
} 