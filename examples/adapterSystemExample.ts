import { 
  AgentSession, 
  DialoguePipe,
  globalAdapterFactoryRegistry,
  globalAdapterRegistry,
  ChatGPTAdapter,
  ClaudeAdapter,
  AdapterCapabilities
} from '@chatpipes/ai-conductor';

/**
 * Example 1: Basic Adapter Usage
 */
async function basicAdapterExample() {
  console.log('🔌 Example 1: Basic Adapter Usage\n');

  // Create ChatGPT adapter
  const chatGPTConfig = {
    type: 'chatgpt',
    model: 'gpt-4',
    temperature: 0.7,
    systemPrompt: 'You are a helpful AI assistant.',
    useStealth: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 }
  };

  const chatGPTSession = new AgentSession({
    agentType: 'chatgpt',
    ...chatGPTConfig
  });

  // Create Claude adapter
  const claudeConfig = {
    type: 'claude',
    model: 'claude-3-sonnet',
    temperature: 0.7,
    systemPrompt: 'You are a thoughtful AI assistant.',
    useStealth: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1440, height: 900 }
  };

  const claudeSession = new AgentSession({
    agentType: 'claude',
    ...claudeConfig
  });

  // Initialize sessions
  console.log('Initializing ChatGPT session...');
  await chatGPTSession.init();

  console.log('Initializing Claude session...');
  await claudeSession.init();

  // Send prompts
  console.log('\nSending prompt to ChatGPT...');
  const chatGPTResponse = await chatGPTSession.sendPrompt('What is artificial intelligence?');
  console.log(`ChatGPT Response: ${chatGPTResponse.substring(0, 100)}...`);

  console.log('\nSending prompt to Claude...');
  const claudeResponse = await claudeSession.sendPrompt('What is artificial intelligence?');
  console.log(`Claude Response: ${claudeResponse.substring(0, 100)}...`);

  // Get statistics
  console.log('\n📊 Session Statistics:');
  console.log('ChatGPT Stats:', chatGPTSession.getStats());
  console.log('Claude Stats:', claudeSession.getStats());

  // Get capabilities
  console.log('\n🔧 Adapter Capabilities:');
  console.log('ChatGPT Capabilities:', chatGPTSession.getCapabilities());
  console.log('Claude Capabilities:', claudeSession.getCapabilities());

  // Clean up
  await chatGPTSession.close();
  await claudeSession.close();
}

/**
 * Example 2: Adapter Factory System
 */
async function adapterFactoryExample() {
  console.log('\n🏭 Example 2: Adapter Factory System\n');

  // List available factories
  console.log('Available adapter types:');
  const supportedTypes = globalAdapterFactoryRegistry.getSupportedTypes();
  supportedTypes.forEach(type => {
    console.log(`  - ${type}`);
  });

  // List factory information
  console.log('\nFactory Information:');
  const factories = globalAdapterFactoryRegistry.listFactories();
  factories.forEach(factory => {
    console.log(`  ${factory.type}:`);
    console.log(`    Aliases: ${factory.aliases.join(', ')}`);
    console.log(`    Supported Types: ${factory.supportedTypes.join(', ')}`);
  });

  // Create adapters using different methods
  console.log('\nCreating adapters using different methods:');

  // Method 1: Direct factory
  const chatGPTFactory = globalAdapterFactoryRegistry.getFactory('chatgpt');
  if (chatGPTFactory) {
    const adapter1 = chatGPTFactory.createAdapter('test-1', {
      type: 'chatgpt',
      model: 'gpt-4',
      useStealth: true
    });
    console.log('✅ Created ChatGPT adapter via factory');
  }

  // Method 2: Generic factory
  const genericFactory = globalAdapterFactoryRegistry.getFactory('generic');
  if (genericFactory) {
    const adapter2 = genericFactory.createAdapter('test-2', {
      type: 'claude',
      model: 'claude-3-sonnet',
      useStealth: true
    });
    console.log('✅ Created Claude adapter via generic factory');
  }

  // Method 3: Using aliases
  const gptAdapter = globalAdapterFactoryRegistry.createAdapter('gpt', 'test-3', {
    type: 'gpt',
    model: 'gpt-4',
    useStealth: true
  });
  console.log('✅ Created GPT adapter via alias');

  const anthropicAdapter = globalAdapterFactoryRegistry.createAdapter('anthropic', 'test-4', {
    type: 'anthropic',
    model: 'claude-3-sonnet',
    useStealth: true
  });
  console.log('✅ Created Anthropic adapter via alias');
}

/**
 * Example 3: Custom Adapter Implementation
 */
