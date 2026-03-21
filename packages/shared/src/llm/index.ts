import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';
import { AGENT_MODELS, type AgentType, type LLMProviderName } from './provider.interface';

export * from './provider.interface';
export { GroqProvider } from './groq.provider';
export { OllamaProvider } from './ollama.provider';

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Returns the configured LLM provider based on the LLM_PROVIDER env variable.
 * Call once at app startup and inject the result — don't call per-request.
 *
 * @example
 * const llm = createLLMProvider();
 * const result = await llm.generateCompletion({ model: getModelForAgent('analyzer'), prompt: '...' });
 */
export function createLLMProvider(providerOverride?: LLMProviderName) {
  const name = (providerOverride ?? process.env.LLM_PROVIDER ?? 'groq') as LLMProviderName;

  switch (name) {
    case 'groq':
      return new GroqProvider();
    case 'ollama':
      return new OllamaProvider();
    default:
      throw new Error(
        `[LLM] Unknown provider: "${name}". Set LLM_PROVIDER to "groq" or "ollama".`,
      );
  }
}

// ─── Model Resolver ───────────────────────────────────────────────────────────

/**
 * Returns the correct model string for a given agent type and provider.
 *
 * @example
 * const model = getModelForAgent('analyzer'); // 'qwen-qwq-32b' on groq
 */
export function getModelForAgent(agentType: AgentType, providerOverride?: LLMProviderName): string {
  const providerName = (providerOverride ?? process.env.LLM_PROVIDER ?? 'groq') as LLMProviderName;
  return AGENT_MODELS[providerName][agentType];
}