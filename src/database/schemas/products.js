import { mysqlTable,bigint, varchar, boolean, datetime, decimal } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

/** * Products table for managing product inventory */
export const products = mysqlTable("products", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
// UUID or custom ID as string
  proCode: varchar("pro_code", { length: 50 }).notNull().unique(), // Adjust length if needed
  productName: varchar("product_name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // e.g. 99999.99
  description: varchar("description", { length: 1000 }), // Optional
  isActive: boolean("is_active").notNull().default(true), // Soft delete flag
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})
