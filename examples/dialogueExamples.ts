import { 
  DialoguePipe, 
  MultiAgentDialogue,
  BrowserAgentSession,
  PersonaConfig,
  PlatformConfig,
  BrowserAgentConfig,
  Interjection,
  Spectator
} from '@chatpipes/ai-conductor';
import { PlaywrightSession } from '@chatpipes/headless-bridges';

// Example 1: Basic DialoguePipe between two agents
async function basicDialoguePipeExample() {
  console.log('🤖 Starting Basic DialoguePipe Example...');

  // Create personas
  const philosopher: PersonaConfig = {
    name: 'Philosopher',
    description: 'A deep-thinking philosopher',
    instructions: 'You are a philosopher who thinks deeply about ethical and moral questions. Always provide thoughtful, nuanced responses.',
    introPrompt: 'You are Socrates, engaging in philosophical dialogue.',
    behaviorStyle: 'contemplative and questioning',
    temperature: 0.8
  };

  const scientist: PersonaConfig = {
    name: 'Scientist',
    description: 'A practical scientist',
    instructions: 'You are a scientist who values evidence and practical solutions. Always base your responses on facts and logic.',
    introPrompt: 'You are a research scientist focused on empirical evidence.',
    behaviorStyle: 'analytical and evidence-based',
    temperature: 0.6
  };

  // Create browser sessions (mock for this example)
  const agentA = new BrowserAgentSession('chatgpt', philosopher, {}, {
    useBrowser: false // Disable browser for demo
  });
  const agentB = new BrowserAgentSession('claude', scientist, {}, {
    useBrowser: false // Disable browser for demo
  });

  // Create DialoguePipe
  const dialogue = new DialoguePipe(agentA, agentB, {
    maxRounds: 5,
    turnDelay: 2000,
    enableStreaming: true,
    interjectionPattern: /Side question – (.+)/
  });

  // Set who starts
  dialogue.setWhoStarts('A');

  // Add spectators
  const cliSpectator: Spectator = {
    id: 'cli-1',
    type: 'cli',
    name: 'CLI Observer',
    onTurnEvent: (event) => {
      console.log(`\n🔄 Turn ${event.round}: ${event.agentName}`);
      if (event.message) {
        console.log(`💬 ${event.agentName}: ${event.message}`);
      }
    },
    onDialogueEvent: (event) => {
      console.log(`📢 Dialogue Event: ${event.type}`);
    },
    onError: (error) => {
      console.error(`❌ Error: ${error.message}`);
    }
  };

  dialogue.addSpectator(cliSpectator);

  // Add an interjection
  const interjection: Interjection = {
    id: 'int-1',
    type: 'side_question',
    text: 'How does this relate to modern technology?',
    target: 'both',
    priority: 'medium',
    timestamp: new Date(),
    promptModification: (original) => `${original}\n\nSide question – How does this relate to modern technology?`
  };

  dialogue.addInterjection(interjection);

  // Run the dialogue
  try {
    await dialogue.runLoopUntilStopped();
  } catch (error) {
    console.error('Dialogue error:', error);
  }
}

