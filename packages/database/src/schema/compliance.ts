import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  integer,
  jsonb,
  pgEnum,
  time,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { leads } from './leads';
import { outreachEvents } from './outreach';
import { phoneVerification } from './leads';
import { workspaces } from './workspaces';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const callConsentTypeEnum = pgEnum('call_consent_type', [
  'inbound_form',
  'demo_request',
  'web_callback',
  'written_consent',
  'verbal_consent',
  'none',
]);

export const callConsentScopeEnum = pgEnum('call_consent_scope', [
  'email_only',
  'call_only',
  'ai_call',
  'all_channels',
]);

export const callTypeEnum = pgEnum('call_type', [
  'ai_voice',
  'human_manual',
  'power_dialer',
]);

export const overallComplianceResultEnum = pgEnum('overall_compliance_result', [
  'approved',
  'blocked',
  'needs_consent',
]);

export const consentTypeEnum = pgEnum('consent_type', ['email', 'call', 'sms']);
export const consentMethodEnum = pgEnum('consent_method', [
  'web_form',
  'verbal',
  'written',
  'implied',
]);

export const complianceCheckResultEnum = pgEnum('compliance_check_result', [
  'pass',
  'fail',
  'warning',
]);

export const abuseSeverityEnum = pgEnum('abuse_severity', [
  'warning',
  'suspension',
  'termination',
]);

export const abuseIncidentTypeEnum = pgEnum('abuse_incident_type', [
  'high_bounce',
  'spam_complaint',
  'blacklisted',
  'content_violation',
  'rate_limit_exceeded',
]);

export const deletionRequestTypeEnum = pgEnum('deletion_request_type', [
  'lead_deletion',
  'full_erasure',
]);

export const deletionRequestStatusEnum = pgEnum('deletion_request_status', [
  'pending',
  'processing',
  'completed',
  'rejected',
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * TCPA & AI call consent records per lead.
 * For AI voice calls to mobile numbers, prior express written consent is mandatory.
 */
export const callConsentRecords = pgTable('call_consent_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  consentType: callConsentTypeEnum('consent_type').default('none').notNull(),
  consentScope: callConsentScopeEnum('consent_scope').default('all_channels').notNull(),
  consentSource: varchar('consent_source', { length: 255 }),
  consentProofUrl: varchar('consent_proof_url', { length: 500 }),
  consentText: text('consent_text'),
  consentedToCompany: varchar('consented_to_company', { length: 255 }),
  grantedAt: timestamp('granted_at'),
  revokedAt: timestamp('revoked_at'),
  revocationMethod: varchar('revocation_method', { length: 100 }),
  revocationProcessedAt: timestamp('revocation_processed_at'),
  isValidForAi: boolean('is_valid_for_ai').default(false).notNull(),
});

/**
 * Pre-call compliance gate. Every AI/auto-dialer call must pass this check.
 * If overall_result != 'approved', the call is blocked at the worker level.
 */
export const callComplianceChecks = pgTable('call_compliance_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  outreachEventId: uuid('outreach_event_id')
    .references(() => outreachEvents.id)
    .notNull(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  phoneVerificationId: uuid('phone_verification_id').references(() => phoneVerification.id),
  consentRecordId: uuid('consent_record_id').references(() => callConsentRecords.id),
  callType: callTypeEnum('call_type').default('human_manual').notNull(),
  targetCountry: varchar('target_country', { length: 5 }).notNull(),
  targetState: varchar('target_state', { length: 10 }),
  // JSON shape: { dnc_clear: bool, consent_valid: bool, hours_ok: bool, rate_ok: bool, ... }
  checks: jsonb('checks').default({}),
  overallResult: overallComplianceResultEnum('overall_result').default('blocked').notNull(),
  blockReason: text('block_reason'),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
});

/**
 * Generic consent records (email / call / sms) — simpler version for non-TCPA contexts.
 */
export const consentRecords = pgTable('consent_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  consentType: consentTypeEnum('consent_type').notNull(),
  consentMethod: consentMethodEnum('consent_method').default('implied').notNull(),
  consentProof: text('consent_proof'),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
});

/**
 * Per-send compliance check results (email & general outreach).
 */
export const complianceChecks = pgTable('compliance_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  outreachEventId: uuid('outreach_event_id')
    .references(() => outreachEvents.id)
    .notNull(),
  checksPassed: jsonb('checks_passed').default([]),
  overallResult: complianceCheckResultEnum('overall_result').default('warning').notNull(),
  blockedReason: text('blocked_reason'),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
});

/**
 * Country/state level compliance rules. Pre-seeded for US, EU, CA.
 * Used by the compliance-check worker to gate outreach.
 */
export const complianceRules = pgTable('compliance_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  countryCode: varchar('country_code', { length: 5 }).notNull(),
  stateCode: varchar('state_code', { length: 10 }),
  regulationName: varchar('regulation_name', { length: 100 }).notNull(),
  requiresConsentEmail: boolean('requires_consent_email').default(false).notNull(),
  requiresConsentCall: boolean('requires_consent_call').default(false).notNull(),
  requiresPhysicalAddress: boolean('requires_physical_address').default(false).notNull(),
  requiresUnsubscribe: boolean('requires_unsubscribe').default(true).notNull(),
  maxOptOutDays: integer('max_opt_out_days').default(10).notNull(),
  aiDisclosureRequired: boolean('ai_disclosure_required').default(false).notNull(),
  callingHoursStart: time('calling_hours_start'),
  callingHoursEnd: time('calling_hours_end'),
  maxCallsPerDayPerNumber: integer('max_calls_per_day_per_number'),
  requiresTwoPartyConsent: boolean('requires_two_party_consent').default(false).notNull(),
  hasPrivateRightOfAction: boolean('has_private_right_of_action').default(false).notNull(),
  coldCallRules: jsonb('cold_call_rules').default({}),
  coldEmailRules: jsonb('cold_email_rules').default({}),
  penaltyPerViolation: varchar('penalty_per_violation', { length: 50 }),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Platform-level abuse tracking per workspace.
 */
export const abuseIncidents = pgTable('abuse_incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id)
    .notNull(),
  incidentType: abuseIncidentTypeEnum('incident_type').notNull(),
  severity: abuseSeverityEnum('severity').default('warning').notNull(),
  details: jsonb('details').default({}),
  actionTaken: text('action_taken'),
  resolved: boolean('resolved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * GDPR/CCPA erasure and deletion requests.
 */
export const dataDeletionRequests = pgTable('data_deletion_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  requestedBy: varchar('requested_by', { length: 255 }).notNull(),
  requestType: deletionRequestTypeEnum('request_type').default('lead_deletion').notNull(),
  status: deletionRequestStatusEnum('status').default('pending').notNull(),
  leadIds: jsonb('lead_ids').default([]),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type CallConsentRecord = typeof callConsentRecords.$inferSelect;
export type CallComplianceCheck = typeof callComplianceChecks.$inferSelect;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type ComplianceRule = typeof complianceRules.$inferSelect;
export type AbuseIncident = typeof abuseIncidents.$inferSelect;
export type DataDeletionRequest = typeof dataDeletionRequests.$inferSelect;