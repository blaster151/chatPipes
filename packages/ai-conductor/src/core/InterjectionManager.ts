import { Interjection } from '@chatpipes/types';

export interface InterjectionQueue {
  id: string;
  interjection: Interjection;
  timestamp: Date;
  applied: boolean;
  targetAgent: string;
}

export interface PromptModification {
  originalPrompt: string;
  modifiedPrompt: string;
  interjectionId: string;
  appliedAt: Date;
}

export class InterjectionManager {
  private queue: InterjectionQueue[] = [];
  private promptHistory: PromptModification[] = [];

  /**
   * Add an interjection to the queue
   */
  addInterjection(interjection: Interjection, targetAgent: string): void {
    const queueItem: InterjectionQueue = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      interjection,
      timestamp: new Date(),
      applied: false,
      targetAgent
    };

    this.queue.push(queueItem);
  }

  /**
   * Get pending interjections for a specific agent
   */
  getPendingInterjections(agentId: string): InterjectionQueue[] {
    return this.queue.filter(item => 
      !item.applied && 
      (item.targetAgent === agentId || item.interjection.target === 'both')
    );
  }

  /**
   * Apply interjection logic to modify prompts
   */
  applyInterjection(text: string, interjection: Interjection): string {
    const modification = this.createPromptModification(text, interjection);
    this.promptHistory.push(modification);
    return modification.modifiedPrompt;
  }

  /**
   * Create prompt modification based on interjection type
   */
  private createPromptModification(text: string, interjection: Interjection): PromptModification {
    let modifiedPrompt = text;

    switch (interjection.type) {
      case 'side_question':
        modifiedPrompt = this.applySideQuestion(text, interjection.text);
        break;
      
      case 'correction':
        modifiedPrompt = this.applyCorrection(text, interjection.text);
        break;
      
      case 'direction':
        modifiedPrompt = this.applyDirection(text, interjection.text);
        break;
      
      case 'pause':
        modifiedPrompt = this.applyPause(text, interjection.text);
        break;
      
      case 'resume':
        modifiedPrompt = this.applyResume(text, interjection.text);
        break;
      
      default:
        modifiedPrompt = this.applySideQuestion(text, interjection.text);
    }

    return {
      originalPrompt: text,
      modifiedPrompt,
      interjectionId: interjection.id,
      appliedAt: new Date()
    };
  }

  /**
   * Apply side question interjection
   */
  private applySideQuestion(text: string, interjection: string): string {
    return `${text}\n\nSide question – I want to hear your full response to the above – but also, ${interjection}`;
  }

  /**
   * Apply correction interjection
   */
  private applyCorrection(text: string, interjection: string): string {
    return `${text}\n\nCorrection: ${interjection}\n\nPlease adjust your response accordingly.`;
  }

  /**
   * Apply direction interjection
   */
  private applyDirection(text: string, interjection: string): string {
    return `${text}\n\nDirection: ${interjection}\n\nPlease focus your response on this aspect.`;
  }

  /**
   * Apply pause interjection
   */
  private applyPause(text: string, interjection: string): string {
    return `${text}\n\nPause requested: ${interjection}\n\nPlease pause your response here and wait for further instruction.`;
  }

  /**
   * Apply resume interjection
   */
  private applyResume(text: string, interjection: string): string {
    return `${text}\n\nResume: ${interjection}\n\nPlease continue with your response.`;
  }

  /**
   * Mark interjection as applied
   */
  markApplied(queueId: string): void {
    const queueItem = this.queue.find(item => item.id === queueId);
    if (queueItem) {
      queueItem.applied = true;
    }
  }

  /**
   * Get next pending interjection for an agent
   */
  getNextInterjection(agentId: string): InterjectionQueue | null {
    const pending = this.getPendingInterjections(agentId);
    return pending.length > 0 ? pending[0] : null;
  }

  /**
   * Clear applied interjections
   */
  clearApplied(): void {
    this.queue = this.queue.filter(item => !item.applied);
  }

  /**
   * Get all interjections (pending and applied)
   */
  getAllInterjections(): InterjectionQueue[] {
    return [...this.queue];
  }

  /**
   * Get prompt modification history
   */
  getPromptHistory(): PromptModification[] {
    return [...this.promptHistory];
  }

  /**
   * Get statistics about interjections
   */
  getStats() {
    const total = this.queue.length;
    const applied = this.queue.filter(item => item.applied).length;
    const pending = total - applied;

    const byType = this.queue.reduce((acc, item) => {
      const type = item.interjection.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = this.queue.reduce((acc, item) => {
      const priority = item.interjection.priority;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      applied,
      pending,
      byType,
      byPriority,
      promptModifications: this.promptHistory.length
    };
  }

  /**
   * Reset the interjection manager
   */
  reset(): void {
    this.queue = [];
    this.promptHistory = [];
  }
} 