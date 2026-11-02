/**
 * Debug: replicate the app's supabase-middleware createServerClient setup
 * and test getUser() against a supplied cookie value.
 * Usage: node scripts/debug-auth-cookie.js <cookiefile>
 */
const { createServerClient } = require('@supabase/ssr');
const fs = require('fs');

const env = {};
for (const line of fs.readFileSync('/home/z/my-project/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const cookieFile = process.argv[2] || '/tmp/sb-cookie.txt';
const raw = fs.readFileSync(cookieFile, 'utf8').trim();
const [name, value] = raw.split('=');

// Parse cookie value the way the browser would send it (percent-encoded raw JSON)
const decodedValue = decodeURIComponent(value);

const requestCookies = { [name]: decodedValue };

const supabase = createServerClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll() {
        return Object.entries(requestCookies).map(([n, v]) => ({ name: n, value: v }));
      },
      setAll() {
        // no-op for test
      },
    },
  }
);

(async () => {
  const { data, error } = await supabase.auth.getUser();
  console.log('user:', data?.user?.id || null);
  console.log('error:', error ? `${error.name || ''} ${error.message}` : 'none');
  const sess = await supabase.auth.getSession();
  console.log('session present:', !!sess.data.session);
  if (sess.error) console.log('session error:', sess.error.message);
})();
