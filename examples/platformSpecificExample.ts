import { AgentSession, PersonaConfig, PlatformConfig } from '../src/core/AgentSession';
import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';

async function main() {
  console.log('🤖 Platform-Specific AgentSession Examples');
  console.log('==========================================\n');

  // Create storage and memory manager
  const store = new FileStore();
  const memoryManager = new MemoryManager(store, 'platform-demo');
  await memoryManager.init();

  // Define a versatile persona
  const persona: PersonaConfig = {
    name: 'Alex',
    description: 'A knowledgeable AI assistant who adapts to different platforms',
    instructions: 'Provide helpful responses tailored to the platform you are running on.',
    temperature: 0.7,
    maxTokens: 1000
  };

  // Example 1: ChatGPT with specific model configuration
  console.log('📝 Example 1: ChatGPT with GPT-4');
  const chatgptConfig: PlatformConfig = {
    chatgpt: {
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID
    }
  };

  const chatgptSession = new AgentSession('chatgpt', persona, chatgptConfig);
  chatgptSession.setMemoryManager(memoryManager);
  await chatgptSession.init();

  const chatgptResponse = await chatgptSession.sendPrompt('What model are you using?');
  console.log(`ChatGPT: ${chatgptResponse}`);
  await chatgptSession.close();
  console.log('---\n');

  // Example 2: Claude with "New Chat" behavior
  console.log('📝 Example 2: Claude with New Chat functionality');
  const claudeConfig: PlatformConfig = {
    claude: {
      model: 'claude-3-sonnet',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 2000
    }
  };

  const claudeSession = new AgentSession('claude', persona, claudeConfig);
  claudeSession.setMemoryManager(memoryManager);
  await claudeSession.init();

  // First conversation
  await claudeSession.sendPrompt('Remember that I am Bob');
  const response1 = await claudeSession.sendPrompt('What is my name?');
  console.log(`Claude (first chat): ${response1}`);

  // Start new chat (simulating Claude's "New Chat" button)
  await claudeSession.startNewChat();
  const response2 = await claudeSession.sendPrompt('What is my name?');
  console.log(`Claude (new chat): ${response2}`);

  await claudeSession.close();
  console.log('---\n');

  // Example 3: Perplexity with different search types
  console.log('📝 Example 3: Perplexity with search type switching');
  const perplexityConfig: PlatformConfig = {
    perplexity: {
      searchType: 'concise',
      focus: 'web',
      apiKey: process.env.PERPLEXITY_API_KEY
    }
  };

  const perplexitySession = new AgentSession('perplexity', persona, perplexityConfig);
  perplexitySession.setMemoryManager(memoryManager);
  await perplexitySession.init();

  // Test different search types
  const conciseResponse = await perplexitySession.sendPrompt('Explain quantum computing');
  console.log(`Perplexity (concise): ${conciseResponse}`);

  await perplexitySession.switchSearchType('detailed');
  const detailedResponse = await perplexitySession.sendPrompt('Explain quantum computing');
  console.log(`Perplexity (detailed): ${detailedResponse}`);

  await perplexitySession.switchSearchType('creative');
  const creativeResponse = await perplexitySession.sendPrompt('Explain quantum computing');
  console.log(`Perplexity (creative): ${creativeResponse}`);

  // Switch focus to academic
  await perplexitySession.switchFocus('academic');
  const academicResponse = await perplexitySession.sendPrompt('Explain quantum computing');
  console.log(`Perplexity (academic): ${academicResponse}`);

  await perplexitySession.close();
  console.log('---\n');

  // Example 4: DeepSeek with coding focus
  console.log('📝 Example 4: DeepSeek with coding model');
  const deepseekConfig: PlatformConfig = {
    deepseek: {
      model: 'deepseek-coder',
      apiKey: process.env.DEEPSEEK_API_KEY,
      temperature: 0.3
    }
  };

  const deepseekSession = new AgentSession('deepseek', persona, deepseekConfig);
  deepseekSession.setMemoryManager(memoryManager);
  await deepseekSession.init();

  const deepseekResponse = await deepseekSession.sendPrompt('Write a TypeScript function to sort an array');
  console.log(`DeepSeek: ${deepseekResponse}`);

  await deepseekSession.close();
  console.log('---\n');

  // Example 5: Platform-specific conversation history
  console.log('📝 Example 5: Platform-specific conversation history');
  
  const testSession = new AgentSession('chatgpt', persona);
  await testSession.init();

  await testSession.sendPrompt('Hello');
  await testSession.sendPrompt('How are you?');
  await testSession.sendPrompt('What is 2+2?');

  const history = testSession.getConversationHistory();
  console.log('Conversation History:');
  history.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
  });

  await testSession.close();
  console.log('---\n');

  // Example 6: Memory integration across platforms
  console.log('📝 Example 6: Memory integration across platforms');
  
  // Create a new session that should remember previous interactions
  const memorySession = new AgentSession('claude', persona);
  memorySession.setMemoryManager(memoryManager);
  await memorySession.init();

  const memoryContext = await memorySession.getMemoryContext();
  console.log('Memory Context:');
  console.log(memoryContext);

  await memorySession.close();

  console.log('\n✅ Platform-specific examples completed!');
}

// Run the example
main().catch(console.error); 