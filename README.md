# k6 + OWASP ZAP Performance & Security Testing Framework

[![CI](https://github.com/jptrp/k6-zap-perfsec-automation/actions/workflows/ci.yml/badge.svg)](https://github.com/jptrp/k6-zap-perfsec-automation/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Production-ready Performance + Security testing suite combining k6 load testing with OWASP ZAP vulnerability scanning**

A complete, automated testing framework for validating API performance under load and discovering security vulnerabilities. Runs in CI/CD with Docker — no local installation required.

---

## Features

### 🚀 Performance Testing (k6)

- **Smoke Test** (30s) - Quick API health validation before deployments
- **Load Test** (6m) - Realistic user load simulation with progressive ramp-up
- **Stress Test** (10m) - Breaking point analysis for capacity planning
- **Custom Metrics** - Track specific endpoint performance
- **Threshold-Driven** - Automatic pass/fail based on SLAs
- **Detailed Reports** - JSON output + custom console summaries

### 🔒 Security Testing (OWASP ZAP)

- **Baseline Scan** (2-5m) - Passive vulnerability scanning (safe for production)
- **OWASP Top 10 Detection** - SQL injection, XSS, security headers, etc.
- **HTML Reports** - Detailed findings with severity levels
- **CI-Ready** - Configurable pass/fail criteria
- **No False Positives** - Tuned configuration with alert suppression

### 🐳 Docker-Based Execution

- **No Local Install** - Everything runs in containers
- **Consistent Environment** - Same results everywhere
- **CI/CD Integration** - GitHub Actions workflow included
- **Easy Updates** - `docker pull` for latest versions

---

## Quick Start

### Prerequisites

- **Docker** (required) - [Install Docker](https://docs.docker.com/get-docker/)
- **Node.js 18+** (optional) - For npm scripts

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/k6-zap-perfsec-automation.git
cd k6-zap-perfsec-automation

# Pull Docker images (one-time setup)
docker pull grafana/k6
docker pull zaproxy/zap-stable
```

### 2. Run Tests

#### Performance Tests (k6)

```bash
# Quick smoke test (30 seconds)
docker run --rm -i grafana/k6 run - < k6/smoke.js

# Realistic load test (6 minutes)
docker run --rm -i grafana/k6 run - < k6/load.js

# Stress test - find breaking points (10 minutes)
docker run --rm -i grafana/k6 run - < k6/stress.js
```

**Using npm scripts** (requires Node.js):

```bash
npm run k6:smoke        # Smoke test
npm run k6:load         # Load test
npm run k6:stress       # Stress test
npm run k6:all          # Run all k6 tests
```

#### Security Scan (OWASP ZAP)

```bash
# Run baseline security scan (2-5 minutes)
docker run --rm -v $(pwd):/zap/wrk:rw -t zaproxy/zap-stable \
  zap-baseline.py -t https://testphp.vulnweb.com \
  -r zap-report.html -c zap/zap-baseline.conf

# View report
open zap-report.html
```

**Using npm scripts**:

```bash
npm run zap:scan        # Full scan with config
npm run zap:scan-quick  # Quick 2-minute scan
```

#### Run Everything

```bash
# Using npm
npm run test:all

# Or manually
npm run k6:all && npm run zap:scan
```

---

## Test Targets

### Performance Testing
- **API**: [https://reqres.in](https://reqres.in)
- **Endpoints**: `/api/users`, `/api/users/{id}`, `/api/unknown`
- **Load Profiles**: 2 VUs (smoke), 1→20 VUs (load), 1→100 VUs (stress)

### Security Testing
- **Target**: [https://testphp.vulnweb.com](https://testphp.vulnweb.com)
- **Scan Type**: Baseline (passive)
- **Expected Findings**: ~65-95 vulnerabilities (intentionally vulnerable test site)

---

## Expected Results

### k6 Performance Tests

#### Smoke Test (30s)
```
✓ checks.........................: 100.00% ✓ 12      ✗ 0
✓ http_req_duration..............: avg=234ms  p(95)=389ms
✓ http_req_failed................: 0.00%   ✓ 0       ✗ 6
  
Status: ✅ PASS
```

#### Load Test (6m)
```
✓ checks.........................: 100.00% ✓ 360     ✗ 0
✓ http_req_duration..............: avg=267ms  p(95)=423ms
✓ http_req_failed................: 0.00%   ✓ 0       ✗ 120
  
Status: ✅ PASS (if p95 < 500ms, failures < 5%)
```

#### Stress Test (10m)
```
✓ http_req_duration..............: avg=1234ms p(95)=1890ms
✓ http_req_failed................: 3.45%   ✓ 69      ✗ 1931
  
Status: ✅ PASS (if failures < 20%)
Insight: Breaking point at ~80 VUs
```

### OWASP ZAP Security Scan

```
Summary:
  HIGH:   8-12 findings (SQL injection, XSS)
  MEDIUM: 12-18 findings (missing headers, insecure cookies)
  LOW:    20-30 findings (info disclosure)
  INFO:   25-35 findings (observations)

Status: ✅ Report Generated
Action: Review HIGH findings immediately
```

---

## Project Structure

```
k6-zap-perfsec-automation/
├── k6/                          # k6 performance test scripts
│   ├── smoke.js                 # Quick 30s validation test
│   ├── load.js                  # 6-minute realistic load test
│   └── stress.js                # 10-minute stress/capacity test
│
├── zap/                         # OWASP ZAP security configuration
│   ├── zap-baseline.conf        # Scan configuration and rules
│   └── notes.md                 # Security testing documentation
│
├── docs/                        # Comprehensive documentation
│   ├── setup.md                 # Installation and setup guide
│   ├── architecture.md          # System design and architecture
│   ├── test-plan.md             # Test strategy and scenarios
│   └── interpreting-results.md  # How to read test outputs
│
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI/CD pipeline
│
├── package.json                 # npm scripts for easy execution
└── README.md                    # This file
```

---

## CI/CD Integration

### GitHub Actions Workflow

This project includes a complete GitHub Actions workflow (`.github/workflows/ci.yml`) that:

1. **Runs on every push** to `main` and on all pull requests
2. **Performance Tests Job**:
   - Executes smoke, load, and stress tests
   - Uploads k6 results as artifacts
3. **Security Scan Job** (depends on performance tests):
   - Runs ZAP baseline scan
   - Uploads HTML report as artifact
4. **Automatic Failure** if thresholds breached

**View CI Results**: Navigate to Actions tab in GitHub

---

## Documentation

Comprehensive guides available in [`docs/`](./docs/):

- **[Setup Guide](./docs/setup.md)** - Installation, running tests, troubleshooting
- **[Architecture](./docs/architecture.md)** - System design, test hierarchy, CI/CD flow
- **[Test Plan](./docs/test-plan.md)** - Test scenarios, objectives, coverage matrix
- **[Interpreting Results](./docs/interpreting-results.md)** - How to read k6 and ZAP outputs

**Quick Help**:
```bash
npm run help  # List all npm commands
```

---

## Thresholds & SLAs

### Performance Thresholds

| Test | p(95) Target | Fail Rate | Check Pass Rate |
|------|--------------|-----------|-----------------|
| Smoke | < 1000ms | < 1% | > 95% |
| Load | < 500ms | < 5% | > 95% |
| Stress | < 2000ms | < 20% | N/A (find limits) |

### Security Thresholds

| Severity | Acceptable Count | Action |
|----------|------------------|--------|
| HIGH | 0 | Block deployment |
| MEDIUM | < 10 | Fix in sprint |
| LOW | < 25 | Fix when possible |
| INFO | Any | Document |

---

## Customization

### Modify k6 Tests

Edit test files in `k6/`:

```javascript
// k6/load.js
export const options = {
  stages: [
    { duration: '1m', target: 5 },   // Adjust VU count
    { duration: '3m', target: 10 },  // Adjust duration
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // Adjust threshold
  },
};
```

### Configure ZAP Scans

Edit `zap/zap-baseline.conf`:

```
# Ignore specific alerts
10020 IGNORE (X-Frame-Options)

# Set max scan duration
-m 5  # 5 minutes max
```

### Change Target URLs

- **Performance**: Update URLs in `k6/*.js` files
- **Security**: Pass `-t` parameter to ZAP command

---

## Troubleshooting

### k6 Tests Failing

**Problem**: Thresholds breached
```
✗ http_req_duration: p(95) < 500ms (actual: 789ms)
```

**Solutions**:
1. Check API availability
2. Review recent deployments
3. Adjust thresholds if realistic
4. See [Setup Guide - Troubleshooting](./docs/setup.md#troubleshooting)

### ZAP Scan Issues

**Problem**: Permission denied writing report
```
ERROR: cannot write to /zap/wrk/zap-report.html
```

**Solutions**:
```bash
# Fix permissions
chmod 755 $(pwd)

# Use :rw flag (already included)
docker run --rm -v $(pwd):/zap/wrk:rw ...
```

**More help**: See [docs/setup.md](./docs/setup.md)

---

## Common Commands

```bash
# Pull latest Docker images
npm run docker:pull

# Run performance tests only
npm run test:perf

# Run security tests only
npm run test:sec

# Run everything
npm run test:all

# Clean generated reports
npm run clean

# Show all commands
npm run help
```

---

## Technologies

- **[k6](https://k6.io/)** - Modern load testing tool by Grafana Labs
- **[OWASP ZAP](https://www.zaproxy.org/)** - Leading open-source security scanner
- **[Docker](https://www.docker.com/)** - Container platform for consistent execution
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD automation

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Resources

- **k6 Documentation**: https://k6.io/docs/
- **OWASP ZAP Docs**: https://www.zaproxy.org/docs/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **GitHub Actions**: https://docs.github.com/en/actions

---

## Acknowledgments

- **ReqRes API** - Public test API for performance testing
- **TestPHP Vulnweb** - Intentionally vulnerable app for security testing
- **Grafana k6 Team** - Excellent load testing tool
- **OWASP ZAP Team** - Essential security testing tool

---

**Questions?** Open an issue or check the [documentation](./docs/).

**Ready to test?** Run `npm run test:all` 🚀


## Prerequisites

- Node.js 20.x
- k6 (installation: <https://k6.io/docs/get-started/installation/>)
- Docker (for running OWASP ZAP)

## Installation

```bash
npm install
```

### Install k6

macOS:
```bash
brew install k6
```

Linux:
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

Windows:
```powershell
choco install k6
```

## Running Performance Tests (k6)

```bash
# Run load test
npm run k6:run

# Run smoke test
npm run k6:run:smoke

# Run stress test
npm run k6:run:stress

# Run custom test directly
k6 run tests/performance/your-test.js
```

## Running Security Tests (OWASP ZAP)

```bash
# Run baseline scan (quick passive scan)
npm run zap:baseline

# Run full scan (comprehensive active scan)
npm run zap:full-scan

# Custom ZAP scan
docker run -v $(pwd):/zap/wrk/:rw -t zaproxy/zap-stable zap-baseline.py -t <target-url> -r zap-report.html
```

## Project Structure

```
├── tests/
│   ├── performance/    # k6 performance tests
│   └── security/       # ZAP security configurations
├── config/             # Configuration files
└── package.json        # Project dependencies
```

## Branching Strategy

- Main branch: `main`
- Feature branches: `feat/<short-name>`
  - Example: `feat/initial-setup`, `feat/ci-pipeline`

## Commit Conventions

- `feat:` - New features/tests
- `docs:` - Documentation changes
- `ci:` - CI changes
- `chore:` - Config/tooling
- `fix:` - Bug/failing test fixes

## k6 Test Stages

- **Smoke Test**: Minimal load to verify the system works
- **Load Test**: Normal expected load
- **Stress Test**: Beyond normal capacity to find breaking point
- **Spike Test**: Sudden increase in load
- **Soak Test**: Extended duration at normal load

## ZAP Scan Types

- **Baseline Scan**: Quick passive scan for obvious vulnerabilities
- **Full Scan**: Comprehensive active scan (more invasive)
- **API Scan**: Specialized scan for API endpoints

## Resources

- k6 Documentation: <https://k6.io/docs/>
- OWASP ZAP Documentation: <https://www.zaproxy.org/docs/>
