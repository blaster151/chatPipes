#!/usr/bin/env node

import * as readline from 'readline';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { MemoryManager } from '../core/MemoryManager';
import { FileStore } from '../storage/FileStore';
import { SqliteStore } from '../storage/SqliteStore';
import { DefaultSummarizer } from '../core/DefaultSummarizer';
import { DefaultMotifDetector } from '../core/DefaultMotifDetector';
import { DefaultEmotionalAnalyzer } from '../core/DefaultEmotionalAnalyzer';
import { MemoryConfig } from '../core/types';

interface CLIInput {
  action: 'ingest' | 'query' | 'summary' | 'facts' | 'emotions' | 'motifs' | 'get' | 'delete' | 'clear';
  text?: string;
  source?: string;
  personaId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  query?: any;
  memoryId?: string;
  useSqlite?: boolean;
  config?: Partial<MemoryConfig>;
}

interface CLIOutput {
  success: boolean;
  data?: any;
  error?: string;
}

class CLIBridge {
  private memoryManagers = new Map<string, MemoryManager>();

  async initializeMemoryManager(personaId: string, useSqlite: boolean = false): Promise<MemoryManager> {
    if (this.memoryManagers.has(personaId)) {
      return this.memoryManagers.get(personaId)!;
    }

    const storage = useSqlite 
      ? new SqliteStore(`./data/${personaId}.db`)
      : new FileStore(`./data/${personaId}`);
    
    const config: Partial<MemoryConfig> = {
      maxMemorySize: 1000,
      summarizationThreshold: 100,
      motifDetectionThreshold: 3,
      emotionalTrackingEnabled: true,
      motifTrackingEnabled: true
    };

    const manager = new MemoryManager(
      storage,
      new DefaultSummarizer(),
      new DefaultMotifDetector(),
      new DefaultEmotionalAnalyzer(),
      config,
      personaId
    );

    await manager.initialize();
    this.memoryManagers.set(personaId, manager);
    return manager;
  }

  async processInput(input: CLIInput): Promise<CLIOutput> {
    try {
      const personaId = input.personaId || 'default';
      const manager = await this.initializeMemoryManager(personaId, input.useSqlite || false);

      switch (input.action) {
        case 'ingest':
          if (!input.text || !input.source) {
            return { success: false, error: 'text and source are required for ingest action' };
          }
          const memory = await manager.ingestUtterance(
            input.text,
            input.source,
            input.tags || [],
            input.metadata || {}
          );
          return { success: true, data: memory };

        case 'query':
          const queryResult = await manager.queryMemories(input.query || {});
          return { success: true, data: queryResult };

        case 'summary':
          const summary = await manager.getSummary();
          return { success: true, data: summary };

        case 'facts':
          const facts = await manager.summarizeFacts();
          return { success: true, data: { facts } };

        case 'emotions':
          const emotions = await manager.summarizeEmotions();
          return { success: true, data: { emotions } };

        case 'motifs':
          const motifs = await manager.getMotifs();
          return { success: true, data: { motifs } };

        case 'get':
          if (!input.memoryId) {
            return { success: false, error: 'memoryId is required for get action' };
          }
          const retrievedMemory = await manager.getMemory(input.memoryId);
          if (!retrievedMemory) {
            return { success: false, error: 'Memory not found' };
          }
          return { success: true, data: retrievedMemory };

        case 'delete':
          if (!input.memoryId) {
            return { success: false, error: 'memoryId is required for delete action' };
          }
          await manager.deleteMemory(input.memoryId);
          return { success: true, data: { message: 'Memory deleted successfully' } };

        case 'clear':
          await manager.clearAllMemories();
          return { success: true, data: { message: 'All memories cleared successfully' } };

        default:
          return { success: false, error: `Unknown action: ${input.action}` };
      }
    } catch (error) {
      return { success: false, error: `Error processing request: ${error}` };
    }
  }

  async run(): Promise<void> {
    const argv = await yargs(hideBin(process.argv))
      .option('action', {
        alias: 'a',
        type: 'string',
        description: 'Action to perform',
        choices: ['ingest', 'query', 'summary', 'facts', 'emotions', 'motifs', 'get', 'delete', 'clear']
      })
      .option('text', {
        alias: 't',
        type: 'string',
        description: 'Text to ingest'
      })
      .option('source', {
        alias: 's',
        type: 'string',
        description: 'Source of the utterance'
      })
      .option('personaId', {
        alias: 'p',
        type: 'string',
        description: 'Persona ID',
        default: 'default'
      })
      .option('memoryId', {
        alias: 'm',
        type: 'string',
        description: 'Memory ID for get/delete actions'
      })
      .option('useSqlite', {
        type: 'boolean',
        description: 'Use SQLite storage instead of file storage',
        default: false
      })
      .option('tags', {
        type: 'array',
        description: 'Tags for the utterance'
      })
      .option('query', {
        type: 'string',
        description: 'JSON query string for query action'
      })
      .help()
      .argv;

    // If no action is provided, read from stdin
    if (!argv.action) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });

      let inputBuffer = '';
      
      rl.on('line', (line) => {
        inputBuffer += line;
      });

      rl.on('close', async () => {
        try {
          const input: CLIInput = JSON.parse(inputBuffer);
          const result = await this.processInput(input);
          console.log(JSON.stringify(result));
        } catch (error) {
          console.log(JSON.stringify({
            success: false,
            error: `Failed to parse input: ${error}`
          }));
        }
      });

      return;
    }

    // Process command line arguments
    const input: CLIInput = {
      action: argv.action as any,
      text: argv.text,
      source: argv.source,
      personaId: argv.personaId,
      tags: argv.tags as string[],
      memoryId: argv.memoryId,
      useSqlite: argv.useSqlite,
      query: argv.query ? JSON.parse(argv.query) : undefined
    };

    const result = await this.processInput(input);
    console.log(JSON.stringify(result));
  }
}

// Run the CLI bridge
if (require.main === module) {
  const bridge = new CLIBridge();
  bridge.run().catch(error => {
    console.error('CLI Bridge error:', error);
    process.exit(1);
  });
}

export default CLIBridge; 