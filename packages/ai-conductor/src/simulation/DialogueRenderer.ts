import { 
  DualUtterance, 
  ChatRenderBlock, 
  AmbientEvent, 
  AgentState, 
  StyleVector,
  InnerThought,
  EntanglementEvent,
  ThreadState,
  EnvironmentState
} from './types/DialogueTypes';

export interface RenderOptions {
  showUnspoken: boolean;
  showAmbient: boolean;
  showInterjections: boolean;
  showCrossTalk: boolean;
  showThoughtDiffusion: boolean;
  showEnvironmentalMood: boolean;
  styleUnspoken: 'italic' | 'quote' | 'gray';
  styleAmbient: 'gray' | 'fade' | 'highlight';
  styleInterjections: 'bold' | 'highlight' | 'quote';
  styleCrossTalk: 'bold' | 'highlight' | 'gray';
  styleThoughtDiffusion: 'italic' | 'gray' | 'fade';
  styleEnvironmentalMood: 'highlight' | 'bold' | 'gray';
  includeTimestamps: boolean;
  includeMetadata: boolean;
  groupBySpeaker: boolean;
  chronologicalOrder: boolean;
}

export interface RenderContext {
  agentStates: Record<string, AgentState>;
  environmentState?: EnvironmentState;
  threadState?: ThreadState;
  styleContagion?: boolean;
  moodDiffusion?: boolean;
}

export class DialogueRenderer {
  private options: RenderOptions;
  private context: RenderContext;

  constructor(options: Partial<RenderOptions> = {}, context: RenderContext = { agentStates: {} }) {
    this.options = {
      showUnspoken: true,
      showAmbient: true,
      showInterjections: true,
      showCrossTalk: true,
      showThoughtDiffusion: true,
      showEnvironmentalMood: true,
      styleUnspoken: 'italic',
      styleAmbient: 'gray',
      styleInterjections: 'bold',
      styleCrossTalk: 'highlight',
      styleThoughtDiffusion: 'italic',
      styleEnvironmentalMood: 'highlight',
      includeTimestamps: false,
      includeMetadata: false,
      groupBySpeaker: false,
      chronologicalOrder: true,
      ...options
    };
    this.context = context;
  }

  /**
   * Render a dual utterance into chat render blocks
   */
  renderDualUtterance(utterance: DualUtterance): ChatRenderBlock[] {
    const blocks: ChatRenderBlock[] = [];

    // Render spoken dialogue
    const spokenBlock: ChatRenderBlock = {
      type: 'spoken',
      text: utterance.spoken,
      speakerId: utterance.speakerId,
      timestamp: utterance.timestamp,
      style: 'quote'
    };

    if (this.options.includeMetadata && utterance.metadata) {
      spokenBlock.metadata = {
        thoughtType: utterance.metadata.thoughtType,
        intensity: utterance.metadata.intensity,
        emotionalState: utterance.metadata.emotionalState
      };
    }

    blocks.push(spokenBlock);

    // Render unspoken thought if enabled and present
    if (this.options.showUnspoken && utterance.unspoken) {
      const unspokenBlock: ChatRenderBlock = {
        type: 'unspoken',
        text: utterance.unspoken,
        speakerId: utterance.speakerId,
        timestamp: utterance.timestamp,
        style: this.options.styleUnspoken
      };

      if (this.options.includeMetadata && utterance.metadata) {
        unspokenBlock.metadata = {
          thoughtType: utterance.metadata.thoughtType,
          intensity: utterance.metadata.intensity,
          emotionalState: utterance.metadata.emotionalState
        };
      }

      blocks.push(unspokenBlock);
    }

    return blocks;
  }

  /**
   * Render ambient event into chat render block
   */
  renderAmbientEvent(event: AmbientEvent): ChatRenderBlock {
    const block: ChatRenderBlock = {
      type: 'ambient',
      text: event.text,
      timestamp: event.timestamp,
      style: this.options.styleAmbient
    };

    if (this.options.includeMetadata) {
      block.metadata = {
        intensity: event.intensity,
        environmentalImpact: event.type
      };
    }

    return block;
  }

  /**
   * Render interjection into chat render block
   */
  renderInterjection(interjection: any): ChatRenderBlock {
    const block: ChatRenderBlock = {
      type: 'interjection',
      text: interjection.content,
      speakerId: interjection.speakerId,
      timestamp: interjection.timestamp,
      style: this.options.styleInterjections
    };

    if (this.options.includeMetadata) {
      block.metadata = {
        intensity: interjection.intensity,
        emotionalState: interjection.emotionalState
      };
    }

    return block;
  }

  /**
   * Render cross-talk event into chat render block
   */
  renderCrossTalk(event: EntanglementEvent): ChatRenderBlock {
    const block: ChatRenderBlock = {
      type: 'cross_talk',
      text: event.content,
      speakerId: event.sourceAgentId,
      targetId: event.targetAgentId,
      timestamp: event.timestamp,
      style: this.options.styleCrossTalk
    };

    if (this.options.includeMetadata) {
      block.metadata = {
        intensity: event.intensity,
        diffusionPath: event.metadata.diffusionPath,
        chainId: event.id
      };
    }

    return block;
  }

