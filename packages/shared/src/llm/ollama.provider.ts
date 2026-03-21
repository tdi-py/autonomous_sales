import type { LLMProvider, LLMCompletionParams, LLMCompletionResult } from './provider.interface';

// ─── Ollama API Types ─────────────────────────────────────────────────────────

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  message: { content: string };
  model: string;
  eval_count?: number;      // output tokens
  prompt_eval_count?: number; // input tokens
  done: boolean;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export class OllamaProvider implements LLMProvider {
  readonly providerName = 'ollama';
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  }

  async generateCompletion(params: LLMCompletionParams): Promise<LLMCompletionResult> {
    const { model, prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 } = params;

    const messages: OllamaMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const startTime = Date.now();

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        }),
      });
    } catch (err) {
      throw new Error(
        `[OllamaProvider] Cannot connect to Ollama at ${this.baseUrl}. ` +
          `Make sure Ollama is running locally. Original error: ${String(err)}`,
      );
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`[OllamaProvider] HTTP ${response.status}: ${body}`);
    }

    const data = (await response.json()) as OllamaChatResponse;
    const durationMs = Date.now() - startTime;

    const inputTokens = data.prompt_eval_count ?? 0;
    const outputTokens = data.eval_count ?? 0;

    return {
      content: data.message?.content ?? '',
      tokensUsed: inputTokens + outputTokens,
      model: data.model ?? model,
      durationMs,
    };
  }

  /** Utility: check if Ollama is reachable and a model is available */
  async healthCheck(model: string): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return { ok: false, message: `Ollama returned HTTP ${res.status}` };

      const data = (await res.json()) as { models: Array<{ name: string }> };
      const available = data.models.map((m) => m.name);
      const found = available.some((n) => n.startsWith(model.split(':')[0]));

      return found
        ? { ok: true, message: `Model "${model}" is available.` }
        : { ok: false, message: `Model "${model}" not found. Available: ${available.join(', ')}` };
    } catch {
      return { ok: false, message: `Cannot reach Ollama at ${this.baseUrl}` };
    }
  }
}