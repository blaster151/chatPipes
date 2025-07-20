#!/usr/bin/env node

import { Command } from 'commander';
import { BrowserAgentSession, BrowserAgentConfig } from '../core/BrowserAgentSession';
import { PersonaConfig, PlatformConfig } from '../core/AgentSession';
import { ConversationOrchestrator, AgentConfig, ConversationConfig } from '../conversation/ConversationOrchestrator';
import { DialoguePipe, Interjection, DialogueConfig } from '../conversation/DialoguePipe';
import { MultiAgentDialogue, MultiAgentConfig } from '../conversation/MultiAgentDialogue';
import { MemoryManager } from '../core/MemoryManager';
import { FileStore } from '../storage/FileStore';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('chatpipes')
  .description('AI Session Management and Conversation Orchestration')
  .version('1.0.0');

// Single session commands
program
  .command('session')
  .description('Manage individual AI sessions')
  .option('-t, --target <target>', 'AI platform (chatgpt, claude, perplexity, deepseek)', 'chatgpt')
  .option('-p, --persona <file>', 'Persona configuration file')
  .option('-b, --browser', 'Use browser automation', false)
  .option('-c, --config <file>', 'Platform configuration file')
  .option('-m, --memory <id>', 'Memory manager ID')
  .action(async (options) => {
    try {
      // Load persona
      let persona: PersonaConfig;
      if (options.persona) {
        const personaData = await fs.readFile(options.persona, 'utf-8');
        persona = JSON.parse(personaData);
      } else {
        persona = {
          name: 'Assistant',
          description: 'A helpful AI assistant',
          instructions: 'Provide helpful and accurate responses.'
        };
      }

      // Load platform config
      let platformConfig: PlatformConfig = {};
      if (options.config) {
        const configData = await fs.readFile(options.config, 'utf-8');
        platformConfig = JSON.parse(configData);
      }

      // Create browser config
      const browserConfig: BrowserAgentConfig = {
        useBrowser: options.browser
      };

      // Create session
      const session = new BrowserAgentSession(
        options.target,
        persona,
        platformConfig,
        browserConfig
      );

      // Set up memory manager
      const store = new FileStore();
      const memoryManager = new MemoryManager(store, options.memory || 'cli-session');
      await memoryManager.init();
      session.setMemoryManager(memoryManager);

      // Initialize session
      await session.init();
      console.log(`Session initialized for ${options.target}`);

      // Interactive mode
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log('Interactive mode. Type "quit" to exit, "screenshot" to take screenshot.');

      const askQuestion = () => {
        rl.question('You: ', async (input: string) => {
          if (input.toLowerCase() === 'quit') {
            await session.close();
            rl.close();
            return;
          }

          if (input.toLowerCase() === 'screenshot') {
            const screenshot = await session.takeScreenshot();
            if (screenshot) {
              await fs.writeFile(`screenshot-${Date.now()}.png`, screenshot);
              console.log('Screenshot saved');
            }
            askQuestion();
            return;
          }

          try {
            const response = await session.sendPrompt(input);
            console.log(`${options.target}: ${response}`);
          } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : String(error));
          }

          askQuestion();
        });
      };

      askQuestion();

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Conversation commands
program
  .command('conversation')
  .description('Manage multi-agent conversations')
  .option('-c, --config <file>', 'Conversation configuration file')
  .option('-s, --start', 'Start conversation immediately')
  .option('-p, --prompt <text>', 'Initial prompt')
  .option('-l, --load <file>', 'Load conversation from file')
  .option('-o, --output <file>', 'Output file for conversation')
  .action(async (options) => {
    try {
      let orchestrator: ConversationOrchestrator;

      if (options.load) {
        // Load existing conversation
        orchestrator = await ConversationOrchestrator.loadConversation(options.load);
        console.log(`Loaded conversation: ${orchestrator.getConversationId()}`);
      } else if (options.config) {
        // Create new conversation from config
        const configData = await fs.readFile(options.config, 'utf-8');
        const config: ConversationConfig = JSON.parse(configData);
        orchestrator = new ConversationOrchestrator(config);
        await orchestrator.initialize();
        console.log(`Created conversation: ${orchestrator.getConversationId()}`);
      } else {
        console.error('Either --config or --load must be specified');
        process.exit(1);
      }

      if (options.start) {
        // Start conversation
        await orchestrator.startConversation(options.prompt);
        
        // Save conversation if output specified
        if (options.output) {
          await orchestrator.saveConversation(options.output);
        }
      } else {
        // Interactive mode
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        console.log('Conversation mode. Commands: start, stop, interject <agent> <prompt>, events, save <file>');

        const askCommand = () => {
          rl.question('> ', async (input: string) => {
            const parts = input.split(' ');
            const command = parts[0].toLowerCase();

            switch (command) {
              case 'start':
                await orchestrator.startConversation(parts.slice(1).join(' '));
                break;
              case 'stop':
                await orchestrator.stopConversation();
                break;
              case 'interject':
                if (parts.length >= 3) {
                  const agentId = parts[1];
                  const prompt = parts.slice(2).join(' ');
                  const response = await orchestrator.addInterjection(agentId, prompt);
                  console.log(`Response: ${response}`);
                } else {
                  console.log('Usage: interject <agent> <prompt>');
                }
                break;
              case 'events':
                const events = orchestrator.getEvents();
                events.forEach((event, index) => {
                  console.log(`${index + 1}. Round ${event.round}: ${event.from} → ${event.to}`);
                  console.log(`   Prompt: ${event.prompt.substring(0, 100)}...`);
                  console.log(`   Response: ${event.response.substring(0, 100)}...`);
                  console.log(`   Duration: ${event.duration}ms`);
                  console.log('');
                });
                break;
              case 'save':
                const file = parts[1] || `conversation-${Date.now()}.json`;
                await orchestrator.saveConversation(file);
                console.log(`Saved to: ${file}`);
                break;
              case 'quit':
                await orchestrator.close();
                rl.close();
                return;
              default:
                console.log('Unknown command. Available: start, stop, interject, events, save, quit');
            }

            askCommand();
          });
        };

        askCommand();
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Configuration commands
program
  .command('config')
  .description('Manage configurations')
  .option('-p, --persona <name>', 'Create persona template')
  .option('-c, --conversation <name>', 'Create conversation template')
  .option('-l, --list', 'List available configurations')
  .action(async (options) => {
    try {
      if (options.persona) {
        const personaTemplate: PersonaConfig = {
          name: options.persona,
          description: 'A helpful AI assistant',
          instructions: 'Provide helpful and accurate responses.',
          temperature: 0.7,
          maxTokens: 1000
        };

        const filePath = `configs/personas/${options.persona}.json`;
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(personaTemplate, null, 2));
        console.log(`Created persona template: ${filePath}`);
      }

      if (options.conversation) {
        const conversationTemplate: ConversationConfig = {
          agents: [
            {
              id: 'agent1',
              target: 'chatgpt',
              persona: {
                name: 'Assistant 1',
                description: 'First AI assistant',
                instructions: 'Provide helpful responses.'
              }
            },
            {
              id: 'agent2',
              target: 'claude',
              persona: {
                name: 'Assistant 2',
                description: 'Second AI assistant',
                instructions: 'Provide helpful responses.'
              }
            }
          ],
          flow: [
            {
              from: 'agent1',
              to: 'agent2',
              promptTemplate: 'Respond to this: {lastResponse}',
              delay: 1000
            },
            {
              from: 'agent2',
              to: 'agent1',
              promptTemplate: 'Continue the conversation: {lastResponse}',
              delay: 1000
            }
          ],
          maxRounds: 5
        };

        const filePath = `configs/conversations/${options.conversation}.json`;
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(conversationTemplate, null, 2));
        console.log(`Created conversation template: ${filePath}`);
      }

      if (options.list) {
        console.log('Available configurations:');
        
        try {
          const personas = await fs.readdir('configs/personas');
          console.log('Personas:', personas.map(p => p.replace('.json', '')));
        } catch (error) {
          console.log('No personas found');
        }

        try {
          const conversations = await fs.readdir('configs/conversations');
          console.log('Conversations:', conversations.map(c => c.replace('.json', '')));
        } catch (error) {
          console.log('No conversations found');
        }
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Utility commands
program
  .command('screenshot')
  .description('Take screenshot of current session')
  .option('-t, --target <target>', 'AI platform', 'chatgpt')
  .option('-o, --output <file>', 'Output file')
  .action(async (options) => {
    try {
      // This would require an active session
      console.log('Screenshot functionality requires an active session');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Dialogue pipe commands
program
  .command('dialogue')
  .description('Manage back-and-forth dialogue between two agents')
  .option('-a, --agent-a <config>', 'Agent A configuration file')
  .option('-b, --agent-b <config>', 'Agent B configuration file')
  .option('-c, --config <file>', 'Dialogue configuration file')
  .option('-s, --start', 'Start dialogue immediately')
  .option('-i, --interactive', 'Interactive mode')
  .action(async (options) => {
    try {
      // Load agent configurations
      let agentAConfig: any = {};
      let agentBConfig: any = {};
      
      if (options.agentA) {
        const configData = await fs.readFile(options.agentA, 'utf-8');
        agentAConfig = JSON.parse(configData);
      }
      
      if (options.agentB) {
        const configData = await fs.readFile(options.agentB, 'utf-8');
        agentBConfig = JSON.parse(configData);
      }

      // Create default personas if not provided
      const defaultPersonaA: PersonaConfig = {
        name: 'Agent A',
        description: 'First dialogue participant',
        instructions: 'Engage in thoughtful conversation.',
        temperature: 0.7
      };

      const defaultPersonaB: PersonaConfig = {
        name: 'Agent B',
        description: 'Second dialogue participant',
        instructions: 'Engage in thoughtful conversation.',
        temperature: 0.7
      };

      // Create agent sessions
      const agentA = new BrowserAgentSession(
        agentAConfig.target || 'chatgpt',
        agentAConfig.persona || defaultPersonaA,
        agentAConfig.platformConfig || {},
        agentAConfig.browserConfig || { useBrowser: false }
      );

      const agentB = new BrowserAgentSession(
        agentBConfig.target || 'claude',
        agentBConfig.persona || defaultPersonaB,
        agentBConfig.platformConfig || {},
        agentBConfig.browserConfig || { useBrowser: false }
      );

      // Set up memory managers
      const storeA = new FileStore();
      const memoryA = new MemoryManager(storeA, 'agent-a');
      await memoryA.init();
      agentA.setMemoryManager(memoryA);

      const storeB = new FileStore();
      const memoryB = new MemoryManager(storeB, 'agent-b');
      await memoryB.init();
      agentB.setMemoryManager(memoryB);

      // Initialize agents
      await agentA.init();
      await agentB.init();

      // Load dialogue configuration
      let dialogueConfig: DialogueConfig = {};
      if (options.config) {
        const configData = await fs.readFile(options.config, 'utf-8');
        dialogueConfig = JSON.parse(configData);
      }

      // Create dialogue pipe
      const dialogue = new DialoguePipe(agentA, agentB, dialogueConfig);

      // Set up event listeners
      dialogue.on('turn_start', (event) => {
        console.log(`\n🎯 Round ${event.round}: Agent ${event.agent} starts turn`);
      });

      dialogue.on('streaming_chunk', (event) => {
        process.stdout.write(event.chunk);
      });

      dialogue.on('turn_end', (event) => {
        console.log('\n');
      });

      dialogue.on('interjection_added', (event) => {
        console.log(`\n🎭 Interjection: ${event.interjection?.text}`);
      });

      if (options.start) {
        // Run dialogue automatically
        console.log('🚀 Starting dialogue...');
        await dialogue.runLoopUntilStopped();
        
        // Display summary
        const history = dialogue.getConversationHistory();
        console.log('\n📊 Dialogue Summary:');
        history.forEach((entry, index) => {
          console.log(`${index + 1}. Agent ${entry.agent}: ${entry.message.substring(0, 100)}...`);
        });
      } else if (options.interactive) {
        // Interactive mode
        console.log('🎮 Interactive Dialogue Mode');
        console.log('Commands: next, auto, pause, resume, interject <text>, quit');

        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const askCommand = () => {
          rl.question('\n> ', async (input: string) => {
            const parts = input.split(' ');
            const command = parts[0].toLowerCase();

            switch (command) {
              case 'next':
                try {
                  await dialogue.runOnce();
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
      } else {
        console.log('Use --start to run automatically or --interactive for manual control');
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Multi-agent dialogue commands
program
  .command('multi-dialogue')
  .description('Manage multi-agent round-robin dialogue (3+ agents)')
  .option('-c, --config <file>', 'Multi-agent configuration file')
  .option('-a, --agents <file>', 'Agents configuration file')
  .option('-s, --start', 'Start dialogue immediately')
  .option('-i, --interactive', 'Interactive mode')
  .option('-r, --rounds <number>', 'Number of rounds', '3')
  .option('-w, --context-window <number>', 'Context window size', '3')
  .option('-t, --strategy <strategy>', 'Context synthesis strategy (recent, all, weighted)', 'recent')
  .action(async (options) => {
    try {
      // Load configuration
      let config: any = {};
      let agentsConfig: any = {};
      
      if (options.config) {
        const configData = await fs.readFile(options.config, 'utf-8');
        config = JSON.parse(configData);
      }
      
      if (options.agents) {
        const agentsData = await fs.readFile(options.agents, 'utf-8');
        agentsConfig = JSON.parse(agentsData);
      }

      // Create default agents if not provided
      const defaultAgents = [
        {
          id: 'agent1',
          name: 'Agent 1',
          persona: {
            name: 'Agent 1',
            description: 'First participant',
            instructions: 'Engage in thoughtful discussion.',
            temperature: 0.7
          },
          target: 'chatgpt',
          platformConfig: { chatgpt: { model: 'gpt-4' } }
        },
        {
          id: 'agent2',
          name: 'Agent 2',
          persona: {
            name: 'Agent 2',
            description: 'Second participant',
            instructions: 'Engage in thoughtful discussion.',
            temperature: 0.7
          },
          target: 'claude',
          platformConfig: { claude: { model: 'claude-3-sonnet' } }
        },
        {
          id: 'agent3',
          name: 'Agent 3',
          persona: {
            name: 'Agent 3',
            description: 'Third participant',
            instructions: 'Engage in thoughtful discussion.',
            temperature: 0.7
          },
          target: 'perplexity',
          platformConfig: { perplexity: { searchType: 'detailed' } }
        }
      ];

      const agents = agentsConfig.agents || defaultAgents;

      // Create agent sessions
      const agentSessions = await Promise.all(agents.map(async (agentConfig: any) => {
        const session = new BrowserAgentSession(
          agentConfig.target,
          agentConfig.persona,
          agentConfig.platformConfig || {},
          agentConfig.browserConfig || { useBrowser: false }
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

      // Create multi-agent configuration
      const multiAgentConfig: MultiAgentConfig = {
        maxRounds: parseInt(options.rounds),
        contextWindow: parseInt(options.contextWindow),
        synthesisStrategy: options.strategy as 'recent' | 'all' | 'weighted',
        turnDelay: 1000,
        enableStreaming: true,
        skipInactiveAgents: true,
        allowInterruptions: false,
        ...config.multiAgentConfig
      };

      // Create multi-agent dialogue
      const dialogue = new MultiAgentDialogue(agentSessions, multiAgentConfig);

      // Set up event listeners
      dialogue.on('turn_start', (event) => {
        console.log(`\n🎯 Round ${event.round}, Turn ${event.turn}: ${event.agentName} starts`);
      });

      dialogue.on('context_synthesized', (event) => {
        console.log(`\n🧠 Context: ${event.context?.substring(0, 100)}...`);
      });

      dialogue.on('streaming_chunk', (event) => {
        process.stdout.write(event.chunk);
      });

      dialogue.on('turn_end', (event) => {
        console.log('\n');
      });

      dialogue.on('agent_status_changed', (event) => {
        console.log(`\n🔄 ${event.agentName}: ${event.isActive ? 'Active' : 'Inactive'}`);
      });

      if (options.start) {
        // Run dialogue automatically
        console.log(`🚀 Starting ${agents.length}-way dialogue with ${options.rounds} rounds...`);
        await dialogue.runLoopUntilStopped();
        
        // Display summary
        const history = dialogue.getHistory();
        console.log('\n📊 Multi-Agent Dialogue Summary:');
        history.forEach((entry, index) => {
          console.log(`${index + 1}. Round ${entry.round}, Turn ${entry.turn}: ${entry.agentName}`);
          console.log(`   ${entry.message.substring(0, 100)}...`);
        });
      } else if (options.interactive) {
        // Interactive mode
        console.log('🎮 Interactive Multi-Agent Mode');
        console.log('Commands: next, auto, pause, resume, activate <agent>, deactivate <agent>, status, quit');

        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

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
                console.log('\n📊 Status:');
                console.log(`Round: ${state.round}, Turn: ${state.turn}`);
                console.log(`Running: ${state.isRunning}, Paused: ${state.isPaused}`);
                state.agents.forEach(agent => {
                  console.log(`  ${agent.name}: ${agent.isActive ? 'Active' : 'Inactive'}`);
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
      } else {
        console.log('Use --start to run automatically or --interactive for manual control');
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse(); 