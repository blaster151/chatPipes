import { BrowserAgentSession } from '../src/core/BrowserAgentSession';
import { ConversationOrchestrator, AgentConfig, ConversationConfig } from '../src/conversation/ConversationOrchestrator';
import { PersonaConfig, PlatformConfig } from '../src/core/AgentSession';
import { MemoryManager } from '../src/core/MemoryManager';
import { FileStore } from '../src/storage/FileStore';

async function quickStartExample() {
  console.log('🚀 ChatPipes Quick Start Example');
  console.log('================================\n');

  // Example 1: Single Browser Session
  console.log('1️⃣ Single Browser Session');
  console.log('--------------------------');

  const persona: PersonaConfig = {
    name: 'Assistant',
    description: 'A helpful AI assistant',
    instructions: 'Provide clear and helpful responses.',
    temperature: 0.7
  };

  const platformConfig: PlatformConfig = {
    chatgpt: {
      model: 'gpt-4'
    }
  };

  // Create session with browser automation (mock mode for demo)
  const session = new BrowserAgentSession('chatgpt', persona, platformConfig, {
    useBrowser: false // Set to true for real browser automation
  });

  // Set up memory manager
  const store = new FileStore();
  const memoryManager = new MemoryManager(store, 'quickstart-demo');
  await memoryManager.init();
  session.setMemoryManager(memoryManager);

  // Initialize and use
  await session.init();
  console.log('✅ Session initialized');

  const response = await session.sendPrompt('What is the future of AI?');
  console.log(`🤖 Response: ${response.substring(0, 100)}...`);

  // Take screenshot (if using browser)
  const screenshot = await session.takeScreenshot();
  if (screenshot) {
    console.log('📸 Screenshot taken');
  }

  await session.close();
  console.log('✅ Session closed\n');

  // Example 2: Multi-Agent Conversation
  console.log('2️⃣ Multi-Agent Conversation');
  console.log('----------------------------');

  const researcherPersona: PersonaConfig = {
    name: 'Researcher',
    description: 'A curious research scientist',
    instructions: 'Ask probing questions and gather information.',
    temperature: 0.8
  };

  const analystPersona: PersonaConfig = {
    name: 'Analyst',
    description: 'A data analyst',
    instructions: 'Analyze information and provide insights.',
    temperature: 0.5
  };

  const agents: AgentConfig[] = [
    {
      id: 'researcher',
      target: 'chatgpt',
      persona: researcherPersona,
      browserConfig: { useBrowser: false }
    },
    {
      id: 'analyst',
      target: 'claude',
      persona: analystPersona,
      browserConfig: { useBrowser: false }
    }
  ];

  const conversationConfig: ConversationConfig = {
    agents,
    flow: [
      {
        from: 'researcher',
        to: 'analyst',
        promptTemplate: 'Please analyze this research question: {lastResponse}',
        delay: 1000
      },
      {
        from: 'analyst',
        to: 'researcher',
        promptTemplate: 'Based on this analysis, what should we explore next? {lastResponse}',
        delay: 1000
      }
    ],
    maxRounds: 2
  };

  const orchestrator = new ConversationOrchestrator(conversationConfig);
  
  try {
    await orchestrator.initialize();
    console.log('✅ Conversation initialized');

    const initialPrompt = "What are the key challenges in renewable energy adoption?";
    console.log(`🎯 Starting conversation: "${initialPrompt}"`);

    await orchestrator.startConversation(initialPrompt);

    // Display results
    const events = orchestrator.getEvents();
    console.log('\n📊 Conversation Summary:');
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.from} → ${event.to}: ${event.response.substring(0, 80)}...`);
    });

    // Save conversation
    await orchestrator.saveConversation('examples/quickstart-conversation.json');
    console.log('💾 Conversation saved');

    await orchestrator.close();
    console.log('✅ Conversation closed\n');

  } catch (error) {
    console.error('❌ Error:', error);
    await orchestrator.close();
  }

  // Example 3: Platform-Specific Features
  console.log('3️⃣ Platform-Specific Features');
  console.log('-------------------------------');

  const perplexitySession = new BrowserAgentSession('perplexity', persona, {
    perplexity: {
      searchType: 'concise',
      focus: 'web'
    }
  }, {
    useBrowser: false
  });

  await perplexitySession.init();
  console.log('✅ Perplexity session initialized');

  // Switch search types
  await perplexitySession.switchSearchType('detailed');
  console.log('🔄 Switched to detailed search');

  await perplexitySession.switchFocus('academic');
  console.log('🎓 Switched to academic focus');

  const searchResponse = await perplexitySession.sendPrompt('Explain quantum computing');
  console.log(`🔍 Search response: ${searchResponse.substring(0, 100)}...`);

  await perplexitySession.close();
  console.log('✅ Perplexity session closed\n');

  console.log('🎉 Quick start example completed!');
  console.log('\nNext steps:');
  console.log('- Set useBrowser: true for real browser automation');
  console.log('- Add API keys to platformConfig for real AI responses');
  console.log('- Try the CLI: npm run chatpipes session --target chatgpt');
  console.log('- Explore more examples in the /examples directory');
}

// Run the example
quickStartExample().catch(console.error); 