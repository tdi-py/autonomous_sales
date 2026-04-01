import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const emailProviderEnum = pgEnum('email_provider', ['gmail', 'outlook', 'custom_smtp']);
export const warmupStatusEnum = pgEnum('warmup_status', ['not_started','warming','ready','paused']);
export const deliverabilityTestTypeEnum = pgEnum('deliverability_test_type', ['seed_test','dns_check','content_scan']);
export const deliverabilityResultEnum = pgEnum('deliverability_result', ['inbox','spam','promotions','junk','not_tested']);

export const emailAccounts = pgTable('email_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  emailAddress: varchar('email_address', { length: 255 }).notNull(),
  provider: emailProviderEnum('provider').default('custom_smtp').notNull(),
  smtpHost: varchar('smtp_host', { length: 255 }),
  smtpPort: integer('smtp_port'),
  imapHost: varchar('imap_host', { length: 255 }),
  imapPort: integer('imap_port'),
  authCredentials: jsonb('auth_credentials'),
  warmupStatus: warmupStatusEnum('warmup_status').default('not_started').notNull(),
  warmupDay: integer('warmup_day').default(0).notNull(),
  dailySendLimit: integer('daily_send_limit').default(20).notNull(),
  healthScore: real('health_score'),
  spfValid: boolean('spf_valid'),
  dkimValid: boolean('dkim_valid'),
  dmarcValid: boolean('dmarc_valid'),
  isSeedAccount: boolean('is_seed_account').default(false).notNull(),
  warmupSeedEmails: jsonb('warmup_seed_emails').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const warmupSchedule = pgTable('warmup_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailAccountId: uuid('email_account_id').references(() => emailAccounts.id).notNull(),
  dayNumber: integer('day_number').notNull(),
  targetSends: integer('target_sends').notNull(),
  actualSends: integer('actual_sends').default(0).notNull(),
  inboxRate: real('inbox_rate'),
  spamRate: real('spam_rate'),
  executedAt: timestamp('executed_at'),
});

export const deliverabilityTests = pgTable('deliverability_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailAccountId: uuid('email_account_id').references(() => emailAccounts.id).notNull(),
  campaignId: uuid('campaign_id'),
  testType: deliverabilityTestTypeEnum('test_type').default('seed_test').notNull(),
  gmailResult: deliverabilityResultEnum('gmail_result').default('not_tested').notNull(),
  outlookResult: deliverabilityResultEnum('outlook_result').default('not_tested').notNull(),
  yahooResult: deliverabilityResultEnum('yahoo_result').default('not_tested').notNull(),
  overallScore: real('overall_score'),
  issuesDetected: jsonb('issues_detected').default([]),
  spamTriggerWords: jsonb('spam_trigger_words'),
  testedAt: timestamp('tested_at').defaultNow().notNull(),
});

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type WarmupSchedule = typeof warmupSchedule.$inferSelect;
export type DeliverabilityTest = typeof deliverabilityTests.$inferSelect;
export type NewEmailAccount = typeof emailAccounts.$inferInsert;
export type NewWarmupSchedule = typeof warmupSchedule.$inferInsert;
export type NewDeliverabilityTest = typeof deliverabilityTests.$inferInsert;
