/**
 * Test the search fallbacks directly: z-ai-web-dev-sdk web_search.
 */
async function main() {
  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  const zai = await ZAI.create();
  console.log('[1] Testing z-ai web_search…');
  try {
    const result = await zai.functions.invoke('web_search', {
      query: 'fintech startups Singapore Series A',
      num: 10,
    });
    console.log('SUCCESS — results:', Array.isArray(result) ? result.length : typeof result);
    if (Array.isArray(result) && result.length) {
      console.log(JSON.stringify(result[0], null, 2).slice(0, 400));
    }
  } catch (err) {
    console.error('web_search FAILED:', err.message);
  }
}
main();
