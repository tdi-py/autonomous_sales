// ─── Core Types ──────────────────────────────────────────────────────────────

export interface LLMCompletionParams {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCompletionResult {
  content: string;
  tokensUsed: number;
  model: string;
  durationMs: number;
}

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface LLMProvider {
  /**
   * Generate a text completion. Every call returns token usage and duration
   * so callers can log to agent_executions without extra work.
   */
  generateCompletion(params: LLMCompletionParams): Promise<LLMCompletionResult>;

  /**
   * Human-readable name of this provider, used in logs and DB records.
   * e.g. "groq", "ollama"
   */
  readonly providerName: string;
}

// ─── Model Constants ─────────────────────────────────────────────────────────

/**
 * Recommended models per agent type.
 *
 * Analyzer   → Qwen3-32B   (deep reasoning, ICP extraction)
 * Strategist → Qwen3-32B   (multi-step analysis, decisions)
 * Communicator → Llama 4 Scout  (fast, high-volume content generation)
 */
export const AGENT_MODELS = {
  groq: {
    analyzer: 'qwen-qwq-32b',
    strategist: 'qwen-qwq-32b',
    communicator: 'meta-llama/llama-4-scout-17b-16e-instruct',
  },
  ollama: {
    analyzer: 'qwen2.5:32b',
    strategist: 'qwen2.5:32b',
    communicator: 'llama3.2:latest',
  },
} as const;

export type AgentType = 'analyzer' | 'communicator' | 'strategist';
export type LLMProviderName = 'groq' | 'ollama';