#!/usr/bin/env node

// Smoke test for the LLM orchestrator via the /check-affirmation-match server route.
// 1. Start the dev server with your keys in .env:  npx expo start
// 2. Run:  API_BASE_URL=http://localhost:8081 node scripts/test-llm-providers.js

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');

async function checkAffirmationMatch(expectedAffirmation, spokenText) {
  const res = await fetch(`${API_BASE_URL}/check-affirmation-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expectedAffirmation, spokenText }),
  });
  return res.json();
}

async function testLLMProviders() {
  console.log('🧪 Testing LLM Providers...\n');

  const testCases = [
    {
      expected: "I am worthy of love",
      spoken: "I am worthy of love",
      expectedScore: 95 // Should be very high
    },
    {
      expected: "I am confident and strong",
      spoken: "um... I am confident and strong",
      expectedScore: 85 // Should handle filler words well
    },
    {
      expected: "I attract abundance",
      spoken: "I attract lots of abundance",
      expectedScore: 80 // Should handle variations
    },
    {
      expected: "I am successful",
      spoken: "this is terrible",
      expectedScore: 10 // Should be very low
    }
  ];

  let successCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: "${testCase.expected}" vs "${testCase.spoken}"`);
    
    try {
      const startTime = Date.now();
      const result = await checkAffirmationMatch(testCase.expected, testCase.spoken);
      const latency = Date.now() - startTime;
      
      if (result.success) {
        const score = result.data.matchScore;
        const explanation = result.data.explanation;
        const provider = result.provider || 'unknown';
        
        console.log(`✅ Success! Score: ${score}, Provider: ${provider}, Latency: ${latency}ms`);
        console.log(`   Explanation: ${explanation}`);
        
        // Basic validation
        const scoreInExpectedRange = Math.abs(score - testCase.expectedScore) < 30;
        if (scoreInExpectedRange) {
          console.log(`   ✓ Score within expected range`);
        } else {
          console.log(`   ⚠️  Score outside expected range (expected ~${testCase.expectedScore})`);
        }
        
        successCount++;
      } else {
        console.log(`❌ Failed: ${result.error}`);
        if (result.details) console.log(`   Details: ${result.details}`);
      }
      
    } catch (error) {
      console.log(`💥 Exception: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log(`📊 Results: ${successCount}/${testCases.length} tests passed\n`);
  
  if (successCount === testCases.length) {
    console.log('🎉 All tests passed! LLM providers are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check your configuration and API keys.');
  }
}

// Run the test
testLLMProviders().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});