import { 
  DialoguePipe, 
  BrowserAgentSession,
  PersonaConfig,
  BrowserAgentConfig,
  Interjection
} from '@chatpipes/ai-conductor';

async function demonstrateInterjectionLogic() {
  console.log('🧠 Demonstrating Interjection Logic and Stealth Capabilities...\n');

  // Create personas
  const gptPersona: PersonaConfig = {
    name: 'GPT Philosopher',
    description: 'A philosophical ChatGPT agent',
    instructions: 'You are a philosophical AI assistant. Provide thoughtful responses about ethics and morality.',
    introPrompt: 'You are a philosophical AI assistant.',
    behaviorStyle: 'thoughtful and analytical',
    temperature: 0.8
  };

  const claudePersona: PersonaConfig = {
    name: 'Claude Ethicist',
    description: 'An ethical Claude agent',
    instructions: 'You are an ethical AI assistant. Focus on moral implications and ethical reasoning.',
    introPrompt: 'You are an ethical AI assistant.',
    behaviorStyle: 'ethical and principled',
    temperature: 0.7
  };

  // Create browser configurations with stealth
  const browserConfig: BrowserAgentConfig = {
    useBrowser: false, // Disable for demo
    browserConfig: {
      headless: true,
      stealth: {
        userAgents: [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        screenResolutions: [
          { width: 1920, height: 1080 },
          { width: 2560, height: 1440 }
        ],
        typingDelays: { min: 50, max: 200 },
        domTransitionDelays: { min: 1000, max: 3000 },
        sessionRotationInterval: 300000,
        maxRequestsPerSession: 50
      }
    }
  };

  // Create agent sessions
  const gptSession = new BrowserAgentSession('chatgpt', gptPersona, {}, browserConfig);
  const claudeSession = new BrowserAgentSession('claude', claudePersona, {}, browserConfig);

  // Create dialogue pipe
  const dialogue = new DialoguePipe(gptSession, claudeSession, {
    maxRounds: 5,
    turnDelay: 2000,
    enableStreaming: true,
    sessionName: 'Interjection Demo'
  });

  // Add spectator to monitor interjections
  const spectator = {
    id: 'interjection-spectator',
    type: 'demo' as const,
    name: 'Interjection Monitor',
    onTurnEvent: (event) => {
      if (event.type === 'turn_start') {
        console.log(`🔄 ${event.agentName} is thinking...`);
      } else if (event.type === 'turn_end' && event.message) {
        console.log(`💬 ${event.agentName}: ${event.message.substring(0, 100)}...`);
      }
    },
    onDialogueEvent: (event) => {
      if (event.type === 'interjection_added') {
        console.log(`💡 Interjection added: "${event.data.interjection.text}"`);
      } else if (event.type === 'interjection_applied') {
        console.log(`✨ Interjection applied to prompt`);
        console.log(`   Original: ${event.data.originalPrompt.substring(0, 50)}...`);
        console.log(`   Modified: ${event.data.modifiedPrompt.substring(0, 50)}...`);
      }
    },
    onError: (error) => {
      console.error(`❌ Error: ${error.message}`);
    }
  };

  dialogue.addSpectator(spectator);

  // Start dialogue
  console.log('🚀 Starting dialogue with interjection capabilities...\n');

  // Simulate dialogue with interjections
  await simulateDialogueWithInterjections(dialogue);

  // Get interjection statistics
  const stats = dialogue.getInterjectionStats();
  console.log('\n📊 Interjection Statistics:');
  console.log(`Total Interjections: ${stats.total}`);
  console.log(`Applied: ${stats.applied}`);
  console.log(`Pending: ${stats.pending}`);
  console.log(`By Type:`, stats.byType);
  console.log(`By Priority:`, stats.byPriority);
  console.log(`Prompt Modifications: ${stats.promptModifications}`);

  // Get prompt modification history
  const history = dialogue.getPromptModificationHistory();
  console.log('\n📝 Prompt Modification History:');
  history.forEach((mod, index) => {
    console.log(`${index + 1}. ${mod.interjectionId}`);
    console.log(`   Original: ${mod.originalPrompt.substring(0, 50)}...`);
    console.log(`   Modified: ${mod.modifiedPrompt.substring(0, 50)}...`);
    console.log(`   Applied: ${mod.appliedAt.toLocaleTimeString()}`);
  });

  // Get session statistics
  const sessionStats = gptSession.getSessionStats();
  console.log('\n🕵️ Stealth Session Statistics:');
  console.log(`Platform: ${sessionStats?.platform}`);
  console.log(`Identity ID: ${sessionStats?.stealth?.identityId}`);
  console.log(`Session Age: ${sessionStats?.stealth?.sessionAge}s`);
  console.log(`Request Count: ${sessionStats?.stealth?.requestCount}`);
  console.log(`User Agent: ${sessionStats?.stealth?.userAgent?.substring(0, 50)}...`);
  console.log(`Viewport: ${sessionStats?.stealth?.viewportSize?.width}x${sessionStats?.stealth?.viewportSize?.height}`);
  console.log(`Timezone: ${sessionStats?.stealth?.timezone}`);
  console.log(`Language: ${sessionStats?.stealth?.language}`);

  console.log('\n✅ Interjection logic and stealth capabilities demonstrated!');
}

async function simulateDialogueWithInterjections(dialogue: DialoguePipe) {
  // Initial prompt
  const initialPrompt = "What are the ethical implications of artificial intelligence?";

  // Add interjections at different points
  const interjections: Interjection[] = [
    {
      id: 'interjection-1',
      type: 'side_question',
      text: 'How does this relate to human consciousness?',
      target: 'both',
      priority: 'high',
      timestamp: new Date()
    },
    {
      id: 'interjection-2',
      type: 'correction',
      text: 'The term "artificial intelligence" was coined in 1956, not 1950.',
      target: 'both',
      priority: 'medium',
      timestamp: new Date()
    },
    {
      id: 'interjection-3',
      type: 'direction',
      text: 'Let\'s focus on practical applications rather than theoretical concerns.',
      target: 'both',
      priority: 'medium',
      timestamp: new Date()
    }
  ];

  // Add interjections to dialogue
  interjections.forEach((interjection, index) => {
    setTimeout(() => {
      dialogue.addInterjection(interjection);
    }, (index + 1) * 3000); // Add interjections every 3 seconds
  });

  // Simulate dialogue turns
  for (let round = 1; round <= 3; round++) {
    console.log(`\n🔄 Round ${round}:`);
    
    // Simulate GPT turn
    console.log(`🤖 GPT is responding...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate Claude turn
    console.log(`🧠 Claude is responding...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Run the example
if (require.main === module) {
  demonstrateInterjectionLogic().catch(console.error);
}

export { demonstrateInterjectionLogic }; 