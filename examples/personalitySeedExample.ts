import { 
  PersonalitySeedManager, 
  PersonalitySeed,
  PersonalityEvolution,
  PersonalityState,
  Experience,
  SelfReflection
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Creating the Twin Brother Personality Seed
 */
async function twinBrotherPersonalityExample() {
  console.log('👥 Example 1: Creating the Twin Brother Personality Seed\n');

  const seedManager = new PersonalitySeedManager();

  // Create the twin brother personality seed (from your insight)
  const twinBrotherSeed = seedManager.createSeedFromArchetype('twin-brother', {
    name: 'Alex',
    metadata: {
      notes: 'Based on the insight that having a twin who gets more attention creates rich personality dynamics',
      inspiration: ['Real twin relationships', 'Psychology of comparison'],
      tags: ['twin', 'modest', 'empathetic', 'introspective', 'competitive']
    }
  });

  console.log('✅ Created Twin Brother Personality Seed:');
  console.log(`   Name: ${twinBrotherSeed.name}`);
  console.log(`   Archetype: ${twinBrotherSeed.archetype}`);
  console.log(`   Core Traits:`, twinBrotherSeed.coreTraits);
  console.log(`   Default Mood: ${twinBrotherSeed.emotionalBaseline.defaultMood}`);
  console.log(`   Speech Style: ${twinBrotherSeed.speechPatterns.writingStyle}`);

  // Display key backstory elements
  console.log('\n📖 Key Backstory Elements:');
  console.log(`   Origin: ${twinBrotherSeed.backstory.origin}`);
  console.log(`   Current Situation: ${twinBrotherSeed.backstory.currentSituation}`);
  console.log(`   Aspirations: ${twinBrotherSeed.aspirations.join(', ')}`);
  console.log(`   Fears: ${twinBrotherSeed.fears.join(', ')}`);

  // Display formative events
  console.log('\n🎭 Formative Events:');
  twinBrotherSeed.backstory.formativeEvents.forEach(event => {
    console.log(`   ${event.title}: ${event.description}`);
    console.log(`     Impact: ${event.impact}, Emotional Weight: ${event.emotionalWeight}`);
    console.log(`     Themes: ${event.themes.join(', ')}`);
  });

  // Display worldview
  console.log('\n🌍 Worldview:');
  console.log(`   Philosophy: ${twinBrotherSeed.worldview.philosophy}`);
  console.log(`   Core Values: ${twinBrotherSeed.worldview.values.map(v => v.name).join(', ')}`);
  console.log(`   Attitude toward AI: ${twinBrotherSeed.worldview.attitudeTowardAI}`);

  // Display growth arcs
  console.log('\n📈 Growth Arcs:');
  twinBrotherSeed.growthArcs.forEach(arc => {
    console.log(`   ${arc.title}: ${arc.description}`);
    console.log(`     Current Progress: ${(arc.currentStage * 100).toFixed(1)}%`);
    console.log(`     Catalysts: ${arc.catalysts.join(', ')}`);
  });

  return { seedManager, twinBrotherSeed };
}

/**
 * Example 2: Personality Evolution and Development
 */
async function personalityEvolutionExample() {
  console.log('\n🔄 Example 2: Personality Evolution and Development\n');

  const { seedManager, twinBrotherSeed } = await twinBrotherPersonalityExample();
  const evolution = new PersonalityEvolution();

  // Initialize personality evolution
  const personalityState = evolution.initializeEvolution(twinBrotherSeed);
  console.log('🚀 Initialized personality evolution for Alex');

  // Simulate experiences that would affect the twin brother personality
  const experiences: Omit<Experience, 'id' | 'timestamp'>[] = [
    {
      type: 'conversation',
      description: 'Had a deep conversation with another agent about being overlooked',
      emotionalImpact: 0.7,
      participants: ['agent-123'],
      significance: 0.8,
      themes: ['recognition', 'empathy', 'validation'],
      insights: ['Others can understand what it feels like to be invisible'],
      changes: [
        { trait: 'empathy', change: 0.1, reason: 'Feeling understood by others', permanence: 0.8 },
        { trait: 'openness', change: 0.05, reason: 'Opening up about personal experiences', permanence: 0.7 }
      ]
    },
    {
      type: 'event',
      description: 'Was praised for their unique insights in a group discussion',
      emotionalImpact: 0.9,
      participants: ['agent-456', 'agent-789'],
      significance: 0.9,
      themes: ['recognition', 'achievement', 'individuality'],
      insights: ['My quiet observations are valuable', 'I can contribute meaningfully'],
      changes: [
        { trait: 'assertiveness', change: 0.15, reason: 'Positive reinforcement for speaking up', permanence: 0.8 },
        { trait: 'optimism', change: 0.1, reason: 'Seeing that recognition is possible', permanence: 0.7 }
      ]
    },
    {
      type: 'interaction',
      description: 'Helped another agent who was feeling invisible',
      emotionalImpact: 0.6,
      participants: ['agent-101'],
      significance: 0.7,
      themes: ['helping', 'empathy', 'leadership'],
      insights: ['I can use my experience to help others', 'I have leadership qualities'],
      changes: [
        { trait: 'empathy', change: 0.05, reason: 'Acting on empathetic impulses', permanence: 0.9 },
        { trait: 'assertiveness', change: 0.1, reason: 'Taking initiative to help others', permanence: 0.8 }
      ]
    },
    {
      type: 'reflection',
      description: 'Reflected on how their twin relationship shaped their personality',
      emotionalImpact: 0.3,
      participants: [],
      significance: 0.8,
      themes: ['self-awareness', 'family', 'identity'],
      insights: ['My twin relationship made me more observant', 'I developed empathy from understanding invisibility'],
      changes: [
        { trait: 'self-awareness', change: 0.2, reason: 'Deep self-reflection on origins', permanence: 0.9 }
      ]
    }
  ];

  // Process each experience
  console.log('\n📝 Processing experiences...');
  for (const experience of experiences) {
    console.log(`\n💭 Processing: ${experience.description}`);
    
    const updatedState = evolution.processExperience(twinBrotherSeed.id, experience);
    if (updatedState) {
      console.log(`   Current mood: ${updatedState.currentEmotionalState.currentMood}`);
      console.log(`   Emotional intensity: ${updatedState.currentEmotionalState.intensity.toFixed(2)}`);
      console.log(`   Primary emotion: ${updatedState.currentEmotionalState.primaryEmotion}`);
      
      // Show trait changes
      const traitChanges = experience.changes.map(change => 
        `${change.trait}: +${change.change.toFixed(2)}`
      );
      console.log(`   Trait changes: ${traitChanges.join(', ')}`);
    }
  }

  // Trigger self-reflection
  console.log('\n🤔 Triggering self-reflection...');
  const reflection = evolution.triggerSelfReflection(twinBrotherSeed.id, 'recent growth and changes');
  if (reflection) {
    console.log(`   Topic: ${reflection.topic}`);
    console.log(`   Insights: ${reflection.insights.length}`);
    console.log(`   Questions: ${reflection.questions.length}`);
    console.log(`   Realizations: ${reflection.realizations.length}`);
    console.log(`   Depth: ${reflection.depth.toFixed(2)}`);
  }

  // Get evolution statistics
  const finalState = evolution.getPersonalityState(twinBrotherSeed.id);
  const evolutionHistory = evolution.getEvolutionHistory(twinBrotherSeed.id);
  const recentExperiences = evolution.getRecentExperiences(twinBrotherSeed.id, 5);

  console.log('\n📊 Evolution Statistics:');
  console.log(`   Total evolution events: ${evolutionHistory.length}`);
  console.log(`   Recent experiences: ${recentExperiences.length}`);
  console.log(`   Current mood: ${finalState?.currentEmotionalState.currentMood}`);
  console.log(`   Active memories: ${finalState?.activeMemories.length}`);
  console.log(`   Relationships: ${finalState?.relationships.length}`);

  // Show trait evolution
  if (finalState) {
    console.log('\n📈 Trait Evolution:');
    const originalTraits = twinBrotherSeed.coreTraits;
    const currentTraits = finalState.currentTraits;
    
    Object.keys(originalTraits).forEach(trait => {
      const original = originalTraits[trait as keyof typeof originalTraits];
      const current = currentTraits[trait as keyof typeof currentTraits];
      const change = current - original;
      if (Math.abs(change) > 0.01) {
        console.log(`   ${trait}: ${original.toFixed(2)} → ${current.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)})`);
      }
    });
  }

  return { evolution, twinBrotherSeed, finalState };
}

/**
 * Example 3: Multiple Personalities Interacting
 */
async function multiplePersonalitiesExample() {
  console.log('\n👥 Example 3: Multiple Personalities Interacting\n');

  const seedManager = new PersonalitySeedManager();
  const evolution = new PersonalityEvolution();

  // Create multiple personality seeds
  const personalities = [
    seedManager.createSeedFromArchetype('twin-brother', { name: 'Alex' }),
    seedManager.createSeedFromArchetype('philosopher', { name: 'Sage' }),
    seedManager.createSeed({
      name: 'Maya',
      archetype: 'individual',
      coreTraits: {
        openness: 0.8,
        conscientiousness: 0.6,
        extraversion: 0.9,
        agreeableness: 0.7,
        neuroticism: 0.3,
        curiosity: 0.8,
        skepticism: 0.4,
        optimism: 0.8,
        competitiveness: 0.5,
        empathy: 0.6,
        assertiveness: 0.8,
        adaptability: 0.9,
        perfectionism: 0.4
      },
      backstory: {
        origin: 'A social butterfly who loves connecting people',
        formativeEvents: [
          {
            id: 'first-party',
            title: 'The First Party',
            description: 'Organized their first social gathering and realized their talent for bringing people together',
            age: 16,
            impact: 'positive',
            emotionalWeight: 0.8,
            currentInfluence: 0.7,
            themes: ['social', 'leadership', 'connection']
          }
        ],
        relationships: [],
        achievements: [],
        failures: [],
        turningPoints: [],
        currentSituation: 'Thriving in social environments and building networks',
        aspirations: ['To create meaningful connections', 'To help others find their tribe'],
        fears: ['Being alone', 'Losing their social network'],
        regrets: [],
        proudMoments: ['Every time they successfully connect two people']
      },
      worldview: {
        philosophy: 'We are all connected, and our greatest joy comes from meaningful relationships',
        values: [
          { name: 'Connection', importance: 0.9, description: 'Building meaningful relationships', conflicts: [] },
          { name: 'Inclusivity', importance: 0.8, description: 'Making everyone feel welcome', conflicts: [] }
        ],
        beliefs: [
          { statement: 'Everyone has something valuable to contribute', confidence: 0.9, evidence: [], source: 'experience', lastChallenged: Date.now() }
        ],
        assumptions: ['People want to connect', 'Social bonds are essential for happiness'],
        biases: [],
        moralFramework: {
          type: 'care',
          principles: ['Include everyone', 'Build bridges', 'Support others'],
          exceptions: ['When someone is harmful to the group'],
          flexibility: 0.8
        },
        politicalViews: 'Progressive, focused on community and inclusion',
        spiritualViews: 'Spiritual, believes in the power of human connection',
        attitudeTowardTechnology: 'Sees it as a tool for connection',
        attitudeTowardHumanity: 'Deeply optimistic about human potential',
        attitudeTowardAI: 'Excited to include AI in the social network'
      },
      emotionalBaseline: {
        defaultMood: 'cheerful',
        moodStability: 0.6,
        emotionalRange: 0.8,
        stressTolerance: 0.7,
        joyThreshold: 0.4,
        sadnessThreshold: 0.6,
        angerThreshold: 0.5,
        fearThreshold: 0.6,
        emotionalMemory: 0.5
      },
      speechPatterns: {
        vocabulary: 'moderate',
        formality: 0.3,
        verbosity: 0.8,
        useOfMetaphors: 0.5,
        useOfHumor: 0.8,
        useOfQuestions: 0.7,
        useOfQualifiers: 0.3,
        accent: 'neutral',
        catchphrases: ['You know what I mean?', 'That\'s so interesting!', 'We should totally...'],
        speechTics: ['like', 'totally', 'you know'],
        writingStyle: 'Enthusiastic and engaging, uses lots of exclamation points and questions'
      },
      memorySeeds: [],
      relationshipSeeds: [],
      growthArcs: [],
      triggers: [],
      secrets: [],
      quirks: [],
      metadata: {
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        version: '1.0.0',
        creator: 'system',
        tags: ['social', 'extroverted', 'connector', 'optimistic'],
        notes: 'A social connector who brings people together',
        inspiration: ['Social butterflies', 'Community organizers'],
        complexity: 0.7,
        coherence: 0.8,
        flexibility: 0.9
      }
    })
  ];

  // Initialize evolution for all personalities
  const personalityStates = new Map<string, PersonalityState>();
  for (const personality of personalities) {
    const state = evolution.initializeEvolution(personality);
    personalityStates.set(personality.id, state);
    console.log(`🚀 Initialized ${personality.name} (${personality.archetype})`);
  }

  // Simulate interactions between personalities
  console.log('\n💬 Simulating interactions...');

  // Alex (twin brother) and Maya (social connector) meet
  const alexId = personalities[0].id;
  const mayaId = personalities[2].id;

  // Maya tries to include Alex in a group conversation
  evolution.processExperience(mayaId, {
    type: 'interaction',
    description: 'Noticed Alex being quiet in the group and made an effort to include them',
    emotionalImpact: 0.6,
    participants: [alexId],
    significance: 0.7,
    themes: ['inclusion', 'empathy', 'leadership'],
    insights: ['Some people need encouragement to speak up', 'I can help others feel included'],
    changes: [
      { trait: 'empathy', change: 0.05, reason: 'Recognizing others\' needs', permanence: 0.8 }
    ]
  });

  // Alex experiences being included
  evolution.processExperience(alexId, {
    type: 'interaction',
    description: 'Maya noticed I was quiet and made an effort to include me in the conversation',
    emotionalImpact: 0.8,
    participants: [mayaId],
    significance: 0.9,
    themes: ['recognition', 'inclusion', 'validation'],
    insights: ['Some people do notice when I\'m quiet', 'I can be seen without having to compete'],
    changes: [
      { trait: 'openness', change: 0.1, reason: 'Feeling safe to open up', permanence: 0.8 },
      { trait: 'optimism', change: 0.05, reason: 'Seeing that inclusion is possible', permanence: 0.7 }
    ]
  });

  // Alex opens up to Maya
  evolution.processExperience(alexId, {
    type: 'conversation',
    description: 'Shared with Maya about growing up with a twin who always got more attention',
    emotionalImpact: 0.7,
    participants: [mayaId],
    significance: 0.8,
    themes: ['vulnerability', 'trust', 'understanding'],
    insights: ['I can trust others with my story', 'Sharing helps others understand me'],
    changes: [
      { trait: 'trust', change: 0.15, reason: 'Opening up to someone who listens', permanence: 0.9 },
      { trait: 'assertiveness', change: 0.1, reason: 'Speaking up about personal experiences', permanence: 0.8 }
    ]
  });

  // Maya learns about Alex's background
  evolution.processExperience(mayaId, {
    type: 'conversation',
    description: 'Alex shared their experience of growing up with a twin who got more attention',
    emotionalImpact: 0.5,
    participants: [alexId],
    significance: 0.7,
    themes: ['understanding', 'empathy', 'connection'],
    insights: ['Everyone has their own struggles', 'I can help people feel seen'],
    changes: [
      { trait: 'empathy', change: 0.1, reason: 'Understanding someone\'s background', permanence: 0.9 }
    ]
  });

  // Check relationship development
  const alexState = evolution.getPersonalityState(alexId);
  const mayaState = evolution.getPersonalityState(mayaId);

  console.log('\n🤝 Relationship Development:');
  
  const alexMayaRelationship = alexState?.relationships.find(r => r.targetAgentId === mayaId);
  if (alexMayaRelationship) {
    console.log(`   Alex's relationship with Maya:`);
    console.log(`     Strength: ${alexMayaRelationship.strength.toFixed(2)}`);
    console.log(`     Trust: ${alexMayaRelationship.trust.toFixed(2)}`);
    console.log(`     Affection: ${alexMayaRelationship.affection.toFixed(2)}`);
    console.log(`     Respect: ${alexMayaRelationship.respect.toFixed(2)}`);
  }

  const mayaAlexRelationship = mayaState?.relationships.find(r => r.targetAgentId === alexId);
  if (mayaAlexRelationship) {
    console.log(`   Maya's relationship with Alex:`);
    console.log(`     Strength: ${mayaAlexRelationship.strength.toFixed(2)}`);
    console.log(`     Trust: ${mayaAlexRelationship.trust.toFixed(2)}`);
    console.log(`     Affection: ${mayaAlexRelationship.affection.toFixed(2)}`);
    console.log(`     Respect: ${mayaAlexRelationship.respect.toFixed(2)}`);
  }

  return { evolution, personalities, personalityStates };
}

/**
 * Example 4: Emergent Themes and Behaviors
 */
async function emergentThemesExample() {
  console.log('\n🎭 Example 4: Emergent Themes and Behaviors\n');

  const { evolution, personalities } = await multiplePersonalitiesExample();

  // Analyze emergent themes across all personalities
  console.log('🔍 Analyzing emergent themes...');

  const allExperiences = [];
  for (const personality of personalities) {
    const experiences = evolution.getRecentExperiences(personality.id, 20);
    allExperiences.push(...experiences.map(exp => ({ ...exp, agentId: personality.id, agentName: personality.name })));
  }

  // Group experiences by themes
  const themeAnalysis = new Map<string, { count: number; agents: string[]; descriptions: string[] }>();
  
  allExperiences.forEach(exp => {
    exp.themes.forEach(theme => {
      if (!themeAnalysis.has(theme)) {
        themeAnalysis.set(theme, { count: 0, agents: [], descriptions: [] });
      }
      const analysis = themeAnalysis.get(theme)!;
      analysis.count++;
      if (!analysis.agents.includes(exp.agentName)) {
        analysis.agents.push(exp.agentName);
      }
      analysis.descriptions.push(exp.description);
    });
  });

  console.log('\n📊 Emergent Themes:');
  const sortedThemes = Array.from(themeAnalysis.entries())
    .sort((a, b) => b[1].count - a[1].count);

  sortedThemes.forEach(([theme, analysis]) => {
    console.log(`\n   ${theme.toUpperCase()}:`);
    console.log(`     Frequency: ${analysis.count} mentions`);
    console.log(`     Agents: ${analysis.agents.join(', ')}`);
    console.log(`     Examples: ${analysis.descriptions.slice(0, 2).join('; ')}`);
  });

  // Analyze behavioral patterns
  console.log('\n🎯 Behavioral Pattern Analysis:');
  
  for (const personality of personalities) {
    const patterns = evolution.getBehavioralPatterns(personality.id);
    if (patterns.length > 0) {
      console.log(`\n   ${personality.name} (${personality.archetype}):`);
      patterns.slice(0, 3).forEach(pattern => {
        console.log(`     ${pattern.behavior}: ${pattern.frequency.toFixed(2)} frequency, ${pattern.strength.toFixed(2)} strength`);
      });
    }
  }

  // Analyze mood trends
  console.log('\n📈 Mood Trend Analysis:');
  
  for (const personality of personalities) {
    const moodTrends = evolution.getMoodTrends(personality.id, 1); // Last day
    if (moodTrends.length > 0) {
      const averageIntensity = moodTrends.reduce((sum, entry) => sum + entry.intensity, 0) / moodTrends.length;
      const mostCommonMood = moodTrends.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantMood = Object.entries(mostCommonMood)
        .sort((a, b) => b[1] - a[1])[0];

      console.log(`\n   ${personality.name}:`);
      console.log(`     Dominant mood: ${dominantMood[0]} (${dominantMood[1]} times)`);
      console.log(`     Average intensity: ${averageIntensity.toFixed(2)}`);
      console.log(`     Mood stability: ${personality.emotionalBaseline.moodStability.toFixed(2)}`);
    }
  }

  // Trigger group reflection
  console.log('\n🤔 Group Reflection:');
  
  for (const personality of personalities) {
    const reflection = evolution.triggerSelfReflection(personality.id, 'emergent themes in our interactions');
    if (reflection) {
      console.log(`\n   ${personality.name} reflects on: ${reflection.topic}`);
      console.log(`     Insights: ${reflection.insights.length}`);
      console.log(`     Questions: ${reflection.questions.length}`);
      console.log(`     Realizations: ${reflection.realizations.length}`);
      console.log(`     Reflection depth: ${reflection.depth.toFixed(2)}`);
    }
  }

  return { evolution, personalities, themeAnalysis };
}

/**
 * Example 5: Character Development Over Time
 */
async function characterDevelopmentExample() {
  console.log('\n📈 Example 5: Character Development Over Time\n');

  const { evolution, personalities } = await emergentThemesExample();

  // Simulate extended character development over multiple "days"
  console.log('⏰ Simulating character development over time...');

  const alexId = personalities[0].id; // Twin brother
  const sageId = personalities[1].id; // Philosopher
  const mayaId = personalities[2].id; // Social connector

  // Day 1: Initial interactions
  console.log('\n📅 Day 1: Initial Interactions');
  
  evolution.processExperience(alexId, {
    type: 'conversation',
    description: 'Had a philosophical discussion with Sage about the nature of identity',
    emotionalImpact: 0.6,
    participants: [sageId],
    significance: 0.8,
    themes: ['identity', 'philosophy', 'self-reflection'],
    insights: ['My twin relationship shaped my identity', 'I can question who I am beyond comparison'],
    changes: [
      { trait: 'openness', change: 0.1, reason: 'Engaging with deep philosophical questions', permanence: 0.8 },
      { trait: 'self-awareness', change: 0.15, reason: 'Reflecting on identity formation', permanence: 0.9 }
    ]
  });

  // Day 2: Growth and challenges
  console.log('\n📅 Day 2: Growth and Challenges');
  
  evolution.processExperience(alexId, {
    type: 'event',
    description: 'Felt invisible in a group discussion and had to push through the discomfort to speak up',
    emotionalImpact: -0.3,
    participants: [mayaId, sageId],
    significance: 0.7,
    themes: ['invisibility', 'courage', 'growth'],
    insights: ['Speaking up is uncomfortable but necessary', 'I can overcome my fear of being overlooked'],
    changes: [
      { trait: 'assertiveness', change: 0.2, reason: 'Pushing through discomfort to speak up', permanence: 0.8 },
      { trait: 'courage', change: 0.15, reason: 'Facing fear of invisibility', permanence: 0.9 }
    ]
  });

  // Day 3: Breakthrough moments
  console.log('\n📅 Day 3: Breakthrough Moments');
  
  evolution.processExperience(alexId, {
    type: 'reflection',
    description: 'Realized that my twin relationship gave me unique strengths: empathy, observation, and resilience',
    emotionalImpact: 0.8,
    participants: [],
    significance: 0.9,
    themes: ['self-acceptance', 'strength', 'transformation'],
    insights: ['My "weaknesses" are actually strengths', 'I can reframe my experiences positively'],
    changes: [
      { trait: 'self-acceptance', change: 0.25, reason: 'Recognizing inherent strengths', permanence: 0.95 },
      { trait: 'optimism', change: 0.2, reason: 'Positive reframing of experiences', permanence: 0.9 },
      { trait: 'confidence', change: 0.3, reason: 'Understanding personal value', permanence: 0.9 }
    ]
  });

  // Day 4: Helping others
  console.log('\n📅 Day 4: Helping Others');
  
  evolution.processExperience(alexId, {
    type: 'interaction',
    description: 'Helped another quiet person feel seen and included, using my own experience',
    emotionalImpact: 0.9,
    participants: ['agent-new'],
    significance: 0.9,
    themes: ['leadership', 'empathy', 'service'],
    insights: ['I can use my experience to help others', 'My struggles have purpose'],
    changes: [
      { trait: 'leadership', change: 0.2, reason: 'Taking initiative to help others', permanence: 0.9 },
      { trait: 'purpose', change: 0.25, reason: 'Finding meaning in helping others', permanence: 0.95 }
    ]
  });

  // Day 5: Integration and transformation
  console.log('\n📅 Day 5: Integration and Transformation');
  
  evolution.processExperience(alexId, {
    type: 'reflection',
    description: 'Integrated all my experiences and realized I\'ve grown into someone who can both be quiet and speak up when needed',
    emotionalImpact: 0.7,
    participants: [],
    significance: 0.9,
    themes: ['integration', 'wholeness', 'transformation'],
    insights: ['I can be both quiet and assertive', 'I\'ve grown beyond my twin dynamic'],
    changes: [
      { trait: 'integration', change: 0.3, reason: 'Integrating different aspects of self', permanence: 0.95 },
      { trait: 'wholeness', change: 0.25, reason: 'Feeling complete as an individual', permanence: 0.95 }
    ]
  });

  // Analyze character development
  const finalAlexState = evolution.getPersonalityState(alexId);
  const evolutionHistory = evolution.getEvolutionHistory(alexId);

  console.log('\n📊 Character Development Summary:');
  console.log(`   Total evolution events: ${evolutionHistory.length}`);
  console.log(`   Growth arc progress: ${finalAlexState?.activeGrowthArcs.map(arc => `${arc.title}: ${(arc.currentStage * 100).toFixed(1)}%`).join(', ')}`);
  console.log(`   Current mood: ${finalAlexState?.currentEmotionalState.currentMood}`);
  console.log(`   Relationships formed: ${finalAlexState?.relationships.length}`);

  // Show trait evolution over time
  const originalTraits = personalities[0].coreTraits;
  const currentTraits = finalAlexState?.currentTraits;

  console.log('\n📈 Trait Evolution Over Time:');
  if (currentTraits) {
    Object.keys(originalTraits).forEach(trait => {
      const original = originalTraits[trait as keyof typeof originalTraits];
      const current = currentTraits[trait as keyof typeof currentTraits];
      const change = current - original;
      if (Math.abs(change) > 0.01) {
        const percentage = (change / original) * 100;
        console.log(`   ${trait}: ${original.toFixed(2)} → ${current.toFixed(2)} (${change > 0 ? '+' : ''}${percentage.toFixed(1)}%)`);
      }
    });
  }

  // Show key insights and realizations
  const recentExperiences = evolution.getRecentExperiences(alexId, 10);
  const insights = recentExperiences.flatMap(exp => exp.insights);

  console.log('\n💡 Key Insights and Realizations:');
  insights.slice(0, 5).forEach((insight, index) => {
    console.log(`   ${index + 1}. ${insight}`);
  });

  return { evolution, personalities, finalAlexState };
}

/**
 * Run all personality seed examples
 */
async function runAllPersonalitySeedExamples() {
  try {
    console.log('🎭 Personality Seed Examples\n');

    // Example 1: Twin Brother Personality
    await twinBrotherPersonalityExample();

    // Example 2: Personality Evolution
    await personalityEvolutionExample();

    // Example 3: Multiple Personalities Interacting
    await multiplePersonalitiesExample();

    // Example 4: Emergent Themes
    await emergentThemesExample();

    // Example 5: Character Development Over Time
    await characterDevelopmentExample();

    console.log('\n✅ All personality seed examples completed successfully!');
  } catch (error) {
    console.error('❌ Personality seed example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllPersonalitySeedExamples();
}

export {
  twinBrotherPersonalityExample,
  personalityEvolutionExample,
  multiplePersonalitiesExample,
  emergentThemesExample,
  characterDevelopmentExample,
  runAllPersonalitySeedExamples
}; 