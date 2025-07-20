import { 
  DualUtterance, 
  ChatRenderBlock, 
  AmbientEvent, 
  AgentState, 
  StyleVector,
  BehavioralState,
  InnerThought,
  EnvironmentalInfluence,
  ThreadState,
  EnvironmentState,
  MoodSnapshot,
  WorldState,
  EntanglementEvent,
  StyleContagion,
  DiffusionState,
  DualTranscript,
  ConversationStream,
  DialogueRenderer,
  StateTracker
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Basic Dual-Layered Dialogue
 */
async function basicDualLayeredDialogueExample() {
  console.log('💬 Example 1: Basic Dual-Layered Dialogue\n');

  // Create dual utterances
  const utterances: DualUtterance[] = [
    {
      speakerId: 'Alice',
      spoken: 'I really think we should go with your plan.',
      unspoken: 'She\'s trying to flatter me. I can tell.',
      timestamp: Date.now(),
      metadata: {
        thoughtType: 'suspicion',
        intensity: 0.8,
        emotionalState: 'suspicious',
        context: 'business meeting'
      }
    },
    {
      speakerId: 'Bob',
      spoken: 'Sure, let\'s go with it.',
      unspoken: 'I should be more careful around her.',
      timestamp: Date.now() + 1000,
      metadata: {
        thoughtType: 'judgment',
        intensity: 0.6,
        emotionalState: 'cautious',
        context: 'business meeting'
      }
    },
    {
      speakerId: 'Alice',
      spoken: 'Great! I\'ll prepare the documents.',
      unspoken: 'Perfect, he\'s falling for it.',
      timestamp: Date.now() + 2000,
      metadata: {
        thoughtType: 'amusement',
        intensity: 0.7,
        emotionalState: 'satisfied',
        context: 'business meeting'
      }
    }
  ];

  // Create ambient events
  const ambientEvents: AmbientEvent[] = [
    {
      id: 'ambient-1',
      envId: 'office',
      text: 'The air conditioning hums softly in the background.',
      source: 'system',
      timestamp: Date.now(),
      intensity: 0.3,
      type: 'environmental',
      affects: ['mood', 'noise']
    },
    {
      id: 'ambient-2',
      envId: 'office',
      text: 'A phone rings in the distance.',
      source: 'randomGen',
      timestamp: Date.now() + 1500,
      intensity: 0.5,
      type: 'social',
      affects: ['noise', 'social']
    }
  ];

  // Create renderer
  const renderer = new DialogueRenderer({
    showUnspoken: true,
    showAmbient: true,
    includeTimestamps: true,
    includeMetadata: false,
    styleUnspoken: 'italic',
    styleAmbient: 'gray'
  });

  // Render dual utterances
  console.log('📝 Rendered Dialogue:');
  utterances.forEach(utterance => {
    const blocks = renderer.renderDualUtterance(utterance);
    blocks.forEach(block => {
      const time = new Date(block.timestamp).toLocaleTimeString();
      const speaker = block.speakerId ? `[${block.speakerId}]` : '';
      const style = block.style === 'italic' ? '*' : block.style === 'gray' ? '//' : '';
      console.log(`[${time}] ${speaker} ${style}${block.text}${style}`);
    });
  });

  // Render ambient events
  console.log('\n🌿 Ambient Events:');
  ambientEvents.forEach(event => {
    const block = renderer.renderAmbientEvent(event);
    const time = new Date(block.timestamp).toLocaleTimeString();
    console.log(`[${time}] // ${block.text}`);
  });

  // Create formatted transcript
  const allBlocks: ChatRenderBlock[] = [];
  utterances.forEach(utterance => {
    allBlocks.push(...renderer.renderDualUtterance(utterance));
  });
  ambientEvents.forEach(event => {
    allBlocks.push(renderer.renderAmbientEvent(event));
  });

  console.log('\n📄 Formatted Transcript:');
  console.log(renderer.createFormattedTranscript(allBlocks));
}

/**
 * Example 2: Agent State Tracking
 */
async function agentStateTrackingExample() {
  console.log('\n🧠 Example 2: Agent State Tracking\n');

  // Create state tracker
  const stateTracker = new StateTracker({
    enabled: true,
    trackAgentStates: true,
    trackStyleContagion: true,
    trackMoodDiffusion: true,
    updateFrequency: 3000,
    stateRetention: 0.8,
    diffusionDecay: 0.7
  });

  // Initialize agent states
  stateTracker.initializeAgentState('Alice', 'Alice', {
    suspicion: 0.8,
    trust: 0.3,
    assertiveness: 0.7,
    empathy: 0.4
  });

  stateTracker.initializeAgentState('Bob', 'Bob', {
    suspicion: 0.4,
    trust: 0.6,
    assertiveness: 0.5,
    empathy: 0.7
  });

  stateTracker.initializeAgentState('Clara', 'Clara', {
    suspicion: 0.2,
    trust: 0.8,
    assertiveness: 0.3,
    empathy: 0.9
  });

  // Listen for state updates
  stateTracker.on('agent_state_updated', (event) => {
    console.log(`🔄 ${event.entityId} state updated:`);
    if (event.oldState && event.newState) {
      const oldTraits = event.oldState.traits;
      const newTraits = event.newState.traits;
      
      Object.keys(newTraits).forEach(trait => {
        if (Math.abs(oldTraits[trait] - newTraits[trait]) > 0.1) {
          console.log(`   ${trait}: ${oldTraits[trait].toFixed(2)} → ${newTraits[trait].toFixed(2)}`);
        }
      });
    }
  });

  stateTracker.on('style_contagion_applied', (data) => {
    console.log(`🎭 Style contagion: ${data.sourceAgentId} → ${data.targetAgentId}`);
    console.log(`   Style: ${JSON.stringify(data.styleContagion.styleVector.emotionalTone)}`);
    console.log(`   Intensity: ${data.styleContagion.intensity.toFixed(2)}`);
  });

  stateTracker.on('mood_diffusion_applied', (data) => {
    console.log(`😊 Mood diffusion: ${data.sourceAgentId} → ${data.targetAgentId}`);
    console.log(`   Mood: ${data.sourceMood}`);
  });

  // Start state tracking
  stateTracker.start();

  // Add thoughts to trigger state changes
  const thoughts: InnerThought[] = [
    {
      id: 'thought-1',
      speakerId: 'Alice',
      targetId: 'Bob',
      content: 'He\'s bluffing.',
      type: 'suspicion',
      intensity: 0.8,
      timestamp: Date.now(),
      behavioralImpact: {
        trustChange: -0.2,
        sarcasmChange: 0.1,
        suspicionChange: 0.3,
        engagementChange: 0.1,
        assertivenessChange: 0.1,
        curiosityChange: 0.1,
        patienceChange: -0.1,
        empathyChange: -0.1
      }
    },
    {
      id: 'thought-2',
      speakerId: 'Bob',
      targetId: 'Alice',
      content: 'I should be more careful around her.',
      type: 'judgment',
      intensity: 0.6,
      timestamp: Date.now() + 1000,
      behavioralImpact: {
        trustChange: -0.1,
        sarcasmChange: 0,
        suspicionChange: 0.2,
        engagementChange: 0.1,
        assertivenessChange: -0.1,
        curiosityChange: 0.1,
        patienceChange: 0.1,
        empathyChange: 0
      }
    },
    {
      id: 'thought-3',
      speakerId: 'Clara',
      targetId: 'Alice',
      content: 'Alice seems tense.',
      type: 'concern',
      intensity: 0.5,
      timestamp: Date.now() + 2000,
      behavioralImpact: {
        trustChange: 0,
        sarcasmChange: 0,
        suspicionChange: 0,
        engagementChange: 0.2,
        assertivenessChange: 0,
        curiosityChange: 0.1,
        patienceChange: 0.1,
        empathyChange: 0.2
      }
    }
  ];

  // Add thoughts to agents
  thoughts.forEach(thought => {
    stateTracker.addThoughtToAgent(thought.speakerId, thought);
  });

  // Let state tracking run
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Show final agent states
  console.log('\n📊 Final Agent States:');
  const agentStates = stateTracker.getAllAgentStates();
  agentStates.forEach((state, agentId) => {
    console.log(`\n${agentId}:`);
    console.log(`   Mood: ${state.mood}`);
    console.log(`   Trust: ${state.traits.trust.toFixed(2)}`);
    console.log(`   Suspicion: ${state.traits.suspicion.toFixed(2)}`);
    console.log(`   Assertiveness: ${state.traits.assertiveness.toFixed(2)}`);
    console.log(`   Empathy: ${state.traits.empathy.toFixed(2)}`);
    console.log(`   Thoughts: ${state.thoughtHistory.length}`);
  });

  // Show state tracker statistics
  console.log('\n📈 State Tracker Statistics:');
  console.log(stateTracker.getStats());

  // Stop state tracking
  stateTracker.stop();
}

/**
 * Example 3: Style Contagion and Mood Diffusion
 */
async function styleContagionExample() {
  console.log('\n🎭 Example 3: Style Contagion and Mood Diffusion\n');

  const stateTracker = new StateTracker({
    enabled: true,
    trackStyleContagion: true,
    trackMoodDiffusion: true,
    updateFrequency: 2000,
    styleContagionRange: 3,
    moodDiffusionRange: 2
  });

  // Initialize agents with different styles
  stateTracker.initializeAgentState('Emma', 'Emma', {
    suspicion: 0.9,
    assertiveness: 0.8,
    empathy: 0.2
  });

  stateTracker.initializeAgentState('Frank', 'Frank', {
    suspicion: 0.3,
    assertiveness: 0.4,
    empathy: 0.8
  });

  stateTracker.initializeAgentState('Grace', 'Grace', {
    suspicion: 0.1,
    assertiveness: 0.6,
    empathy: 0.9
  });

  // Set different style vectors
  const emmaStyle: StyleVector = {
    verbosity: 0.3,
    metaphorAffinity: 0.2,
    emotionalTone: 'suspicious',
    formality: 0.8,
    assertiveness: 0.9,
    curiosity: 0.4,
    patience: 0.2,
    empathy: 0.1,
    humor: 0.1,
    directness: 0.9,
    adaptability: 0.3
  };

  const frankStyle: StyleVector = {
    verbosity: 0.7,
    metaphorAffinity: 0.8,
    emotionalTone: 'warm',
    formality: 0.4,
    assertiveness: 0.5,
    curiosity: 0.8,
    patience: 0.8,
    empathy: 0.9,
    humor: 0.7,
    directness: 0.4,
    adaptability: 0.8
  };

  const graceStyle: StyleVector = {
    verbosity: 0.6,
    metaphorAffinity: 0.6,
    emotionalTone: 'neutral',
    formality: 0.6,
    assertiveness: 0.6,
    curiosity: 0.7,
    patience: 0.7,
    empathy: 0.8,
    humor: 0.5,
    directness: 0.6,
    adaptability: 0.7
  };

  // Update agent styles
  stateTracker.updateAgentState('Emma', { styleAdaptation: emmaStyle, mood: 'suspicious' });
  stateTracker.updateAgentState('Frank', { styleAdaptation: frankStyle, mood: 'warm' });
  stateTracker.updateAgentState('Grace', { styleAdaptation: graceStyle, mood: 'neutral' });

  // Listen for style contagion events
  stateTracker.on('style_contagion_applied', (data) => {
    console.log(`🎭 Style Contagion Event:`);
    console.log(`   From: ${data.sourceAgentId} (${data.styleContagion.styleVector.emotionalTone})`);
    console.log(`   To: ${data.targetAgentId}`);
    console.log(`   Intensity: ${data.styleContagion.intensity.toFixed(2)}`);
    console.log(`   Duration: ${data.styleContagion.duration}ms`);
  });

  stateTracker.on('mood_diffusion_applied', (data) => {
    console.log(`😊 Mood Diffusion Event:`);
    console.log(`   From: ${data.sourceAgentId}`);
    console.log(`   To: ${data.targetAgentId}`);
    console.log(`   Mood: ${data.sourceMood}`);
  });

  // Start state tracking
  stateTracker.start();

  // Simulate interactions that trigger style contagion
  const thoughts: InnerThought[] = [
    {
      id: 'thought-1',
      speakerId: 'Emma',
      content: 'Everyone is hiding something.',
      type: 'suspicion',
      intensity: 0.9,
      timestamp: Date.now(),
      behavioralImpact: {
        trustChange: -0.3,
        suspicionChange: 0.2,
        engagementChange: 0.1,
        assertivenessChange: 0.1,
        curiosityChange: 0,
        patienceChange: -0.2,
        sarcasmChange: 0.1,
        empathyChange: -0.1
      }
    },
    {
      id: 'thought-2',
      speakerId: 'Frank',
      content: 'I should try to make everyone feel comfortable.',
      type: 'empathy',
      intensity: 0.8,
      timestamp: Date.now() + 1000,
      behavioralImpact: {
        trustChange: 0.1,
        suspicionChange: -0.1,
        engagementChange: 0.2,
        assertivenessChange: -0.1,
        curiosityChange: 0.1,
        patienceChange: 0.2,
        sarcasmChange: -0.1,
        empathyChange: 0.2
      }
    },
    {
      id: 'thought-3',
      speakerId: 'Grace',
      content: 'I wonder what\'s really going on here.',
      type: 'curiosity',
      intensity: 0.7,
      timestamp: Date.now() + 2000,
      behavioralImpact: {
        trustChange: 0,
        suspicionChange: 0.1,
        engagementChange: 0.2,
        assertivenessChange: 0,
        curiosityChange: 0.2,
        patienceChange: 0.1,
        sarcasmChange: 0,
        empathyChange: 0.1
      }
    }
  ];

  // Add thoughts to trigger style contagion
  thoughts.forEach(thought => {
    stateTracker.addThoughtToAgent(thought.speakerId, thought);
  });

  // Let style contagion occur
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Show final states and style contagions
  console.log('\n📊 Final Agent States:');
  const agentStates = stateTracker.getAllAgentStates();
  agentStates.forEach((state, agentId) => {
    console.log(`\n${agentId}:`);
    console.log(`   Mood: ${state.mood}`);
    console.log(`   Emotional Tone: ${state.styleAdaptation?.emotionalTone}`);
    console.log(`   Verbosity: ${state.styleAdaptation?.verbosity?.toFixed(2)}`);
    console.log(`   Empathy: ${state.styleAdaptation?.empathy?.toFixed(2)}`);
    console.log(`   Assertiveness: ${state.styleAdaptation?.assertiveness?.toFixed(2)}`);
  });

  console.log('\n🎭 Active Style Contagions:');
  const activeContagions = stateTracker.getActiveStyleContagions();
  activeContagions.forEach(contagion => {
    console.log(`   ${contagion.sourceAgentId} → ${contagion.targetAgentId}`);
    console.log(`   Style: ${contagion.styleVector.emotionalTone}`);
    console.log(`   Intensity: ${contagion.intensity.toFixed(2)}`);
  });

  // Stop state tracking
  stateTracker.stop();
}

/**
 * Example 4: Complete Dialogue System Integration
 */
async function completeDialogueSystemExample() {
  console.log('\n🎭 Example 4: Complete Dialogue System Integration\n');

  // Create state tracker
  const stateTracker = new StateTracker({
    enabled: true,
    trackAgentStates: true,
    trackStyleContagion: true,
    trackMoodDiffusion: true
  });

  // Create dialogue renderer
  const renderer = new DialogueRenderer({
    showUnspoken: true,
    showAmbient: true,
    showInterjections: true,
    showCrossTalk: true,
    showThoughtDiffusion: true,
    showEnvironmentalMood: true,
    includeTimestamps: true,
    includeMetadata: true,
    styleUnspoken: 'italic',
    styleAmbient: 'gray',
    styleInterjections: 'bold',
    styleCrossTalk: 'highlight',
    styleThoughtDiffusion: 'italic',
    styleEnvironmentalMood: 'highlight'
  });

  // Initialize agents
  stateTracker.initializeAgentState('Alice', 'Alice', { suspicion: 0.8, trust: 0.3 });
  stateTracker.initializeAgentState('Bob', 'Bob', { suspicion: 0.4, trust: 0.6 });
  stateTracker.initializeAgentState('Clara', 'Clara', { suspicion: 0.2, trust: 0.8 });

  // Initialize environment
  stateTracker.initializeEnvironmentState('cafe', 'Coffee Shop');

  // Initialize thread
  stateTracker.initializeThreadState('conversation-1', 'Alice & Bob', ['Alice', 'Bob']);

  // Start state tracking
  stateTracker.start();

  // Create dual utterances with state tracking
  const utterances: DualUtterance[] = [
    {
      speakerId: 'Alice',
      spoken: 'I think we should be very careful about this deal.',
      unspoken: 'He\'s definitely hiding something.',
      timestamp: Date.now(),
      metadata: {
        thoughtType: 'suspicion',
        intensity: 0.9,
        emotionalState: 'suspicious'
      }
    },
    {
      speakerId: 'Bob',
      spoken: 'I understand your concerns, but I think it\'s a good opportunity.',
      unspoken: 'She\'s being overly cautious.',
      timestamp: Date.now() + 2000,
      metadata: {
        thoughtType: 'judgment',
        intensity: 0.6,
        emotionalState: 'frustrated'
      }
    },
    {
      speakerId: 'Alice',
      spoken: 'I need to see more details before I commit.',
      unspoken: 'I\'m not falling for his sales pitch.',
      timestamp: Date.now() + 4000,
      metadata: {
        thoughtType: 'suspicion',
        intensity: 0.8,
        emotionalState: 'defensive'
      }
    }
  ];

  // Create ambient events
  const ambientEvents: AmbientEvent[] = [
    {
      id: 'ambient-1',
      envId: 'cafe',
      text: 'The espresso machine hisses loudly.',
      source: 'system',
      timestamp: Date.now() + 1000,
      intensity: 0.6,
      type: 'environmental',
      affects: ['noise', 'mood']
    },
    {
      id: 'ambient-2',
      envId: 'cafe',
      text: 'A couple laughs softly at a nearby table.',
      source: 'randomGen',
      timestamp: Date.now() + 3000,
      intensity: 0.4,
      type: 'social',
      affects: ['mood', 'social']
    }
  ];

  // Create entanglement events
  const entanglementEvents: EntanglementEvent[] = [
    {
      id: 'entanglement-1',
      type: 'thought_diffusion',
      sourceThreadId: 'conversation-1',
      targetThreadId: 'conversation-2',
      environmentId: 'cafe',
      sourceAgentId: 'Alice',
      targetAgentId: 'Clara',
      content: 'I wonder what Alice is thinking. She seems suspicious.',
      intensity: 0.7,
      metadata: {
        originalThought: {
          id: 'thought-1',
          speakerId: 'Alice',
          content: 'He\'s definitely hiding something.',
          type: 'suspicion',
          intensity: 0.9,
          timestamp: Date.now()
        },
        diffusionPath: ['conversation-1', 'conversation-2']
      },
      timestamp: Date.now() + 2500
    }
  ];

  // Process all events
  console.log('🎭 Processing Dialogue Events:\n');

  // Process utterances and add thoughts
  utterances.forEach((utterance, index) => {
    console.log(`💬 ${utterance.speakerId}: "${utterance.spoken}"`);
    if (utterance.unspoken) {
      console.log(`   *${utterance.unspoken}*`);
    }

    // Add thought to state tracker
    if (utterance.unspoken) {
      const thought: InnerThought = {
        id: `thought-${index}`,
        speakerId: utterance.speakerId,
        content: utterance.unspoken,
        type: utterance.metadata?.thoughtType as any || 'observation',
        intensity: utterance.metadata?.intensity || 0.5,
        timestamp: utterance.timestamp,
        behavioralImpact: {
          trustChange: utterance.metadata?.thoughtType === 'suspicion' ? -0.2 : 0,
          suspicionChange: utterance.metadata?.thoughtType === 'suspicion' ? 0.2 : 0,
          engagementChange: 0.1,
          assertivenessChange: 0,
          curiosityChange: 0,
          patienceChange: 0,
          sarcasmChange: 0,
          empathyChange: 0
        }
      };
      stateTracker.addThoughtToAgent(utterance.speakerId, thought);
    }
  });

  // Process ambient events
  ambientEvents.forEach(event => {
    console.log(`🌿 Ambient: ${event.text}`);
  });

  // Process entanglement events
  entanglementEvents.forEach(event => {
    console.log(`🔗 Entanglement: ${event.content}`);
  });

  // Let the system process
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Render final conversation
  console.log('\n📝 Final Rendered Conversation:');
  const allBlocks: ChatRenderBlock[] = [];

  // Render utterances
  utterances.forEach(utterance => {
    allBlocks.push(...renderer.renderDualUtterance(utterance));
  });

  // Render ambient events
  ambientEvents.forEach(event => {
    allBlocks.push(renderer.renderAmbientEvent(event));
  });

  // Render entanglement events
  entanglementEvents.forEach(event => {
    if (event.type === 'thought_diffusion') {
      allBlocks.push(renderer.renderThoughtDiffusion(event));
    }
  });

  // Sort by timestamp
  allBlocks.sort((a, b) => a.timestamp - b.timestamp);

  // Display formatted conversation
  console.log(renderer.createFormattedTranscript(allBlocks));

  // Show final states
  console.log('\n📊 Final System State:');
  console.log('Agent States:', stateTracker.getAllAgentStates().size);
  console.log('Environment States:', stateTracker.getAllEnvironmentStates().size);
  console.log('Thread States:', stateTracker.getAllThreadStates().size);
  console.log('Active Style Contagions:', stateTracker.getActiveStyleContagions().length);

  // Stop state tracking
  stateTracker.stop();
}

/**
 * Run all dialogue types examples
 */
async function runAllDialogueTypesExamples() {
  try {
    console.log('💬 TypeScript Schema: Dual-Layered Dialogue Examples\n');

    // Example 1: Basic dual-layered dialogue
    await basicDualLayeredDialogueExample();

    // Example 2: Agent state tracking
    await agentStateTrackingExample();

    // Example 3: Style contagion and mood diffusion
    await styleContagionExample();

    // Example 4: Complete dialogue system integration
    await completeDialogueSystemExample();

    console.log('\n✅ All dialogue types examples completed successfully!');
  } catch (error) {
    console.error('❌ Dialogue types example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllDialogueTypesExamples();
}

export {
  basicDualLayeredDialogueExample,
  agentStateTrackingExample,
  styleContagionExample,
  completeDialogueSystemExample,
  runAllDialogueTypesExamples
}; 