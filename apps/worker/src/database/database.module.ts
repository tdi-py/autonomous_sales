import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@autonomous-sales/database';

export const DATABASE_TOKEN = 'DATABASE';

// ─── Execution Logger Helper ─────────────────────────────────────────────────
// Her processor bu helper'ı kullanarak agent_executions tablosuna log atar.

export interface LogExecutionParams {
  db: ReturnType<typeof drizzle>;
  projectId: string;
  agentType: 'analyzer' | 'communicator' | 'strategist';
  trigger: string;
  inputPayload: unknown;
  outputPayload?: unknown;
  status: 'pending' | 'running' | 'success' | 'error' | 'timeout';
  tokensUsed?: number;
  modelUsed?: string;
  durationMs?: number;
  errorMessage?: string;
}

export async function logExecution(params: LogExecutionParams) {
  try {
    await (params.db as ReturnType<typeof drizzle<typeof schema>>)
      .insert(schema.agentExecutions)
      .values({
        projectId: params.projectId,
        agentType: params.agentType,
        trigger: params.trigger,
        inputPayload: params.inputPayload,
        outputPayload: params.outputPayload ?? {},
        status: params.status,
        tokensUsed: params.tokensUsed ?? 0,
        modelUsed: params.modelUsed,
        durationMs: params.durationMs ?? 0,
        errorMessage: params.errorMessage,
      });
  } catch (err) {
    // Never let logging failure crash the processor
    console.error('[logExecution] Failed to write execution log:', err);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error('DATABASE_URL is not set');
        const client = postgres(connectionString, { prepare: false });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}