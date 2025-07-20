import { ConversationOrchestrator, AgentConfig, ConversationConfig } from '../src/conversation/ConversationOrchestrator';
import { PersonaConfig, PlatformConfig } from '../src/core/AgentSession';
import { BrowserAgentConfig } from '../src/core/BrowserAgentSession';

async function main() {
  console.log('🤖 Piped Conversation Example');
  console.log('=============================\n');

  // Define personas for different AI agents
  const researcherPersona: PersonaConfig = {
    name: 'Dr. Research',
    description: 'A curious research scientist who asks probing questions',
    instructions: 'Ask thoughtful questions to understand the topic deeply. Focus on gathering information and identifying gaps in knowledge.',
    temperature: 0.7,
    maxTokens: 1000
  };

  const analystPersona: PersonaConfig = {
    name: 'Analyst Alice',
    description: 'A data analyst who processes and interprets information',
    instructions: 'Analyze the information provided and identify patterns, trends, and insights. Provide structured analysis.',
    temperature: 0.5,
    maxTokens: 1000
  };

  const synthesizerPersona: PersonaConfig = {
    name: 'Synthesizer Sam',
    description: 'A synthesis expert who combines insights into coherent conclusions',
    instructions: 'Take the analysis and research findings and synthesize them into clear, actionable conclusions and recommendations.',
    temperature: 0.6,
    maxTokens: 1000
  };

  // Configure agents
  const agents: AgentConfig[] = [
    {
      id: 'researcher',
      target: 'chatgpt',
      persona: researcherPersona,
      platformConfig: {
        chatgpt: {
          model: 'gpt-4',
          temperature: 0.7
        }
      },
      browserConfig: {
        useBrowser: false // Use mock mode for this example
      }
    },
    {
      id: 'analyst',
      target: 'claude',
      persona: analystPersona,
      platformConfig: {
        claude: {
          model: 'claude-3-sonnet',
          maxTokens: 1000
        }
      },
      browserConfig: {
        useBrowser: false
      }
    },
    {
      id: 'synthesizer',
      target: 'perplexity',
      persona: synthesizerPersona,
      platformConfig: {
        perplexity: {
          searchType: 'detailed',
          focus: 'academic'
        }
      },
      browserConfig: {
        useBrowser: false
      }
    }
  ];

  // Define conversation flow: Researcher → Analyst → Synthesizer → Researcher
  const conversationConfig: ConversationConfig = {
    agents,
    flow: [
      {
        from: 'researcher',
        to: 'analyst',
        promptTemplate: 'Please analyze this research question and findings: {lastResponse}',
        delay: 2000
      },
      {
        from: 'analyst',
        to: 'synthesizer',
        promptTemplate: 'Based on this analysis, please synthesize the key insights and provide recommendations: {lastResponse}',
        delay: 2000
      },
      {
        from: 'synthesizer',
        to: 'researcher',
        promptTemplate: 'Given these conclusions, what additional research questions should we explore? {lastResponse}',
        delay: 2000
      }
    ],
    maxRounds: 3,
    autoStart: false
  };

  // Create conversation orchestrator
  const orchestrator = new ConversationOrchestrator(conversationConfig);
  
  try {
    // Initialize the orchestrator
    await orchestrator.initialize();
    console.log(`✅ Conversation initialized: ${orchestrator.getConversationId()}\n`);

    // Start the conversation with an initial prompt
    const initialPrompt = "What are the potential applications and implications of quantum computing in the next decade?";
    console.log(`🎯 Starting conversation with: "${initialPrompt}"\n`);

    await orchestrator.startConversation(initialPrompt);

    // Display conversation summary
    console.log('\n📊 Conversation Summary:');
    console.log('=======================');
    
    const events = orchestrator.getEvents();
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. Round ${event.round}: ${event.from} → ${event.to}`);
      console.log(`   Duration: ${event.duration}ms`);
      console.log(`   Prompt: ${event.prompt.substring(0, 150)}...`);
      console.log(`   Response: ${event.response.substring(0, 200)}...`);
    });

    // Save the conversation
    await orchestrator.saveConversation('examples/quantum-computing-conversation.json');
    console.log('\n💾 Conversation saved to: examples/quantum-computing-conversation.json');

    // Demonstrate interjection
    console.log('\n🎭 Adding an interjection...');
    const interjectionResponse = await orchestrator.addInterjection(
      'analyst',
      'What specific technical challenges do you see in quantum computing implementation?'
    );
    console.log(`Analyst interjection response: ${interjectionResponse.substring(0, 200)}...`);

    // Close the orchestrator
    await orchestrator.close();
    console.log('\n✅ Conversation completed successfully!');

  } catch (error) {
    console.error('❌ Error during conversation:', error);
    await orchestrator.close();
  }
}

// Example 2: Debate-style conversation
async function debateExample() {
  console.log('\n🤖 Debate-Style Conversation Example');
  console.log('===================================\n');

  const debater1Persona: PersonaConfig = {
    name: 'Optimist',
    description: 'An optimistic AI that sees the positive side of AI development',
    instructions: 'Argue for the benefits and positive potential of AI development. Be enthusiastic and forward-looking.',
    temperature: 0.8
  };

  const debater2Persona: PersonaConfig = {
    name: 'Skeptic',
    description: 'A cautious AI that raises concerns about AI development',
    instructions: 'Raise thoughtful concerns about AI development. Focus on risks, ethics, and potential negative consequences.',
    temperature: 0.6
  };

  const moderatorPersona: PersonaConfig = {
    name: 'Moderator',
    description: 'A neutral moderator who facilitates the debate',
    instructions: 'Facilitate the debate by asking clarifying questions and ensuring both sides are heard. Remain neutral.',
    temperature: 0.4
  };

  const debateAgents: AgentConfig[] = [
    {
      id: 'optimist',
      target: 'chatgpt',
      persona: debater1Persona,
      browserConfig: { useBrowser: false }
    },
    {
      id: 'skeptic',
      target: 'claude',
      persona: debater2Persona,
      browserConfig: { useBrowser: false }
    },
    {
      id: 'moderator',
      target: 'perplexity',
      persona: moderatorPersona,
      browserConfig: { useBrowser: false }
    }
  ];

  const debateConfig: ConversationConfig = {
    agents: debateAgents,
    flow: [
      {
        from: 'moderator',
        to: 'optimist',
        promptTemplate: 'Please respond to this concern: {lastResponse}',
        delay: 1500
      },
      {
        from: 'optimist',
        to: 'skeptic',
        promptTemplate: 'What is your response to this optimistic view? {lastResponse}',
        delay: 1500
      },
      {
        from: 'skeptic',
        to: 'moderator',
        promptTemplate: 'Please moderate this exchange and ask a follow-up question: {lastResponse}',
        delay: 1500
      }
    ],
    maxRounds: 4
  };

  const debateOrchestrator = new ConversationOrchestrator(debateConfig);
  
  try {
    await debateOrchestrator.initialize();
    console.log(`✅ Debate initialized: ${debateOrchestrator.getConversationId()}\n`);

    const debateTopic = "Should we accelerate AI development or implement more cautious regulations?";
    console.log(`🎯 Debate topic: "${debateTopic}"\n`);

    await debateOrchestrator.startConversation(debateTopic);

    console.log('\n📊 Debate Summary:');
    console.log('==================');
    
    const events = debateOrchestrator.getEvents();
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.from} → ${event.to}:`);
      console.log(`   ${event.response.substring(0, 150)}...`);
    });

    await debateOrchestrator.saveConversation('examples/ai-debate-conversation.json');
    await debateOrchestrator.close();
    
    console.log('\n✅ Debate completed!');

  } catch (error) {
    console.error('❌ Error during debate:', error);
    await debateOrchestrator.close();
  }
}

// Run examples
main()
  .then(() => debateExample())
  .catch(console.error); 