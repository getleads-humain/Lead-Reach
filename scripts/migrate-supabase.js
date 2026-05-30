#!/usr/bin/env node
/**
 * LeadReach — Supabase Migration Runner
 * =======================================
 * Automatically connects to Supabase PostgreSQL and runs the full migration SQL.
 *
 * Usage:
 *   node scripts/migrate-supabase.js                  # Run migration
 *   node scripts/migrate-supabase.js --verify         # Verify tables only
 *   node scripts/migrate-supabase.js --dry-run        # Show what would run
 *
 * Connection methods (tried in order):
 *   1. DATABASE_URL from .env (direct connection)
 *   2. SUPABASE_POOLER_URL from .env (connection pooler)
 *   3. Supabase REST API (fallback — limited to verification only)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ── Configuration ───────────────────────────────────────────────────────────

const PROJECT_DIR = path.join(__dirname, '..');
const MIGRATION_FILE = path.join(PROJECT_DIR, 'supabase', 'migrations', '001_initial_schema.sql');
const ENV_FILE = path.join(PROJECT_DIR, '.env');

// ── Load .env ───────────────────────────────────────────────────────────────

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ No .env file found at', ENV_FILE);
    process.exit(1);
  }
  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
    process.env[key] = val;
  }
  return env;
}

// ── Connection strategies ───────────────────────────────────────────────────

const CONNECTION_STRATEGIES = [
  {
    name: 'Direct Connection (DATABASE_URL)',
    getUrl: (env) => env.DATABASE_URL,
  },
  {
    name: 'Pooler Connection (SUPABASE_POOLER_URL)',
    getUrl: (env) => env.SUPABASE_POOLER_URL,
  },
];

async function tryConnect(connectionUrl) {
  const client = new Client({
    connectionString: connectionUrl,
    connectionTimeoutMillis: 8000,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    return client;
  } catch (err) {
    try { await client.end(); } catch (_) {}
    throw err;
  }
}

async function findConnection(env) {
  for (const strategy of CONNECTION_STRATEGIES) {
    const url = strategy.getUrl(env);
    if (!url) continue;
    console.log(`\n🔗 Trying: ${strategy.name}`);
    try {
      const client = await tryConnect(url);
      console.log(`   ✅ Connected successfully!`);
      return client;
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message.substring(0, 80)}`);
    }
  }
  return null;
}

// ── Migration execution ─────────────────────────────────────────────────────

async function runMigration(client) {
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  console.log(`\n📄 Read migration file: ${MIGRATION_FILE}`);
  console.log(`   Size: ${(sql.length / 1024).toFixed(1)} KB`);

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('\n✅ Migration executed successfully!');
    return true;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('\n❌ Migration failed:', err.message);

    // Try running without transaction (some DDL can't be in transactions)
    console.log('\n🔄 Retrying without transaction...');
    try {
      await client.query(sql);
      console.log('\n✅ Migration succeeded (without transaction)!');
      return true;
    } catch (err2) {
      console.error('\n❌ Migration failed again:', err2.message);
      return false;
    }
  }
}

// ── Verification ────────────────────────────────────────────────────────────

const EXPECTED_TABLES = [
  'campaigns', 'leads', 'outreach', 'agent_tasks', 'agent_reach_channels',
  'sub_accounts', 'ai_setters', 'setter_conversations', 'custom_ai_tasks',
  'ab_tests', 'icp_profiles', 'follow_up_sequences',
];

async function verifyDatabase(client) {
  console.log('\n🔍 Verifying database schema...');

  const result = await client.query(`
    SELECT table_name,
           (SELECT count(*) FROM information_schema.columns
            WHERE table_schema = 'public'
              AND columns.table_name = tables.table_name) as column_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const existingTables = result.rows.map(r => r.table_name);
  let allGood = true;

  for (const expected of EXPECTED_TABLES) {
    if (existingTables.includes(expected)) {
      const info = result.rows.find(r => r.table_name === expected);
      console.log(`   ✅ ${expected} (${info.column_count} columns)`);
    } else {
      console.log(`   ❌ ${expected} — MISSING`);
      allGood = false;
    }
  }

  // Check RLS
  const rlsResult = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename IN (${EXPECTED_TABLES.map(t => `'${t}'`).join(',')})
    ORDER BY tablename
  `);
  console.log('\n🔒 Row Level Security:');
  for (const row of rlsResult.rows) {
    console.log(`   ${row.rowsecurity ? '✅' : '⚠️ '} ${row.tablename} — RLS ${row.rowsecurity ? 'enabled' : 'disabled'}`);
  }

  // Check indexes
  const idxResult = await client.query(`
    SELECT count(*) as idx_count
    FROM pg_indexes
    WHERE schemaname = 'public'
  `);
  console.log(`\n📊 Total indexes: ${idxResult.rows[0].idx_count}`);

  return allGood;
}

// ── REST API verification (fallback when DB connection fails) ───────────────

async function verifyViaRestApi(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log('⚠️  No Supabase URL/Key for REST API verification');
    return false;
  }

  console.log('\n🌐 Verifying via Supabase REST API...');

  for (const table of EXPECTED_TABLES) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
      });
      if (response.ok) {
        console.log(`   ✅ ${table} — accessible`);
      } else if (response.status === 404) {
        console.log(`   ❌ ${table} — not found (needs migration)`);
      } else {
        const err = await response.json();
        console.log(`   ⚠️  ${table} — ${err.message || response.status}`);
      }
    } catch (e) {
      console.log(`   ❌ ${table} — request failed: ${e.message}`);
    }
  }
  return true;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isVerify = args.includes('--verify');
  const isDryRun = args.includes('--dry-run');

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   LeadReach — Supabase Migration Runner         ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const env = loadEnv();

  if (isDryRun) {
    console.log('\n📋 DRY RUN — would execute the following migration:');
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
    const lines = sql.split('\n').filter(l => l.trim() && !l.trim().startsWith('--'));
    console.log(`   ${lines.length} SQL statements`);
    console.log(`   ${(sql.length / 1024).toFixed(1)} KB total`);
    console.log(`\n   Tables: ${EXPECTED_TABLES.join(', ')}`);
    return;
  }

  // Try to connect to database
  const client = await findConnection(env);

  if (!client) {
    console.log('\n⚠️  Could not connect to Supabase PostgreSQL directly.');
    console.log('   This is expected if your server lacks IPv6 or pooler access.');
    console.log('');
    console.log('📋 To complete migration, do ONE of the following:');
    console.log('');
    console.log('   Option A — Supabase Dashboard SQL Editor (RECOMMENDED):');
    console.log('   1. Go to: https://supabase.com/dashboard/project/ssaskkftdpidfwvpgdwl/sql');
    console.log('   2. Copy the contents of: supabase/migrations/001_initial_schema.sql');
    console.log('   3. Paste into the SQL Editor and click "Run"');
    console.log('');
    console.log('   Option B — Supabase CLI (if you have access token):');
    console.log('   1. Run: supabase login');
    console.log('   2. Run: supabase link --project-ref ssaskkftdpidfwvpgdwl');
    console.log('   3. Run: supabase db push');
    console.log('');

    // Try REST API verification as fallback
    await verifyViaRestApi(env);
    process.exit(1);
  }

  try {
    if (isVerify) {
      await verifyDatabase(client);
    } else {
      // Run migration
      const success = await runMigration(client);
      if (success) {
        // Verify after migration
        await verifyDatabase(client);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
