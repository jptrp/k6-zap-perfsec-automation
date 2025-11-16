/**
 * k6 Load Test - Realistic User Load Simulation
 * 
 * Purpose: Simulate realistic user behavior under normal load conditions.
 * This test gradually increases load to validate performance under expected traffic.
 * 
 * Duration: 6 minutes total
 * Load Profile: 
 *   - Ramp up from 1 to 10 VUs over 1 minute
 *   - Maintain 10 VUs for 3 minutes
 *   - Increase to 20 VUs over 1 minute
 *   - Ramp down to 0 over 1 minute
 * 
 * Target API: https://jsonplaceholder.typicode.com
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics for detailed analysis
const getPostTrend = new Trend('get_post_duration');
const createPostTrend = new Trend('create_post_duration');
const totalRequests = new Counter('total_requests');

// Test configuration with progressive load stages
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 20 },  // Spike to 20 users
    { duration: '1m', target: 0 },   // Ramp down to 0
  ],
  
  thresholds: {
    // 95th percentile should be under 400ms (JSONPlaceholder is typically faster)
    http_req_duration: ['p(95)<400'],
    
    // 99th percentile should be under 800ms
    'http_req_duration{expected_response:true}': ['p(99)<800'],
    
    // HTTP failures should be less than 5%
    http_req_failed: ['rate<0.05'],
    
    // At least 95% of checks should pass
    checks: ['rate>0.95'],
  },
};

const baseUrl = 'https://jsonplaceholder.typicode.com';

export default function () {
  // Scenario 1: Browse posts (simulates user browsing list)
  group('Browse Posts', function () {
    const response = http.get(`${baseUrl}/posts`);
    totalRequests.add(1);
    
    check(response, {
      'browse: status 200': (r) => r.status === 200,
      'browse: has posts': (r) => Array.isArray(r.json()) && r.json().length > 0,
    });
    
    sleep(1);
  });
  
  // Scenario 2: View post details (simulates clicking on a post)
  group('View Post Details', function () {
    const postId = Math.floor(Math.random() * 100) + 1; // Random post 1-100
    const response = http.get(`${baseUrl}/posts/${postId}`);
    totalRequests.add(1);
    getPostTrend.add(response.timings.duration);
    
    check(response, {
      'details: status 200': (r) => r.status === 200,
      'details: has post data': (r) => r.json('id') !== undefined,
    });
    
    sleep(2);
  });
  
  // Scenario 3: Create post (20% of users will create)
  if (Math.random() < 0.2) {
    group('Create Post', function () {
      const payload = JSON.stringify({
        title: `Test Post VU${__VU}-${__ITER}`,
        body: 'Performance testing with k6',
        userId: 1,
      });
      
      const response = http.post(`${baseUrl}/posts`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      totalRequests.add(1);
      createPostTrend.add(response.timings.duration);
      
      check(response, {
        'create: status 201': (r) => r.status === 201,
        'create: has id': (r) => r.json('id') !== undefined,
      });
      
      sleep(1);
    });
  }
  
  // Scenario 4: Get comments (simulates navigating to different sections)
  group('Get Comments', function () {
    const postId = Math.floor(Math.random() * 100) + 1;
    const response = http.get(`${baseUrl}/posts/${postId}/comments`);
    totalRequests.add(1);
    
    check(response, {
      'comments: status 200': (r) => r.status === 200,
    });
    
    sleep(1);
  });
  
  sleep(1); // Think time between iterations
}

export function handleSummary(data) {
  const checks = data.metrics.checks;
  const httpReqDuration = data.metrics.http_req_duration;
  const httpReqFailed = data.metrics.http_req_failed;
  const httpReqs = data.metrics.http_reqs;
  const iterations = data.metrics.iterations;
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           k6 LOAD TEST - PERFORMANCE SUMMARY                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 REQUEST METRICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total Requests........: ${httpReqs.values.count}`);
  console.log(`  Requests/sec..........: ${httpReqs.values.rate.toFixed(2)}`);
  console.log(`  Failed Requests.......: ${(httpReqFailed.values.rate * 100).toFixed(2)}%`);
  console.log(`  Success Rate..........: ${((1 - httpReqFailed.values.rate) * 100).toFixed(2)}%\n`);
  
  console.log('⏱️  RESPONSE TIME METRICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Min...................: ${httpReqDuration.values.min.toFixed(2)}ms`);
  console.log(`  Avg...................: ${httpReqDuration.values.avg.toFixed(2)}ms`);
  console.log(`  Median (p50)..........: ${httpReqDuration.values.med.toFixed(2)}ms`);
  console.log(`  p(90).................: ${httpReqDuration.values['p(90)'].toFixed(2)}ms`);
  console.log(`  p(95).................: ${httpReqDuration.values['p(95)'].toFixed(2)}ms ${httpReqDuration.values['p(95)'] < 400 ? '✓ PASS' : '✗ FAIL'} (< 400ms)`);
  console.log(`  p(99).................: ${httpReqDuration.values['p(99)'].toFixed(2)}ms ${httpReqDuration.values['p(99)'] < 800 ? '✓ PASS' : '✗ FAIL'} (< 800ms)`);
  console.log(`  Max...................: ${httpReqDuration.values.max.toFixed(2)}ms\n`);
  
  console.log('✓ CHECK RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Passed................: ${checks.values.passes}`);
  console.log(`  Failed................: ${checks.values.fails}`);
  console.log(`  Success Rate..........: ${(checks.values.rate * 100).toFixed(2)}%\n`);
  
  console.log('🎯 THRESHOLD STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  p(95) < 400ms.........: ${httpReqDuration.values['p(95)'] < 400 ? '✓ PASS' : '✗ FAIL'} (${httpReqDuration.values['p(95)'].toFixed(2)}ms)`);
  console.log(`  p(99) < 800ms.........: ${httpReqDuration.values['p(99)'] < 800 ? '✓ PASS' : '✗ FAIL'} (${httpReqDuration.values['p(99)'].toFixed(2)}ms)`);
  console.log(`  Fail Rate < 5%........: ${httpReqFailed.values.rate < 0.05 ? '✓ PASS' : '✗ FAIL'} (${(httpReqFailed.values.rate * 100).toFixed(2)}%)`);
  console.log(`  Checks > 95%..........: ${checks.values.rate > 0.95 ? '✓ PASS' : '✗ FAIL'} (${(checks.values.rate * 100).toFixed(2)}%)\n`);
  
  console.log('📈 LOAD PROFILE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total Iterations......: ${iterations.values.count}`);
  console.log(`  Iteration Rate........: ${iterations.values.rate.toFixed(2)}/s`);
  console.log(`  Max VUs...............: ${data.metrics.vus_max.values.max}`);
  console.log(`  Duration..............: ${(data.state.testRunDurationMs / 1000).toFixed(0)}s\n`);
  
  const allPassed = httpReqDuration.values['p(95)'] < 400 &&
                    httpReqDuration.values['p(99)'] < 800 &&
                    httpReqFailed.values.rate < 0.05 &&
                    checks.values.rate > 0.95;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Overall Status: ${allPassed ? '✅ ALL THRESHOLDS PASSED' : '❌ SOME THRESHOLDS FAILED'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    'stdout': '',
  };
}
