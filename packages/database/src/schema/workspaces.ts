import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const workspaceMemberRoleEnum = pgEnum('workspace_member_role', [
  'owner',
  'admin',
  'member',
  'viewer',
]);

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('owner_id')
    .references(() => users.id)
    .notNull(),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  maxProjects: integer('max_projects').default(1).notNull(),
  maxEmailAccounts: integer('max_email_accounts').default(1).notNull(),
  maxSendsPerDay: integer('max_sends_per_day').default(50).notNull(),
  billingEmail: varchar('billing_email', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: workspaceMemberRoleEnum('role').default('member').notNull(),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    acceptedAt: timestamp('accepted_at'),
  },
  (table) => ({
    uniqueMember: uniqueIndex('unique_workspace_member').on(table.workspaceId, table.userId),
  }),
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;