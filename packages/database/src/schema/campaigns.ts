import { pgTable, uuid, varchar, integer, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const campaignTypeEnum = pgEnum('campaign_type', [
  'cold_email',
  'cold_call',
  'linkedin',
  'multi_channel',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'paused',
  'completed',
]);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: campaignTypeEnum('type').default('cold_email').notNull(),
  status: campaignStatusEnum('status').default('draft').notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailSequences = pgTable('email_sequences', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id)
    .notNull(),
  stepOrder: integer('step_order').notNull(),
  subjectTemplate: text('subject_template').notNull(),
  bodyTemplate: text('body_template').notNull(),
  delayDays: integer('delay_days').default(0).notNull(),
  variantLabel: varchar('variant_label', { length: 50 }),
  language: varchar('language', { length: 10 }).default('en').notNull(),
  modelUsed: varchar('model_used', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const callScripts = pgTable('call_scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id)
    .notNull(),
  version: integer('version').default(1).notNull(),
  openingScript: text('opening_script'),
  dialogueTree: jsonb('dialogue_tree').default({}),
  objectionHandlers: jsonb('objection_handlers').default([]),
  closingScript: text('closing_script'),
  vapiConfig: jsonb('vapi_config'),
  language: varchar('language', { length: 10 }).default('en').notNull(),
  modelUsed: varchar('model_used', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type EmailSequence = typeof emailSequences.$inferSelect;
export type CallScript = typeof callScripts.$inferSelect;