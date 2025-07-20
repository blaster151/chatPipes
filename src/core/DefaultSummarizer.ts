import {
  Summarizer,
  MemoryItem,
  Motif
} from './types';

export class DefaultSummarizer implements Summarizer {
  summarizeFacts(memories: MemoryItem[]): string {
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

  summarizeEmotions(memories: MemoryItem[]): string {
    if (memories.length === 0) {
      return "No emotional data to summarize.";
    }

    const emotions = memories
      .filter(m => m.utterance.emotionalTone)
      .map(m => m.utterance.emotionalTone!);

    if (emotions.length === 0) {
      return "No emotional tone data available.";
    }

    // Calculate average emotional metrics
    const avgValence = emotions.reduce((sum, e) => sum + e.valence, 0) / emotions.length;
    const avgArousal = emotions.reduce((sum, e) => sum + e.arousal, 0) / emotions.length;
    const avgDominance = emotions.reduce((sum, e) => sum + e.dominance, 0) / emotions.length;

    // Count primary emotions
    const emotionCounts = new Map<string, number>();
    emotions.forEach(e => {
      if (e.primaryEmotion) {
        emotionCounts.set(e.primaryEmotion, (emotionCounts.get(e.primaryEmotion) || 0) + 1);
      }
    });

    const dominantEmotion = Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    let summary = `Overall emotional state: `;
    
    // Valence interpretation
    if (avgValence > 0.3) summary += "Generally positive, ";
    else if (avgValence < -0.3) summary += "Generally negative, ";
    else summary += "Neutral, ";

    // Arousal interpretation
    if (avgArousal > 0.6) summary += "high energy, ";
    else if (avgArousal < 0.4) summary += "calm, ";
    else summary += "moderate energy, ";

    // Dominance interpretation
    if (avgDominance > 0.6) summary += "assertive. ";
    else if (avgDominance < 0.4) summary += "submissive. ";
    else summary += "balanced. ";

    if (dominantEmotion) {
      summary += `Most common emotion: ${dominantEmotion[0]} (${dominantEmotion[1]} occurrences).`;
    }

    return summary;
  }

  summarizeMotifs(motifs: Motif[]): string {
    if (motifs.length === 0) {
      return "No motifs detected.";
    }

    const strongMotifs = motifs
      .filter(m => m.strength > 0.5)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    if (strongMotifs.length === 0) {
      return "No strong motifs detected.";
    }

    const motifDescriptions = strongMotifs.map(motif => 
      `"${motif.pattern}" (frequency: ${motif.frequency}, strength: ${motif.strength.toFixed(2)})`
    );

    return `Detected ${motifs.length} motifs. Strongest patterns: ${motifDescriptions.join('; ')}`;
  }
} 