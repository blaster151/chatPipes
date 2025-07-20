import { EventEmitter } from 'events';
import { AgentSession, ConvoThread } from '@chatpipes/ai-conductor';

export interface EnvironmentConfig {
  id: string;
  name: string;
  description: string;
  initialState: any;
  ambientEventFrequencyMs?: number;
  ambientEventGenerator: (state: any, timestamp: Date) => AmbientEvent;
  stateUpdateRules?: StateUpdateRule[];
  eventFilters?: EventFilter[];
  maxListeners?: number;
}

export interface AmbientEvent {
  id: string;
  type: 'ambient' | 'social' | 'environmental' | 'narrative';
  description: string;
  intensity: number; // 0-1 scale
  duration: number; // milliseconds
  affects: string[]; // which aspects of state this affects
  timestamp: Date;
  metadata?: any;
}

export interface StateUpdateRule {
  condition: (state: any, event: AmbientEvent) => boolean;
  update: (state: any, event: AmbientEvent) => any;
  priority: number; // higher numbers execute first
}

export interface EventFilter {
  condition: (event: AmbientEvent, state: any) => boolean;
  transform?: (event: AmbientEvent) => AmbientEvent;
  suppress?: boolean; // if true, event is not emitted
}

export interface EnvironmentState {
  time: {
    hour: number;
    minute: number;
    day: number;
    season: string;
  };
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  atmosphere: {
    mood: string;
    noiseLevel: number;
    lighting: string;
    activity: string;
  };
  social: {
    nearbyConversations: number;
    crowdDensity: number;
    socialTension: number;
    recentEvents: string[];
  };
  physical: {
    temperature: number;
    smells: string[];
    sounds: string[];
    visualElements: string[];
  };
  [key: string]: any;
}

export class Environment extends EventEmitter {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public state: EnvironmentState;
  public listeners: Set<AgentSession | ConvoThread> = new Set();
  
  private config: EnvironmentConfig;
  private ambientLoop?: NodeJS.Timeout;
  private eventHistory: AmbientEvent[] = [];
  private isActive: boolean = false;
  private lastTick: Date = new Date();

  constructor(config: EnvironmentConfig) {
    super();
    this.setMaxListeners(config.maxListeners || 100);
    
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.config = config;
    this.state = { ...config.initialState };
  }

  /**
   * Start the ambient event loop
   */
  startAmbientLoop(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.lastTick = new Date();

    const frequency = this.config.ambientEventFrequencyMs || 30000; // 30 seconds default

    this.ambientLoop = setInterval(() => {
      this.tick();
    }, frequency);

    this.emit('ambient_loop_started', {
      environmentId: this.id,
      frequency,
      timestamp: new Date()
    });
  }

  /**
   * Stop the ambient event loop
   */
  stopAmbientLoop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    
    if (this.ambientLoop) {
      clearInterval(this.ambientLoop);
      this.ambientLoop = undefined;
    }

