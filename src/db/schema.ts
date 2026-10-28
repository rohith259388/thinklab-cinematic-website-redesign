import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * Leads captured from the contact chamber — the moment a visitor's idea
 * re-enters the laboratory.
 */
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 220 }).notNull(),
  company: varchar('company', { length: 220 }),
  service: varchar('service', { length: 120 }),
  message: text('message').notNull(),
  source: varchar('source', { length: 60 }).notNull().default('contact'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
