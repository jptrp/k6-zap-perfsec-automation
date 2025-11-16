# K6 Configuration Examples

## Environment Variables

Set these in your environment or use k6's `--env` flag:

```bash
k6 run --env BASE_URL=https://api.example.com tests/performance/load-test.js
```

## Common k6 Options

```javascript
export const options = {
  // Virtual users
  vus: 10,
  
  // Duration
  duration: '30s',
  
  // Stages for ramping
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  
  // Thresholds
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  
  // Tags
  tags: {
    test_type: 'load',
  },
};
```

## Cloud Execution

```bash
k6 cloud tests/performance/load-test.js
```

## Output Options

```bash
# JSON output
k6 run --out json=results.json test.js

# InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 test.js

# CSV
k6 run --out csv=results.csv test.js
```
