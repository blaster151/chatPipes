import { MultiAgentDialogue, MultiAgentConfig } from '../src/conversation/MultiAgentDialogue';
import { BrowserAgentSession } from '../src/core/BrowserAgentSession';
import { PersonaConfig, PlatformConfig } from '../src/core/AgentSession';
import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';

async function threeWayCommunicationExample() {
  console.log('🔺 3-Way Communication Example');
  console.log('==============================\n');

  // Create personas for the three agents
  const philosopherPersona: PersonaConfig = {
    name: 'Philosopher',
    description: 'A deep-thinking philosopher who explores abstract concepts',
    instructions: 'Engage in thoughtful philosophical discussions. Ask probing questions and explore ideas deeply.',
    temperature: 0.8
  };

  const scientistPersona: PersonaConfig = {
    name: 'Scientist',
    description: 'A practical scientist who focuses on empirical evidence',
    instructions: 'Provide scientific perspectives and evidence-based analysis. Challenge assumptions with data.',
    temperature: 0.6
  };

  const ethicistPersona: PersonaConfig = {
    name: 'Ethicist',
    description: 'An ethical philosopher who considers moral implications',
    instructions: 'Focus on ethical considerations and moral implications of topics. Consider rights, responsibilities, and consequences.',
    temperature: 0.7
  };

  // Create agent sessions
  const agentA = new BrowserAgentSession('chatgpt', philosopherPersona, {
    chatgpt: { model: 'gpt-4' }
  }, { useBrowser: false });

  const agentB = new BrowserAgentSession('claude', scientistPersona, {
    claude: { model: 'claude-3-sonnet' }
  }, { useBrowser: false });

  const agentC = new BrowserAgentSession('perplexity', ethicistPersona, {
    perplexity: { searchType: 'detailed', focus: 'academic' }
  }, { useBrowser: false });

  // Set up memory managers
  const storeA = new FileStore();
  const memoryA = new MemoryManager(storeA, 'philosopher');
  await memoryA.init();
  agentA.setMemoryManager(memoryA);

  const storeB = new FileStore();
  const memoryB = new MemoryManager(storeB, 'scientist');
  await memoryB.init();
  agentB.setMemoryManager(memoryB);

  const storeC = new FileStore();
  const memoryC = new MemoryManager(storeC, 'ethicist');
  await memoryC.init();
  agentC.setMemoryManager(memoryC);

  // Initialize agents
  await agentA.init();
  await agentB.init();
  await agentC.init();

  // Configure multi-agent dialogue
  const config: MultiAgentConfig = {
    maxRounds: 4, // 4 rounds = 12 turns total (3 agents × 4 rounds)
    turnDelay: 1500,
    enableStreaming: true,
    contextWindow: 3, // Include last 3 messages in context
    synthesisStrategy: 'recent', // Use recent context synthesis
    skipInactiveAgents: true,
    allowInterruptions: false
  };

  // Create multi-agent dialogue
  const dialogue = new MultiAgentDialogue([
    { id: 'philosopher', name: 'Philosopher', session: agentA },
    { id: 'scientist', name: 'Scientist', session: agentB },
    { id: 'ethicist', name: 'Ethicist', session: agentC }
  ], config);

  // Set up event listeners for real-time monitoring
  dialogue.on('turn_start', (event) => {
    console.log(`\n🎯 Round ${event.round}, Turn ${event.turn}: ${event.agentName} starts`);
  });

  dialogue.on('context_synthesized', (event) => {
    console.log(`\n🧠 Context for ${event.agentName}:`);
    console.log(event.context);
  });

  dialogue.on('streaming_start', (event) => {
    console.log(`\n💭 ${event.agentName} is thinking...`);
  });

  dialogue.on('streaming_chunk', (event) => {
    process.stdout.write(event.chunk);
  });

  dialogue.on('streaming_end', (event) => {
    console.log('\n');
  });

  dialogue.on('turn_end', (event) => {
    console.log(`✅ ${event.agentName} completed turn ${event.turn}`);
  });

  dialogue.on('agent_status_changed', (event) => {
    console.log(`\n🔄 ${event.agentName} status: ${event.isActive ? 'Active' : 'Inactive'}`);
  });

  console.log('🚀 Starting 3-way philosophical discussion...\n');
  console.log('Topic: The ethics of artificial intelligence development\n');

  // Start the dialogue loop
  await dialogue.runLoopUntilStopped();

  // Display final results
  console.log('\n📊 3-Way Discussion Summary:');
  console.log('============================');
  
  const history = dialogue.getHistory();
  history.forEach((entry, index) => {
    console.log(`\n${index + 1}. Round ${entry.round}, Turn ${entry.turn}: ${entry.agentName}`);
    console.log(`   ${entry.message.substring(0, 200)}...`);
    console.log(`   Time: ${entry.timestamp.toLocaleTimeString()}`);
  });

  // Save dialogue state
  const state = dialogue.exportState();
  const fs = require('fs').promises;
  await fs.writeFile('examples/three-way-discussion.json', JSON.stringify(state, null, 2));
  console.log('\n💾 Dialogue state saved to: examples/three-way-discussion.json');

  await dialogue.close();
  console.log('\n✅ 3-way discussion completed!');
}

