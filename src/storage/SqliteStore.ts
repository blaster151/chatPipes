import Database from 'better-sqlite3';
import * as path from 'path';
import {
  MemoryItem,
  MemorySummary,
  Motif,
  Utterance,
  EmotionalTone
} from '../core/types';
import { StorageAdapter } from './StorageAdapter';

export class SqliteStore implements StorageAdapter {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = './data/memory.db') {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
  }

  async init(): Promise<void> {
    try {
      // Create tables if they don't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          utterance_id TEXT NOT NULL,
          utterance_text TEXT NOT NULL,
          utterance_timestamp TEXT NOT NULL,
          utterance_source TEXT NOT NULL,
          utterance_tags TEXT,
          utterance_metadata TEXT,
          utterance_emotional_tone TEXT,
          importance REAL NOT NULL,
          access_count INTEGER NOT NULL DEFAULT 0,
          last_accessed TEXT NOT NULL,
          created_at TEXT NOT NULL,
          motifs TEXT,
          summary TEXT
        );

        CREATE TABLE IF NOT EXISTS motifs (
          id TEXT PRIMARY KEY,
          pattern TEXT NOT NULL,
          frequency INTEGER NOT NULL DEFAULT 1,
          first_seen TEXT NOT NULL,
          last_seen TEXT NOT NULL,
          related_memories TEXT,
          strength REAL NOT NULL DEFAULT 0.5
        );

        CREATE TABLE IF NOT EXISTS summaries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_id TEXT NOT NULL,
          summary_data TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(utterance_source);
        CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(utterance_timestamp);
        CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
        CREATE INDEX IF NOT EXISTS idx_motifs_pattern ON motifs(pattern);
        CREATE INDEX IF NOT EXISTS idx_motifs_frequency ON motifs(frequency);
        CREATE INDEX IF NOT EXISTS idx_summaries_agent ON summaries(agent_id);
      `);
    } catch (error) {
      throw new Error(`Failed to initialize SqliteStore: ${error}`);
    }
  }

  async saveUtterance(agentId: string, item: MemoryItem): Promise<void> {
    return this.saveMemory(item);
  }

  async getUtterances(agentId: string, limit?: number): Promise<MemoryItem[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE utterance_source = ? 
      ORDER BY created_at DESC
      ${limit ? 'LIMIT ?' : ''}
    `);
    
    const rows = limit ? stmt.all(agentId, limit) : stmt.all(agentId);
    return (rows as any[]).map(row => this.rowToMemoryItem(row));
  }

  async saveSummary(agentId: string, summary: MemorySummary): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO summaries (agent_id, summary_data, created_at)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(agentId, JSON.stringify(summary), new Date().toISOString());
  }

  async getLatestSummary(agentId: string): Promise<MemorySummary | null> {
    const stmt = this.db.prepare(`
      SELECT summary_data FROM summaries 
      WHERE agent_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const row = stmt.get(agentId) as any;
    return row ? JSON.parse(row.summary_data) : null;
  }

  async clear(agentId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM memories WHERE utterance_source = ?');
    stmt.run(agentId);
  }

  async saveMemory(memory: MemoryItem): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO memories (
          id, utterance_id, utterance_text, utterance_timestamp, utterance_source,
          utterance_tags, utterance_metadata, utterance_emotional_tone,
          importance, access_count, last_accessed, created_at, motifs, summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        memory.id,
        memory.utterance.id,
        memory.utterance.text,
        memory.utterance.timestamp.toISOString(),
        memory.utterance.source,
        JSON.stringify(memory.utterance.tags || []),
        JSON.stringify(memory.utterance.metadata || {}),
        JSON.stringify(memory.utterance.emotionalTone || null),
        memory.importance,
        memory.accessCount,
        memory.lastAccessed.toISOString(),
        memory.createdAt.toISOString(),
        JSON.stringify(memory.motifs || []),
        memory.summary || null
      );
    } catch (error) {
      throw new Error(`Failed to save memory: ${error}`);
    }
  }

  async getMemory(id: string): Promise<MemoryItem | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?');
      const row = stmt.get(id) as any;

      if (!row) return null;

      return this.rowToMemoryItem(row);
    } catch (error) {
      throw new Error(`Failed to get memory: ${error}`);
    }
  }

  async getAllMemories(): Promise<MemoryItem[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM memories ORDER BY created_at DESC');
      const rows = stmt.all() as any[];

      return rows.map(row => this.rowToMemoryItem(row));
    } catch (error) {
      throw new Error(`Failed to get all memories: ${error}`);
    }
  }

  async getMemoriesBySource(source: string): Promise<MemoryItem[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM memories WHERE utterance_source = ? ORDER BY created_at DESC');
      const rows = stmt.all(source) as any[];

      return rows.map(row => this.rowToMemoryItem(row));
    } catch (error) {
      throw new Error(`Failed to get memories by source: ${error}`);
    }
  }

  async getMemoriesByTimeRange(start: Date, end: Date): Promise<MemoryItem[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM memories 
        WHERE utterance_timestamp BETWEEN ? AND ? 
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(start.toISOString(), end.toISOString()) as any[];

      return rows.map(row => this.rowToMemoryItem(row));
    } catch (error) {
      throw new Error(`Failed to get memories by time range: ${error}`);
    }
  }

  async deleteMemory(id: string): Promise<void> {
    try {
      const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?');
      stmt.run(id);
    } catch (error) {
      throw new Error(`Failed to delete memory: ${error}`);
    }
  }

  async clearAllMemories(): Promise<void> {
    try {
      this.db.exec('DELETE FROM memories');
    } catch (error) {
      throw new Error(`Failed to clear all memories: ${error}`);
    }
  }

  async saveMotif(motif: Motif): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO motifs (
          id, pattern, frequency, first_seen, last_seen, related_memories, strength
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        motif.id,
        motif.pattern,
        motif.frequency,
        motif.firstSeen.toISOString(),
        motif.lastSeen.toISOString(),
        JSON.stringify(motif.relatedMemories || []),
        motif.strength
      );
    } catch (error) {
      throw new Error(`Failed to save motif: ${error}`);
    }
  }

  async getMotifs(): Promise<Motif[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM motifs ORDER BY frequency DESC');
      const rows = stmt.all() as any[];

      return rows.map(row => this.rowToMotif(row));
    } catch (error) {
      throw new Error(`Failed to get motifs: ${error}`);
    }
  }

  async updateMotif(motif: Motif): Promise<void> {
    try {
      await this.saveMotif(motif);
    } catch (error) {
      throw new Error(`Failed to update motif: ${error}`);
    }
  }

  async deleteMotif(id: string): Promise<void> {
    try {
      const stmt = this.db.prepare('DELETE FROM motifs WHERE id = ?');
      stmt.run(id);
    } catch (error) {
      throw new Error(`Failed to delete motif: ${error}`);
    }
  }

  close(): void {
    this.db.close();
  }

  private rowToMemoryItem(row: any): MemoryItem {
    const utterance: Utterance = {
      id: row.utterance_id,
      text: row.utterance_text,
      timestamp: new Date(row.utterance_timestamp),
      source: row.utterance_source,
      tags: JSON.parse(row.utterance_tags || '[]'),
      metadata: JSON.parse(row.utterance_metadata || '{}'),
      emotionalTone: row.utterance_emotional_tone ? 
        JSON.parse(row.utterance_emotional_tone) as EmotionalTone : undefined
    };

    return {
      id: row.id,
      utterance,
      importance: row.importance,
      accessCount: row.access_count,
      lastAccessed: new Date(row.last_accessed),
      createdAt: new Date(row.created_at),
      motifs: JSON.parse(row.motifs || '[]'),
      summary: row.summary || undefined
    };
  }

  private rowToMotif(row: any): Motif {
    return {
      id: row.id,
      pattern: row.pattern,
      frequency: row.frequency,
      firstSeen: new Date(row.first_seen),
      lastSeen: new Date(row.last_seen),
      relatedMemories: JSON.parse(row.related_memories || '[]'),
      strength: row.strength
    };
  }
} 