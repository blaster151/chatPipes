import { SimpleMemoryItem } from "../types";

export function summarizeFacts(utterances: SimpleMemoryItem[]): string {
  if (utterances.length === 0) {
    return "No memories to summarize.";
  }

  // Simple fact extraction - look for statements that seem factual
  const facts = utterances
    .filter(u => {
      const text = u.text.toLowerCase();
      // Look for statements that might be facts
      return text.includes('is') || text.includes('was') || text.includes('are') || 
             text.includes('have') || text.includes('has') || text.includes('can') ||
             text.includes('will') || text.includes('should') || text.includes('must');
    })
    .map(u => u.text)
    .slice(0, 5); // Limit to 5 facts

  return facts.length > 0 ? facts.join(". ") : "No clear facts identified.";
}

export function summarizeEmotions(utterances: SimpleMemoryItem[]): string {
  if (utterances.length === 0) {
    return "No emotional data available.";
  }

  // Simple emotion detection based on keywords
  const emotionKeywords = {
    joy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'like'],
    sadness: ['sad', 'depressed', 'unhappy', 'sorry', 'regret', 'miss', 'lost'],
    anger: ['angry', 'mad', 'furious', 'hate', 'terrible', 'awful', 'bad'],
    fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'fear'],
    surprise: ['wow', 'surprised', 'shocked', 'unexpected', 'amazing']
  };

  const emotionCounts: Record<string, number> = {};
  
  utterances.forEach(u => {
    const text = u.text.toLowerCase();
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
    }
  });

  if (Object.keys(emotionCounts).length === 0) {
    return "Neutral emotional state detected.";
  }

  const dominantEmotion = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return `Overall emotional state: ${dominantEmotion[0]}, with ${dominantEmotion[1]} instances detected.`;
} 