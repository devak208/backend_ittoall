import { pgTable, uuid, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core';

/**
 * Table for storing disabled devices
 */
export const disabledDevices = pgTable('disabled_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  androidId: varchar('android_id', { length: 255 }).notNull().unique(),
  originalCreatedAt: timestamp('original_created_at').notNull(),
  wasApproved: boolean('was_approved').default(false).notNull(),
  approvedAt: timestamp('approved_at'),
  expiresAt: timestamp('expires_at'),
  disabledAt: timestamp('disabled_at').defaultNow().notNull(),
  disabledBy: varchar('disabled_by', { length: 255 }),
  disableReason: text('disable_reason'),
  originalNotes: text('original_notes'),
});

/**
 * Table for storing rejected devices
 */
export const rejectedDevices = pgTable('rejected_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  androidId: varchar('android_id', { length: 255 }).notNull().unique(),
  originalCreatedAt: timestamp('original_created_at').notNull(),
  rejectedAt: timestamp('rejected_at').defaultNow().notNull(),
  rejectedBy: varchar('rejected_by', { length: 255 }),
  rejectionReason: text('rejection_reason'),
  originalNotes: text('original_notes'),
});
