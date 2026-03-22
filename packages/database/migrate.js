const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
require('dotenv').config({ path: '../../.env' });

async function runMigrate() {
  console.log("Starting migration...");
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);
  
  try {
    console.log("Migrating via Drizzle ORM...");
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

runMigrate().catch(console.error);
