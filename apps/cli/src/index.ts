#!/usr/bin/env node

import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { 
  DialoguePipe, 
  MultiAgentDialogue,
  SessionManager,
  BrowserAgentSession,
  PersonaConfig,
  PlatformConfig,
  BrowserAgentConfig,
  Spectator,
  Interjection
} from '@chatpipes/ai-conductor';
import { v4 as uuidv4 } from 'uuid';
import { ChatInterface } from './components/ChatInterface';
import { SessionMonitor } from './components/SessionMonitor';
import { ReplayInterface } from './components/ReplayInterface';

const program = new Command();

// Global state for active sessions
let activeDialogue: DialoguePipe | null = null;
let activeMultiDialogue: MultiAgentDialogue | null = null;
let sessionManager: SessionManager | null = null;

program
  .name('aichat')
  .description('AI conversation orchestration CLI')
  .version('1.0.0');

// Pipe command: Create dialogue between two agents
program
  .command('pipe')
  .description('Create a dialogue pipe between two AI agents')
  .argument('<agent1>', 'First agent platform (chatgpt, claude, perplexity, deepseek)')
  .argument('<agent2>', 'Second agent platform (chatgpt, claude, perplexity, deepseek)')
  .option('-s, --start-with <agent>', 'Which agent starts (agent1 or agent2)', 'agent1')
  .option('-r, --rounds <number>', 'Maximum number of rounds', '10')
  .option('-d, --delay <ms>', 'Delay between turns in milliseconds', '2000')
  .option('-n, --name <name>', 'Session name', 'CLI Dialogue')
  .option('--no-streaming', 'Disable real-time streaming')
  .option('--headless', 'Run in headless mode (no TUI)')
  .action(async (agent1, agent2, options) => {
    try {
      // Initialize session manager
      sessionManager = new SessionManager({
        storagePath: './sessions',
        autoSave: true,
        saveInterval: 10000
      });
      await sessionManager.init();

      // Create personas
      const persona1: PersonaConfig = {
        name: `${agent1.toUpperCase()} Agent`,
        description: `A ${agent1} AI agent`,
        instructions: `You are a helpful AI assistant using ${agent1}. Provide thoughtful and engaging responses.`,
        introPrompt: `You are an AI assistant powered by ${agent1}.`,
        behaviorStyle: 'helpful and knowledgeable',
        temperature: 0.7
      };

      const persona2: PersonaConfig = {
        name: `${agent2.toUpperCase()} Agent`,
        description: `A ${agent2} AI agent`,
        instructions: `You are a helpful AI assistant using ${agent2}. Provide thoughtful and engaging responses.`,
        introPrompt: `You are an AI assistant powered by ${agent2}.`,
        behaviorStyle: 'helpful and knowledgeable',
        temperature: 0.7
      };

      // Create browser configurations
      const browserConfig: BrowserAgentConfig = {
        useBrowser: false, // Disable browser for CLI
        browserConfig: {
          headless: true
        }
      };

      // Create agent sessions
      const session1 = new BrowserAgentSession(
        agent1 as 'chatgpt' | 'claude' | 'perplexity' | 'deepseek',
        persona1,
        {},
        browserConfig
      );

      const session2 = new BrowserAgentSession(
        agent2 as 'chatgpt' | 'claude' | 'perplexity' | 'deepseek',
        persona2,
        {},
        browserConfig
      );

      // Create dialogue pipe
      activeDialogue = new DialoguePipe(session1, session2, {
        maxRounds: parseInt(options.rounds),
        turnDelay: parseInt(options.delay),
        enableStreaming: options.streaming,
        sessionManager,
        sessionName: options.name
      });

      // Set who starts
      const startAgent = options.startWith === 'agent1' ? 'A' : 'B';
      activeDialogue.setWhoStarts(startAgent);

      // Add CLI spectator
      const cliSpectator: Spectator = {
        id: 'cli-spectator',
        type: 'cli',
        name: 'CLI Observer',
        onTurnEvent: (event) => {
          if (event.type === 'turn_start') {
            console.log(`\n🔄 Round ${event.round}: ${event.agentName} is thinking...`);
          } else if (event.type === 'turn_end' && event.message) {
            console.log(`💬 ${event.agentName}: ${event.message}`);
          }
        },
        onDialogueEvent: (event) => {
          console.log(`📢 ${event.type}: ${JSON.stringify(event.data)}`);
        },
        onError: (error) => {
          console.error(`❌ Error: ${error.message}`);
        }
      };

      activeDialogue.addSpectator(cliSpectator);

      if (options.headless) {
        // Run in headless mode
        console.log(`🚀 Starting dialogue between ${agent1} and ${agent2}...`);
        await activeDialogue.runLoopUntilStopped();
      } else {
        // Run with TUI
        const { waitUntilExit } = render(
          React.createElement(ChatInterface, {
            dialogue: activeDialogue,
            sessionManager,
            onExit: () => {
              activeDialogue = null;
              process.exit(0);
            }
          })
        );

        await waitUntilExit();
      }

    } catch (error) {
      console.error('Error creating dialogue:', error);
      process.exit(1);
    }
  });

