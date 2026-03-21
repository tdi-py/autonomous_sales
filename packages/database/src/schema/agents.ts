import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  integer,
  real,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const agentTypeEnum = pgEnum('agent_type', [
  'analyzer',
  'communicator',
  'strategist',
]);

export const agentExecutionStatusEnum = pgEnum('agent_execution_status', [
  'pending',
  'running',
  'success',
  'error',
  'timeout',
]);

export const decisionTypeEnum = pgEnum('decision_type', [
  'prompt_update',
  'icp_refinement',
  'channel_switch',
  'ab_test_winner',
  'objection_update',
  'pause_campaign',
]);

export const ruleTypeEnum = pgEnum('rule_type', [
  'spam_word_avoid',
  'subject_pattern',
  'icp_insight',
  'objection_pattern',
  'send_time_optimal',
  'tone_preference',
]);

export const platformRuleTypeEnum = pgEnum('platform_rule_type', [
  'spam_word_avoid',
  'subject_pattern',
  'icp_insight',
  'objection_pattern',
  'send_time_optimal',
  'tone_preference',
  'industry_insight',
]);

export const promptCreatedByEnum = pgEnum('prompt_created_by', [
  'system',
  'strategist_agent',
  'user',
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * Every agent run is logged here. Enables full audit trail, cost tracking,
 * and performance analysis across all three agent types.
 */
export const agentExecutions = pgTable('agent_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  agentType: agentTypeEnum('agent_type').notNull(),
  trigger: varchar('trigger', { length: 100 }).notNull(),
  inputPayload: jsonb('input_payload').default({}),
  outputPayload: jsonb('output_payload').default({}),
  tokensUsed: integer('tokens_used').default(0).notNull(),
  modelUsed: varchar('model_used', { length: 100 }),
  durationMs: integer('duration_ms').default(0).notNull(),
  status: agentExecutionStatusEnum('status').default('pending').notNull(),
  // Self-referential FK: child executions point to their parent
  parentExecutionId: uuid('parent_execution_id'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Strategist Agent decisions. Each decision proposes a change (old_value → new_value).
 * 'applied' tracks whether the change was actually implemented.
 */
export const strategyDecisions = pgTable('strategy_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  agentExecutionId: uuid('agent_execution_id')
    .references(() => agentExecutions.id)
    .notNull(),
  decisionType: decisionTypeEnum('decision_type').notNull(),
  reasoning: text('reasoning').notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value').notNull(),
  applied: boolean('applied').default(false).notNull(),
  appliedAt: timestamp('applied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Project-level learned rules. Accumulate as the Strategist analyses results
 * for THIS specific project. confidence_score rises with evidence.
 */
export const strategyLearnedRules = pgTable('strategy_learned_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  ruleType: ruleTypeEnum('rule_type').notNull(),
  // JSON shape depends on rule_type:
  // spam_word_avoid: { words: string[] }
  // subject_pattern: { pattern: string, open_rate_delta: number }
  // send_time_optimal: { hour_utc: number, day_of_week: number }
  ruleContent: jsonb('rule_content').notNull(),
  confidenceScore: real('confidence_score').default(0).notNull(),
  evidenceCount: integer('evidence_count').default(0).notNull(),
  sourceDecisions: jsonb('source_decisions').default([]),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Platform-wide learned rules — aggregate intelligence from ALL projects.
 * Enables cross-project learning (e.g., "in SaaS + US, subject lines with
 * 'quick question' have 34% higher open rates").
 */
export const platformLearnedRules = pgTable('platform_learned_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleType: platformRuleTypeEnum('rule_type').notNull(),
  industry: varchar('industry', { length: 100 }),
  businessType: varchar('business_type', { length: 50 }),
  geography: varchar('geography', { length: 100 }),
  ruleContent: jsonb('rule_content').notNull(),
  confidenceScore: real('confidence_score').default(0).notNull(),
  evidenceCount: integer('evidence_count').default(0).notNull(),
  sourceProjectCount: integer('source_project_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Versioned prompt storage. Strategist Agent can create new prompt versions
 * and mark old ones inactive. performance_score tracks which versions win.
 */
export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  agentType: agentTypeEnum('agent_type').notNull(),
  purpose: varchar('purpose', { length: 255 }).notNull(),
  promptText: text('prompt_text').notNull(),
  version: integer('version').default(1).notNull(),
  performanceScore: real('performance_score'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: promptCreatedByEnum('created_by').default('system').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentExecution = typeof agentExecutions.$inferSelect;
export type NewAgentExecution = typeof agentExecutions.$inferInsert;
export type StrategyDecision = typeof strategyDecisions.$inferSelect;
export type StrategyLearnedRule = typeof strategyLearnedRules.$inferSelect;
export type PlatformLearnedRule = typeof platformLearnedRules.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;