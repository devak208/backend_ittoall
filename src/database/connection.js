import mysql from "mysql2/promise"
import { drizzle } from "drizzle-orm/mysql2"
import * as schema from "./index.js"
import dotenv from "dotenv"

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}

const pool = mysql.createPool(connectionString)

async function initDb() {
  try {
    const conn = await pool.getConnection()
    await conn.query("SELECT 1")
    console.log("✅ MySQL connection successful")
    conn.release()
  } catch (error) {
    console.error("❌ MySQL connection failed:", error)
    process.exit(1)
  }
}

initDb()

// Add mode: 'default' for standard MySQL or mode: 'planetscale' if using PlanetScale
export const db = drizzle(pool, { schema, mode: "default" })
export { pool }
