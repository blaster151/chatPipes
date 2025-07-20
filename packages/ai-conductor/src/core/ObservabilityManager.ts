import { EventEmitter } from 'events';
import { 
  DialogueExchange, 
  ReplayOptions, 
  ReplayEvent,
  ReplayState,
  ExchangeMetadata 
} from '@chatpipes/types';

export interface ObservabilityConfig {
  enableReplay: boolean;
  maxHistorySize: number;
  persistToFile: boolean;
  filePath?: string;
  autoSaveInterval: number;
  enableLiveStreaming: boolean;
}

export interface ReplaySession {
  id: string;
  exchanges: DialogueExchange[];
  metadata: {
    startTime: Date;
    endTime?: Date;
    totalExchanges: number;
    agentCount: number;
    sessionName: string;
  };
  config: ReplayOptions;
}

export class ObservabilityManager extends EventEmitter {
  private exchanges: DialogueExchange[] = [];
  private replaySessions: Map<string, ReplaySession> = new Map();
  private activeReplays: Map<string, ReplayState> = new Map();
  private config: ObservabilityConfig;
  private autoSaveTimer?: NodeJS.Timeout;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    super();
    this.setMaxListeners(100);
    
    this.config = {
      enableReplay: true,
      maxHistorySize: 10000,
      persistToFile: false,
      autoSaveInterval: 30000,
      enableLiveStreaming: true,
      ...config
    };

