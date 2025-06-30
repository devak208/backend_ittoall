import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(connectionString);

async function initDb() {
  try {
    await sql`SELECT 1`; // ✅ Test query
    console.log('✅ PostgreSQL connection successful');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
}

initDb();

export const db = drizzle(sql, { schema });
export { sql };
