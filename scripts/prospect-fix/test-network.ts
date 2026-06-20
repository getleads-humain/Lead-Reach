/**
 * Quick test: can we reach Z.AI via fetchIPv4?
 */
import { fetchIPv4, testIPv4Connectivity } from '../../src/lib/network-helpers';
import { getZhipuToken } from '../../src/lib/zhipu-jwt';

async function main() {
  console.log('1. Testing connectivity to https://api.z.ai...');
  const conn = await testIPv4Connectivity('https://api.z.ai/api/paas/v4/chat/completions');
  console.log('   ', conn);

  console.log('\n2. Testing actual chat completion via fetchIPv4...');
  const token = getZhipuToken();
  if (!token) {
    console.log('   No ZHIPU_API_KEY configured');
    return;
  }
  console.log('   JWT token length:', token.length);

  try {
    const res = await fetchIPv4('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 20,
        thinking: { type: 'enabled', budget_tokens: 1024 },
      }),
    });
    console.log('   Status:', res.status);
    const text = await res.text();
    console.log('   Body:', text.slice(0, 600));
  } catch (e) {
    console.error('   Error:', e instanceof Error ? e.message : e);
  }

  console.log('\n3. Testing Jina Reader via fetchIPv4...');
  try {
    const res = await fetchIPv4('https://r.jina.ai/https://example.com', {
      headers: { 'Accept': 'text/markdown' },
    });
    console.log('   Status:', res.status);
    const text = await res.text();
    console.log('   Body:', text.slice(0, 400));
  } catch (e) {
    console.error('   Error:', e instanceof Error ? e.message : e);
  }

  console.log('\n4. Testing direct DuckDuckGo HTML fetch...');
  try {
    const res = await fetchIPv4('https://html.duckduckgo.com/html/?q=Kavya+Shah+Credora+software+developer', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    console.log('   Status:', res.status);
    const text = await res.text();
    console.log('   Length:', text.length);
    console.log('   First 400 chars:', text.slice(0, 400));
  } catch (e) {
    console.error('   Error:', e instanceof Error ? e.message : e);
  }
}

main().catch(console.error);