    if (this.config.persistToFile && this.config.autoSaveInterval > 0) {
      this.startAutoSave();
    }
  }

  /**
   * Record a dialogue exchange
   */
  recordExchange(exchange: DialogueExchange): void {
    this.exchanges.push(exchange);

    // Emit live streaming event
    if (this.config.enableLiveStreaming) {
      this.emit('exchange_recorded', {
        exchange,
        totalExchanges: this.exchanges.length,
        timestamp: new Date()
      });
    }

    // Trim history if needed
    if (this.exchanges.length > this.config.maxHistorySize) {
      this.exchanges = this.exchanges.slice(-this.config.maxHistorySize);
    }

    // Emit exchange event for real-time observers
    this.emit('exchange', exchange);
  }

  /**
   * Get all exchanges
   */
  getAllExchanges(): DialogueExchange[] {
    return [...this.exchanges];
  }

  /**
   * Get exchanges by filter
   */
  getExchangesByFilter(filter: {
    agentId?: string;
    round?: number;
    startTime?: Date;
    endTime?: Date;
    hasInterjection?: boolean;
  }): DialogueExchange[] {
    return this.exchanges.filter(exchange => {
      if (filter.agentId && exchange.from !== filter.agentId && exchange.to !== filter.agentId) {
        return false;
      }
      if (filter.round && exchange.round !== filter.round) {
        return false;
      }
      if (filter.startTime && exchange.timestamp < filter.startTime) {
        return false;
      }
      if (filter.endTime && exchange.timestamp > filter.endTime) {
        return false;
      }
      if (filter.hasInterjection !== undefined) {
        const hasInterjection = !!exchange.interjectionId;
        if (hasInterjection !== filter.hasInterjection) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Create replay session
   */
  createReplaySession(
    exchanges: DialogueExchange[],
    options: ReplayOptions = {}
  ): string {
    const sessionId = `replay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const replaySession: ReplaySession = {
      id: sessionId,
      exchanges: [...exchanges],
      metadata: {
        startTime: exchanges[0]?.timestamp || new Date(),
        endTime: exchanges[exchanges.length - 1]?.timestamp,
        totalExchanges: exchanges.length,
        agentCount: new Set(exchanges.flatMap(e => [e.from, e.to])).size,
        sessionName: options.sessionName || 'Replay Session'
      },
      config: {
        speed: 'normal',
        enableInterjections: true,
        enableMetadata: true,
        autoAdvance: true,
        loop: false,
        ...options
      }
    };

    this.replaySessions.set(sessionId, replaySession);
    this.emit('replay_session_created', { sessionId, session: replaySession });

    return sessionId;
  }

  /**
   * Start replay session
   */
  async startReplay(sessionId: string): Promise<void> {
    const session = this.replaySessions.get(sessionId);
    if (!session) {
      throw new Error(`Replay session ${sessionId} not found`);
    }

    const replayState: ReplayState = {
      sessionId,
      currentIndex: 0,
      isPlaying: false,
      isPaused: false,
      startTime: new Date(),
      currentTime: new Date(),
      speed: session.config.speed,
      totalExchanges: session.exchanges.length
    };

    this.activeReplays.set(sessionId, replayState);
    this.emit('replay_started', { sessionId, state: replayState });

    // Start replay loop
    this.runReplayLoop(sessionId);
  }

  /**
   * Run replay loop
   */
  private async runReplayLoop(sessionId: string): Promise<void> {
    const session = this.replaySessions.get(sessionId);
    const state = this.activeReplays.get(sessionId);
    
    if (!session || !state) return;

    state.isPlaying = true;
    this.emit('replay_playing', { sessionId, state });

    for (let i = 0; i < session.exchanges.length; i++) {
      if (!state.isPlaying) break;

      state.currentIndex = i;
      state.currentTime = new Date();

      const exchange = session.exchanges[i];
      
      // Emit exchange event
      const replayEvent: ReplayEvent = {
        type: 'exchange',
        exchange,
        index: i,
        timestamp: new Date(),
        sessionId
      };

      this.emit('replay_exchange', replayEvent);

      // Calculate delay based on speed
      const delay = this.calculateReplayDelay(session.config.speed);
      
      // Wait for delay or pause
      await this.waitWithPause(delay, sessionId);

      // Auto-advance if enabled
      if (!session.config.autoAdvance) {
        await this.waitForManualAdvance(sessionId);
      }
    }

    // Handle loop
    if (session.config.loop && state.isPlaying) {
      state.currentIndex = 0;
      this.runReplayLoop(sessionId);
    } else {
      this.completeReplay(sessionId);
    }
  }

  /**
   * Calculate replay delay based on speed
   */
  private calculateReplayDelay(speed: string): number {
    switch (speed) {
      case 'instant': return 0;
      case 'fast': return 300;
      case 'normal': return 1000;
      case 'slow': return 3000;
      default: return 1000;
    }
  }

  /**
   * Wait with pause support
   */
  private async waitWithPause(delay: number, sessionId: string): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < delay) {
      const state = this.activeReplays.get(sessionId);
      if (!state || !state.isPlaying) return;
      
      if (state.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Wait for manual advance
   */
  private async waitForManualAdvance(sessionId: string): Promise<void> {
    return new Promise(resolve => {
      const onAdvance = (data: { sessionId: string }) => {
        if (data.sessionId === sessionId) {
          this.off('replay_advance', onAdvance);
          resolve();
        }
      };
      this.on('replay_advance', onAdvance);
    });
  }

  /**
   * Pause replay
   */
  pauseReplay(sessionId: string): void {
    const state = this.activeReplays.get(sessionId);
    if (state) {
      state.isPaused = true;
      this.emit('replay_paused', { sessionId, state });
    }
  }

  /**
   * Resume replay
   */
  resumeReplay(sessionId: string): void {
    const state = this.activeReplays.get(sessionId);
    if (state) {
      state.isPaused = false;
      this.emit('replay_resumed', { sessionId, state });
    }
  }

  /**
   * Stop replay
   */
  stopReplay(sessionId: string): void {
    const state = this.activeReplays.get(sessionId);
    if (state) {
      state.isPlaying = false;
      this.emit('replay_stopped', { sessionId, state });
    }
  }

  /**
   * Advance replay manually
   */
  advanceReplay(sessionId: string): void {
    this.emit('replay_advance', { sessionId });
  }

  /**
   * Jump to specific exchange in replay
   */
  jumpToExchange(sessionId: string, index: number): void {
    const state = this.activeReplays.get(sessionId);
    const session = this.replaySessions.get(sessionId);
    
    if (state && session && index >= 0 && index < session.exchanges.length) {
      state.currentIndex = index;
      state.currentTime = new Date();
      
      const exchange = session.exchanges[index];
      const replayEvent: ReplayEvent = {
        type: 'exchange',
        exchange,
        index,
        timestamp: new Date(),
        sessionId
      };

      this.emit('replay_exchange', replayEvent);
      this.emit('replay_jumped', { sessionId, index, state });
    }
  }

  /**
   * Complete replay
   */
  private completeReplay(sessionId: string): void {
    const state = this.activeReplays.get(sessionId);
    if (state) {
      state.isPlaying = false;
      this.emit('replay_completed', { sessionId, state });
    }
  }

  /**
   * Get replay state
   */
  getReplayState(sessionId: string): ReplayState | null {
    return this.activeReplays.get(sessionId) || null;
  }

  /**
   * Get replay session
   */
  getReplaySession(sessionId: string): ReplaySession | null {
    return this.replaySessions.get(sessionId) || null;
  }

  /**
   * Get all replay sessions
   */
  getAllReplaySessions(): ReplaySession[] {
    return Array.from(this.replaySessions.values());
  }

  /**
   * Export replay session
   */
  exportReplaySession(sessionId: string): string {
    const session = this.replaySessions.get(sessionId);
    if (!session) {
      throw new Error(`Replay session ${sessionId} not found`);
    }

    return JSON.stringify(session, null, 2);
  }

  /**
   * Import replay session
   */
  importReplaySession(jsonData: string): string {
    try {
      const session: ReplaySession = JSON.parse(jsonData);
      const sessionId = session.id || `imported-${Date.now()}`;
      
      this.replaySessions.set(sessionId, {
        ...session,
        id: sessionId
      });

      this.emit('replay_session_imported', { sessionId, session });
      return sessionId;
    } catch (error) {
      throw new Error(`Failed to import replay session: ${error}`);
    }
  }

  /**
   * Get observability statistics
   */
  getStats() {
    return {
      totalExchanges: this.exchanges.length,
      activeReplays: this.activeReplays.size,
      replaySessions: this.replaySessions.size,
      config: this.config
    };
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.saveToFile();
    }, this.config.autoSaveInterval);
  }

  /**
   * Save exchanges to file
   */
  private async saveToFile(): Promise<void> {
    if (!this.config.persistToFile || !this.config.filePath) return;

    try {
      const fs = require('fs').promises;
      const data = {
        exchanges: this.exchanges,
        timestamp: new Date(),
        version: '1.0.0'
      };
      
      await fs.writeFile(this.config.filePath, JSON.stringify(data, null, 2));
      this.emit('data_saved', { filePath: this.config.filePath, exchangeCount: this.exchanges.length });
    } catch (error) {
      this.emit('save_error', { error, filePath: this.config.filePath });
    }
  }

  /**
   * Load exchanges from file
   */
  async loadFromFile(filePath: string): Promise<void> {
    try {
      const fs = require('fs').promises;
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      
      if (data.exchanges && Array.isArray(data.exchanges)) {
        this.exchanges = data.exchanges;
        this.emit('data_loaded', { filePath, exchangeCount: this.exchanges.length });
      }
    } catch (error) {
      this.emit('load_error', { error, filePath });
      throw error;
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.exchanges = [];
    this.replaySessions.clear();
    this.activeReplays.clear();
    this.emit('data_cleared');
  }

  /**
   * Close and cleanup
   */
  close(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    // Stop all active replays
    for (const sessionId of this.activeReplays.keys()) {
      this.stopReplay(sessionId);
    }
    
    this.removeAllListeners();
  }
} 