import {
  EmotionalAnalyzer,
  EmotionalTone
} from './types';

export class DefaultEmotionalAnalyzer implements EmotionalAnalyzer {
  private emotionKeywords = {
    joy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'like', 'enjoy', 'pleased', 'delighted'],
    sadness: ['sad', 'depressed', 'unhappy', 'miserable', 'sorrow', 'grief', 'disappointed', 'upset', 'crying', 'tears'],
    anger: ['angry', 'mad', 'furious', 'rage', 'hate', 'disgust', 'annoyed', 'irritated', 'frustrated', 'outraged'],
    fear: ['afraid', 'scared', 'fear', 'terrified', 'anxious', 'worried', 'nervous', 'panic', 'horror', 'dread'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'wow', 'incredible', 'unbelievable'],
    disgust: ['disgust', 'gross', 'nasty', 'revolting', 'sickening', 'repulsive', 'vile']
  };

  private intensityModifiers = {
    very: 1.5,
    really: 1.3,
    extremely: 1.8,
    quite: 0.8,
    somewhat: 0.6,
    slightly: 0.4,
    not: -0.5,
    never: -0.7
  };

  analyzeEmotion(text: string): EmotionalTone {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let primaryEmotion = '';
    let maxScore = 0;
    let totalValence = 0;
    let totalArousal = 0;
    let totalDominance = 0;
    let emotionCount = 0;

    // Analyze each emotion category
    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      let score = 0;
      
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      // Check for intensity modifiers
      for (const [modifier, multiplier] of Object.entries(this.intensityModifiers)) {
        const modifierRegex = new RegExp(`\\b${modifier}\\s+\\w*(${keywords.join('|')})\\w*`, 'gi');
        const modifierMatches = lowerText.match(modifierRegex);
        if (modifierMatches) {
          score *= multiplier;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion;
      }

      // Calculate VAD (Valence, Arousal, Dominance) scores
      if (score > 0) {
        const vad = this.getVADScores(emotion, score);
        totalValence += vad.valence;
        totalArousal += vad.arousal;
        totalDominance += vad.dominance;
        emotionCount++;
      }
    }

    // Default to neutral if no emotions detected
    if (emotionCount === 0) {
      return {
        valence: 0,
        arousal: 0.3, // Slight arousal for neutral text
        dominance: 0.5,
        confidence: 0.1
      };
    }

    // Calculate averages
    const avgValence = totalValence / emotionCount;
    const avgArousal = totalArousal / emotionCount;
    const avgDominance = totalDominance / emotionCount;

    // Calculate confidence based on emotion strength and text length
    const confidence = Math.min(maxScore / 3 + (words.length / 50), 1);

    return {
      valence: Math.max(-1, Math.min(1, avgValence)),
      arousal: Math.max(0, Math.min(1, avgArousal)),
      dominance: Math.max(0, Math.min(1, avgDominance)),
      primaryEmotion: maxScore > 0 ? primaryEmotion : undefined,
      confidence: Math.max(0.1, Math.min(1, confidence))
    };
  }

  private getVADScores(emotion: string, intensity: number): { valence: number; arousal: number; dominance: number } {
    const baseScores = {
      joy: { valence: 0.8, arousal: 0.6, dominance: 0.7 },
      sadness: { valence: -0.7, arousal: 0.3, dominance: 0.2 },
      anger: { valence: -0.6, arousal: 0.8, dominance: 0.8 },
      fear: { valence: -0.5, arousal: 0.9, dominance: 0.1 },
      surprise: { valence: 0.2, arousal: 0.8, dominance: 0.4 },
      disgust: { valence: -0.8, arousal: 0.6, dominance: 0.3 }
    };

    const base = baseScores[emotion as keyof typeof baseScores] || { valence: 0, arousal: 0.5, dominance: 0.5 };
    const intensityFactor = Math.min(intensity / 3, 1);

    return {
      valence: base.valence * intensityFactor,
      arousal: base.arousal * intensityFactor + (1 - intensityFactor) * 0.3,
      dominance: base.dominance * intensityFactor + (1 - intensityFactor) * 0.5
    };
  }
} 