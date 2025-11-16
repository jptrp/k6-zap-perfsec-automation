# Setup Guide - k6 + OWASP ZAP Performance & Security Testing

## Prerequisites

### Required

- **Docker**: Version 20.x or higher
  - [Install Docker](https://docs.docker.com/get-docker/)
  - Required for running k6 and ZAP containers

### Optional

- **Node.js**: 20.x or higher (for npm scripts)
- **k6**: Native installation for local development
  - macOS: `brew install k6`
  - Linux: See [k6 installation docs](https://k6.io/docs/get-started/installation/)
  - Windows: `choco install k6`

---

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd k6-zap-perfsec-automation
```

### 2. Verify Docker Installation

```bash
docker --version
# Should output: Docker version 20.x.x or higher

docker ps
# Should list running containers (or be empty)
```

### 3. Pull Required Docker Images

```bash
# Pull k6 image
docker pull grafana/k6:latest

# Pull OWASP ZAP image
docker pull owasp/zap2docker-stable:latest
```

---

## Running k6 Performance Tests

### Using Docker (Recommended)

#### Smoke Test (Quick Validation)

```bash
docker run --rm -i grafana/k6 run - < k6/smoke.js
```

Expected duration: ~30 seconds  
Expected output: Pass/fail with check results

#### Load Test (Normal Load)

```bash
docker run --rm -i grafana/k6 run - < k6/load.js
```

Expected duration: ~6 minutes  
Expected output: Detailed performance metrics with p95, p99 percentiles

#### Stress Test (Breaking Point)

```bash
docker run --rm -i grafana/k6 run - < k6/stress.js
```

Expected duration: ~10 minutes  
Expected output: Performance under extreme load with failure analysis

### Using npm Scripts

If you have Node.js installed:

```bash
npm install  # First time only

# Run individual tests
npm run k6:smoke
npm run k6:load
npm run k6:stress
```

### Using Native k6 (If Installed)

```bash
# Navigate to project root
cd k6-zap-perfsec-automation

# Run tests directly
k6 run k6/smoke.js
k6 run k6/load.js
k6 run k6/stress.js
```

### Understanding k6 Output

```
     ✓ GET /users status is 200
     ✓ GET /users has data
     ✓ GET /users response time < 500ms

     checks.........................: 100.00% ✓ 180      ✗ 0
     http_req_duration..............: avg=245ms   min=123ms  med=234ms  max=456ms  p(90)=334ms  p(95)=389ms
     http_req_failed................: 0.00%   ✓ 0        ✗ 60
     http_reqs......................: 60      2/s
     iterations.....................: 20      0.666667/s
```

**Key Metrics**:
- `checks`: Percentage of validation checks passed
- `http_req_duration`: Response time statistics
- `http_req_failed`: Percentage of failed requests
- `http_reqs`: Total number of requests
- `p(95)`: 95th percentile (95% of requests faster than this)

---

## Running OWASP ZAP Security Scan

### Using Docker (Recommended)

```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -r zap-report.html
```

**Windows (PowerShell)**:
```powershell
docker run --rm -v ${PWD}:/zap/wrk:rw `
  -t owasp/zap2docker-stable `
  zap-baseline.py `
  -t https://testphp.vulnweb.com `
  -r zap-report.html
```

### Using npm Script

```bash
npm run zap:scan
```

### ZAP Scan Options

#### With Configuration File

```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -c zap/zap-baseline.conf \
  -r zap-report.html
```

#### Generate JSON Report

```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -J zap-report.json
```

#### Fail on High Severity Only

```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -r zap-report.html \
  -z "-i HIGH"
```

### Viewing ZAP Report

After scan completes:

```bash
# macOS
open zap-report.html

# Linux
xdg-open zap-report.html

# Windows
start zap-report.html
```

---

## Running Complete Test Suite

### Sequential Execution

```bash
# Run all k6 tests
echo "Running Smoke Test..."
docker run --rm -i grafana/k6 run - < k6/smoke.js

echo "Running Load Test..."
docker run --rm -i grafana/k6 run - < k6/load.js

echo "Running Stress Test..."
docker run --rm -i grafana/k6 run - < k6/stress.js

# Run ZAP scan
echo "Running Security Scan..."
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -r zap-report.html
```

### Using Shell Script

Create `run-all-tests.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Performance + Security Test Suite"
echo "=============================================="

echo ""
echo "📊 Running k6 Smoke Test..."
docker run --rm -i grafana/k6 run - < k6/smoke.js || exit 1

echo ""
echo "📊 Running k6 Load Test..."
docker run --rm -i grafana/k6 run - < k6/load.js || exit 1

echo ""
echo "📊 Running k6 Stress Test..."
docker run --rm -i grafana/k6 run - < k6/stress.js || exit 1

echo ""
echo "🔒 Running OWASP ZAP Security Scan..."
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -r zap-report.html || exit 1

echo ""
echo "✅ All tests completed successfully!"
echo "📄 ZAP Report: zap-report.html"
```

Make executable and run:

```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

View results:
1. Go to repository **Actions** tab
2. Click on latest workflow run
3. Download artifacts (k6 results, ZAP report)

### Running CI Locally

To simulate CI environment:

```bash
# Set environment variables
export CI=true
export GITHUB_WORKSPACE=$(pwd)

# Run k6 tests
docker run --rm -i grafana/k6 run - < k6/smoke.js
docker run --rm -i grafana/k6 run - < k6/load.js
docker run --rm -i grafana/k6 run - < k6/stress.js

# Run ZAP scan
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -r zap-report.html
```

---

## Troubleshooting

### k6 Issues

#### Error: "Cannot read from stdin"

**Cause**: Docker unable to read test file  
**Solution**: Ensure you're in project root and file exists

```bash
# Verify file exists
ls -la k6/smoke.js

# Run from project root
cd k6-zap-perfsec-automation
docker run --rm -i grafana/k6 run - < k6/smoke.js
```

#### Error: "Request timeout"

**Cause**: Target API unavailable or network issues  
**Solution**: Check internet connection and API availability

```bash
# Test connectivity
curl https://reqres.in/api/users

# Check DNS
nslookup reqres.in
```

#### High Failure Rate

**Cause**: API rate limiting or server issues  
**Solution**: Reduce VUs or increase sleep time in tests

### ZAP Issues

#### Error: "Permission denied"

**Cause**: Docker doesn't have write access  
**Solution**: Ensure directory is writable

```bash
# Check permissions
ls -la

# Fix permissions (Linux/macOS)
chmod 755 .
```

#### Error: "Report not generated"

**Cause**: Volume mount issue  
**Solution**: Use absolute path

```bash
# Use absolute path
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -r zap-report.html
```

#### Scan Takes Too Long

**Cause**: Target site has many pages  
**Solution**: Limit scan duration

```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -m 5 \
  -r zap-report.html
```

### Docker Issues

#### Error: "Docker daemon not running"

**Solution**:
- macOS: Open Docker Desktop
- Linux: `sudo systemctl start docker`
- Windows: Start Docker Desktop

#### Error: "Cannot connect to Docker daemon"

**Solution**:
```bash
# Verify Docker is running
docker ps

# Check Docker service
docker info
```

---

## Configuration

### k6 Configuration

Edit test files directly to modify:
- VUs (virtual users)
- Duration
- Thresholds
- Target endpoints

Example in `k6/load.js`:

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Modify VU count
    { duration: '3m', target: 20 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // Modify threshold
  },
};
```

### ZAP Configuration

Edit `zap/zap-baseline.conf`:

```conf
# Set alert threshold
ALERT_LEVEL=WARN

# Maximum scan duration
MAX_DURATION=5

# Ignore specific alerts
IGNORE_ALERTS=10020,10021
```

---

## Best Practices

### Performance Testing

1. **Start with Smoke Tests**: Validate before heavy testing
2. **Gradual Load Increase**: Use stages in load tests
3. **Set Realistic Thresholds**: Based on requirements
4. **Monitor Trends**: Compare results over time
5. **Test in Staging**: Never stress production

### Security Testing

1. **Regular Scans**: Run on every deployment
2. **Baseline First**: Start with passive scanning
3. **Review Findings**: Triage before fixing all
4. **Track Progress**: Monitor remediation over time
5. **Test Safely**: Only active scan test environments

---

## Next Steps

1. Read [architecture.md](./architecture.md) to understand design
2. Read [test-plan.md](./test-plan.md) for test strategy
3. Read [interpreting-results.md](./interpreting-results.md) to analyze outputs
4. Review [zap/notes.md](../zap/notes.md) for security details

---

## Support Resources

- **k6 Documentation**: https://k6.io/docs/
- **OWASP ZAP**: https://www.zaproxy.org/
- **Docker Documentation**: https://docs.docker.com/
- **Project Issues**: [GitHub Issues](https://github.com/[username]/k6-zap-perfsec-automation/issues)

---

**Last Updated**: November 16, 2025  
**k6 Version**: Latest (Docker)  
**ZAP Version**: Stable (Docker)