// Example 2: N-Way Communication with Different Context Strategies
async function nWayCommunicationExample() {
  console.log('\n🔷 N-Way Communication Example');
  console.log('==============================\n');

  // Create multiple agents with different perspectives
  const agents = [
    {
      id: 'optimist',
      name: 'Optimist',
      persona: {
        name: 'Optimist',
        description: 'An optimistic AI researcher',
        instructions: 'Focus on the positive potential and benefits of AI development.',
        temperature: 0.8
      },
      target: 'chatgpt' as const,
      platformConfig: { chatgpt: { model: 'gpt-4' } }
    },
    {
      id: 'skeptic',
      name: 'Skeptic',
      persona: {
        name: 'Skeptic',
        description: 'A cautious AI researcher',
        instructions: 'Raise concerns and potential risks about AI development.',
        temperature: 0.6
      },
      target: 'claude' as const,
      platformConfig: { claude: { model: 'claude-3-sonnet' } }
    },
    {
      id: 'pragmatist',
      name: 'Pragmatist',
      persona: {
        name: 'Pragmatist',
        description: 'A practical AI researcher',
        instructions: 'Focus on practical implementation and real-world applications.',
        temperature: 0.5
      },
      target: 'perplexity' as const,
      platformConfig: { perplexity: { searchType: 'concise', focus: 'web' } }
    },
    {
      id: 'regulator',
      name: 'Regulator',
      persona: {
        name: 'Regulator',
        description: 'A policy and regulation expert',
        instructions: 'Consider legal, regulatory, and policy implications.',
        temperature: 0.4
      },
      target: 'deepseek' as const,
      platformConfig: { deepseek: { model: 'deepseek-chat' } }
    }
  ];

  // Create agent sessions
  const agentSessions = await Promise.all(agents.map(async (agentConfig) => {
    const session = new BrowserAgentSession(
      agentConfig.target,
      agentConfig.persona,
      agentConfig.platformConfig,
      { useBrowser: false }
    );

    // Set up memory manager
    const store = new FileStore();
    const memory = new MemoryManager(store, agentConfig.id);
    await memory.init();
    session.setMemoryManager(memory);
    await session.init();

    return {
      id: agentConfig.id,
      name: agentConfig.name,
      session
    };
  }));

  // Test different context synthesis strategies
  const strategies: Array<{ name: string; config: MultiAgentConfig }> = [
    {
      name: 'Recent Context',
      config: {
        maxRounds: 2,
        turnDelay: 1000,
        contextWindow: 3,
        synthesisStrategy: 'recent',
        enableStreaming: true
      }
    },
    {
      name: 'All Context',
      config: {
        maxRounds: 2,
        turnDelay: 1000,
        contextWindow: 10,
        synthesisStrategy: 'all',
        enableStreaming: true
      }
    },
    {
      name: 'Weighted Context',
      config: {
        maxRounds: 2,
        turnDelay: 1000,
        contextWindow: 5,
        synthesisStrategy: 'weighted',
        enableStreaming: true
      }
    }
  ];

  for (const strategy of strategies) {
    console.log(`\n🧠 Testing ${strategy.name} Strategy`);
    console.log('='.repeat(40));

    const dialogue = new MultiAgentDialogue(agentSessions, strategy.config);

    // Set up minimal event listeners
    dialogue.on('turn_start', (event) => {
      console.log(`\n🎯 ${event.agentName} starts turn ${event.turn}`);
    });

    dialogue.on('context_synthesized', (event) => {
      console.log(`\n📝 Context: ${event.context?.substring(0, 100)}...`);
    });

    dialogue.on('turn_end', (event) => {
      console.log(`✅ ${event.agentName} completed turn`);
    });

    await dialogue.runLoopUntilStopped();

    // Show summary
    const history = dialogue.getHistory();
    console.log(`\n📊 ${strategy.name} Results:`);
    history.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.agentName}: ${entry.message.substring(0, 80)}...`);
    });

    await dialogue.close();
  }

  console.log('\n✅ N-way communication examples completed!');
}

// Example 3: Interactive Multi-Agent Control
async function interactiveMultiAgentExample() {
  console.log('\n🎮 Interactive Multi-Agent Control');
  console.log('==================================\n');

  // Create a simple 3-agent setup
  const agentA = new BrowserAgentSession('chatgpt', {
    name: 'Alice',
    description: 'A creative thinker',
    instructions: 'Be creative and imaginative in responses.',
    temperature: 0.8
  }, {}, { useBrowser: false });

  const agentB = new BrowserAgentSession('claude', {
    name: 'Bob',
    description: 'A logical thinker',
    instructions: 'Be logical and analytical in responses.',
    temperature: 0.5
  }, {}, { useBrowser: false });

  const agentC = new BrowserAgentSession('perplexity', {
    name: 'Charlie',
    description: 'A practical thinker',
    instructions: 'Be practical and solution-oriented in responses.',
    temperature: 0.6
  }, {}, { useBrowser: false });

  await agentA.init();
  await agentB.init();
  await agentC.init();

  const dialogue = new MultiAgentDialogue([
    { id: 'alice', name: 'Alice', session: agentA },
    { id: 'bob', name: 'Bob', session: agentB },
    { id: 'charlie', name: 'Charlie', session: agentC }
  ], {
    maxRounds: 10,
    turnDelay: 500,
    enableStreaming: true,
    contextWindow: 2
  });

  // Set up event listeners
  dialogue.on('turn_start', (event) => {
    console.log(`\n🎯 ${event.agentName} starts turn ${event.turn}`);
  });

  dialogue.on('streaming_chunk', (event) => {
    process.stdout.write(event.chunk);
  });

  dialogue.on('turn_end', (event) => {
    console.log('\n');
  });

  // Interactive control
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🎮 Interactive Multi-Agent Controls:');
  console.log('- Type "next" to continue one turn');
  console.log('- Type "auto" to run automatically');
  console.log('- Type "pause" to pause');
  console.log('- Type "resume" to resume');
  console.log('- Type "activate <agent>" to activate agent');
  console.log('- Type "deactivate <agent>" to deactivate agent');
  console.log('- Type "status" to show agent status');
  console.log('- Type "quit" to exit');

  const askCommand = () => {
    rl.question('\n> ', async (input: string) => {
      const parts = input.split(' ');
      const command = parts[0].toLowerCase();

      switch (command) {
        case 'next':
          try {
            await dialogue.nextTurn();
          } catch (error) {
            console.log('Error:', error instanceof Error ? error.message : String(error));
          }
          break;

        case 'auto':
          console.log('🔄 Running automatically...');
          dialogue.runLoopUntilStopped().catch(console.error);
          break;

        case 'pause':
          dialogue.pause();
          break;

        case 'resume':
          dialogue.resume();
          break;

        case 'activate':
          if (parts.length >= 2) {
            const agentId = parts[1].toLowerCase();
            dialogue.setAgentActive(agentId, true);
          }
          break;

        case 'deactivate':
          if (parts.length >= 2) {
            const agentId = parts[1].toLowerCase();
            dialogue.setAgentActive(agentId, false);
          }
          break;

        case 'status':
          const state = dialogue.getState();
          console.log('\n📊 Current Status:');
          console.log(`Round: ${state.round}, Turn: ${state.turn}`);
          console.log(`Running: ${state.isRunning}, Paused: ${state.isPaused}`);
          console.log('Agents:');
          state.agents.forEach(agent => {
            console.log(`  ${agent.name} (${agent.id}): ${agent.isActive ? 'Active' : 'Inactive'}`);
          });
          break;

        case 'quit':
          await dialogue.close();
          rl.close();
          return;

        default:
          console.log('Unknown command. Try: next, auto, pause, resume, activate, deactivate, status, quit');
      }

      askCommand();
    });
  };

  askCommand();
}

// Run examples
threeWayCommunicationExample()
  .then(() => nWayCommunicationExample())
  .then(() => interactiveMultiAgentExample())
  .catch(console.error); 