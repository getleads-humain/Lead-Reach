/**
 * LeadReach — Admin: Fix Supabase Security Warnings
 * ===================================================
 * POST /api/admin/fix-security
 *
 * Applies fixes for 3 Supabase Security Advisor warnings:
 *   1. anon_security_definer_function_executable
 *   2. authenticated_security_definer_function_executable
 *   3. auth_leaked_password_protection
 *
 * Requires SUPABASE_DB_PASSWORD env var for database connection.
 * Falls back to providing SQL instructions if connection fails.
 */

import { NextRequest, NextResponse } from 'next/server';

// SQL statements for warnings 1 & 2
const SQL_FIX_WARNINGS_1_2 = `
-- Revoke EXECUTE on handle_new_user() from anon, authenticated, and PUBLIC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
`;

// Verification query
const SQL_VERIFY = `
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public'
  AND grantee IN ('anon', 'authenticated');
`;

export async function POST(request: NextRequest) {
  const results: {
    warning1_2: { status: string; message: string; details?: string };
    warning3: { status: string; message: string; details?: string };
  } = {
    warning1_2: { status: 'pending', message: '' },
    warning3: { status: 'pending', message: '' },
  };

  // ─── Fix Warnings 1 & 2: Revoke EXECUTE on handle_new_user() ──────────
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl?.replace('https://', '').replace('.supabase.co', '');

  if (!dbPassword || !projectRef) {
    results.warning1_2 = {
      status: 'needs_manual_action',
      message: 'Cannot connect to database: SUPABASE_DB_PASSWORD not set in .env',
      details: `Add SUPABASE_DB_PASSWORD to your .env file, then re-run this endpoint. You can find the database password in Supabase Dashboard → Project Settings → Database → Connection string.\n\nAlternatively, run the following SQL in Supabase SQL Editor:\n${SQL_FIX_WARNINGS_1_2}`,
    };
  } else {
    try {
      // Dynamic import of pg (may not be available in edge runtime)
      const { Client } = await import('pg');

      const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

      const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
      });

      await client.connect();

      // Apply the fix
      await client.query(SQL_FIX_WARNINGS_1_2);

      // Verify the fix
      const verifyResult = await client.query(SQL_VERIFY);

      await client.end();

      if (verifyResult.rows.length === 0) {
        results.warning1_2 = {
          status: 'fixed',
          message: 'EXECUTE permission revoked from anon and authenticated on handle_new_user()',
        };
      } else {
        results.warning1_2 = {
          status: 'partial',
          message: 'Some grants still exist',
          details: JSON.stringify(verifyResult.rows, null, 2),
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.warning1_2 = {
        status: 'needs_manual_action',
        message: `Database connection failed: ${errorMessage}`,
        details: `Run the following SQL in Supabase SQL Editor instead:\n${SQL_FIX_WARNINGS_1_2}`,
      };
    }
  }

  // ─── Fix Warning 3: Enable Leaked Password Protection ────────────────
  // This requires the Supabase Management API with a personal access token,
  // which we don't have. We'll try the API and fall back to instructions.

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (accessToken && projectRef) {
    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password_hibp_enabled: true }),
        }
      );

      if (response.ok) {
        results.warning3 = {
          status: 'fixed',
          message: 'Leaked password protection has been enabled',
        };
      } else {
        const errorBody = await response.text();
        results.warning3 = {
          status: 'needs_manual_action',
          message: `Management API returned ${response.status}`,
          details: `${errorBody}\n\nEnable it manually: Supabase Dashboard → Authentication → Providers → Email → Security → Enable "Protect against leaked passwords"`,
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.warning3 = {
        status: 'needs_manual_action',
        message: `Management API error: ${errorMessage}`,
        details: 'Enable it manually: Supabase Dashboard → Authentication → Providers → Email → Security → Enable "Protect against leaked passwords"',
      };
    }
  } else {
    results.warning3 = {
      status: 'needs_manual_action',
      message: 'SUPABASE_ACCESS_TOKEN not set — cannot use Management API',
      details: 'Enable leaked password protection manually:\n\n1. Go to Supabase Dashboard\n2. Navigate to Authentication → Providers\n3. Click on "Email" provider\n4. Under "Security", toggle ON "Protect against leaked passwords"\n5. Click Save\n\nAlternatively, add SUPABASE_ACCESS_TOKEN (personal access token) to .env and re-run this endpoint.',
    };
  }

  const allFixed = results.warning1_2.status === 'fixed' && results.warning3.status === 'fixed';
  const anyNeedsAction =
    results.warning1_2.status === 'needs_manual_action' ||
    results.warning3.status === 'needs_manual_action';

  return NextResponse.json(
    {
      success: allFixed,
      message: allFixed
        ? 'All 3 security warnings have been fixed!'
        : anyNeedsAction
          ? 'Some fixes require manual action. See details below.'
          : 'Fixes partially applied. See details below.',
      results,
      sql_for_manual_run: SQL_FIX_WARNINGS_1_2,
    },
    { status: allFixed ? 200 : 207 }
  );
}

export async function GET() {
  // Return instructions for manual fix
  return NextResponse.json({
    message: 'Supabase Security Warning Fix Endpoint',
    method: 'POST to this endpoint to apply fixes',
    env_vars_needed: [
      'SUPABASE_DB_PASSWORD — Database password (found in Supabase Dashboard → Settings → Database)',
      'SUPABASE_ACCESS_TOKEN — Personal access token (optional, for Warning 3)',
    ],
    sql_for_sql_editor: SQL_FIX_WARNINGS_1_2,
    warning3_instructions:
      'Enable leaked password protection: Supabase Dashboard → Authentication → Providers → Email → Security → Enable "Protect against leaked passwords"',
  });
}
