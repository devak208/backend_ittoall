import { mysqlTable,bigint, varchar, datetime, boolean } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

/** * Table for storing disabled devices */
export const disabledDevices = mysqlTable("disabled_devices", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
 // UUIDs stored as VARCHAR(36)
  email: varchar("email", { length: 255 }).notNull(),
  androidId: varchar("android_id", { length: 255 }).notNull().unique(),
  originalCreatedAt: datetime("original_created_at").notNull(),
  wasApproved: boolean("was_approved").notNull().default(false),
  approvedAt: datetime("approved_at"),
  expiresAt: datetime("expires_at"),
  disabledAt: datetime("disabled_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  disabledBy: varchar("disabled_by", { length: 255 }),
  disableReason: varchar("disable_reason", { length: 1000 }),
  originalNotes: varchar("original_notes", { length: 1000 }),
})

/** * Table for storing rejected devices */
export const rejectedDevices = mysqlTable("rejected_devices", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
 // UUIDs stored as VARCHAR(36)
  email: varchar("email", { length: 255 }).notNull(),
  androidId: varchar("android_id", { length: 255 }).notNull().unique(),
  originalCreatedAt: datetime("original_created_at").notNull(),
  rejectedAt: datetime("rejected_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  rejectedBy: varchar("rejected_by", { length: 255 }),
  rejectionReason: varchar("rejection_reason", { length: 1000 }),
  originalNotes: varchar("original_notes", { length: 1000 }),
})