async function customAdapterExample() {
  console.log('\n⚙️ Example 3: Custom Adapter Implementation\n');

  // Example of how to create a custom adapter
  class CustomAIAdapter extends globalAdapterRegistry.BaseAgentAdapter {
    constructor(id: string, config: any) {
      super(id, 'custom-ai', config);
    }

    async init(): Promise<void> {
      console.log(`Initializing custom AI adapter: ${this.id}`);
      this.initialized = true;
      this.connected = true;
      this.emit('initialized', { adapterId: this.id, type: this.type });
    }

    async send(prompt: string): Promise<string> {
      // Simulate AI response
      const response = `Custom AI response to: "${prompt}"`;
      this.recordSuccess(1000, this.estimateTokens(response));
      return response;
    }

    async close(): Promise<void> {
      console.log(`Closing custom AI adapter: ${this.id}`);
      this.initialized = false;
      this.connected = false;
      this.emit('closed', { adapterId: this.id, type: this.type });
    }

    getCapabilities(): AdapterCapabilities {
      return {
        supportsStreaming: false,
        supportsInterjections: true,
        supportsRateLimiting: true,
        supportsStealth: false,
        maxTokensPerRequest: 1000,
        maxRequestsPerMinute: 10,
        supportedModels: ['custom-model'],
        features: ['custom_response', 'simulation']
      };
    }

    validateConfig(): boolean {
      return true;
    }

    private estimateTokens(text: string): number {
      return Math.ceil(text.length / 4);
    }
  }

  // Create custom adapter factory
  class CustomAIAdapterFactory {
    createAdapter(id: string, config: any): AgentAdapter {
      return new CustomAIAdapter(id, config);
    }

    getSupportedTypes(): string[] {
      return ['custom-ai'];
    }

    validateConfig(type: string, config: any): boolean {
      return true;
    }
  }

  // Register custom factory
  globalAdapterRegistry.registerFactory('custom-ai', new CustomAIAdapterFactory());

  // Use custom adapter
  const customSession = new AgentSession({
    agentType: 'custom-ai',
    useStealth: false
  });

  await customSession.init();
  
  const response = await customSession.sendPrompt('Hello, custom AI!');
  console.log(`Custom AI Response: ${response}`);

  console.log('Custom AI Capabilities:', customSession.getCapabilities());
  console.log('Custom AI Stats:', customSession.getStats());

  await customSession.close();
}

/**
 * Example 4: Adapter Comparison and Benchmarking
 */
