import { pgTable, uuid, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core';

/**
 * Main devices table for active devices
 */
export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  androidId: varchar('android_id', { length: 255 }).notNull().unique(),
  isApproved: boolean('is_approved').default(false).notNull(),
  approvedAt: timestamp('approved_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  notes: text('notes'),
});