    this.emit('ambient_loop_stopped', {
      environmentId: this.id,
      timestamp: new Date()
    });
  }

  /**
   * Process one tick of the environment
   */
  tick(): void {
    const now = new Date();
    const timeSinceLastTick = now.getTime() - this.lastTick.getTime();
    
    // Update time-based state
    this.updateTimeState(timeSinceLastTick);

    // Generate ambient event
    const event = this.config.ambientEventGenerator(this.state, now);
    
    // Apply event filters
    const filteredEvent = this.applyEventFilters(event);
    
    if (filteredEvent && !filteredEvent.suppress) {
      // Update state based on event
      this.updateStateFromEvent(filteredEvent);
      
      // Emit event to all listeners
      this.emitAmbientEvent(filteredEvent);
      
      // Store in history
      this.eventHistory.push(filteredEvent);
      
      // Trim history if too long
      if (this.eventHistory.length > 1000) {
        this.eventHistory = this.eventHistory.slice(-500);
      }
    }

    this.lastTick = now;
  }

  /**
   * Update time-based state
   */
  private updateTimeState(timeSinceLastTick: number): void {
    // Update time
    if (this.state.time) {
      const minutesToAdd = Math.floor(timeSinceLastTick / 60000);
      this.state.time.minute += minutesToAdd;
      
      if (this.state.time.minute >= 60) {
        this.state.time.hour += Math.floor(this.state.time.minute / 60);
        this.state.time.minute = this.state.time.minute % 60;
      }
      
      if (this.state.time.hour >= 24) {
        this.state.time.day += Math.floor(this.state.time.hour / 24);
        this.state.time.hour = this.state.time.hour % 24;
      }
    }

    // Update weather gradually
    if (this.state.weather) {
      // Simulate gradual weather changes
      const weatherChange = (Math.random() - 0.5) * 0.1;
      this.state.weather.temperature += weatherChange;
      this.state.weather.temperature = Math.max(-20, Math.min(50, this.state.weather.temperature));
    }
  }

  /**
   * Apply event filters
   */
  private applyEventFilters(event: AmbientEvent): AmbientEvent | null {
    let filteredEvent = event;

    for (const filter of this.config.eventFilters || []) {
      if (filter.condition(filteredEvent, this.state)) {
        if (filter.suppress) {
          return null;
        }
        if (filter.transform) {
          filteredEvent = filter.transform(filteredEvent);
        }
      }
    }

    return filteredEvent;
  }

  /**
   * Update state based on event
   */
  private updateStateFromEvent(event: AmbientEvent): void {
    // Apply state update rules
    const sortedRules = (this.config.stateUpdateRules || [])
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.condition(this.state, event)) {
        this.state = rule.update(this.state, event);
      }
    }

    // Update specific state aspects based on event affects
    for (const aspect of event.affects) {
      this.updateStateAspect(aspect, event);
    }
  }

  /**
   * Update specific state aspect
   */
  private updateStateAspect(aspect: string, event: AmbientEvent): void {
    switch (aspect) {
      case 'mood':
        if (this.state.atmosphere) {
          this.state.atmosphere.mood = this.calculateMoodChange(event);
        }
        break;
      case 'noise':
        if (this.state.atmosphere) {
          this.state.atmosphere.noiseLevel = Math.min(1, 
            this.state.atmosphere.noiseLevel + (event.intensity * 0.1));
        }
        break;
      case 'social':
        if (this.state.social) {
          this.state.social.recentEvents.push(event.description);
          if (this.state.social.recentEvents.length > 10) {
            this.state.social.recentEvents = this.state.social.recentEvents.slice(-10);
          }
        }
        break;
      case 'physical':
        if (this.state.physical) {
          this.state.physical.sounds.push(event.description);
          if (this.state.physical.sounds.length > 20) {
            this.state.physical.sounds = this.state.physical.sounds.slice(-20);
          }
        }
        break;
    }
  }

  /**
   * Calculate mood change based on event
   */
  private calculateMoodChange(event: AmbientEvent): string {
    const moods = ['tense', 'calm', 'excited', 'melancholy', 'energetic', 'peaceful'];
    const currentMood = this.state.atmosphere?.mood || 'neutral';
    
    // Simple mood transition based on event intensity and type
    if (event.intensity > 0.7) {
      return event.type === 'social' ? 'excited' : 'tense';
    } else if (event.intensity < 0.3) {
      return event.type === 'environmental' ? 'peaceful' : 'calm';
    }
    
    return currentMood;
  }

  /**
   * Emit ambient event to all listeners
   */
  private emitAmbientEvent(event: AmbientEvent): void {
    // Emit to environment listeners
    this.emit('ambient_event', {
      environmentId: this.id,
      event,
      state: this.state
    });

    // Emit to connected listeners
    for (const listener of this.listeners) {
      if (listener instanceof AgentSession) {
        listener.emit('ambient_event', {
          environmentId: this.id,
          event,
          state: this.state
        });
      } else if (listener instanceof ConvoThread) {
        listener.emit('ambient_event', {
          environmentId: this.id,
          event,
          state: this.state
        });
      }
    }
  }

  /**
   * Connect a listener to this environment
   */
  connect(listener: AgentSession | ConvoThread): void {
    this.listeners.add(listener);
    
    // Send current state to new listener
    listener.emit('environment_connected', {
      environmentId: this.id,
      state: this.state,
      description: this.description
    });

    this.emit('listener_connected', {
      environmentId: this.id,
      listenerId: listener instanceof AgentSession ? listener.id : listener.id,
      timestamp: new Date()
    });
  }

  /**
   * Disconnect a listener from this environment
   */
  disconnect(listener: AgentSession | ConvoThread): void {
    this.listeners.delete(listener);
    
    listener.emit('environment_disconnected', {
      environmentId: this.id,
      timestamp: new Date()
    });

    this.emit('listener_disconnected', {
      environmentId: this.id,
      listenerId: listener instanceof AgentSession ? listener.id : listener.id,
      timestamp: new Date()
    });
  }

  /**
   * Manually emit an event
   */
  emitEvent(event: AmbientEvent): void {
    this.updateStateFromEvent(event);
    this.emitAmbientEvent(event);
    this.eventHistory.push(event);
  }

  /**
   * Update environment state
   */
  updateState(update: Partial<EnvironmentState>): void {
    this.state = { ...this.state, ...update };
    
    this.emit('state_updated', {
      environmentId: this.id,
      state: this.state,
      timestamp: new Date()
    });
  }

  /**
   * Get current state
   */
  getState(): EnvironmentState {
    return { ...this.state };
  }

  /**
   * Get event history
   */
  getEventHistory(limit: number = 100): AmbientEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get recent events of a specific type
   */
  getRecentEvents(type: string, limit: number = 50): AmbientEvent[] {
    return this.eventHistory
      .filter(event => event.type === type)
      .slice(-limit);
  }

  /**
   * Check if environment is active
   */
  isActive(): boolean {
    return this.isActive;
  }

  /**
   * Get environment statistics
   */
  getStats() {
    return {
      id: this.id,
      name: this.name,
      isActive: this.isActive,
      listenerCount: this.listeners.size,
      eventHistoryLength: this.eventHistory.length,
      lastTick: this.lastTick,
      state: this.state
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAmbientLoop();
    this.listeners.clear();
    this.eventHistory = [];
    this.removeAllListeners();
  }
} 