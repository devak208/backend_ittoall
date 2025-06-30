import { pgTable, uuid, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core';
import { devices } from './devices.js';

/**
 * Table for tracking device history and audit trail
 */
export const deviceHistory = pgTable('device_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'approved', 'expired', 'extended', 'disabled'
  previousStatus: boolean('previous_status'),
  newStatus: boolean('new_status'),
  actionBy: varchar('action_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  notes: text('notes'),
});
