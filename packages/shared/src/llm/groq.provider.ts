import type { LLMProvider, LLMCompletionParams, LLMCompletionResult } from './provider.interface';

// ─── Groq API Types ───────────────────────────────────────────────────────────

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Groq free tier: 30 requests/minute. We stay safely under. */
const GROQ_RATE_LIMIT_RPM = 30;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const MAX_RETRIES = 4;

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

class RateLimiter {
  private timestamps: number[] = [];
  private readonly windowMs = 60_000;
  private readonly maxRequests: number;

  constructor(maxRequestsPerMinute: number) {
    this.maxRequests = maxRequestsPerMinute;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length >= this.maxRequests) {
      const oldest = this.timestamps[0];
      const waitMs = this.windowMs - (now - oldest) + 100; // +100ms buffer
      console.log(`[GroqProvider] Rate limit reached. Waiting ${waitMs}ms...`);
      await sleep(waitMs);
    }

    this.timestamps.push(Date.now());
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffMs(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s — with ±20% jitter
  const base = Math.pow(2, attempt) * 1000;
  const jitter = base * 0.2 * (Math.random() - 0.5);
  return Math.min(base + jitter, 30_000);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export class GroqProvider implements LLMProvider {
  readonly providerName = 'groq';
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GROQ_API_KEY;
    if (!key) throw new Error('[GroqProvider] GROQ_API_KEY is not set.');
    this.apiKey = key;
    this.rateLimiter = new RateLimiter(GROQ_RATE_LIMIT_RPM);
  }

  async generateCompletion(params: LLMCompletionParams): Promise<LLMCompletionResult> {
    const { model, prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 } = params;

    const messages: GroqMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await this.rateLimiter.waitIfNeeded();

        const startTime = Date.now();

        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        // 429 → rate limited by server, back off and retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : getBackoffMs(attempt);
          console.warn(`[GroqProvider] 429 received. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(waitMs);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`[GroqProvider] HTTP ${response.status}: ${errorBody}`);
        }

        const data = (await response.json()) as GroqResponse;
        const content = data.choices[0]?.message?.content ?? '';
        const durationMs = Date.now() - startTime;

        return {
          content,
          tokensUsed: data.usage?.total_tokens ?? 0,
          model: data.model ?? model,
          durationMs,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry on non-recoverable errors
        if (lastError.message.includes('HTTP 4') && !lastError.message.includes('HTTP 429')) {
          throw lastError;
        }

        if (attempt < MAX_RETRIES - 1) {
          const waitMs = getBackoffMs(attempt);
          console.warn(`[GroqProvider] Error on attempt ${attempt + 1}. Retrying in ${waitMs}ms. Error: ${lastError.message}`);
          await sleep(waitMs);
        }
      }
    }

    throw new Error(`[GroqProvider] All ${MAX_RETRIES} attempts failed. Last error: ${lastError?.message}`);
  }
}