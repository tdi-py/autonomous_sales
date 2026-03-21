import { pgTable, uuid, varchar, boolean, timestamp, text, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const businessTypeEnum = pgEnum('business_type', [
  'saas',
  'ecommerce',
  'agency',
  'service',
  'marketplace',
  'other',
]);

export const projectStatusEnum = pgEnum('project_status', [
  'onboarding',
  'active',
  'paused',
  'archived',
]);

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  websiteUrl: varchar('website_url', { length: 500 }),
  industry: varchar('industry', { length: 100 }),
  businessType: businessTypeEnum('business_type').default('other').notNull(),
  targetGeography: jsonb('target_geography').default([]),
  defaultLanguage: varchar('default_language', { length: 10 }).default('en').notNull(),
  status: projectStatusEnum('status').default('onboarding').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectAnalysis = pgTable('project_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .unique()
    .notNull(),
  rawScrapedData: jsonb('raw_scraped_data'),
  valueProposition: text('value_proposition'),
  productDescription: text('product_description'),
  targetMarket: text('target_market'),
  keyFeatures: jsonb('key_features').default([]),
  toneOfVoice: varchar('tone_of_voice', { length: 50 }),
  competitorsDetected: jsonb('competitors_detected'),
  userConfirmed: boolean('user_confirmed').default(false).notNull(),
  userEdits: jsonb('user_edits'),
  analyzedAt: timestamp('analyzed_at'),
  modelUsed: varchar('model_used', { length: 100 }),
});

export const icpProfiles = pgTable('icp_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 100 }),
  companySize: varchar('company_size', { length: 50 }),
  jobTitles: jsonb('job_titles').default([]),
  painPoints: jsonb('pain_points').default([]),
  geography: varchar('geography', { length: 100 }),
  buyingSignals: jsonb('buying_signals'),
  priority: varchar('priority', { length: 10 }).default('1'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectAnalysis = typeof projectAnalysis.$inferSelect;
export type IcpProfile = typeof icpProfiles.$inferSelect;