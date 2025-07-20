import { DialoguePipe, Interjection, DialogueConfig } from '../src/conversation/DialoguePipe';
import { BrowserAgentSession } from '../src/core/BrowserAgentSession';
import { PersonaConfig, PlatformConfig } from '../src/core/AgentSession';
import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';

async function dialoguePipeExample() {
  console.log('🔄 DialoguePipe Back-and-Forth Example');
  console.log('=====================================\n');

  // Create personas for the dialogue
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

  // Create agent sessions
  const agentA = new BrowserAgentSession('chatgpt', philosopherPersona, {
    chatgpt: { model: 'gpt-4' }
  }, { useBrowser: false });

  const agentB = new BrowserAgentSession('claude', scientistPersona, {
    claude: { model: 'claude-3-sonnet' }
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

  // Initialize agents
  await agentA.init();
  await agentB.init();

  // Configure dialogue
  const dialogueConfig: DialogueConfig = {
    maxRounds: 6,
    turnDelay: 1500,
    enableStreaming: true,
    interjectionPattern: /Side question – (.+)/i
  };

  // Create dialogue pipe
  const dialogue = new DialoguePipe(agentA, agentB, dialogueConfig);

  // Set up event listeners for real-time streaming
  dialogue.on('turn_start', (event) => {
    console.log(`\n🎯 Round ${event.round}: ${event.agent === 'A' ? 'Philosopher' : 'Scientist'} starts turn`);
  });

  dialogue.on('streaming_start', (event) => {
    console.log(`\n💭 ${event.agent === 'A' ? 'Philosopher' : 'Scientist'} is thinking...`);
  });

  dialogue.on('streaming_chunk', (event) => {
    process.stdout.write(event.chunk);
  });

  dialogue.on('streaming_end', (event) => {
    console.log('\n');
  });

  dialogue.on('turn_end', (event) => {
    console.log(`✅ ${event.agent === 'A' ? 'Philosopher' : 'Scientist'} completed turn ${event.round}`);
  });

  dialogue.on('interjection_added', (event) => {
    console.log(`\n🎭 Interjection added: ${event.interjection?.text}`);
  });

  dialogue.on('dialogue_paused', () => {
    console.log('\n⏸️  Dialogue paused');
  });

  dialogue.on('dialogue_resumed', () => {
    console.log('\n▶️  Dialogue resumed');
  });

  // Set who starts (Philosopher starts)
  dialogue.setWhoStarts('A');

  console.log('🚀 Starting philosophical dialogue...\n');

  // Start the dialogue loop
  const dialoguePromise = dialogue.runLoopUntilStopped();

  // Simulate interjections during the dialogue
  setTimeout(() => {
    const interjection1: Interjection = {
      id: '1',
      type: 'side_question',
      text: 'How does this relate to consciousness?',
      target: 'A',
      priority: 'medium',
      timestamp: new Date()
    };
    dialogue.addInterjection(interjection1);
  }, 3000);

  setTimeout(() => {
    const interjection2: Interjection = {
      id: '2',
      type: 'direction',
      text: 'Focus more on practical applications',
      target: 'B',
      priority: 'high',
      timestamp: new Date()
    };
    dialogue.addInterjection(interjection2);
  }, 8000);

  // Simulate pause and resume
  setTimeout(() => {
    dialogue.pause();
    console.log('\n⏸️  Pausing for 3 seconds...');
    
    setTimeout(() => {
      dialogue.resume();
    }, 3000);
  }, 12000);

  // Wait for dialogue to complete
  await dialoguePromise;

  // Display final results
  console.log('\n📊 Dialogue Summary:');
  console.log('===================');
  
  const history = dialogue.getConversationHistory();
  history.forEach((entry, index) => {
    const agentName = entry.agent === 'A' ? 'Philosopher' : 'Scientist';
    const hasInterjection = entry.interjection ? ' (with interjection)' : '';
    console.log(`${index + 1}. ${agentName}${hasInterjection}:`);
    console.log(`   ${entry.message.substring(0, 150)}...`);
    console.log(`   Round: ${entry.round}, Time: ${entry.timestamp.toLocaleTimeString()}`);
    console.log('');
  });

  // Save dialogue state
  const state = dialogue.exportState();
  const fs = require('fs').promises;
  await fs.writeFile('examples/philosophical-dialogue.json', JSON.stringify(state, null, 2));
  console.log('💾 Dialogue state saved to: examples/philosophical-dialogue.json');

  await dialogue.close();
  console.log('\n✅ Dialogue completed!');
}

// Example 2: Interactive Dialogue with User Control
async function interactiveDialogueExample() {
  console.log('\n🎮 Interactive Dialogue Example');
  console.log('==============================\n');

  const debater1Persona: PersonaConfig = {
    name: 'Optimist',
    description: 'An optimistic debater',
    instructions: 'Argue for the positive side of any topic.',
    temperature: 0.7
  };

  const debater2Persona: PersonaConfig = {
    name: 'Skeptic',
    description: 'A skeptical debater',
    instructions: 'Argue against claims and raise concerns.',
    temperature: 0.7
  };

  const agentA = new BrowserAgentSession('chatgpt', debater1Persona, {}, { useBrowser: false });
  const agentB = new BrowserAgentSession('claude', debater2Persona, {}, { useBrowser: false });

  await agentA.init();
  await agentB.init();

  const dialogue = new DialoguePipe(agentA, agentB, {
    maxRounds: 10,
    turnDelay: 1000,
    enableStreaming: true
  });

  // Set up event listeners
  dialogue.on('turn_start', (event) => {
    console.log(`\n🎯 ${event.agent === 'A' ? 'Optimist' : 'Skeptic'} starts turn ${event.round}`);
  });

  dialogue.on('streaming_chunk', (event) => {
    process.stdout.write(event.chunk);
  });

  dialogue.on('turn_end', (event) => {
    console.log('\n');
  });

  // Start with one turn
  console.log('🎭 Starting debate on AI safety...\n');
  await dialogue.runOnce();

  // Interactive control
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🎮 Interactive Controls:');
  console.log('- Type "next" to continue one turn');
  console.log('- Type "auto" to run automatically');
  console.log('- Type "pause" to pause');
  console.log('- Type "resume" to resume');
  console.log('- Type "interject <text>" to add interjection');
  console.log('- Type "quit" to exit');

  const askCommand = () => {
    rl.question('\n> ', async (input: string) => {
      const parts = input.split(' ');
      const command = parts[0].toLowerCase();

      switch (command) {
        case 'next':
          try {
            await dialogue.runOnce();
          } catch (error) {
            console.log('Error:', error);
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

        case 'interject':
          if (parts.length >= 2) {
            const text = parts.slice(1).join(' ');
            const interjection: Interjection = {
              id: Date.now().toString(),
              type: 'side_question',
              text,
              priority: 'medium',
              timestamp: new Date()
            };
            dialogue.addInterjection(interjection);
          }
          break;

        case 'quit':
          await dialogue.close();
          rl.close();
          return;

        default:
          console.log('Unknown command. Try: next, auto, pause, resume, interject, quit');
      }

      askCommand();
    });
  };

  askCommand();
}

// Run examples
dialoguePipeExample()
  .then(() => interactiveDialogueExample())
  .catch(console.error); 