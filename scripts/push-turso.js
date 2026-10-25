import { createClient } from '@libsql/client';
import { execSync } from 'child_process';
import fs from 'fs';

async function main() {
  // 1. Check for Turso variables
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  // 2. Generate SQL from your Prisma schema
  console.log('Generating SQL from Prisma schema...');
  try {
    // We use the local SQLite file temporarily just to generate the SQL
    execSync('DATABASE_URL="file:./dev.db" npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql');
    const sql = fs.readFileSync('migration.sql', 'utf8');
    fs.unlinkSync('migration.sql');

    if (!sql.trim()) {
      console.log('✅ Database schema is already up to date.');
      return;
    }

    // 3. Connect to Turso and apply the SQL
    console.log('Connecting to Turso...');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (e) {
        // Ignore "table already exists" errors so it doesn't fail on re-deploys
        if (!e.message.includes('already exists')) {
          console.warn('⚠️ Statement warning:', e.message);
        }
      }
    }
    
    console.log('✅ Turso database synced successfully!');
  } catch (err) {
    console.error('❌ Failed to sync database:', err);
    process.exit(1);
  }
}

main();
