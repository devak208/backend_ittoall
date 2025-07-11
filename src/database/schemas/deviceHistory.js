import { mysqlTable, bigint, varchar, datetime, boolean } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"
import { devices } from "./devices.js"

export const deviceHistory = mysqlTable("device_history", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),

  deviceId: bigint("device_id", { mode: "number" }).notNull().references(() => devices.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(),
  previousStatus: boolean("previous_status"),
  newStatus: boolean("new_status"),
  actionBy: varchar("action_by", { length: 255 }),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  notes: varchar("notes", { length: 1000 }),
})
