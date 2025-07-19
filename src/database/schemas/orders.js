import { mysqlTable, bigint, varchar, datetime, decimal, int } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"
import { users } from "./auth.js"
import { products } from "./products.js"

/**
 * Orders table for storing order information
 */
export const orders = mysqlTable("orders", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number" }).references(() => users.id),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})

/**
 * Order items table for storing individual items in an order
 */
export const orderItems = mysqlTable("order_items", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  orderId: bigint("order_id", { mode: "number" }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: bigint("product_id", { mode: "number" }).references(() => products.id),
  productCode: varchar("product_code", { length: 50 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})