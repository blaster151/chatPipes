import { AgentSession, PersonaConfig } from '../src/core/AgentSession';
import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';

async function main() {
  // Create storage and memory manager
  const store = new FileStore();
  const memoryManager = new MemoryManager(store, 'alice-bot');
  await memoryManager.init();

  // Define persona configuration
  const alicePersona: PersonaConfig = {
    name: 'Alice',
    description: 'A friendly and knowledgeable AI assistant who loves to help people learn new things.',
    instructions: 'Always be helpful, patient, and encouraging. Share your knowledge in an accessible way.',
    temperature: 0.7,
    maxTokens: 1000
  };

  // Create agent session
  const session = new AgentSession('chatgpt', alicePersona);
  
  // Connect memory manager to session
  session.setMemoryManager(memoryManager);
  
  // Initialize session
  await session.init();
  
  console.log('🤖 Alice Bot Session Started');
  console.log(`Session ID: ${session.getSessionId()}`);
  console.log('---');

  try {
    // First interaction
    console.log('👤 User: Hi Alice, my name is Bob');
    const response1 = await session.sendPrompt('Hi Alice, my name is Bob');
    console.log(`🤖 Alice: ${response1}`);
    console.log('---');

    // Second interaction - Alice should remember Bob's name
    console.log('👤 User: What is my name?');
    const response2 = await session.sendPrompt('What is my name?');
    console.log(`🤖 Alice: ${response2}`);
    console.log('---');

    // Third interaction - testing memory context
    console.log('👤 User: I am feeling happy today');
    const response3 = await session.sendPrompt('I am feeling happy today');
    console.log(`🤖 Alice: ${response3}`);
    console.log('---');

    // Generate memory summary
    console.log('📝 Generating memory summary...');
    const summary = await memoryManager.generateSummary();
    console.log('Memory Summary:', summary);
    console.log('---');

    // Show rehydration prompt
    console.log('🧠 Memory Context for next session:');
    const context = await session.getMemoryContext();
    console.log(context);

  } finally {
    // Clean up
    await session.close();
    console.log('🔚 Session closed');
  }
}

// Run the example
main().catch(console.error); 