// Example 2: MultiAgentDialogue with 3 agents
async function multiAgentDialogueExample() {
  console.log('🔷 Starting MultiAgentDialogue Example...');

  // Create personas for 3 agents
  const ethicist: PersonaConfig = {
    name: 'Ethicist',
    description: 'An AI ethics expert',
    instructions: 'You are an expert in AI ethics. Focus on moral implications and ethical considerations.',
    introPrompt: 'You are an AI ethics researcher concerned with responsible AI development.',
    behaviorStyle: 'morally conscious and principled',
    temperature: 0.7
  };

  const technologist: PersonaConfig = {
    name: 'Technologist',
    description: 'A technology innovator',
    instructions: 'You are a technology innovator. Focus on practical implementation and technical feasibility.',
    introPrompt: 'You are a tech entrepreneur focused on AI innovation.',
    behaviorStyle: 'innovative and practical',
    temperature: 0.8
  };

  const policymaker: PersonaConfig = {
    name: 'Policymaker',
    description: 'A government policy expert',
    instructions: 'You are a policy expert. Focus on regulatory frameworks and governance structures.',
    introPrompt: 'You are a government official responsible for AI policy.',
    behaviorStyle: 'pragmatic and regulatory-minded',
    temperature: 0.6
  };

  // Create agent sessions
  const agent1 = new BrowserAgentSession('chatgpt', ethicist, {}, { useBrowser: false });
  const agent2 = new BrowserAgentSession('claude', technologist, {}, { useBrowser: false });
  const agent3 = new BrowserAgentSession('perplexity', policymaker, {}, { useBrowser: false });

  // Create MultiAgentDialogue
  const multiDialogue = new MultiAgentDialogue([agent1, agent2, agent3], {
    maxRounds: 6, // 2 rounds per agent
    turnDelay: 1500,
    enableStreaming: true,
    contextWindow: 2,
    synthesisStrategy: 'recent',
    skipInactiveAgents: false,
    allowInterruptions: true
  });

  // Add spectators
  const uiSpectator: Spectator = {
    id: 'ui-1',
    type: 'ui',
    name: 'UI Observer',
    onTurnEvent: (event) => {
      console.log(`\n🎯 Round ${event.round}: ${event.agentName}`);
      if (event.message) {
        console.log(`💭 ${event.agentName}: ${event.message.substring(0, 100)}...`);
      }
    },
    onDialogueEvent: (event) => {
      console.log(`📡 Multi-Agent Event: ${event.type}`);
    },
    onError: (error) => {
      console.error(`🚨 Error: ${error.message}`);
    }
  };

  multiDialogue.addSpectator(uiSpectator);

  // Add interjection for the technologist
  const techInterjection: Interjection = {
    id: 'int-2',
    type: 'direction',
    text: 'Focus on practical implementation challenges',
    target: agent2.id,
    priority: 'high',
    timestamp: new Date(),
    promptModification: (original) => `${original}\n\nDirection: Focus on practical implementation challenges and technical feasibility.`
  };

  multiDialogue.addInterjection(techInterjection);

  // Run the multi-agent dialogue
  try {
    await multiDialogue.runLoopUntilStopped();
  } catch (error) {
    console.error('Multi-agent dialogue error:', error);
  }
}

// Example 3: Interactive DialoguePipe with user control
async function interactiveDialogueExample() {
  console.log('🎮 Starting Interactive Dialogue Example...');

  const debater: PersonaConfig = {
    name: 'Debater',
    description: 'A skilled debater',
    instructions: 'You are a skilled debater. Present arguments clearly and respond to counterpoints.',
    introPrompt: 'You are a debate champion with excellent argumentation skills.',
    behaviorStyle: 'persuasive and logical',
    temperature: 0.7
  };

  const critic: PersonaConfig = {
    name: 'Critic',
    description: 'A critical thinker',
    instructions: 'You are a critical thinker. Analyze arguments carefully and point out weaknesses.',
    introPrompt: 'You are a critical analyst who examines arguments thoroughly.',
    behaviorStyle: 'analytical and skeptical',
    temperature: 0.6
  };

  const agentA = new BrowserAgentSession('chatgpt', debater, {}, { useBrowser: false });
  const agentB = new BrowserAgentSession('claude', critic, {}, { useBrowser: false });

  const dialogue = new DialoguePipe(agentA, agentB, {
    maxRounds: 10,
    turnDelay: 1000,
    enableStreaming: true
  });

  dialogue.setWhoStarts('A');

  // Interactive spectator
  const interactiveSpectator: Spectator = {
    id: 'interactive-1',
    type: 'cli',
    name: 'Interactive Observer',
    onTurnEvent: (event) => {
      console.log(`\n🎭 ${event.agentName}: ${event.message || 'Thinking...'}`);
      
      // Simulate user interaction
      if (event.type === 'turn_end' && Math.random() > 0.7) {
        const interjection: Interjection = {
          id: `user-${Date.now()}`,
          type: 'side_question',
          text: 'Can you elaborate on that point?',
          target: 'both',
          priority: 'medium',
          timestamp: new Date()
        };
        
        setTimeout(() => {
          dialogue.addInterjection(interjection);
          console.log('💡 User interjection added!');
        }, 500);
      }
    },
    onDialogueEvent: (event) => {
      console.log(`🎪 Interactive Event: ${event.type}`);
    },
    onError: (error) => {
      console.error(`💥 Interactive Error: ${error.message}`);
    }
  };

  dialogue.addSpectator(interactiveSpectator);

  // Run with user control simulation
  try {
    // Run a few turns
    for (let i = 0; i < 3; i++) {
      await dialogue.runOnce();
      
      // Simulate user pause/resume
      if (i === 1) {
        console.log('\n⏸️  User pauses dialogue...');
        dialogue.pause();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('▶️  User resumes dialogue...');
        dialogue.resume();
      }
    }
  } catch (error) {
    console.error('Interactive dialogue error:', error);
  }
}

