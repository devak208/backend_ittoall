import { db } from '../src/database/connection.js';
import { devices, deviceHistory } from '../src/database/index.js';
import { createId } from '@paralleldrive/cuid2';
import { seed } from 'drizzle-orm/mysql2/seed';

async function main() {
  try {
    // Seed with both tables exposed to handle foreign key constraints
    await seed(db, {
      devices,
      deviceHistory
    }).run();
    
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

main();