// Multi-agent dialogue command
program
  .command('multi')
  .description('Create a multi-agent round-robin dialogue')
  .argument('<agents...>', 'Agent platforms (chatgpt, claude, perplexity, deepseek)')
  .option('-r, --rounds <number>', 'Maximum number of rounds', '6')
  .option('-d, --delay <ms>', 'Delay between turns in milliseconds', '1500')
  .option('-s, --strategy <strategy>', 'Context synthesis strategy (recent, all, weighted)', 'recent')
  .option('-n, --name <name>', 'Session name', 'CLI Multi-Agent')
  .option('--no-streaming', 'Disable real-time streaming')
  .action(async (agents, options) => {
    try {
      if (agents.length < 3) {
        console.error('Multi-agent dialogue requires at least 3 agents');
        process.exit(1);
      }

      // Initialize session manager
      sessionManager = new SessionManager({
        storagePath: './sessions',
        autoSave: true,
        saveInterval: 10000
      });
      await sessionManager.init();

      // Create agent sessions
      const agentSessions = agents.map((platform, index) => {
        const persona: PersonaConfig = {
          name: `Agent ${index + 1} (${platform.toUpperCase()})`,
          description: `A ${platform} AI agent`,
          instructions: `You are a helpful AI assistant using ${platform}.`,
          introPrompt: `You are an AI assistant powered by ${platform}.`,
          behaviorStyle: 'helpful and knowledgeable',
          temperature: 0.7
        };

        const browserConfig: BrowserAgentConfig = {
          useBrowser: false,
          browserConfig: { headless: true }
        };

        return new BrowserAgentSession(
          platform as 'chatgpt' | 'claude' | 'perplexity' | 'deepseek',
          persona,
          {},
          browserConfig
        );
      });

      // Create multi-agent dialogue
      activeMultiDialogue = new MultiAgentDialogue(agentSessions, {
        maxRounds: parseInt(options.rounds),
        turnDelay: parseInt(options.delay),
        enableStreaming: options.streaming,
        synthesisStrategy: options.strategy as 'recent' | 'all' | 'weighted'
      });

      // Add CLI spectator
      const cliSpectator: Spectator = {
        id: 'cli-multi-spectator',
        type: 'cli',
        name: 'CLI Multi-Agent Observer',
        onTurnEvent: (event) => {
          if (event.type === 'turn_start') {
            console.log(`\n🔄 Round ${event.round}: ${event.agentName} is thinking...`);
          } else if (event.type === 'turn_end' && event.message) {
            console.log(`💬 ${event.agentName}: ${event.message.substring(0, 100)}...`);
          }
        },
        onDialogueEvent: (event) => {
          console.log(`📢 Multi-Agent Event: ${event.type}`);
        },
        onError: (error) => {
          console.error(`❌ Multi-Agent Error: ${error.message}`);
        }
      };

      activeMultiDialogue.addSpectator(cliSpectator);

      console.log(`🚀 Starting multi-agent dialogue with ${agents.length} agents...`);
      await activeMultiDialogue.runLoopUntilStopped();

    } catch (error) {
      console.error('Error creating multi-agent dialogue:', error);
      process.exit(1);
    }
  });

// Interjection command
program
  .command('interject')
  .description('Add an interjection to the active dialogue')
  .argument('<text>', 'Interjection text')
  .option('-t, --target <target>', 'Target agent (A, B, or both)', 'both')
  .option('-p, --priority <priority>', 'Priority (low, medium, high)', 'medium')
  .option('-T, --type <type>', 'Interjection type (side_question, correction, direction, pause, resume)', 'side_question')
  .action(async (text, options) => {
    if (!activeDialogue && !activeMultiDialogue) {
      console.error('❌ No active dialogue found. Start a dialogue first with "aichat pipe" or "aichat multi"');
      process.exit(1);
    }

    const interjection: Interjection = {
      id: uuidv4(),
      type: options.type as any,
      text,
      target: options.target as any,
      priority: options.priority as any,
      timestamp: new Date()
    };

    if (activeDialogue) {
      activeDialogue.addInterjection(interjection);
      console.log(`💡 Interjection added to dialogue: "${text}"`);
    } else if (activeMultiDialogue) {
      activeMultiDialogue.addInterjection(interjection);
      console.log(`💡 Interjection added to multi-agent dialogue: "${text}"`);
    }
  });

