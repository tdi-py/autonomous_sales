import { pgTable, uuid, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'starter', 'pro', 'agency', 'enterprise']);
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'member', 'viewer']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  plan: planEnum('plan').default('free').notNull(),
  role: userRoleEnum('role').default('owner').notNull(),
  locale: varchar('locale', { length: 10 }).default('en').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;