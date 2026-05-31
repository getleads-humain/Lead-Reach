/**
 * LeadReach — Fix Supabase Security Advisor Warnings
 * ===================================================
 * Run: npx tsx scripts/fix-supabase-security.ts
 *
 * Prerequisites:
 *   - Set SUPABASE_DB_PASSWORD in .env (find it in Supabase Dashboard → Settings → Database)
 *   - Optionally set SUPABASE_ACCESS_TOKEN for Warning 3 (Management API)
 *
 * Fixes:
 *   1. anon_security_definer_function_executable        → REVOKE EXECUTE from anon
 *   2. authenticated_security_definer_function_executable → REVOKE EXECUTE from authenticated
 *   3. auth_leaked_password_protection                   → Enable via Management API or Dashboard
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const PROJECT_REF = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

// ANSI color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(level: 'info' | 'success' | 'warn' | 'error', message: string) {
  const prefix = {
    info: `${CYAN}ℹ${RESET}`,
    success: `${GREEN}✓${RESET}`,
    warn: `${YELLOW}⚠${RESET}`,
    error: `${RED}✗${RESET}`,
  }[level];
  console.log(`${prefix} ${message}`);
}

// ─── SQL for Warnings 1 & 2 ──────────────────────────────────────────────
const SQL_REVOKE_EXECUTE = `
-- Revoke EXECUTE on handle_new_user() from anon, authenticated, and PUBLIC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
`;

const SQL_VERIFY = `
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public'
  AND grantee IN ('anon', 'authenticated');
`;

async function fixWarnings1And2(): Promise<boolean> {
  console.log(`\n${BOLD}─── Warning 1 & 2: Revoke EXECUTE on handle_new_user() ───${RESET}`);

  if (!DB_PASSWORD) {
    log('error', 'SUPABASE_DB_PASSWORD is not set in .env');
    log('info', 'Find your database password:');
    log('info', '  1. Go to https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database');
    log('info', '  2. Copy the password from the Connection string');
    log('info', '  3. Add SUPABASE_DB_PASSWORD=<your-password> to .env');
    log('info', '  4. Re-run this script');
    log('warn', 'Alternatively, run this SQL in the Supabase SQL Editor:');
    console.log(SQL_REVOKE_EXECUTE);
    return false;
  }

  const connectionString = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  try {
    log('info', `Connecting to Supabase database (pooler)...`);

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      statement_timeout: 30000,
    });

    await client.connect();
    log('success', 'Connected to database');

    // Apply the fix
    log('info', 'Revoking EXECUTE permissions...');
    await client.query(SQL_REVOKE_EXECUTE);
    log('success', 'SQL executed successfully');

    // Verify
    log('info', 'Verifying fix...');
    const result = await client.query(SQL_VERIFY);

    if (result.rows.length === 0) {
      log('success', 'VERIFIED: No EXECUTE grants remain for anon or authenticated');
    } else {
      log('warn', 'Some grants still exist:');
      console.table(result.rows);
    }

    await client.end();
    return result.rows.length === 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log('error', `Database connection failed: ${message}`);

    // Try direct connection as fallback
    const directString = `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
    log('info', 'Trying direct connection...');

    try {
      const client2 = new Client({
        connectionString: directString,
        ssl: { rejectUnauthorized: false },
        statement_timeout: 30000,
      });

      await client2.connect();
      log('success', 'Connected via direct connection');

      await client2.query(SQL_REVOKE_EXECUTE);
      log('success', 'SQL executed successfully');

      const result = await client2.query(SQL_VERIFY);
      if (result.rows.length === 0) {
        log('success', 'VERIFIED: No EXECUTE grants remain for anon or authenticated');
      }

      await client2.end();
      return result.rows.length === 0;
    } catch (error2: unknown) {
      const msg2 = error2 instanceof Error ? error2.message : String(error2);
      log('error', `Direct connection also failed: ${msg2}`);
      log('warn', 'Run this SQL manually in the Supabase SQL Editor:');
      console.log(SQL_REVOKE_EXECUTE);
      return false;
    }
  }
}

async function fixWarning3(): Promise<boolean> {
  console.log(`\n${BOLD}─── Warning 3: Enable Leaked Password Protection ───${RESET}`);

  if (!ACCESS_TOKEN) {
    log('warn', 'SUPABASE_ACCESS_TOKEN not set — cannot use Management API');
    log('info', 'Enable leaked password protection manually:');
    log('info', '  1. Go to https://supabase.com/dashboard/project/' + PROJECT_REF + '/auth/providers');
    log('info', '  2. Click on "Email" provider');
    log('info', '  3. Under "Security", toggle ON "Protect against leaked passwords"');
    log('info', '  4. Click Save');
    log('info', '');
    log('info', 'Alternatively, generate a personal access token:');
    log('info', '  1. Go to https://supabase.com/dashboard/account/tokens');
    log('info', '  2. Generate a new token');
    log('info', '  3. Add SUPABASE_ACCESS_TOKEN=<your-token> to .env');
    log('info', '  4. Re-run this script');
    return false;
  }

  try {
    log('info', 'Enabling leaked password protection via Management API...');

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password_hibp_enabled: true }),
      }
    );

    if (response.ok) {
      log('success', 'Leaked password protection has been ENABLED');
      return true;
    } else {
      const errorBody = await response.text();
      log('error', `Management API returned ${response.status}: ${errorBody}`);
      log('warn', 'Enable it manually in the Supabase Dashboard');
      return false;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log('error', `Management API error: ${message}`);
    log('warn', 'Enable it manually in the Supabase Dashboard');
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`${BOLD}${CYAN}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   LeadReach — Fix Supabase Security Advisor Warnings   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${RESET}`);

  log('info', `Project: ${PROJECT_REF}`);
  log('info', `Database password: ${DB_PASSWORD ? '✓ Set' : '✗ Not set'}`);
  log('info', `Access token: ${ACCESS_TOKEN ? '✓ Set' : '✗ Not set'}`);

  const result1 = await fixWarnings1And2();
  const result3 = await fixWarning3();

  console.log(`\n${BOLD}─── Summary ───${RESET}`);

  if (result1 && result3) {
    log('success', 'All 3 security warnings have been FIXED!');
  } else {
    if (result1) {
      log('success', 'Warning 1 & 2: FIXED');
    } else {
      log('warn', 'Warning 1 & 2: Needs manual action (see above)');
    }
    if (result3) {
      log('success', 'Warning 3: FIXED');
    } else {
      log('warn', 'Warning 3: Needs manual action (see above)');
    }
  }

  process.exit(result1 && result3 ? 0 : 1);
}

main().catch((error) => {
  log('error', `Unexpected error: ${error}`);
  process.exit(1);
});