// Pause command
program
  .command('pause')
  .description('Pause the active dialogue')
  .action(() => {
    if (!activeDialogue && !activeMultiDialogue) {
      console.error('❌ No active dialogue found');
      process.exit(1);
    }

    if (activeDialogue) {
      activeDialogue.pause();
      console.log('⏸️  Dialogue paused');
    } else if (activeMultiDialogue) {
      activeMultiDialogue.pause();
      console.log('⏸️  Multi-agent dialogue paused');
    }
  });

// Resume command
program
  .command('resume')
  .description('Resume the active dialogue')
  .action(() => {
    if (!activeDialogue && !activeMultiDialogue) {
      console.error('❌ No active dialogue found');
      process.exit(1);
    }

    if (activeDialogue) {
      activeDialogue.resume();
      console.log('▶️  Dialogue resumed');
    } else if (activeMultiDialogue) {
      activeMultiDialogue.resume();
      console.log('▶️  Multi-agent dialogue resumed');
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop the active dialogue')
  .action(() => {
    if (!activeDialogue && !activeMultiDialogue) {
      console.error('❌ No active dialogue found');
      process.exit(1);
    }

    if (activeDialogue) {
      activeDialogue.stop();
      console.log('⏹️  Dialogue stopped');
      activeDialogue = null;
    } else if (activeMultiDialogue) {
      activeMultiDialogue.stop();
      console.log('⏹️  Multi-agent dialogue stopped');
      activeMultiDialogue = null;
    }
  });

// Sessions command
program
  .command('sessions')
  .description('List and manage saved sessions')
  .option('-l, --list', 'List all sessions')
  .option('-e, --export <id>', 'Export session by ID')
  .option('-i, --import <file>', 'Import session from file')
  .option('-d, --delete <id>', 'Delete session by ID')
  .action(async (options) => {
    try {
      const sessionManager = new SessionManager({
        storagePath: './sessions'
      });
      await sessionManager.init();

      if (options.list) {
        const sessions = sessionManager.getAllSessions();
        console.log('\n📋 Saved Sessions:');
        sessions.forEach(session => {
          console.log(`\n🆔 ${session.id}`);
          console.log(`📝 ${session.name}`);
          console.log(`📊 Type: ${session.type}`);
          console.log(`📅 Created: ${session.createdAt.toLocaleString()}`);
          console.log(`🔄 Status: ${session.status}`);
          console.log(`💬 Exchanges: ${session.exchanges.length}`);
          console.log(`💡 Interjections: ${session.interjections.length}`);
        });
      } else if (options.export) {
        const exported = sessionManager.exportSession(options.export);
        console.log('\n📄 Exported Session:');
        console.log(exported);
      } else if (options.import) {
        const fs = require('fs');
        const jsonData = fs.readFileSync(options.import, 'utf-8');
        const imported = sessionManager.importSession(jsonData);
        console.log(`✅ Session imported: ${imported.name} (${imported.id})`);
      } else if (options.delete) {
        // Note: Delete functionality would need to be added to SessionManager
        console.log('🗑️  Delete functionality not yet implemented');
      } else {
        console.log('Use --list, --export, --import, or --delete options');
      }

      await sessionManager.close();
    } catch (error) {
      console.error('Error managing sessions:', error);
    }
  });

// Replay command
program
  .command('replay')
  .description('Replay a saved session')
  .argument('<sessionId>', 'Session ID to replay')
  .option('-s, --speed <speed>', 'Replay speed (slow, normal, fast, instant)', 'normal')
  .action(async (sessionId, options) => {
    try {
      const sessionManager = new SessionManager({
        storagePath: './sessions'
      });
      await sessionManager.init();

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        console.error(`❌ Session ${sessionId} not found`);
        process.exit(1);
      }

      console.log(`🎬 Replaying session: ${session.name}`);
      
      const { waitUntilExit } = render(
        React.createElement(ReplayInterface, {
          sessionManager,
          sessionId,
          speed: options.speed,
          onExit: () => process.exit(0)
        })
      );

      await waitUntilExit();
      await sessionManager.close();
    } catch (error) {
      console.error('Error replaying session:', error);
    }
  });

// Monitor command
program
  .command('monitor')
  .description('Monitor active sessions and system status')
  .action(async () => {
    try {
      const sessionManager = new SessionManager({
        storagePath: './sessions'
      });
      await sessionManager.init();

      const { waitUntilExit } = render(
        React.createElement(SessionMonitor, {
          sessionManager,
          onExit: () => process.exit(0)
        })
      );

      await waitUntilExit();
      await sessionManager.close();
    } catch (error) {
      console.error('Error monitoring sessions:', error);
    }
  });

program.parse(); 