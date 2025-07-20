import { PlaywrightSession, BrowserConfig } from '../src/browser/PlaywrightSession';
import { getPlatformConfig, robustPlatformConfigs } from '../src/browser/playwrightPlatformConfigs';

async function playwrightBrowserExample() {
  console.log('🎭 Playwright Browser Automation Example');
  console.log('=======================================\n');

  // Example 1: Basic ChatGPT session
  console.log('1️⃣ Basic ChatGPT Session');
  console.log('------------------------');

  const chatgptConfig = getPlatformConfig('chatgpt');
  const browserConfig: BrowserConfig = {
    browserType: 'chromium',
    headless: false, // Set to true for headless mode
    slowMo: 100,
    timeout: 30000,
    viewport: { width: 1280, height: 720 }
  };

  const chatgptSession = new PlaywrightSession(chatgptConfig, browserConfig);

  // Set up event listeners
  chatgptSession.on('session_started', (event) => {
    console.log('✅ ChatGPT session started');
  });

  chatgptSession.on('message_sent', (event) => {
    console.log('📤 Message sent:', event.data?.prompt?.substring(0, 50) + '...');
  });

  chatgptSession.on('response_received', (event) => {
    console.log('📥 Response received:', event.data?.response?.substring(0, 50) + '...');
  });

  chatgptSession.on('error', (event) => {
    console.log('❌ Error:', event.data?.error);
  });

  try {
    await chatgptSession.init();
    
    // Send a prompt
    const response = await chatgptSession.sendPrompt('Hello! Can you explain quantum computing in simple terms?');
    console.log('🤖 Response:', response.substring(0, 200) + '...');

    // Take a screenshot
    const screenshot = await chatgptSession.takeScreenshot('chatgpt-conversation.png');
    console.log('📸 Screenshot saved');

    await chatgptSession.close();
    console.log('✅ ChatGPT session closed\n');

  } catch (error) {
    console.error('❌ ChatGPT session failed:', error);
  }

  // Example 2: Claude session with robust selectors
  console.log('2️⃣ Claude Session with Robust Selectors');
  console.log('----------------------------------------');

  const claudeConfig = robustPlatformConfigs.claude;
  const claudeSession = new PlaywrightSession(claudeConfig, {
    ...browserConfig,
    headless: false
  });

  try {
    await claudeSession.init();
    
    // Send multiple prompts to test queue mechanism
    const prompts = [
      'What is the meaning of life?',
      'Explain the concept of consciousness',
      'How do neural networks work?'
    ];

    console.log('🔄 Sending multiple prompts to test queue mechanism...');
    
    const responses = await Promise.all(
      prompts.map(prompt => claudeSession.sendPrompt(prompt))
    );

    responses.forEach((response, index) => {
      console.log(`📝 Response ${index + 1}:`, response.substring(0, 100) + '...');
    });

    await claudeSession.close();
    console.log('✅ Claude session closed\n');

  } catch (error) {
    console.error('❌ Claude session failed:', error);
  }

  // Example 3: Perplexity session with search type switching
  console.log('3️⃣ Perplexity Session with Search Type Switching');
  console.log('------------------------------------------------');

  const perplexityConfig = robustPlatformConfigs.perplexity;
  const perplexitySession = new PlaywrightSession(perplexityConfig, {
    ...browserConfig,
    headless: false
  });

  try {
    await perplexitySession.init();
    
    // Switch to detailed search type
    await perplexitySession.switchSearchType('detailed');
    console.log('🔄 Switched to detailed search type');
    
    // Switch focus to academic
    await perplexitySession.switchFocus('academic');
    console.log('🔄 Switched focus to academic');
    
    // Send a research question
    const researchResponse = await perplexitySession.sendPrompt('What are the latest developments in quantum computing?');
    console.log('🔬 Research response:', researchResponse.substring(0, 200) + '...');

    await perplexitySession.close();
    console.log('✅ Perplexity session closed\n');

  } catch (error) {
    console.error('❌ Perplexity session failed:', error);
  }

  // Example 4: Session state monitoring
  console.log('4️⃣ Session State Monitoring');
  console.log('----------------------------');

  const deepseekConfig = robustPlatformConfigs.deepseek;
  const deepseekSession = new PlaywrightSession(deepseekConfig, {
    ...browserConfig,
    headless: false
  });

  try {
    await deepseekSession.init();
    
    // Monitor session state
    const initialState = deepseekSession.getState();
    console.log('📊 Initial state:', initialState);
    
    // Send a prompt
    await deepseekSession.sendPrompt('Explain the concept of artificial intelligence');
    
    // Check state after sending
    const afterPromptState = deepseekSession.getState();
    console.log('📊 State after prompt:', afterPromptState);
    
    // Get current URL
    const currentUrl = await deepseekSession.getCurrentUrl();
    console.log('🌐 Current URL:', currentUrl);
    
    // Get page content
    const pageContent = await deepseekSession.getPageContent();
    console.log('📄 Page content length:', pageContent.length);

    await deepseekSession.close();
    console.log('✅ DeepSeek session closed\n');

  } catch (error) {
    console.error('❌ DeepSeek session failed:', error);
  }

  // Example 5: Error handling and retries
  console.log('5️⃣ Error Handling and Retries');
  console.log('-------------------------------');

  const errorProneConfig = {
    ...getPlatformConfig('chatgpt'),
    selectors: {
      ...getPlatformConfig('chatgpt').selectors,
      chatInput: 'non-existent-selector', // This will cause an error
      sendButton: 'another-non-existent-selector'
    }
  };

  const errorSession = new PlaywrightSession(errorProneConfig, {
    ...browserConfig,
    headless: true
  });

  try {
    await errorSession.init();
    console.log('❌ This should not happen - session should fail');
  } catch (error) {
    console.log('✅ Expected error caught:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n🎉 Playwright browser automation examples completed!');
}

// Example 6: Multiple concurrent sessions
async function concurrentSessionsExample() {
  console.log('\n🔄 Concurrent Sessions Example');
  console.log('==============================\n');

  const sessions = [
    { name: 'ChatGPT', config: robustPlatformConfigs.chatgpt },
    { name: 'Claude', config: robustPlatformConfigs.claude },
    { name: 'Perplexity', config: robustPlatformConfigs.perplexity }
  ];

  const browserConfig: BrowserConfig = {
    browserType: 'chromium',
    headless: true, // Use headless for concurrent sessions
    slowMo: 50,
    timeout: 30000
  };

  console.log('🚀 Starting multiple concurrent sessions...');

  const sessionInstances = await Promise.all(
    sessions.map(async ({ name, config }) => {
      const session = new PlaywrightSession(config, browserConfig);
      
      session.on('session_started', () => console.log(`✅ ${name} session started`));
      session.on('message_sent', () => console.log(`📤 ${name} message sent`));
      session.on('response_received', () => console.log(`📥 ${name} response received`));
      
      await session.init();
      return { name, session };
    })
  );

  console.log('📝 Sending prompts to all sessions...');

  const prompts = [
    'What is machine learning?',
    'Explain quantum physics',
    'How does the internet work?'
  ];

  const results = await Promise.all(
    sessionInstances.map(async ({ name, session }, index) => {
      const prompt = prompts[index % prompts.length];
      const response = await session.sendPrompt(prompt);
      return { name, prompt, response: response.substring(0, 100) + '...' };
    })
  );

  results.forEach(({ name, prompt, response }) => {
    console.log(`\n🤖 ${name}:`);
    console.log(`   Prompt: ${prompt}`);
    console.log(`   Response: ${response}`);
  });

  // Close all sessions
  await Promise.all(
    sessionInstances.map(({ name, session }) => session.close())
  );

  console.log('\n✅ All concurrent sessions completed!');
}

// Run examples
playwrightBrowserExample()
  .then(() => concurrentSessionsExample())
  .catch(console.error); 