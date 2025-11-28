// Quick test to diagnose OpenAI API latency
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('Testing OpenAI API speed...\n');

async function testSmallRequest() {
  console.log('Test 1: Small request (should be ~1-2 seconds)');
  const start = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello in JSON format' }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 100,
    });

    const elapsed = Date.now() - start;
    console.log(`✓ Completed in ${elapsed}ms`);
    console.log(`  Response: ${completion.choices[0].message.content}\n`);
    return elapsed;
  } catch (error) {
    console.error('✗ Error:', error.message);
    return -1;
  }
}

async function testMediumRequest() {
  console.log('Test 2: Medium request with ~1000 chars (should be ~2-3 seconds)');
  const testText = 'Lorem ipsum dolor sit amet. '.repeat(40); // ~1000 chars
  const start = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Extract any numbers from the text and return as JSON array.' },
        { role: 'user', content: testText }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const elapsed = Date.now() - start;
    console.log(`✓ Completed in ${elapsed}ms`);
    console.log(`  Tokens used: ${JSON.stringify(completion.usage)}\n`);
    return elapsed;
  } catch (error) {
    console.error('✗ Error:', error.message);
    return -1;
  }
}

async function testLargeRequest() {
  console.log('Test 3: Large request with ~5000 chars (simulating bank statement)');
  const testText = `
Transaction Date: 01 Jan 2024
Description: GRAB*TRIP SINGAPORE
Amount: -15.50

Transaction Date: 02 Jan 2024
Description: NTUC FAIRPRICE SINGAPORE
Amount: -45.60
  `.repeat(50); // ~5000 chars

  const start = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Parse transactions into JSON array' },
        { role: 'user', content: testText }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
    });

    const elapsed = Date.now() - start;
    console.log(`✓ Completed in ${elapsed}ms`);
    console.log(`  Tokens used: ${JSON.stringify(completion.usage)}\n`);
    return elapsed;
  } catch (error) {
    console.error('✗ Error:', error.message);
    return -1;
  }
}

async function runTests() {
  const time1 = await testSmallRequest();
  const time2 = await testMediumRequest();
  const time3 = await testLargeRequest();

  console.log('========================================');
  console.log('Summary:');
  console.log(`  Small request:  ${time1}ms ${time1 > 5000 ? '⚠️ SLOW!' : '✓'}`);
  console.log(`  Medium request: ${time2}ms ${time2 > 10000 ? '⚠️ SLOW!' : '✓'}`);
  console.log(`  Large request:  ${time3}ms ${time3 > 15000 ? '⚠️ SLOW!' : '✓'}`);
  console.log('========================================\n');

  if (time1 > 5000 || time2 > 10000 || time3 > 15000) {
    console.log('⚠️  Your OpenAI API calls are VERY slow!');
    console.log('Possible causes:');
    console.log('  1. Network latency (distant from OpenAI servers)');
    console.log('  2. VPN or proxy interference');
    console.log('  3. Rate limiting on your API key');
    console.log('  4. Regional restrictions\n');
    console.log('Recommendation: Switch to parallel page processing instead of single call');
  } else {
    console.log('✓ Your OpenAI API connection is normal.');
    console.log('The slow parsing must be due to PDF size or content complexity.');
  }
}

runTests().catch(console.error);
