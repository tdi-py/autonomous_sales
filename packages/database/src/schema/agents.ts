import {
  pgTable, uuid, varchar, boolean, timestamp, text, integer, real, jsonb, pgEnum,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const agentTypeEnum = pgEnum('agent_type', ['analyzer','communicator','strategist']);
export const agentExecutionStatusEnum = pgEnum('agent_execution_status', ['pending','running','success','error','timeout']);
export const decisionTypeEnum = pgEnum('decision_type', ['prompt_update','icp_refinement','channel_switch','ab_test_winner','objection_update','pause_campaign']);
export const ruleTypeEnum = pgEnum('rule_type', ['spam_word_avoid','subject_pattern','icp_insight','objection_pattern','send_time_optimal','tone_preference']);
export const platformRuleTypeEnum = pgEnum('platform_rule_type', ['spam_word_avoid','subject_pattern','icp_insight','objection_pattern','send_time_optimal','tone_preference','industry_insight']);
export const promptCreatedByEnum = pgEnum('prompt_created_by', ['system','strategist_agent','user']);

export const agentExecutions = pgTable('agent_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  agentType: agentTypeEnum('agent_type').notNull(),
  trigger: varchar('trigger', { length: 100 }).notNull(),
  inputPayload: jsonb('input_payload').default({}),
  outputPayload: jsonb('output_payload').default({}),
  tokensUsed: integer('tokens_used').default(0).notNull(),
  modelUsed: varchar('model_used', { length: 100 }),
  durationMs: integer('duration_ms').default(0).notNull(),
  status: agentExecutionStatusEnum('status').default('pending').notNull(),
  parentExecutionId: uuid('parent_execution_id'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const strategyDecisions = pgTable('strategy_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  agentExecutionId: uuid('agent_execution_id').references(() => agentExecutions.id).notNull(),
  decisionType: decisionTypeEnum('decision_type').notNull(),
  reasoning: text('reasoning').notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value').notNull(),
  applied: boolean('applied').default(false).notNull(),
  appliedAt: timestamp('applied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const strategyLearnedRules = pgTable('strategy_learned_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  ruleType: ruleTypeEnum('rule_type').notNull(),
  ruleContent: jsonb('rule_content').notNull(),
  confidenceScore: real('confidence_score').default(0).notNull(),
  evidenceCount: integer('evidence_count').default(0).notNull(),
  sourceDecisions: jsonb('source_decisions').default([]),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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

export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  agentType: agentTypeEnum('agent_type').notNull(),
  purpose: varchar('purpose', { length: 255 }).notNull(),
  promptText: text('prompt_text').notNull(),
  version: integer('version').default(1).notNull(),
  performanceScore: real('performance_score'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: promptCreatedByEnum('created_by').default('system').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailTemplateStats = pgTable('email_template_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  campaignId: uuid('campaign_id').notNull(),
  sequenceStepId: uuid('sequence_step_id'),
  variantLabel: varchar('variant_label', { length: 10 }),
  subjectSnippet: varchar('subject_snippet', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  icpLabel: varchar('icp_label', { length: 255 }),
  businessCategory: varchar('business_category', { length: 100 }),
  sampleSize: integer('sample_size').default(0).notNull(),
  openRate: real('open_rate').default(0).notNull(),
  clickRate: real('click_rate').default(0).notNull(),
  replyRate: real('reply_rate').default(0).notNull(),
  bounceRate: real('bounce_rate').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type EmailTemplateStats = typeof emailTemplateStats.$inferSelect;
export type NewEmailTemplateStats = typeof emailTemplateStats.$inferInsert;
export type AgentExecution = typeof agentExecutions.$inferSelect;
export type NewAgentExecution = typeof agentExecutions.$inferInsert;
export type StrategyDecision = typeof strategyDecisions.$inferSelect;
export type StrategyLearnedRule = typeof strategyLearnedRules.$inferSelect;
export type PlatformLearnedRule = typeof platformLearnedRules.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;
