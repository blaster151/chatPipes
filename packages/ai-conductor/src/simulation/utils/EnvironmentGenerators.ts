import { Environment, EnvironmentConfig, AmbientEvent } from '../Environment';

/**
 * Generate a cozy coffee shop environment
 */
export function createCoffeeShopEnvironment(id: string): Environment {
  const config: EnvironmentConfig = {
    id,
    name: 'Cozy Coffee Shop',
    description: 'A warm, inviting coffee shop with the aroma of freshly brewed coffee and the gentle hum of conversation.',
    initialState: {
      time: { hour: 9, minute: 0, day: 1, season: 'autumn' },
      weather: { condition: 'partly_cloudy', temperature: 18, humidity: 60, windSpeed: 5 },
      atmosphere: { mood: 'cozy', noiseLevel: 0.3, lighting: 'warm', activity: 'moderate' },
      social: { nearbyConversations: 3, crowdDensity: 0.4, socialTension: 0.1, recentEvents: [] },
      physical: {
        temperature: 22,
        smells: ['coffee', 'pastries', 'cinnamon'],
        sounds: ['coffee_grinder', 'soft_music', 'conversation'],
        visualElements: ['wooden_tables', 'artwork', 'plants', 'bookshelves']
      }
    },
    ambientEventFrequencyMs: 25000,
    ambientEventGenerator: (state, timestamp) => {
      const events = [
        {
          description: 'The coffee grinder whirrs to life, filling the air with the rich aroma of freshly ground beans.',
          type: 'ambient' as const,
          affects: ['smells', 'sounds']
        },
        {
          description: 'A customer laughs loudly, drawing brief attention from nearby tables.',
          type: 'social' as const,
          affects: ['mood', 'noise']
        },
        {
          description: 'The barista steams milk, creating a gentle hissing sound and releasing sweet vanilla notes.',
          type: 'ambient' as const,
          affects: ['smells', 'sounds']
        },
        {
          description: 'Someone drops a spoon, creating a brief moment of attention before conversation resumes.',
          type: 'social' as const,
          affects: ['noise', 'mood']
        },
        {
          description: 'The door chimes as new customers enter, bringing in a cool breeze and fresh energy.',
          type: 'environmental' as const,
          affects: ['mood', 'social']
        },
        {
          description: 'A group of students huddles over laptops, their focused energy creating a studious atmosphere.',
          type: 'social' as const,
          affects: ['mood', 'activity']
        }
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      
      return {
        id: `coffee-${Date.now()}`,
        type: event.type,
        description: event.description,
        intensity: Math.random() * 0.4 + 0.2, // 0.2 to 0.6
        duration: 3000,
        affects: event.affects,
        timestamp
      };
    },
    stateUpdateRules: [
      {
        condition: (state, event) => event.type === 'social' && event.intensity > 0.5,
        update: (state, event) => ({
          ...state,
          atmosphere: { ...state.atmosphere, noiseLevel: Math.min(1, state.atmosphere.noiseLevel + 0.1) }
        }),
        priority: 1
      },
      {
        condition: (state, event) => event.type === 'ambient' && event.affects.includes('smells'),
        update: (state, event) => ({
          ...state,
          physical: { ...state.physical, smells: [...state.physical.smells.slice(-2), 'coffee'] }
        }),
        priority: 2
      }
    ]
  };

  return new Environment(config);
}

/**
 * Generate a busy office environment
 */
export function createOfficeEnvironment(id: string): Environment {
  const config: EnvironmentConfig = {
    id,
    name: 'Modern Office Space',
    description: 'A contemporary office with the buzz of productivity, ringing phones, and the click-clack of keyboards.',
    initialState: {
      time: { hour: 10, minute: 30, day: 1, season: 'spring' },
      weather: { condition: 'sunny', temperature: 20, humidity: 45, windSpeed: 8 },
      atmosphere: { mood: 'productive', noiseLevel: 0.6, lighting: 'bright', activity: 'high' },
      social: { nearbyConversations: 5, crowdDensity: 0.7, socialTension: 0.3, recentEvents: [] },
      physical: {
        temperature: 21,
        smells: ['coffee', 'cleaner', 'electronics'],
        sounds: ['keyboards', 'phones', 'printers', 'conversations'],
        visualElements: ['desks', 'computers', 'whiteboards', 'plants']
      }
    },
    ambientEventFrequencyMs: 20000,
    ambientEventGenerator: (state, timestamp) => {
      const events = [
        {
          description: 'A phone rings, followed by a brief conversation about project deadlines.',
          type: 'social' as const,
          affects: ['noise', 'social']
        },
        {
          description: 'The printer whirs to life, producing a steady rhythm of paper being processed.',
          type: 'ambient' as const,
          affects: ['sounds']
        },
        {
          description: 'Someone walks by quickly, their footsteps echoing on the hard floor.',
          type: 'ambient' as const,
          affects: ['sounds', 'activity']
        },
        {
          description: 'A team huddles around a whiteboard, their animated discussion drawing attention.',
          type: 'social' as const,
          affects: ['mood', 'social', 'activity']
        },
        {
          description: 'The air conditioning kicks on, creating a subtle background hum.',
          type: 'environmental' as const,
          affects: ['sounds', 'temperature']
        },
        {
          description: 'Someone sighs loudly, then returns to typing with renewed focus.',
          type: 'social' as const,
          affects: ['mood', 'noise']
        }
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      
      return {
        id: `office-${Date.now()}`,
        type: event.type,
        description: event.description,
        intensity: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
        duration: 2000,
        affects: event.affects,
        timestamp
      };
    },
    stateUpdateRules: [
      {
        condition: (state, event) => event.type === 'social' && event.affects.includes('social'),
        update: (state, event) => ({
          ...state,
          social: { ...state.social, socialTension: Math.min(1, state.social.socialTension + 0.05) }
        }),
        priority: 1
      },
      {
        condition: (state, event) => event.type === 'ambient' && event.affects.includes('sounds'),
        update: (state, event) => ({
          ...state,
          atmosphere: { ...state.atmosphere, noiseLevel: Math.min(1, state.atmosphere.noiseLevel + 0.05) }
        }),
        priority: 2
      }
    ]
  };

  return new Environment(config);
}

/**
 * Generate a peaceful park environment
 */
export function createParkEnvironment(id: string): Environment {
  const config: EnvironmentConfig = {
    id,
    name: 'Tranquil Park',
    description: 'A serene park with rustling leaves, chirping birds, and the gentle sounds of nature.',
    initialState: {
      time: { hour: 14, minute: 0, day: 1, season: 'summer' },
      weather: { condition: 'sunny', temperature: 24, humidity: 55, windSpeed: 3 },
      atmosphere: { mood: 'peaceful', noiseLevel: 0.2, lighting: 'natural', activity: 'low' },
      social: { nearbyConversations: 1, crowdDensity: 0.2, socialTension: 0.05, recentEvents: [] },
      physical: {
        temperature: 24,
        smells: ['grass', 'flowers', 'fresh_air'],
        sounds: ['birds', 'leaves_rustling', 'distant_traffic'],
        visualElements: ['trees', 'benches', 'flowers', 'pathways']
      }
    },
    ambientEventFrequencyMs: 35000,
    ambientEventGenerator: (state, timestamp) => {
      const events = [
        {
          description: 'A gentle breeze rustles through the leaves, creating a soothing whisper.',
          type: 'environmental' as const,
          affects: ['sounds', 'mood']
        },
        {
          description: 'Birds chirp melodiously from the branches above, their song carrying across the park.',
          type: 'ambient' as const,
          affects: ['sounds', 'mood']
        },
        {
          description: 'A squirrel scampers across the path, its tiny footsteps barely audible.',
          type: 'ambient' as const,
          affects: ['sounds', 'activity']
        },
        {
          description: 'Someone walks by on the nearby path, their footsteps soft on the gravel.',
          type: 'social' as const,
          affects: ['sounds', 'social']
        },
        {
          description: 'The sun filters through the leaves, creating dappled shadows that shift with the breeze.',
          type: 'environmental' as const,
          affects: ['mood', 'lighting']
        },
        {
          description: 'A distant dog barks, its sound muffled by the trees and distance.',
          type: 'ambient' as const,
          affects: ['sounds']
        }
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      
      return {
        id: `park-${Date.now()}`,
        type: event.type,
        description: event.description,
        intensity: Math.random() * 0.3 + 0.1, // 0.1 to 0.4
        duration: 5000,
        affects: event.affects,
        timestamp
      };
    },
    stateUpdateRules: [
      {
        condition: (state, event) => event.type === 'environmental' && event.affects.includes('mood'),
        update: (state, event) => ({
          ...state,
          atmosphere: { ...state.atmosphere, mood: 'peaceful' }
        }),
        priority: 1
      },
      {
        condition: (state, event) => event.type === 'social' && event.affects.includes('social'),
        update: (state, event) => ({
          ...state,
          social: { ...state.social, nearbyConversations: Math.min(5, state.social.nearbyConversations + 1) }
        }),
        priority: 2
      }
    ]
  };

  return new Environment(config);
}

/**
 * Generate a library environment
 */
export function createLibraryEnvironment(id: string): Environment {
  const config: EnvironmentConfig = {
    id,
    name: 'Quiet Library',
    description: 'A hushed library with the soft rustle of pages, whispered conversations, and the scent of old books.',
    initialState: {
      time: { hour: 15, minute: 30, day: 1, season: 'winter' },
      weather: { condition: 'overcast', temperature: 16, humidity: 40, windSpeed: 6 },
      atmosphere: { mood: 'focused', noiseLevel: 0.1, lighting: 'soft', activity: 'very_low' },
      social: { nearbyConversations: 0, crowdDensity: 0.3, socialTension: 0.02, recentEvents: [] },
      physical: {
        temperature: 20,
        smells: ['books', 'wood', 'dust', 'paper'],
        sounds: ['pages_turning', 'whispers', 'footsteps', 'chairs_creaking'],
        visualElements: ['bookshelves', 'tables', 'lamps', 'windows']
      }
    },
    ambientEventFrequencyMs: 40000,
    ambientEventGenerator: (state, timestamp) => {
      const events = [
        {
          description: 'Pages rustle softly as someone turns a book, the sound barely audible.',
          type: 'ambient' as const,
          affects: ['sounds']
        },
        {
          description: 'A chair creaks gently as someone shifts position, then silence returns.',
          type: 'ambient' as const,
          affects: ['sounds']
        },
        {
          description: 'Someone whispers quietly to a companion, their voices barely carrying.',
          type: 'social' as const,
          affects: ['sounds', 'social']
        },
        {
          description: 'Footsteps echo softly on the wooden floor, growing louder then fading away.',
          type: 'ambient' as const,
          affects: ['sounds', 'activity']
        },
        {
          description: 'A book is carefully placed back on the shelf with a soft thud.',
          type: 'ambient' as const,
          affects: ['sounds']
        },
        {
          description: 'The air conditioning hums quietly, maintaining the perfect temperature for reading.',
          type: 'environmental' as const,
          affects: ['sounds', 'temperature']
        }
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      
      return {
        id: `library-${Date.now()}`,
        type: event.type,
        description: event.description,
        intensity: Math.random() * 0.2 + 0.05, // 0.05 to 0.25
        duration: 2000,
        affects: event.affects,
        timestamp
      };
    },
    stateUpdateRules: [
      {
        condition: (state, event) => event.type === 'social' && event.intensity > 0.3,
        update: (state, event) => ({
          ...state,
          atmosphere: { ...state.atmosphere, noiseLevel: Math.min(0.3, state.atmosphere.noiseLevel + 0.05) }
        }),
        priority: 1
      },
      {
        condition: (state, event) => event.type === 'ambient' && event.affects.includes('sounds'),
        update: (state, event) => ({
          ...state,
          atmosphere: { ...state.atmosphere, mood: 'focused' }
        }),
        priority: 2
      }
    ]
  };

  return new Environment(config);
}

/**
 * Generate a party environment
 */
export function createPartyEnvironment(id: string): Environment {
  const config: EnvironmentConfig = {
    id,
    name: 'Lively Party',
    description: 'A vibrant party with music, laughter, and the energy of celebration filling the air.',
    initialState: {
      time: { hour: 20, minute: 0, day: 1, season: 'summer' },
      weather: { condition: 'clear', temperature: 22, humidity: 65, windSpeed: 2 },
      atmosphere: { mood: 'excited', noiseLevel: 0.8, lighting: 'dim', activity: 'very_high' },
      social: { nearbyConversations: 8, crowdDensity: 0.9, socialTension: 0.1, recentEvents: [] },
      physical: {
        temperature: 24,
        smells: ['food', 'drinks', 'perfume', 'cologne'],
        sounds: ['music', 'laughter', 'conversations', 'clinking_glasses'],
        visualElements: ['lights', 'decorations', 'people', 'food_table']
      }
    },
    ambientEventFrequencyMs: 15000,
    ambientEventGenerator: (state, timestamp) => {
      const events = [
        {
          description: 'The music swells, and people start dancing, their movements creating waves of energy.',
          type: 'social' as const,
          affects: ['mood', 'activity', 'noise']
        },
        {
          description: 'Someone tells a joke, and laughter ripples through the crowd.',
          type: 'social' as const,
          affects: ['mood', 'noise', 'social']
        },
        {
          description: 'Glasses clink together in a toast, followed by cheers and applause.',
          type: 'social' as const,
          affects: ['noise', 'mood', 'social']
        },
        {
          description: 'The DJ changes the song, and the crowd responds with excitement.',
          type: 'ambient' as const,
          affects: ['mood', 'activity']
        },
        {
          description: 'Someone spills a drink, creating a brief moment of attention before the party continues.',
          type: 'social' as const,
          affects: ['noise', 'mood']
        },
        {
          description: 'A group of friends huddles together for a photo, their smiles infectious.',
          type: 'social' as const,
          affects: ['mood', 'social']
        }
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      
      return {
        id: `party-${Date.now()}`,
        type: event.type,
        description: event.description,
        intensity: Math.random() * 0.6 + 0.4, // 0.4 to 1.0
        duration: 3000,
        affects: event.affects,
        timestamp
      };
    },
    stateUpdateRules: [
      {
        condition: (state, event) => event.type === 'social' && event.affects.includes('mood'),
        update: (state, event) => ({
          ...state,
          atmosphere: { ...state.atmosphere, mood: 'excited' }
        }),
        priority: 1
      },
      {
        condition: (state, event) => event.type === 'social' && event.affects.includes('noise'),
        update: (state, event) => ({
          ...state,
          atmosphere: { ...state.atmosphere, noiseLevel: Math.min(1, state.atmosphere.noiseLevel + 0.1) }
        }),
        priority: 2
      }
    ]
  };

  return new Environment(config);
}

/**
 * Generate a custom environment with specified parameters
 */
export function createCustomEnvironment(
  id: string,
  name: string,
  description: string,
  initialState: any,
  eventGenerator: (state: any, timestamp: Date) => AmbientEvent,
  options: {
    ambientEventFrequencyMs?: number;
    stateUpdateRules?: any[];
    eventFilters?: any[];
  } = {}
): Environment {
  const config: EnvironmentConfig = {
    id,
    name,
    description,
    initialState,
    ambientEventFrequencyMs: options.ambientEventFrequencyMs || 30000,
    ambientEventGenerator: eventGenerator,
    stateUpdateRules: options.stateUpdateRules || [],
    eventFilters: options.eventFilters || []
  };

  return new Environment(config);
} 