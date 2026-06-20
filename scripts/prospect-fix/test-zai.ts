import { fetchIPv4, testIPv4Connectivity } from '../../src/lib/network-helpers';
import { getZhipuToken } from '../../src/lib/zhipu-jwt';

async function main() {
  console.log('1. Test connectivity (HEAD) to api.z.ai...');
  const c1 = await testIPv4Connectivity('https://api.z.ai/');
  console.log('   ', c1);
  
  console.log('\n2. Test GET to https://api.z.ai/api/paas/v4/...');
  try {
    const r = await fetchIPv4('https://api.z.ai/api/paas/v4/', { method: 'GET', timeoutMs: 15000 });
    console.log('   Status:', r.status);
    console.log('   Body:', (await r.text()).slice(0, 300));
  } catch (e) { console.error('   Err:', e instanceof Error ? e.message : e); }
  
  console.log('\n3. Test POST chat completion...');
  const token = getZhipuToken();
  if (!token) { console.log('   No token'); return; }
  try {
    const body = JSON.stringify({
      model: 'glm-4.7-flash',
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 50,
    });
    const r = await fetchIPv4('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body,
      timeoutMs: 30000,
    });
    console.log('   Status:', r.status);
    console.log('   Body:', (await r.text()).slice(0, 600));
  } catch (e) { console.error('   Err:', e instanceof Error ? e.message : e); }
  
  console.log('\n4. Test with thinking disabled...');
  try {
    const body = JSON.stringify({
      model: 'glm-4.7-flash',
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 50,
      thinking: { type: 'disabled' },
    });
    const r = await fetchIPv4('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body,
      timeoutMs: 30000,
    });
    console.log('   Status:', r.status);
    console.log('   Body:', (await r.text()).slice(0, 600));
  } catch (e) { console.error('   Err:', e instanceof Error ? e.message : e); }
}

main().catch(console.error);
