/**
 * Creates a test user (if missing), signs in via password grant,
 * and emits the Supabase auth cookie string for curl testing.
 */
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const REF = SUPABASE_URL.match(/https:\/\/([^.]+)\./)[1];

const EMAIL = 'demo@leadreach.test';
const PASSWORD = 'Demo1234!Pass';

async function main() {
  // 1. Create or get user via Admin API
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Demo Tester' },
    }),
  });
  const created = await createRes.json().catch(() => ({}));
  if (!createRes.ok && !created.id) {
    // Maybe user exists already — try to find
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(EMAIL)}`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }
    );
    const listed = await listRes.json();
    const found = listed.users?.find((u) => u.email === EMAIL);
    if (!found) {
      // Service role key may be rotated/invalid — fall back to a direct
      // password grant probe. If sign-in succeeds the user exists and we
      // can proceed; only truly-missing users need the Admin API.
      const probe = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      });
      if (probe.ok) {
        console.log('# user exists (verified via password grant; admin API key invalid)');
      } else {
        throw new Error('Could not create or find test user: ' + JSON.stringify(created));
      }
    } else {
      console.log('# user already existed:', found.id);
    }
  } else {
    console.log('# user created:', created.id);
  }

  // 2. Password grant
  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!tokenRes.ok) {
    throw new Error('Password grant failed: ' + (await tokenRes.text()));
  }
  const session = await tokenRes.json();

  // 3. Build cookies in @supabase/ssr v0.10+ format (base64- prefixed JSON)
  const sessionForCookie = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: session.user,
  };
  const b64 = Buffer.from(JSON.stringify(sessionForCookie)).toString('base64url');
  const cookieName = `sb-${REF}-auth-token`;

  fs.writeFileSync('/tmp/sb-cookie.txt', `${cookieName}=base64-${b64}`);
  fs.writeFileSync('/tmp/sb-session.json', JSON.stringify(sessionForCookie, null, 2));
  console.log('# cookie written to /tmp/sb-cookie.txt');
  console.log('# cookie name:', cookieName, '| token length:', session.access_token.length);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