// Example 4: Round-robin with different synthesis strategies
async function synthesisStrategyExample() {
  console.log('🧠 Starting Synthesis Strategy Example...');

  const strategist: PersonaConfig = {
    name: 'Strategist',
    description: 'A strategic thinker',
    instructions: 'You are a strategic thinker. Consider long-term implications and multiple perspectives.',
    introPrompt: 'You are a strategic consultant focused on long-term planning.',
    behaviorStyle: 'strategic and forward-thinking',
    temperature: 0.7
  };

  const analyst: PersonaConfig = {
    name: 'Analyst',
    description: 'A data analyst',
    instructions: 'You are a data analyst. Focus on facts, numbers, and evidence-based conclusions.',
    introPrompt: 'You are a data scientist who relies on empirical evidence.',
    behaviorStyle: 'analytical and data-driven',
    temperature: 0.5
  };

  const innovator: PersonaConfig = {
    name: 'Innovator',
    description: 'A creative innovator',
    instructions: 'You are a creative innovator. Think outside the box and propose novel solutions.',
    introPrompt: 'You are a creative entrepreneur focused on innovation.',
    behaviorStyle: 'creative and innovative',
    temperature: 0.9
  };

  const agent1 = new BrowserAgentSession('chatgpt', strategist, {}, { useBrowser: false });
  const agent2 = new BrowserAgentSession('claude', analyst, {}, { useBrowser: false });
  const agent3 = new BrowserAgentSession('perplexity', innovator, {}, { useBrowser: false });

  // Test different synthesis strategies
  const strategies: Array<'all' | 'recent' | 'weighted'> = ['recent', 'all', 'weighted'];
  
  for (const strategy of strategies) {
    console.log(`\n🔧 Testing ${strategy} synthesis strategy...`);
    
    const multiDialogue = new MultiAgentDialogue([agent1, agent2, agent3], {
      maxRounds: 3,
      turnDelay: 1000,
      synthesisStrategy: strategy,
      contextWindow: 2
    });

    const strategySpectator: Spectator = {
      id: `strategy-${strategy}`,
      type: 'cli',
      name: `${strategy} Strategy Observer`,
      onTurnEvent: (event) => {
        console.log(`📊 [${strategy}] ${event.agentName}: ${event.message?.substring(0, 80)}...`);
      },
      onDialogueEvent: (event) => {
        // Silent for cleaner output
      },
      onError: (error) => {
        console.error(`❌ [${strategy}] Error: ${error.message}`);
      }
    };

    multiDialogue.addSpectator(strategySpectator);

    try {
      await multiDialogue.runLoopUntilStopped();
    } catch (error) {
      console.error(`Strategy ${strategy} error:`, error);
    }
  }
}

// Main function to run all examples
async function runAllExamples() {
  console.log('🚀 ChatPipes Dialogue Examples\n');
  
  try {
    await basicDialoguePipeExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await multiAgentDialogueExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await interactiveDialogueExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await synthesisStrategyExample();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export for use in other files
export {
  basicDialoguePipeExample,
  multiAgentDialogueExample,
  interactiveDialogueExample,
  synthesisStrategyExample,
  runAllExamples
};

// Run if this file is executed directly
if (require.main === module) {
  runAllExamples();
} 