async function adapterComparisonExample() {
  console.log('\n📊 Example 4: Adapter Comparison and Benchmarking\n');

  const adapters = [
    {
      name: 'ChatGPT',
      type: 'chatgpt',
      config: {
        model: 'gpt-4',
        temperature: 0.7,
        useStealth: true
      }
    },
    {
      name: 'Claude',
      type: 'claude',
      config: {
        model: 'claude-3-sonnet',
        temperature: 0.7,
        useStealth: true
      }
    }
  ];

  const testPrompt = 'Explain quantum computing in one sentence.';

  for (const adapterInfo of adapters) {
    console.log(`\n🧪 Testing ${adapterInfo.name} adapter:`);
    
    const session = new AgentSession({
      agentType: adapterInfo.type,
      ...adapterInfo.config
    });

    try {
      const startTime = Date.now();
      await session.init();
      const initTime = Date.now() - startTime;

      const promptStartTime = Date.now();
      const response = await session.sendPrompt(testPrompt);
      const responseTime = Date.now() - promptStartTime;

      const stats = session.getStats();
      const capabilities = session.getCapabilities();

      console.log(`  ✅ Initialization time: ${initTime}ms`);
      console.log(`  ✅ Response time: ${responseTime}ms`);
      console.log(`  ✅ Response length: ${response.length} characters`);
      console.log(`  ✅ Total requests: ${stats.totalRequests}`);
      console.log(`  ✅ Success rate: ${(stats.successfulRequests / stats.totalRequests * 100).toFixed(1)}%`);
      console.log(`  ✅ Average response time: ${stats.averageResponseTime.toFixed(0)}ms`);
      console.log(`  ✅ Max tokens: ${capabilities.maxTokensPerRequest}`);
      console.log(`  ✅ Rate limit: ${capabilities.maxRequestsPerMinute}/min`);

      await session.close();
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
  }
}

/**
 * Example 5: Adapter with Interjections and Rate Limiting
 */
async function advancedAdapterExample() {
  console.log('\n🚀 Example 5: Advanced Adapter Features\n');

  const session = new AgentSession({
    agentType: 'chatgpt',
    model: 'gpt-4',
    temperature: 0.7,
    useStealth: true,
    rateLimitConfig: {
      requestsPerMinute: 5,
      cooldownPeriod: 30000
    }
  });

  await session.init();

  // Add interjections
  session.addInterjection({
    id: 'interjection-1',
    interjection: 'Please be concise in your response.',
    targetAgentId: session.getAdapter().getStats().browserStats?.identityId || 'unknown',
    timestamp: new Date()
  });

  session.addInterjection({
    id: 'interjection-2',
    interjection: 'Focus on practical applications.',
    targetAgentId: session.getAdapter().getStats().browserStats?.identityId || 'unknown',
    timestamp: new Date()
  });

  console.log('Pending interjections:', session.getPendingInterjections());

  // Send multiple prompts to test rate limiting
  const prompts = [
    'What is machine learning?',
    'How does deep learning work?',
    'Explain neural networks.',
    'What is reinforcement learning?',
    'How do transformers work?'
  ];

  for (let i = 0; i < prompts.length; i++) {
    console.log(`\nSending prompt ${i + 1}/${prompts.length}: ${prompts[i]}`);
    
    try {
      const startTime = Date.now();
      const response = await session.sendPrompt(prompts[i]);
      const responseTime = Date.now() - startTime;
      
      console.log(`Response (${responseTime}ms): ${response.substring(0, 100)}...`);
      
      // Check if rate limited
      const stats = session.getStats();
      if (stats.browserStats?.rateLimitHits && stats.browserStats.rateLimitHits > 0) {
        console.log(`⚠️ Rate limit hit! Total hits: ${stats.browserStats.rateLimitHits}`);
      }
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }

  console.log('\nFinal Statistics:');
  console.log(session.getStats());

  await session.close();
}

/**
 * Example 6: DialoguePipe with Adapters
 */
async function dialoguePipeAdapterExample() {
  console.log('\n🔗 Example 6: DialoguePipe with Adapters\n');

  // Create two different adapters
  const gptSession = new AgentSession({
    agentType: 'chatgpt',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful AI assistant. Be concise and practical.',
    useStealth: true
  });

  const claudeSession = new AgentSession({
    agentType: 'claude',
    model: 'claude-3-sonnet',
    systemPrompt: 'You are a thoughtful AI assistant. Provide detailed explanations.',
    useStealth: true
  });

  // Initialize sessions
  await gptSession.init();
  await claudeSession.init();

  // Create dialogue pipe
  const pipe = new DialoguePipe({
    agentA: gptSession,
    agentB: claudeSession,
    startWith: 'A',
    maxRounds: 3,
    turnDelay: 2000
  });

  // Listen for exchanges
  pipe.on('exchange', (exchange) => {
    console.log(`💬 ${exchange.from} → ${exchange.to}: ${exchange.response.substring(0, 50)}...`);
  });

  pipe.on('turn_start', (data) => {
    console.log(`🔄 Turn ${data.round}: ${data.agentName}`);
  });

  pipe.on('turn_end', (data) => {
    console.log(`✅ Turn ${data.round} completed`);
  });

  // Start dialogue
  console.log('Starting dialogue between ChatGPT and Claude...');
  await pipe.start();

  // Get all exchanges
  const exchanges = pipe.getAllExchanges();
  console.log(`\nTotal exchanges: ${exchanges.length}`);

  // Create replay session
  const replaySessionId = pipe.createReplaySession({
    speed: 'normal',
    enableInterjections: true,
    enableMetadata: true,
    autoAdvance: true,
    loop: false,
    sessionName: 'GPT vs Claude Dialogue'
  });

  console.log(`Created replay session: ${replaySessionId}`);

  // Clean up
  await gptSession.close();
  await claudeSession.close();
}

/**
 * Run all adapter examples
 */
async function runAllAdapterExamples() {
  try {
    console.log('🔌 Adapter System Examples\n');

    // Example 1: Basic adapter usage
    await basicAdapterExample();

    // Example 2: Adapter factory system
    await adapterFactoryExample();

    // Example 3: Custom adapter implementation
    await customAdapterExample();

    // Example 4: Adapter comparison
    await adapterComparisonExample();

    // Example 5: Advanced features
    await advancedAdapterExample();

    // Example 6: DialoguePipe integration
    await dialoguePipeAdapterExample();

    console.log('\n✅ All adapter examples completed successfully!');
  } catch (error) {
    console.error('❌ Adapter example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllAdapterExamples();
}

export {
  basicAdapterExample,
  adapterFactoryExample,
  customAdapterExample,
  adapterComparisonExample,
  advancedAdapterExample,
  dialoguePipeAdapterExample,
  runAllAdapterExamples
}; 