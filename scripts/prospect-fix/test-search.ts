import { directDuckDuckGoSearch, directDuckDuckGoSiteSearch, directWebRead } from '../../src/lib/direct-search';

async function main() {
  console.log('1. Test directDuckDuckGoSearch for "Kavya Shah Credora"...');
  const r1 = await directDuckDuckGoSearch('Kavya Shah Credora software developer', 5);
  console.log('   Success:', r1.success);
  console.log('   Results:', r1.data.length);
  for (const r of r1.data.slice(0, 3)) {
    console.log('   -', r.title.slice(0, 80));
    console.log('     URL:', r.url.slice(0, 100));
    console.log('     Snippet:', r.snippet.slice(0, 150));
  }
  
  console.log('\n2. Test directDuckDuckGoSiteSearch for LinkedIn...');
  const r2 = await directDuckDuckGoSiteSearch('linkedin.com/in', 'Kavya Shah software developer Toronto', 5);
  console.log('   Success:', r2.success);
  console.log('   Results:', r2.data.length);
  for (const r of r2.data.slice(0, 3)) {
    console.log('   -', r.title.slice(0, 80));
    console.log('     URL:', r.url.slice(0, 100));
  }
  
  console.log('\n3. Test directWebRead on example.com...');
  const r3 = await directWebRead('https://example.com');
  console.log('   Success:', r3.success);
  if (r3.data) {
    console.log('   Title:', r3.data.title);
    console.log('   Content (first 300):', r3.data.content.slice(0, 300));
    console.log('   Word count:', r3.data.wordCount);
  } else {
    console.log('   Error:', r3.error);
  }
  
  console.log('\n4. Test directWebRead on a real article...');
  const r4 = await directWebRead('https://en.wikipedia.org/wiki/JavaScript');
  console.log('   Success:', r4.success);
  if (r4.data) {
    console.log('   Title:', r4.data.title);
    console.log('   Content (first 500):', r4.data.content.slice(0, 500));
    console.log('   Word count:', r4.data.wordCount);
  } else {
    console.log('   Error:', r4.error);
  }
}

main().catch(console.error);
