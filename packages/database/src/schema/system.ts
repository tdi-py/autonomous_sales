import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  integer,
  real,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const templateTypeEnum = pgEnum('template_type', [
  'email_sequence',
  'call_script',
  'icp_profile',
  'objection_set',
]);

export const templateBusinessTypeEnum = pgEnum('template_business_type', [
  'saas',
  'ecommerce',
  'agency',
  'service',
  'marketplace',
  'other',
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * Pre-built, system-level templates per industry + business type.
 * New projects get seeded with relevant templates as a starting point.
 * is_system = true means Anthropic/platform created it.
 * is_system = false means a workspace created it (future: template marketplace).
 *
 * Content JSONB shape per template_type:
 *   email_sequence: { steps: [{subject, body, delay_days}] }
 *   call_script:    { opening, dialogue_tree, objections, closing }
 *   icp_profile:    { label, job_titles, pain_points, buying_signals }
 *   objection_set:  { objections: [{text, response}] }
 */
export const industryTemplates = pgTable('industry_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  industry: varchar('industry', { length: 100 }).notNull(),
  businessType: templateBusinessTypeEnum('business_type').default('other').notNull(),
  templateType: templateTypeEnum('template_type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  content: jsonb('content').notNull(),
  language: varchar('language', { length: 10 }).default('en').notNull(),
  performanceScore: real('performance_score'),
  usageCount: integer('usage_count').default(0).notNull(),
  isSystem: boolean('is_system').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type IndustryTemplate = typeof industryTemplates.$inferSelect;
export type NewIndustryTemplate = typeof industryTemplates.$inferInsert;