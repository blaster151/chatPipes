import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  SessionState, 
  Exchange, 
  InterjectionRecord, 
  SessionReplay, 
  LiveLogEntry,
  AgentSession,
  PersonaConfig,
  StorageAdapter
} from '@chatpipes/types';
import { FileStore } from '../storage/FileStore';

export interface SessionManagerConfig {
  storagePath?: string;
  autoSave?: boolean;
  saveInterval?: number;
  maxLogEntries?: number;
  enableReplay?: boolean;
}

export class SessionManager extends EventEmitter {
  private sessions: Map<string, SessionState> = new Map();
  private replays: Map<string, SessionReplay> = new Map();
  private liveLogs: Map<string, LiveLogEntry[]> = new Map();
  private storage: StorageAdapter;
  private config: SessionManagerConfig;
  private autoSaveTimer?: NodeJS.Timeout;

  constructor(config: SessionManagerConfig = {}) {
    super();
    this.config = {
      storagePath: './sessions',
      autoSave: true,
      saveInterval: 30000, // 30 seconds
      maxLogEntries: 1000,
      enableReplay: true,
      ...config
    };
    
    this.storage = new FileStore(this.config.storagePath!);
  }

  /**
   * Initialize the session manager
   */
  async init(): Promise<void> {
    await this.storage.init();
    await this.loadSessions();
    
    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Create a new session
   */
  createSession(
    name: string,
    type: 'dialogue' | 'multi-agent',
    agents: Array<{
      id: string;
      name: string;
      persona: PersonaConfig;
      platform: string;
    }>,
    config: any = {}
  ): SessionState {
    const sessionId = uuidv4();
    const now = new Date();
    
    const session: SessionState = {
      id: sessionId,
      name,
      type,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      config: {
        maxRounds: config.maxRounds,
        turnDelay: config.turnDelay,
        enableStreaming: config.enableStreaming,
        synthesisStrategy: config.synthesisStrategy,
        contextWindow: config.contextWindow
      },
      agents: agents.map(agent => ({
        ...agent,
        isActive: true
      })),
      exchanges: [],
      interjections: [],
      currentRound: 0,
      currentTurn: null,
      metadata: {
        totalTokens: 0,
        totalDuration: 0,
        averageResponseTime: 0,
        errorCount: 0
      }
    };

    this.sessions.set(sessionId, session);
    this.liveLogs.set(sessionId, []);
    
    this.addLogEntry(sessionId, 'info', 'system', `Session "${name}" created`);
    this.emit('session_created', session);
    
    return session;
  }

  /**
   * Add an exchange to a session
   */
  addExchange(
    sessionId: string,
    from: string,
    to: string,
    prompt: string,
    response: string,
    round: number,
    metadata?: any
  ): Exchange {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const exchange: Exchange = {
      id: uuidv4(),
      from,
      to,
      prompt,
      response,
      timestamp: new Date(),
      round,
      metadata: {
        tokens: metadata?.tokens,
        duration: metadata?.duration,
        platform: metadata?.platform,
        model: metadata?.model
      }
    };

    session.exchanges.push(exchange);
    session.updatedAt = new Date();
    session.currentRound = round;
    session.currentTurn = to;

    // Update metadata
    if (metadata?.tokens) {
      session.metadata!.totalTokens! += metadata.tokens;
    }
    if (metadata?.duration) {
      session.metadata!.totalDuration! += metadata.duration;
      session.metadata!.averageResponseTime = session.metadata!.totalDuration! / session.exchanges.length;
    }

    this.addLogEntry(sessionId, 'info', 'turn', 
      `${from} → ${to}: ${response.substring(0, 100)}...`);
    
    this.emit('exchange_added', { sessionId, exchange });
    
    return exchange;
  }

  /**
   * Add an interjection to a session
   */
  addInterjection(
    sessionId: string,
    interjection: Omit<InterjectionRecord, 'id' | 'timestamp'>
  ): InterjectionRecord {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const interjectionRecord: InterjectionRecord = {
      ...interjection,
      id: uuidv4(),
      timestamp: new Date()
    };

    session.interjections.push(interjectionRecord);
    session.updatedAt = new Date();

    this.addLogEntry(sessionId, 'info', 'interjection', 
      `Interjection added: ${interjection.text.substring(0, 50)}...`);
    
    this.emit('interjection_added', { sessionId, interjection: interjectionRecord });
    
    return interjectionRecord;
  }

  /**
   * Mark an interjection as applied
   */
  markInterjectionApplied(sessionId: string, interjectionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const interjection = session.interjections.find(i => i.id === interjectionId);
    if (interjection) {
      interjection.appliedAt = new Date();
      this.addLogEntry(sessionId, 'info', 'interjection', 
        `Interjection applied: ${interjection.text.substring(0, 50)}...`);
    }
  }

  /**
   * Update session status
   */
  updateSessionStatus(sessionId: string, status: SessionState['status']): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = status;
    session.updatedAt = new Date();

    this.addLogEntry(sessionId, 'info', 'system', `Session status changed to: ${status}`);
    this.emit('session_status_changed', { sessionId, status });
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): SessionState[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Export session as JSON
   */
  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const exportData = {
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      exchanges: session.exchanges.map(exchange => ({
        ...exchange,
        timestamp: exchange.timestamp.toISOString()
      })),
      interjections: session.interjections.map(interjection => ({
        ...interjection,
        timestamp: interjection.timestamp.toISOString(),
        appliedAt: interjection.appliedAt?.toISOString()
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import session from JSON
   */
  importSession(jsonData: string): SessionState {
    const data = JSON.parse(jsonData);
    
    // Convert ISO strings back to Date objects
    const session: SessionState = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      exchanges: data.exchanges.map((ex: any) => ({
        ...ex,
        timestamp: new Date(ex.timestamp)
      })),
      interjections: data.interjections.map((int: any) => ({
        ...int,
        timestamp: new Date(int.timestamp),
        appliedAt: int.appliedAt ? new Date(int.appliedAt) : undefined
      }))
    };

    // Generate new ID if importing
    if (this.sessions.has(session.id)) {
      session.id = uuidv4();
    }

    this.sessions.set(session.id, session);
    this.liveLogs.set(session.id, []);
    
    this.addLogEntry(session.id, 'info', 'system', `Session "${session.name}" imported`);
    this.emit('session_imported', session);
    
    return session;
  }

  /**
   * Start a replay session
   */
  startReplay(sessionId: string, speed: SessionReplay['speed'] = 'normal'): SessionReplay {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const replayId = uuidv4();
    const replay: SessionReplay = {
      sessionId,
      replayId,
      startTime: new Date(),
      speed,
      currentExchangeIndex: 0,
      isPlaying: false,
      exchanges: [...session.exchanges]
    };

    this.replays.set(replayId, replay);
    this.emit('replay_started', replay);
    
    return replay;
  }

  /**
   * Play replay
   */
  async playReplay(replayId: string): Promise<void> {
    const replay = this.replays.get(replayId);
    if (!replay) {
      throw new Error(`Replay ${replayId} not found`);
    }

    replay.isPlaying = true;
    this.emit('replay_playing', replay);

    const delays = {
      slow: 3000,
      normal: 1000,
      fast: 300,
      instant: 0
    };

    const delay = delays[replay.speed];

    for (let i = replay.currentExchangeIndex; i < replay.exchanges.length; i++) {
      if (!replay.isPlaying) break;

      const exchange = replay.exchanges[i];
      replay.currentExchangeIndex = i;
      
      this.emit('replay_exchange', { replayId, exchange, index: i });
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    replay.isPlaying = false;
    replay.endTime = new Date();
    this.emit('replay_completed', replay);
  }

  /**
   * Pause replay
   */
  pauseReplay(replayId: string): void {
    const replay = this.replays.get(replayId);
    if (replay) {
      replay.isPlaying = false;
      this.emit('replay_paused', replay);
    }
  }

  /**
   * Stop replay
   */
  stopReplay(replayId: string): void {
    const replay = this.replays.get(replayId);
    if (replay) {
      replay.isPlaying = false;
      replay.currentExchangeIndex = 0;
      this.emit('replay_stopped', replay);
    }
  }

  /**
   * Get replay by ID
   */
  getReplay(replayId: string): SessionReplay | undefined {
    return this.replays.get(replayId);
  }

  /**
   * Add log entry
   */
  addLogEntry(
    sessionId: string,
    level: LiveLogEntry['level'],
    category: LiveLogEntry['category'],
    message: string,
    data?: any
  ): void {
    const logs = this.liveLogs.get(sessionId) || [];
    
    const logEntry: LiveLogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    logs.push(logEntry);

    // Limit log entries
    if (logs.length > this.config.maxLogEntries!) {
      logs.splice(0, logs.length - this.config.maxLogEntries!);
    }

    this.liveLogs.set(sessionId, logs);
    this.emit('log_entry_added', { sessionId, logEntry });
  }

  /**
   * Get live logs for a session
   */
  getLiveLogs(sessionId: string, limit?: number): LiveLogEntry[] {
    const logs = this.liveLogs.get(sessionId) || [];
    return limit ? logs.slice(-limit) : logs;
  }

  /**
   * Clear logs for a session
   */
  clearLogs(sessionId: string): void {
    this.liveLogs.set(sessionId, []);
    this.emit('logs_cleared', { sessionId });
  }

  /**
   * Save sessions to storage
   */
  async saveSessions(): Promise<void> {
    try {
      const sessionsData = Array.from(this.sessions.values()).map(session => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        exchanges: session.exchanges.map(exchange => ({
          ...exchange,
          timestamp: exchange.timestamp.toISOString()
        })),
        interjections: session.interjections.map(interjection => ({
          ...interjection,
          timestamp: interjection.timestamp.toISOString(),
          appliedAt: interjection.appliedAt?.toISOString()
        }))
      }));

      await this.storage.save('sessions.json', sessionsData);
      this.emit('sessions_saved', { count: sessionsData.length });
    } catch (error) {
      this.emit('save_error', error);
      throw error;
    }
  }

  /**
   * Load sessions from storage
   */
  async loadSessions(): Promise<void> {
    try {
      const sessionsData = await this.storage.load('sessions.json');
      if (sessionsData) {
        for (const sessionData of sessionsData) {
          const session: SessionState = {
            ...sessionData,
            createdAt: new Date(sessionData.createdAt),
            updatedAt: new Date(sessionData.updatedAt),
            exchanges: sessionData.exchanges.map((ex: any) => ({
              ...ex,
              timestamp: new Date(ex.timestamp)
            })),
            interjections: sessionData.interjections.map((int: any) => ({
              ...int,
              timestamp: new Date(int.timestamp),
              appliedAt: int.appliedAt ? new Date(int.appliedAt) : undefined
            }))
          };

          this.sessions.set(session.id, session);
          this.liveLogs.set(session.id, []);
        }
      }
    } catch (error) {
      // Ignore load errors for new installations
      console.warn('No existing sessions found or error loading sessions:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.saveSessions();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.config.saveInterval);
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  /**
   * Close the session manager
   */
  async close(): Promise<void> {
    this.stopAutoSave();
    await this.saveSessions();
    await this.storage.close();
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    totalExchanges: number;
    totalInterjections: number;
    averageResponseLength: number;
    totalDuration: number;
    errorCount: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const totalExchanges = session.exchanges.length;
    const totalInterjections = session.interjections.length;
    const averageResponseLength = totalExchanges > 0 
      ? session.exchanges.reduce((sum, ex) => sum + ex.response.length, 0) / totalExchanges 
      : 0;
    const totalDuration = session.metadata?.totalDuration || 0;
    const errorCount = session.metadata?.errorCount || 0;

    return {
      totalExchanges,
      totalInterjections,
      averageResponseLength,
      totalDuration,
      errorCount
    };
  }
} 