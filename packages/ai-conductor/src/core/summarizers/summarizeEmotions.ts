import { MemoryItem, EmotionalTone } from '../types';

export function summarizeEmotions(memories: MemoryItem[]): string {
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

export function analyzeEmotionalTrends(memories: MemoryItem[]): {
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
  details: string;
} {
  if (memories.length < 2) {
    return {
      trend: 'stable',
      confidence: 0,
      details: 'Insufficient data for trend analysis'
    };
  }

  // Sort by timestamp
  const sortedMemories = memories
    .filter(m => m.utterance.emotionalTone)
    .sort((a, b) => a.utterance.timestamp.getTime() - b.utterance.timestamp.getTime());

  if (sortedMemories.length < 2) {
    return {
      trend: 'stable',
      confidence: 0,
      details: 'Insufficient emotional data'
    };
  }

  // Calculate valence trend
  const valences = sortedMemories.map(m => m.utterance.emotionalTone!.valence);
  const firstHalf = valences.slice(0, Math.floor(valences.length / 2));
  const secondHalf = valences.slice(Math.floor(valences.length / 2));

  const avgFirst = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

  const difference = avgSecond - avgFirst;
  const confidence = Math.min(Math.abs(difference) * 2, 1);

  let trend: 'improving' | 'declining' | 'stable';
  let details: string;

  if (Math.abs(difference) < 0.1) {
    trend = 'stable';
    details = 'Emotional state has remained relatively stable';
  } else if (difference > 0) {
    trend = 'improving';
    details = `Emotional state has improved by ${(difference * 100).toFixed(1)}%`;
  } else {
    trend = 'declining';
    details = `Emotional state has declined by ${(Math.abs(difference) * 100).toFixed(1)}%`;
  }

  return { trend, confidence, details };
}

export function getEmotionalProfile(memories: MemoryItem[]): {
  dominantEmotions: Array<{ emotion: string; frequency: number; averageValence: number }>;
  emotionalRange: { min: number; max: number; average: number };
  emotionalStability: number;
} {
  const emotions = memories
    .filter(m => m.utterance.emotionalTone)
    .map(m => m.utterance.emotionalTone!);

  if (emotions.length === 0) {
    return {
      dominantEmotions: [],
      emotionalRange: { min: 0, max: 0, average: 0 },
      emotionalStability: 0
    };
  }

  // Calculate dominant emotions
  const emotionCounts = new Map<string, { count: number; totalValence: number }>();
  emotions.forEach(e => {
    if (e.primaryEmotion) {
      const current = emotionCounts.get(e.primaryEmotion) || { count: 0, totalValence: 0 };
      current.count++;
      current.totalValence += e.valence;
      emotionCounts.set(e.primaryEmotion, current);
    }
  });

  const dominantEmotions = Array.from(emotionCounts.entries())
    .map(([emotion, data]) => ({
      emotion,
      frequency: data.count / emotions.length,
      averageValence: data.totalValence / data.count
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  // Calculate emotional range
  const valences = emotions.map(e => e.valence);
  const emotionalRange = {
    min: Math.min(...valences),
    max: Math.max(...valences),
    average: valences.reduce((sum, v) => sum + v, 0) / valences.length
  };

  // Calculate emotional stability (lower variance = more stable)
  const variance = valences.reduce((sum, v) => sum + Math.pow(v - emotionalRange.average, 2), 0) / valences.length;
  const emotionalStability = Math.max(0, 1 - Math.sqrt(variance));

  return {
    dominantEmotions,
    emotionalRange,
    emotionalStability
  };
} 