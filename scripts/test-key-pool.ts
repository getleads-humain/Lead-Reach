import 'dotenv/config';
import { callLLM, getKeyPoolStatus } from '../src/lib/llm';

async function main() {
  console.log('Key Pool Status:', JSON.stringify(getKeyPoolStatus(), null, 2));

  console.log('\nTesting LLM call with key pool...');
  const result = await callLLM({
    systemPrompt: 'You are a B2B analyst. Classify the industry. Reply with just the industry name.',
    userMessage: 'Song Nam ITD Co.,LTD - Agricultural Products exporter from Vietnam',
    thinkingBudget: 'quick',
    maxTokens: 50,
  });
  console.log('Industry classification result:', result);

  console.log('\nKey Pool Status after call:', JSON.stringify(getKeyPoolStatus(), null, 2));
}

main().catch(e => console.error('Error:', e.message));
