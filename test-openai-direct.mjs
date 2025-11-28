// Direct OpenAI API test - minimal overhead
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load .env.local file
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error('ERROR: OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: API_KEY,
  timeout: 10000,
  maxRetries: 0,
});

console.log('Testing direct OpenAI API connection...\n');

async function testTinyRequest() {
  console.log('Test: Tiny request (just "hello")');
  const start = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "ok" in JSON' }],
      response_format: { type: "json_object" },
      max_completion_tokens: 10,
    });

    const elapsed = Date.now() - start;
    console.log(`✓ SUCCESS in ${elapsed}ms`);
    console.log(`  Response: ${completion.choices[0].message.content}\n`);

    if (elapsed > 5000) {
      console.log('⚠️  WARNING: Even tiny requests are taking >5 seconds!');
      console.log('   This indicates severe OpenAI API latency.\n');
    }

    return elapsed;
  } catch (error) {
    const elapsed = Date.now() - start;
    console.error(`✗ FAILED after ${elapsed}ms`);
    console.error(`  Error: ${error.message}\n`);
    return -1;
  }
}

async function runTest() {
  const time = await testTinyRequest();

  console.log('========================================');
  console.log('Diagnosis:');

  if (time < 0) {
    console.log('❌ OpenAI API is NOT reachable or timing out');
    console.log('\nPossible fixes:');
    console.log('  1. Check your OPENAI_API_KEY is valid');
    console.log('  2. Disable VPN if active');
    console.log('  3. Check firewall/antivirus settings');
    console.log('  4. Try from a different network');
  } else if (time > 10000) {
    console.log('❌ OpenAI API is EXTREMELY slow (>10 seconds)');
    console.log('\nLikely causes:');
    console.log('  - Regional latency (far from OpenAI servers)');
    console.log('  - Network throttling by ISP');
    console.log('  - Rate limiting on API key');
  } else if (time > 3000) {
    console.log('⚠️  OpenAI API is slow but functional');
    console.log('   Consider using a different region or network');
  } else {
    console.log('✓ OpenAI API connection is normal');
  }

  console.log('========================================');
}

runTest().catch(console.error);
