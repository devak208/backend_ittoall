import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/database/index.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'mysql://root:devak%40123@localhost:3306/crackers_db',
  },
});
