/**
 * k6 Smoke Test - Quick API Health Check
 * 
 * Purpose: Validate that the API is functional and responsive before running full load tests.
 * This is a lightweight test that should complete quickly and catch major issues.
 * 
 * Duration: 30 seconds
 * Load: 2 concurrent users (VUs)
 * Target API: https://jsonplaceholder.typicode.com
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  vus: 2,
  duration: '30s',
  
  thresholds: {
    // 95th percentile response time should be below 800ms (JSONPlaceholder is typically faster)
    http_req_duration: ['p(95)<800'],
    
    // Error rate should be less than 1%
    'errors': ['rate<0.01'],
    
    // At least 95% of checks should pass
    'checks': ['rate>0.95'],
  },
};

export default function () {
  const baseUrl = 'https://jsonplaceholder.typicode.com';
  
  // Test 1: GET request to list posts
  const listResponse = http.get(`${baseUrl}/posts`);
  const listCheck = check(listResponse, {
    'GET /posts status is 200': (r) => r.status === 200,
    'GET /posts has data': (r) => Array.isArray(r.json()) && r.json().length > 0,
    'GET /posts response time < 400ms': (r) => r.timings.duration < 400,
  });
  errorRate.add(!listCheck);
  
  sleep(1);
  
  // Test 2: GET request for specific post
  const postResponse = http.get(`${baseUrl}/posts/1`);
  const postCheck = check(postResponse, {
    'GET /posts/1 status is 200': (r) => r.status === 200,
    'GET /posts/1 has post data': (r) => r.json('id') === 1,
    'GET /posts/1 response time < 400ms': (r) => r.timings.duration < 400,
  });
  errorRate.add(!postCheck);
  
  sleep(1);
  
  // Test 3: POST request to create post
  const payload = JSON.stringify({
    title: 'k6 Performance Test',
    body: 'Testing API performance with k6',
    userId: 1,
  });
  
  const createResponse = http.post(`${baseUrl}/posts`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const createCheck = check(createResponse, {
    'POST /posts status is 201': (r) => r.status === 201,
    'POST /posts returns id': (r) => r.json('id') !== undefined,
    'POST /posts response time < 400ms': (r) => r.timings.duration < 400,
  });
  errorRate.add(!createCheck);
  
  sleep(1);
}

export function handleSummary(data) {
  const checks = data.metrics.checks;
  const errors = data.metrics.errors;
  const httpReqDuration = data.metrics.http_req_duration;
  const httpReqFailed = data.metrics.http_req_failed;
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          SMOKE TEST RESULTS                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log('  ✓ Smoke Test Results');
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`   Checks................: ${(checks.values.rate * 100).toFixed(2)}% ✓`);
  console.log(`   Requests..............: ${data.metrics.http_reqs.values.count}`);
  console.log(`   Request Duration p(95): ${httpReqDuration.values['p(95)'].toFixed(2)}ms`);
  console.log(`   Request Failed........: ${(httpReqFailed.values.rate * 100).toFixed(2)}%`);
  console.log(`   Iterations............: ${data.metrics.iterations.values.count}`);
  console.log(`   VUs...................: ${data.metrics.vus.values.value}\n`);
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    'stdout': '', // Return empty to prevent default summary
  };
}
