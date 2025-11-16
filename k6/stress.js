/**
 * k6 Stress Test - Find System Breaking Points
 * 
 * Purpose: Push the API to its limits to discover breaking points and understand degradation patterns.
 * This test helps with capacity planning and identifying maximum sustainable load.
 * 
 * Duration: 10 minutes total
 * Load Profile:
 *   - Ramp up from 1 to 20 VUs over 2 minutes (warm up)
 *   - Spike to 50 VUs over 2 minutes (stress)
 *   - Hold at 50 VUs for 2 minutes (sustained stress)
 *   - Spike to 100 VUs over 2 minutes (extreme stress)
 *   - Ramp down to 0 over 2 minutes (recovery)
 * 
 * Target API: https://jsonplaceholder.typicode.com
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// Custom metrics
const responseTime = new Trend('response_time');
const totalSuccess = new Counter('successful_requests');
const totalErrors = new Counter('failed_requests');
const errorRate = new Rate('error_rate');

// Stress test configuration with aggressive load profile
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Warm up
    { duration: '2m', target: 50 },   // Stress
    { duration: '2m', target: 50 },   // Sustain
    { duration: '2m', target: 100 },  // Extreme stress
    { duration: '2m', target: 0 },    // Recovery
  ],
  
  thresholds: {
    // More relaxed thresholds - we expect some failures under extreme load
    http_req_duration: ['p(95)<1500'], // 1.5 seconds for 95th percentile
    http_req_failed: ['rate<0.20'],     // Allow up to 20% failures
  },
};

const baseUrl = 'https://jsonplaceholder.typicode.com';

export default function () {
  // High-frequency post browsing
  const listResponse = http.get(`${baseUrl}/posts`);
  responseTime.add(listResponse.timings.duration);
  
  const listSuccess = check(listResponse, {
    'list status 200': (r) => r.status === 200,
  });
  
  if (listSuccess) {
    totalSuccess.add(1);
  } else {
    totalErrors.add(1);
    errorRate.add(1);
  }
  
  sleep(0.5); // Minimal sleep for stress
  
  // Rapid-fire individual post requests
  const postId = Math.floor(Math.random() * 100) + 1;
  const postResponse = http.get(`${baseUrl}/posts/${postId}`);
  responseTime.add(postResponse.timings.duration);
  
  const postSuccess = check(postResponse, {
    'post status 200': (r) => r.status === 200,
  });
  
  if (postSuccess) {
    totalSuccess.add(1);
  } else {
    totalErrors.add(1);
    errorRate.add(1);
  }
  
  // Aggressive POST operations
  if (__ITER % 3 === 0) { // Every 3rd iteration
    const payload = JSON.stringify({
      title: `Stress Test Post VU${__VU}-${__ITER}`,
      body: `Performance test iteration ${__ITER}`,
      userId: 1,
    });
    
    const createResponse = http.post(`${baseUrl}/posts`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    responseTime.add(createResponse.timings.duration);
    
    const createSuccess = check(createResponse, {
      'create status 201': (r) => r.status === 201,
    });
    
    if (createSuccess) {
      totalSuccess.add(1);
    } else {
      totalErrors.add(1);
      errorRate.add(1);
    }
  }
  
  // Batch operation simulation
  const userId = Math.floor(Math.random() * 10) + 1;
  const responses = http.batch([
    ['GET', `${baseUrl}/posts`],
    ['GET', `${baseUrl}/users/${userId}`],
    ['GET', `${baseUrl}/comments?postId=${postId}`],
  ]);
  
  responses.forEach((response) => {
    responseTime.add(response.timings.duration);
    const success = response.status === 200;
    if (success) {
      totalSuccess.add(1);
    } else {
      totalErrors.add(1);
      errorRate.add(1);
    }
  });
  
  sleep(0.3); // Aggressive iteration
}

export function handleSummary(data) {
  const httpReqDuration = data.metrics.http_req_duration;
  const httpReqFailed = data.metrics.http_req_failed;
  const httpReqs = data.metrics.http_reqs;
  const iterations = data.metrics.iterations;
  const vus = data.metrics.vus_max;
  
  const successfulReqs = data.metrics.successful_requests ? data.metrics.successful_requests.values.count : 0;
  const failedReqs = data.metrics.failed_requests ? data.metrics.failed_requests.values.count : 0;
  const failureRate = httpReqFailed.values.rate;
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         k6 STRESS TEST - BREAKING POINT ANALYSIS            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 REQUEST METRICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total Requests........: ${httpReqs.values.count}`);
  console.log(`  Requests/sec..........: ${httpReqs.values.rate.toFixed(2)}`);
  console.log(`  Successful............: ${successfulReqs}`);
  console.log(`  Failed................: ${failedReqs}`);
  console.log(`  Failure Rate..........: ${(failureRate * 100).toFixed(2)}%\n`);
  
  console.log('⏱️  RESPONSE TIME METRICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Min...................: ${httpReqDuration.values.min.toFixed(2)}ms`);
  console.log(`  Avg...................: ${httpReqDuration.values.avg.toFixed(2)}ms`);
  console.log(`  Median (p50)..........: ${httpReqDuration.values.med.toFixed(2)}ms`);
  console.log(`  p(90).................: ${httpReqDuration.values['p(90)'].toFixed(2)}ms`);
  console.log(`  p(95).................: ${httpReqDuration.values['p(95)'].toFixed(2)}ms ${httpReqDuration.values['p(95)'] < 1500 ? '✓ PASS' : '✗ FAIL'} (< 1500ms)`);
  console.log(`  p(99).................: ${httpReqDuration.values['p(99)'].toFixed(2)}ms`);
  console.log(`  Max...................: ${httpReqDuration.values.max.toFixed(2)}ms\n`);
  
  console.log('🎯 THRESHOLD STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  p(95) < 1500ms........: ${httpReqDuration.values['p(95)'] < 1500 ? '✓ PASS' : '✗ FAIL'} (${httpReqDuration.values['p(95)'].toFixed(2)}ms)`);
  console.log(`  Fail Rate < 20%.......: ${failureRate < 0.20 ? '✓ PASS' : '✗ FAIL'} (${(failureRate * 100).toFixed(2)}%)\n`);
  
  console.log('📈 STRESS PROFILE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total Iterations......: ${iterations.values.count}`);
  console.log(`  Iteration Rate........: ${iterations.values.rate.toFixed(2)}/s`);
  console.log(`  Peak VUs..............: ${vus.values.max}`);
  console.log(`  Duration..............: ${(data.state.testRunDurationMs / 1000).toFixed(0)}s\n`);
  
  console.log('💡 STRESS TEST INSIGHTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (failureRate < 0.05) {
    console.log('  ✓ System handled 100 VUs with minimal failures (<5%)');
    console.log('  ✓ Consider increasing load further to find true breaking point\n');
  } else if (failureRate < 0.15) {
    console.log('  ⚠ System showing stress signs at 100 VUs (5-15% failures)');
    console.log('  ⚠ This may be approaching capacity limits\n');
  } else if (failureRate < 0.20) {
    console.log('  ⚠ System under significant stress (15-20% failures)');
    console.log('  ⚠ Breaking point identified around current VU level\n');
  } else {
    console.log('  ✗ System exceeded sustainable capacity (>20% failures)');
    console.log('  ✗ Breaking point exceeded - consider scaling infrastructure\n');
  }
  
  console.log('📊 RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (failureRate < 0.05) {
    console.log('  • System performs well under 100 VU load');
    console.log('  • Consider stress testing with higher VU counts (150-200)');
    console.log('  • Current infrastructure handles expected peak load\n');
  } else if (failureRate < 0.20) {
    console.log('  • Breaking point identified between 50-100 VUs');
    console.log('  • Consider horizontal scaling for peak traffic');
    console.log('  • Review application performance bottlenecks\n');
  } else {
    console.log('  • Immediate action required - system unstable at 100 VUs');
    console.log('  • Infrastructure scaling needed before production load');
    console.log('  • Investigate application bottlenecks and optimize\n');
  }
  
  const allPassed = httpReqDuration.values['p(95)'] < 1500 && failureRate < 0.20;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Overall Status: ${allPassed ? '✅ STRESS TEST PASSED' : '❌ STRESS TEST FAILED'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    'stdout': '',
  };
}
