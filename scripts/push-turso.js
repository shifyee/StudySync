import { createClient } from '@libsql/client';
import { execSync } from 'child_process';
import fs from 'fs';

async function main() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  console.log('🔄 Generating SQL from Prisma schema...');
  try {
    // Generate SQL using a temporary local SQLite file
    execSync('DATABASE_URL="file:./dev.db" npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql', { stdio: 'inherit' });
    const sql = fs.readFileSync('migration.sql', 'utf8');
    fs.unlinkSync('migration.sql');

    if (!sql.trim()) {
      console.log('✅ Database schema is already up to date. No changes needed.');
      return;
    }

    console.log('📝 SQL to execute:\n', sql);

    console.log('🔌 Connecting to Turso...');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    console.log(`🚀 Executing ${statements.length} statements...`);

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
        console.log(`✅ Executed: ${stmt.slice(0, 50)}...`);
      } catch (e) {
        // Ignore "already exists" errors to allow re-runs
        if (!e.message.includes('already exists')) {
          console.error('❌ Statement failed:', e.message);
          console.error('   Statement:', stmt);
          throw e; // Fail the script so Render shows an error
        } else {
          console.log(`ℹ️ Skipped (already exists): ${stmt.slice(0, 50)}...`);
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