  /**
   * Render thought diffusion event into chat render block
   */
  renderThoughtDiffusion(event: EntanglementEvent): ChatRenderBlock {
    const block: ChatRenderBlock = {
      type: 'thought_diffusion',
      text: event.content,
      speakerId: event.targetAgentId,
      targetId: event.sourceAgentId,
      timestamp: event.timestamp,
      style: this.options.styleThoughtDiffusion
    };

    if (this.options.includeMetadata) {
      block.metadata = {
        intensity: event.intensity,
        originalThought: event.metadata.originalThought,
        diffusionPath: event.metadata.diffusionPath,
        chainId: event.id
      };
    }

    return block;
  }

  /**
   * Render environmental mood shift into chat render block
   */
  renderEnvironmentalMood(event: EntanglementEvent): ChatRenderBlock {
    const block: ChatRenderBlock = {
      type: 'environmental_mood',
      text: event.content,
      timestamp: event.timestamp,
      style: this.options.styleEnvironmentalMood
    };

    if (this.options.includeMetadata) {
      block.metadata = {
        intensity: event.intensity,
        environmentalImpact: event.metadata.environmentalImpact,
        tensionLevel: event.metadata.tensionLevel,
        trustLevel: event.metadata.trustLevel
      };
    }

    return block;
  }

