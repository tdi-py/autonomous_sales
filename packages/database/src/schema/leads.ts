import { pgTable, uuid, varchar, integer, boolean, timestamp, text, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { icpProfiles } from './projects';

export const leadSourceEnum = pgEnum('lead_source', [
  'manual',
  'scraped',
  'apollo',
  'google_maps',
  'csv_import',
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'responded',
  'qualified',
  'converted',
  'lost',
]);

export const numberTypeEnum = pgEnum('number_type', ['landline', 'mobile', 'voip', 'unknown']);
export const aiCallClassificationEnum = pgEnum('ai_call_classification', [
  'can_call_ai',
  'can_call_manual',
  'cannot_call',
]);

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  icpProfileId: uuid('icp_profile_id').references(() => icpProfiles.id),
  companyName: varchar('company_name', { length: 255 }),
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactTitle: varchar('contact_title', { length: 255 }),
  website: varchar('website', { length: 500 }),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  source: leadSourceEnum('source').default('manual').notNull(),
  sourceDetail: varchar('source_detail', { length: 255 }),
  status: leadStatusEnum('status').default('new').notNull(),
  score: integer('score'),
  enrichmentData: jsonb('enrichment_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leadEnrichment = pgTable('lead_enrichment', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .unique()
    .notNull(),
  companyWebsite: varchar('company_website', { length: 500 }),
  employeeCount: varchar('employee_count', { length: 50 }),
  techStack: jsonb('tech_stack'),
  socialProfiles: jsonb('social_profiles'),
  annualRevenueEst: varchar('annual_revenue_est', { length: 50 }),
  enrichmentSource: varchar('enrichment_source', { length: 100 }),
  employmentVerified: boolean('employment_verified'),
  employmentVerifiedAt: timestamp('employment_verified_at'),
  currentCompany: varchar('current_company', { length: 255 }),
  enrichedAt: timestamp('enriched_at'),
});

export const phoneVerification = pgTable('phone_verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  numberType: numberTypeEnum('number_type').default('unknown').notNull(),
  carrier: varchar('carrier', { length: 100 }),
  isOnDnc: boolean('is_on_dnc').default(false).notNull(),
  dncCheckedAt: timestamp('dnc_checked_at'),
  isPubliclyListed: boolean('is_publicly_listed').default(false).notNull(),
  publicSource: varchar('public_source', { length: 100 }),
  publicSourceUrl: varchar('public_source_url', { length: 500 }),
  countryCode: varchar('country_code', { length: 5 }),
  stateCode: varchar('state_code', { length: 10 }),
  aiCallEligible: boolean('ai_call_eligible').default(false).notNull(),
  aiCallClassification: aiCallClassificationEnum('ai_call_classification').default('cannot_call').notNull(),
  classificationReason: text('classification_reason'),
  verifiedAt: timestamp('verified_at'),
});

export const dealStages = pgTable('deal_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  stage: varchar('stage', { length: 50 }).default('lead').notNull(),
  valueEstimate: varchar('value_estimate', { length: 50 }),
  notes: text('notes'),
  movedAt: timestamp('moved_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type PhoneVerification = typeof phoneVerification.$inferSelect;