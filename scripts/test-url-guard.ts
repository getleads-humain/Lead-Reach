/**
 * Quick sanity test for url-guard SSRF protection.
 * Run with: npx tsx scripts/test-url-guard.ts
 */
import { assertSafeUrlSync, assertSafeUrl, checkUrlSafetySync, UnsafeUrlError } from '../src/lib/url-guard';

const syncCases: Array<{ url: string; expectSafe: boolean; reason?: string }> = [
  // Safe URLs
  { url: 'https://example.com/path', expectSafe: true },
  { url: 'http://example.com:8080/path', expectSafe: true },
  { url: 'https://api.example.com/v1/data', expectSafe: true },

  // Dangerous schemes
  { url: 'file:///etc/passwd', expectSafe: false, reason: 'not allowed' },
  { url: 'gopher://localhost:6379/_FLUSHALL', expectSafe: false, reason: 'not allowed' },
  { url: 'ftp://example.com/file', expectSafe: false, reason: 'not allowed' },
  { url: 'javascript:alert(1)', expectSafe: false, reason: 'not allowed' },
  { url: 'data:text/html,<script>alert(1)</script>', expectSafe: false, reason: 'not allowed' },

  // Private IPs
  { url: 'http://127.0.0.1/', expectSafe: false, reason: 'private/reserved' },
  { url: 'http://10.0.0.1/', expectSafe: false, reason: 'private/reserved' },
  { url: 'http://172.16.0.1/', expectSafe: false, reason: 'private/reserved' },
  { url: 'http://192.168.1.1/', expectSafe: false, reason: 'private/reserved' },
  { url: 'http://169.254.169.254/latest/meta-data/', expectSafe: false, reason: 'metadata' },
  { url: 'http://0.0.0.0/', expectSafe: false, reason: 'private/reserved' },
  { url: 'http://[::1]/', expectSafe: false, reason: 'private/reserved' },

  // Localhost variants
  { url: 'http://localhost/', expectSafe: false, reason: 'blocked' },
  { url: 'http://localhost.localdomain/', expectSafe: false, reason: 'blocked' },
  { url: 'http://foo.internal/', expectSafe: false, reason: 'blocked' },
  { url: 'http://foo.local/', expectSafe: false, reason: 'blocked' },

  // Userinfo
  { url: 'http://user:pass@example.com/', expectSafe: false, reason: 'userinfo' },

  // Malformed
  { url: '', expectSafe: false },
  { url: 'not a url', expectSafe: false, reason: 'Malformed' },

  // Cloud metadata
  { url: 'http://metadata.google.internal/computeMetadata/v1/', expectSafe: false, reason: 'blocked' },
];

let passed = 0;
let failed = 0;
for (const test of syncCases) {
  const report = checkUrlSafetySync(test.url);
  const ok = report.safe === test.expectSafe;
  if (!ok) {
    failed++;
    console.log(`FAIL: ${test.url} — expected safe=${test.expectSafe} but got safe=${report.safe} (${report.reason})`);
  } else if (!test.expectSafe && test.reason && !report.reason?.toLowerCase().includes(test.reason.toLowerCase())) {
    failed++;
    console.log(`FAIL: ${test.url} — expected reason containing "${test.reason}" but got "${report.reason}"`);
  } else {
    passed++;
    console.log(`PASS: ${test.url} — safe=${report.safe} ${report.reason ? `(${report.reason})` : ''}`);
  }
}

console.log(`\n${passed}/${passed + failed} passed`);
if (failed > 0) {
  process.exit(1);
}
