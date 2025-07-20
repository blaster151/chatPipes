// src/core/MemoryManager.ts
import { StorageAdapter } from "../storage/StorageAdapter";
import { SimpleMemoryItem, SimpleMemorySummary } from "./types";
import { summarizeFacts, summarizeEmotions } from "./summarizers/index";

export class MemoryManager {
  private store: StorageAdapter;
  private agentId: string;

  constructor(store: StorageAdapter, agentId: string) {
    this.store = store;
    this.agentId = agentId;
  }

  async init() {
    await this.store.init();
  }

  async ingestUtterance(role: "user" | "agent", text: string) {
    const item: SimpleMemoryItem = {
      timestamp: new Date().toISOString(),
      role,
      text,
    };
    await this.store.saveUtterance(this.agentId, item);
  }

  async generateSummary(): Promise<SimpleMemorySummary> {
    const utterances = await this.store.getUtterances(this.agentId, 50);
    const summary: SimpleMemorySummary = {
      timestamp: new Date().toISOString(),
      facts: summarizeFacts(utterances),
      emotions: summarizeEmotions(utterances),
      motifs: this.extractMotifs(utterances),
    };
    await this.store.saveSummary(this.agentId, summary);
    return summary;
  }

  async getRehydrationPrompt(): Promise<string> {
    const summary = await this.store.getLatestSummary(this.agentId);
    if (!summary) return "";

    return [
      `This agent remembers the following:`,
      `Facts: ${summary.facts}`,
      `Emotional tones: ${summary.emotions}`,
      summary.motifs.length > 0 ? `Recurring motifs: ${summary.motifs.join(", ")}` : "",
    ].filter(Boolean).join("\n");
  }

  private extractMotifs(utterances: SimpleMemoryItem[]): string[] {
    const lower = (s: string) => s.toLowerCase();
    const motifCounts = new Map<string, number>();

    for (const u of utterances) {
      const match = lower(u.text).match(/\b(being here|twin|vibe|callback|alive|weird)\b/g);
      match?.forEach(word => {
        motifCounts.set(word, (motifCounts.get(word) ?? 0) + 1);
      });
    }

    return [...motifCounts.entries()]
      .filter(([_, count]) => count >= 2)
      .map(([word]) => word);
  }

  async wipe() {
    await this.store.clear(this.agentId);
  }
} 