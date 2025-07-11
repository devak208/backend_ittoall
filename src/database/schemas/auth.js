import { mysqlTable, int, bigint, varchar, boolean, datetime } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

/** * Users table */
export const users = mysqlTable("users", {
   id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: varchar("image", { length: 1000 }),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  tokenVersion: int("token_version").notNull().default(0), // Add this field for refresh token invalidation
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})

/** * Accounts table */
export const accounts = mysqlTable("accounts", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  accessToken: varchar("access_token", { length: 1000 }),
  refreshToken: varchar("refresh_token", { length: 1000 }),
  idToken: varchar("id_token", { length: 1000 }),
  accessTokenExpiresAt: datetime("access_token_expires_at"),
  refreshTokenExpiresAt: datetime("refresh_token_expires_at"),
  scope: varchar("scope", { length: 500 }),
  password: varchar("password", { length: 255 }),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})

/** * Sessions table */
export const sessions = mysqlTable("sessions", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),

  expiresAt: datetime("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: varchar("user_agent", { length: 1000 }),
  
})

/** * Verifications table */
export const verifications = mysqlTable("verifications", {
 id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),

  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})
