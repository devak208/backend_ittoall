import { mysqlTable, bigint , varchar, boolean, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const devices = mysqlTable("devices", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull(),
  androidId: varchar("android_id", { length: 255 }).notNull().unique(),
  isApproved: boolean("is_approved").notNull().default(false),
  approvedAt: datetime("approved_at"),
  expiresAt: datetime("expires_at"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  notes: varchar("notes", { length: 1000 }).default(sql`NULL`),
});