  /**
   * Render a complete conversation thread
   */
  renderThread(threadState: ThreadState): ChatRenderBlock[] {
    const blocks: ChatRenderBlock[] = [];

    // Render dual exchanges
    threadState.dualExchanges.forEach(utterance => {
      const utteranceBlocks = this.renderDualUtterance(utterance);
      blocks.push(...utteranceBlocks);
    });

    // Render ambient events if enabled
    if (this.options.showAmbient) {
      threadState.ambientEvents.forEach(event => {
        blocks.push(this.renderAmbientEvent(event));
      });
    }

    // Render interjections if enabled
    if (this.options.showInterjections) {
      threadState.interjections.forEach(interjection => {
        blocks.push(interjection);
      });
    }

    // Render cross-talk events if enabled
    if (this.options.showCrossTalk) {
      threadState.crossTalkEvents.forEach(crossTalk => {
        blocks.push(crossTalk);
      });
    }

    // Render thought diffusion events if enabled
    if (this.options.showThoughtDiffusion) {
      threadState.thoughtDiffusions.forEach(diffusion => {
        blocks.push(diffusion);
      });
    }

    // Render environmental mood shifts if enabled
    if (this.options.showEnvironmentalMood) {
      threadState.environmentalMoodShifts.forEach(moodShift => {
        blocks.push(moodShift);
      });
    }

    // Sort by timestamp if chronological order is requested
    if (this.options.chronologicalOrder) {
      blocks.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Group by speaker if requested
    if (this.options.groupBySpeaker) {
      return this.groupBlocksBySpeaker(blocks);
    }

    return blocks;
  }

  /**
   * Group render blocks by speaker
   */
  private groupBlocksBySpeaker(blocks: ChatRenderBlock[]): ChatRenderBlock[] {
    const grouped: ChatRenderBlock[] = [];
    const speakerGroups: Record<string, ChatRenderBlock[]> = {};

    // Group blocks by speaker
    blocks.forEach(block => {
      const speakerId = block.speakerId || 'environment';
      if (!speakerGroups[speakerId]) {
        speakerGroups[speakerId] = [];
      }
      speakerGroups[speakerId].push(block);
    });

    // Flatten groups while maintaining chronological order within each group
    Object.values(speakerGroups).forEach(group => {
      group.sort((a, b) => a.timestamp - b.timestamp);
      grouped.push(...group);
    });

    return grouped;
  }

  /**
   * Render agent state changes
   */
  renderAgentStateChange(agentId: string, oldState: AgentState, newState: AgentState): ChatRenderBlock[] {
    const blocks: ChatRenderBlock[] = [];
    const changes: string[] = [];

    // Detect significant changes
    if (Math.abs(oldState.traits.suspicion - newState.traits.suspicion) > 0.1) {
      changes.push(`suspicion ${oldState.traits.suspicion.toFixed(1)} → ${newState.traits.suspicion.toFixed(1)}`);
    }

    if (Math.abs(oldState.traits.trust - newState.traits.trust) > 0.1) {
      changes.push(`trust ${oldState.traits.trust.toFixed(1)} → ${newState.traits.trust.toFixed(1)}`);
    }

    if (oldState.mood !== newState.mood) {
      changes.push(`mood ${oldState.mood} → ${newState.mood}`);
    }

    if (changes.length > 0) {
      const block: ChatRenderBlock = {
        type: 'ambient',
        text: `${agentId} state changes: ${changes.join(', ')}`,
        timestamp: newState.timestamp,
        style: 'gray'
      };

      if (this.options.includeMetadata) {
        block.metadata = {
          intensity: 0.5,
          environmentalImpact: 'agent_state_change'
        };
      }

      blocks.push(block);
    }

    return blocks;
  }

  /**
   * Render style contagion event
   */
  renderStyleContagion(sourceId: string, targetId: string, styleVector: StyleVector, intensity: number): ChatRenderBlock {
    const styleChanges: string[] = [];

    if (styleVector.verbosity !== undefined) {
      styleChanges.push(`verbosity: ${styleVector.verbosity.toFixed(1)}`);
    }
    if (styleVector.emotionalTone) {
      styleChanges.push(`tone: ${styleVector.emotionalTone}`);
    }
    if (styleVector.formality !== undefined) {
      styleChanges.push(`formality: ${styleVector.formality.toFixed(1)}`);
    }

    const block: ChatRenderBlock = {
      type: 'ambient',
      text: `Style contagion: ${sourceId} influences ${targetId} (${styleChanges.join(', ')})`,
      timestamp: Date.now(),
      style: 'highlight'
    };

    if (this.options.includeMetadata) {
      block.metadata = {
        intensity,
        environmentalImpact: 'style_contagion'
      };
    }

    return block;
  }

  /**
   * Render mood diffusion event
   */
  renderMoodDiffusion(sourceId: string, targetId: string, mood: string, intensity: number): ChatRenderBlock {
    const block: ChatRenderBlock = {
      type: 'ambient',
      text: `Mood diffusion: ${sourceId}'s ${mood} mood spreads to ${targetId}`,
      timestamp: Date.now(),
      style: 'highlight'
    };

    if (this.options.includeMetadata) {
      block.metadata = {
        intensity,
        environmentalImpact: 'mood_diffusion'
      };
    }

    return block;
  }

  /**
   * Update render options
   */
  updateOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Update render context
   */
  updateContext(context: Partial<RenderContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get current render options
   */
  getOptions(): RenderOptions {
    return { ...this.options };
  }

  /**
   * Get current render context
   */
  getContext(): RenderContext {
    return { ...this.context };
  }

  /**
   * Create a formatted conversation transcript
   */
  createFormattedTranscript(blocks: ChatRenderBlock[]): string {
    return blocks.map(block => {
      let formatted = '';

      // Add timestamp if enabled
      if (this.options.includeTimestamps) {
        const time = new Date(block.timestamp).toLocaleTimeString();
        formatted += `[${time}] `;
      }

      // Add speaker if present
      if (block.speakerId) {
        formatted += `[${block.speakerId}] `;
      }

      // Add content with appropriate formatting
      switch (block.style) {
        case 'italic':
          formatted += `*${block.text}*`;
          break;
        case 'bold':
          formatted += `**${block.text}**`;
          break;
        case 'quote':
          formatted += `"${block.text}"`;
          break;
        case 'gray':
          formatted += `// ${block.text}`;
          break;
        case 'highlight':
          formatted += `==${block.text}==`;
          break;
        case 'fade':
          formatted += `~~${block.text}~~`;
          break;
        default:
          formatted += block.text;
      }

      return formatted;
    }).join('\n');
  }

  /**
   * Create HTML-formatted conversation
   */
  createHTMLConversation(blocks: ChatRenderBlock[]): string {
    return blocks.map(block => {
      let html = '<div class="chat-block">';

      // Add timestamp if enabled
      if (this.options.includeTimestamps) {
        const time = new Date(block.timestamp).toLocaleTimeString();
        html += `<span class="timestamp">[${time}]</span> `;
      }

      // Add speaker if present
      if (block.speakerId) {
        html += `<span class="speaker">[${block.speakerId}]</span> `;
      }

      // Add content with appropriate styling
      const styleClass = block.style ? ` style-${block.style}` : '';
      const typeClass = `type-${block.type}`;
      
      html += `<span class="content${styleClass} ${typeClass}">${block.text}</span>`;

      html += '</div>';
      return html;
    }).join('\n');
  }

  /**
   * Create JSON-formatted conversation for API responses
   */
  createJSONConversation(blocks: ChatRenderBlock[]): any {
    return {
      blocks: blocks.map(block => ({
        type: block.type,
        text: block.text,
        speakerId: block.speakerId,
        targetId: block.targetId,
        style: block.style,
        timestamp: block.timestamp,
        metadata: this.options.includeMetadata ? block.metadata : undefined
      })),
      metadata: {
        totalBlocks: blocks.length,
        blockTypes: this.getBlockTypeDistribution(blocks),
        timeRange: {
          start: Math.min(...blocks.map(b => b.timestamp)),
          end: Math.max(...blocks.map(b => b.timestamp))
        }
      }
    };
  }

  /**
   * Get distribution of block types
   */
  private getBlockTypeDistribution(blocks: ChatRenderBlock[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    blocks.forEach(block => {
      distribution[block.type] = (distribution[block.type] || 0) + 1;
    });

    return distribution;
  }
} 