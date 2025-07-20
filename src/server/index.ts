import express from 'express';
import { MemoryManager } from '../core/MemoryManager';
import { FileStore } from '../storage/FileStore';
import { SqliteStore } from '../storage/SqliteStore';
import { DefaultSummarizer } from '../core/DefaultSummarizer';
import { DefaultMotifDetector } from '../core/DefaultMotifDetector';
import { DefaultEmotionalAnalyzer } from '../core/DefaultEmotionalAnalyzer';
import { MemoryConfig } from '../core/types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize memory managers for different personas
const memoryManagers = new Map<string, MemoryManager>();

async function initializeMemoryManager(personaId: string, useSqlite: boolean = false): Promise<MemoryManager> {
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
  return manager;
}

// Routes

// Ingest utterance
app.post('/ingest', async (req, res) => {
  try {
    const { text, source, personaId = 'default', tags = [], metadata = {} } = req.body;
    
    if (!text || !source) {
      return res.status(400).json({ error: 'text and source are required' });
    }

    if (!memoryManagers.has(personaId)) {
      memoryManagers.set(personaId, await initializeMemoryManager(personaId));
    }

    const manager = memoryManagers.get(personaId)!;
    const memory = await manager.ingestUtterance(text, source, tags, metadata);
    
    res.json({ success: true, memory });
  } catch (error) {
    console.error('Error ingesting utterance:', error);
    res.status(500).json({ error: 'Failed to ingest utterance' });
  }
});

// Get memory by ID
app.get('/memory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { personaId = 'default' } = req.query;

    if (!memoryManagers.has(personaId as string)) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const manager = memoryManagers.get(personaId as string)!;
    const memory = await manager.getMemory(id);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json({ memory });
  } catch (error) {
    console.error('Error getting memory:', error);
    res.status(500).json({ error: 'Failed to get memory' });
  }
});

// Query memories
app.post('/query', async (req, res) => {
  try {
    const { query, personaId = 'default' } = req.body;
    
    if (!memoryManagers.has(personaId)) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const manager = memoryManagers.get(personaId)!;
    const result = await manager.queryMemories(query || {});
    
    res.json(result);
  } catch (error) {
    console.error('Error querying memories:', error);
    res.status(500).json({ error: 'Failed to query memories' });
  }
});

// Get summary
app.get('/summary', async (req, res) => {
  try {
    const { personaId = 'default' } = req.query;

    if (!memoryManagers.has(personaId as string)) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const manager = memoryManagers.get(personaId as string)!;
    const summary = await manager.getSummary();
    
    res.json(summary);
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// Get facts summary
app.get('/summary/facts', async (req, res) => {
  try {
    const { personaId = 'default' } = req.query;

    if (!memoryManagers.has(personaId as string)) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const manager = memoryManagers.get(personaId as string)!;
    const facts = await manager.summarizeFacts();
    
    res.json({ facts });
  } catch (error) {
    console.error('Error getting facts summary:', error);
    res.status(500).json({ error: 'Failed to get facts summary' });
  }
});

// Get emotions summary
app.get('/summary/emotions', async (req, res) => {
  try {
    const { personaId = 'default' } = req.query;

    if (!memoryManagers.has(personaId as string)) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const manager = memoryManagers.get(personaId as string)!;
    const emotions = await manager.summarizeEmotions();
    
    res.json({ emotions });
  } catch (error) {
    console.error('Error getting emotions summary:', error);
    res.status(500).json({ error: 'Failed to get emotions summary' });
  }
});

// Get motifs
app.get('/motifs', async (req, res) => {
  try {
    const { personaId = 'default' } = req.query;

    if (!memoryManagers.has(personaId as string)) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const manager = memoryManagers.get(personaId as string)!;
    const motifs = await manager.getMotifs();
    
    res.json({ motifs });
  } catch (error) {
    console.error('Error getting motifs:', error);
    res.status(500).json({ error: 'Failed to get motifs' });
  }
});

// Delete memory
app.delete('/memory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { personaId = 'default' } = req.query;

    if (!memoryManagers.has(personaId as string)) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const manager = memoryManagers.get(personaId as string)!;
    await manager.deleteMemory(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// Clear all memories
app.delete('/memories', async (req, res) => {
  try {
    const { personaId = 'default' } = req.query;

    if (!memoryManagers.has(personaId as string)) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const manager = memoryManagers.get(personaId as string)!;
    await manager.clearAllMemories();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing memories:', error);
    res.status(500).json({ error: 'Failed to clear memories' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    activePersonas: Array.from(memoryManagers.keys()),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MemoryManager server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app; 