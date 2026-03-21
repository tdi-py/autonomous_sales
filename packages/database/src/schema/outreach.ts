import { pgTable, uuid, varchar, boolean, timestamp, text, real, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { leads } from './leads';
import { campaigns } from './campaigns';
import { projects } from './projects';

export const outreachChannelEnum = pgEnum('outreach_channel', [
  'email',
  'call',
  'linkedin',
  'contact_form',
]);

export const outreachStatusEnum = pgEnum('outreach_status', [
  'sent',
  'delivered',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'failed',
  'call_completed',
  'call_no_answer',
  'call_voicemail',
]);

export const sentimentEnum = pgEnum('sentiment', [
  'positive',
  'negative',
  'neutral',
  'objection',
  'unsubscribe',
  'out_of_office',
]);

export const suppressionReasonEnum = pgEnum('suppression_reason', [
  'unsubscribed',
  'bounced',
  'complained',
  'manual',
]);

export const outreachEvents = pgTable('outreach_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id)
    .notNull(),
  channel: outreachChannelEnum('channel').default('email').notNull(),
  sequenceStepId: uuid('sequence_step_id'),
  callScriptId: uuid('call_script_id'),
  status: outreachStatusEnum('status').default('sent').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  metadata: jsonb('metadata').default({}),
});

export const inboxMessages = pgTable('inbox_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  leadId: uuid('lead_id').references(() => leads.id),
  outreachEventId: uuid('outreach_event_id').references(() => outreachEvents.id),
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  sentiment: sentimentEnum('sentiment').default('neutral').notNull(),
  sentimentScore: real('sentiment_score'),
  aiSummary: text('ai_summary'),
  isRead: boolean('is_read').default(false).notNull(),
  requiresAction: boolean('requires_action').default(false).notNull(),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
});

export const suppressionList = pgTable('suppression_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  reason: suppressionReasonEnum('reason').default('unsubscribed').notNull(),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

export type OutreachEvent = typeof outreachEvents.$inferSelect;
export type InboxMessage = typeof inboxMessages.$inferSelect;
export type SuppressionEntry = typeof suppressionList.$inferSelect;