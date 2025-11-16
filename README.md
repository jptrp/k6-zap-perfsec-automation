# K6 + ZAP Performance & Security Automation

Performance and security testing using k6 and OWASP ZAP.

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
