# Architecture - k6 + OWASP ZAP Performance & Security Testing Framework

## Overview

This project implements a comprehensive non-functional testing framework combining:

- **Performance Testing** (k6)
- **Security Testing** (OWASP ZAP)
- **CI/CD Integration** (GitHub Actions)

**Goal**: Provide automated, continuous validation of system performance and security posture.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CI/CD Pipeline (GitHub Actions)            │
│                                                              │
│  ┌────────────────────┐      ┌──────────────────────┐      │
│  │   k6 Performance   │──────│   OWASP ZAP Security │      │
│  │      Tests         │      │       Scan           │      │
│  └────────────────────┘      └──────────────────────┘      │
│           │                            │                     │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌────────────────────┐      ┌──────────────────────┐      │
│  │  Performance       │      │   Security           │      │
│  │  Reports/Metrics   │      │   Report (HTML)      │      │
│  └────────────────────┘      └──────────────────────┘      │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        ▼                                     │
│              ┌──────────────────┐                           │
│              │   Artifacts      │                           │
│              │   (Upload)       │                           │
│              └──────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
k6-zap-perfsec-automation/
├── k6/                          # Performance test scripts
│   ├── smoke.js                 # Quick health check (30s, 2 VUs)
│   ├── load.js                  # Normal load simulation (6m, 1-20 VUs)
│   └── stress.js                # Breaking point test (10m, 1-100 VUs)
│
├── zap/                         # Security testing configuration
│   ├── zap-baseline.conf        # ZAP scan configuration
│   └── notes.md                 # Security testing documentation
│
├── docs/                        # Documentation
│   ├── setup.md                 # Installation and usage guide
│   ├── architecture.md          # This file - system design
│   ├── test-plan.md             # Test strategy and coverage
│   └── interpreting-results.md  # How to read test outputs
│
├── .github/                     # CI/CD configuration
│   └── workflows/
│       └── ci.yml               # GitHub Actions workflow
│
├── package.json                 # npm scripts for test execution
├── README.md                    # Project overview
└── [Generated Reports]          # Output files (gitignored)
    ├── k6-load-results.json
    ├── k6-stress-results.json
    └── zap-report.html
```

---

## k6 Performance Testing Architecture

### Design Principles

1. **Progressive Load Testing**: Start light (smoke) → normal (load) → extreme (stress)
2. **Docker-First**: All tests runnable via Docker (no local k6 installation required)
3. **Threshold-Driven**: Tests fail if performance degrades below acceptable levels
4. **Modular**: Each test is self-contained and independently runnable

### Test Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Smoke Test                                │
│  Purpose: Validate basic functionality                      │
│  VUs: 2 | Duration: 30s | Thresholds: Strict               │
│  Use: Pre-deployment validation                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Test                                 │
│  Purpose: Simulate realistic load                           │
│  VUs: 1→20 | Duration: 6m | Thresholds: Production SLAs    │
│  Use: Regular performance monitoring                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Stress Test                                │
│  Purpose: Find breaking points                              │
│  VUs: 1→100 | Duration: 10m | Thresholds: Relaxed          │
│  Use: Capacity planning                                      │
└─────────────────────────────────────────────────────────────┘
```

### Test Components

#### 1. Smoke Test (`k6/smoke.js`)

**Purpose**: Quick validation that APIs are functional

**Characteristics**:
- **VUs**: 2 concurrent virtual users
- **Duration**: 30 seconds
- **Endpoints Tested**:
  - `GET /api/users` (list)
  - `GET /api/users/2` (single user)
  - `POST /api/users` (create user)

**Thresholds**:
```javascript
http_req_duration: ['p(95)<1000'],   // 95% under 1s
errors: ['rate<0.01'],                // <1% error rate
checks: ['rate>0.95'],                // >95% checks pass
```

**When to Run**: Before every deployment, after configuration changes

#### 2. Load Test (`k6/load.js`)

**Purpose**: Measure performance under realistic user load

**Load Profile**:
```javascript
stages: [
  { duration: '2m', target: 10 },   // Ramp up
  { duration: '3m', target: 20 },   // Peak load
  { duration: '2m', target: 20 },   // Sustained
  { duration: '1m', target: 0 },    // Ramp down
]
```

**Scenarios**:
- **Browse Users** (100%): List users with pagination
- **View User Details** (100%): Get specific user
- **Create User** (20%): POST new user
- **Get Resources** (100%): Additional endpoint

**Thresholds**:
```javascript
http_req_duration: ['p(95)<500'],              // P95 < 500ms
'http_req_duration{expected_response:true}': ['p(99)<1000'],  // P99 < 1s
http_req_failed: ['rate<0.05'],                // <5% failures
```

**Metrics Collected**:
- Request duration (min, avg, median, p90, p95, p99, max)
- Request rate (req/s)
- Failure rate
- Check pass rate
- Custom trends (per-endpoint timing)

#### 3. Stress Test (`k6/stress.js`)

**Purpose**: Push system beyond normal capacity to find limits

**Load Profile**:
```javascript
stages: [
  { duration: '1m', target: 20 },    // Quick ramp
  { duration: '2m', target: 50 },    // Aggressive
  { duration: '2m', target: 50 },    // Hold
  { duration: '2m', target: 100 },   // Maximum stress
  { duration: '2m', target: 100 },   // Sustained stress
  { duration: '1m', target: 0 },     // Recovery
]
```

**Scenarios**:
- High-frequency requests
- Batch operations
- Concurrent POST/GET operations
- Minimal sleep times (aggressive)

**Thresholds** (Relaxed):
```javascript
http_req_duration: ['p(95)<2000'],   // Allow 2s for p95
http_req_failed: ['rate<0.20'],      // Allow 20% failures
errors: ['rate<0.25'],                // Allow 25% errors
```

**Purpose of Relaxed Thresholds**: Identify breaking points, not enforce SLAs

### Custom Metrics

All tests track:

```javascript
// Error rate tracker
const errorRate = new Rate('errors');

// Per-endpoint timing
const getUserTrend = new Trend('get_user_duration');
const createUserTrend = new Trend('create_user_duration');

// Request counters
const totalRequests = new Counter('total_requests');
const totalSuccess = new Counter('total_success');
const totalErrors = new Counter('total_errors');
```

---

## OWASP ZAP Security Testing Architecture

### Scan Type: Baseline Scan

**Characteristics**:
- **Mode**: Passive scanning (non-intrusive)
- **Duration**: 2-5 minutes typical
- **Target**: https://testphp.vulnweb.com
- **Safe for Production**: Yes (passive only)

### Security Checks Performed

```
┌─────────────────────────────────────────────────────────────┐
│                  ZAP Baseline Scan                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Spider/Crawl                                      │  │
│  │     - Discover all pages and endpoints                │  │
│  │     - Build site map                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. Passive Scan                                      │  │
│  │     - Analyze HTTP requests/responses                 │  │
│  │     - Check headers, cookies, content                 │  │
│  │     - No active attacks                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. Alert Generation                                  │  │
│  │     - Categorize findings by severity                 │  │
│  │     - HIGH, MEDIUM, LOW, INFORMATIONAL                │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  4. Report Generation                                 │  │
│  │     - HTML report with details                        │  │
│  │     - Remediation recommendations                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Vulnerability Categories Detected

1. **Missing Security Headers** (Medium)
   - X-Frame-Options
   - X-Content-Type-Options
   - Content-Security-Policy
   - Strict-Transport-Security

2. **Cookie Security** (Medium)
   - Missing HttpOnly flag
   - Missing Secure flag
   - Missing SameSite attribute

3. **Information Disclosure** (Low)
   - Server version leakage
   - Debug messages
   - Sensitive comments

4. **Injection Vulnerabilities** (High)
   - SQL injection indicators
   - XSS potential
   - Command injection

5. **TLS/SSL Issues** (Medium/High)
   - Weak ciphers
   - Certificate problems

### Configuration Management

**File**: `zap/zap-baseline.conf`

```conf
ALERT_LEVEL=WARN          # Fail threshold
MAX_DURATION=5            # Timeout in minutes
IGNORE_ALERTS=            # Suppressed findings
SCAN_SCOPE=https://...    # Target scope
```

**Alert Level Options**:
- `PASS`: Report but don't fail
- `WARN`: Warn on medium+
- `FAIL`: Fail on any findings

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Performance + Security Tests

on: [push, pull_request]

jobs:
  k6-tests:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run smoke.js
      - Run load.js
      - Run stress.js
      - Upload k6 results

  zap-scan:
    needs: k6-tests
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run ZAP baseline scan
      - Upload zap-report.html
```

### Execution Flow

```
┌─────────────┐
│   Git Push  │
│   to main   │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────┐
│  Trigger GitHub Actions Workflow   │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│     Job 1: k6-tests               │
│  ┌──────────────────────────────┐ │
│  │  - Pull k6 Docker image      │ │
│  │  - Run smoke.js              │ │
│  │  - Run load.js               │ │
│  │  - Run stress.js             │ │
│  │  - Upload JSON results       │ │
│  └──────────────────────────────┘ │
└──────┬─────────────────────────────┘
       │ (on success)
       ▼
┌────────────────────────────────────┐
│     Job 2: zap-scan               │
│  ┌──────────────────────────────┐ │
│  │  - Pull ZAP Docker image     │ │
│  │  - Run baseline scan         │ │
│  │  - Upload HTML report        │ │
│  └──────────────────────────────┘ │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│   Artifacts Available in UI        │
│  - k6-results.json                 │
│  - zap-report.html                 │
└────────────────────────────────────┘
```

### Failure Scenarios

**k6 Tests Fail**:
- Threshold breach (p95 too high, error rate too high)
- Connection failures
- **Action**: ZAP scan does NOT run (depends on k6 success)

**ZAP Scan Fails**:
- HIGH severity findings (if configured)
- Scan timeout
- **Action**: Workflow fails, report available in artifacts

---

## Data Flow

### Input Sources

```
┌──────────────────┐
│  Test Scripts    │
│  (k6/*.js)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│  Docker k6       │──────▶│  reqres.in API   │
│  Container       │◀──────│  (Target)        │
└────────┬─────────┘      └──────────────────┘
         │
         ▼
┌──────────────────┐
│  Metrics/Results │
│  (JSON/Console)  │
└──────────────────┘
```

```
┌──────────────────┐
│  ZAP Config      │
│  (zap/*.conf)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│  Docker ZAP      │──────▶│  testphp.vuln... │
│  Container       │◀──────│  (Target)        │
└────────┬─────────┘      └──────────────────┘
         │
         ▼
┌──────────────────┐
│  Security Report │
│  (HTML)          │
└──────────────────┘
```

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Performance** | k6 | Latest | Load/stress testing |
| **Security** | OWASP ZAP | Stable | Vulnerability scanning |
| **Containerization** | Docker | 20+ | Isolated execution |
| **CI/CD** | GitHub Actions | N/A | Automation |
| **Scripting** | JavaScript (k6) | ES6+ | Test logic |
| **Package Manager** | npm | 10+ | Script management |

---

## Design Decisions

### Why k6?

✅ **Pros**:
- JavaScript-based (developer-friendly)
- Excellent CLI output
- Threshold-driven testing
- Docker support
- Open source

❌ **Alternatives Considered**:
- JMeter (heavy, requires Java)
- Gatling (Scala, steeper learning curve)
- Locust (Python, less mature)

### Why OWASP ZAP?

✅ **Pros**:
- Industry-standard security tool
- Docker baseline scan perfect for CI
- Comprehensive OWASP Top 10 coverage
- Active community
- Open source

❌ **Alternatives Considered**:
- Burp Suite (expensive, limited automation)
- Nikto (less comprehensive)
- Custom security scripts (reinventing wheel)

### Why Docker-First Approach?

✅ **Benefits**:
- No local tool installation required
- Consistent execution environment
- Easy CI/CD integration
- Version pinning
- Cross-platform compatibility

---

## Scalability

### Horizontal Scaling (More Load)

**k6**:
- Increase VU count in stages
- Extend test duration
- Add more scenarios

**ZAP**:
- Use `zap-full-scan.py` for active testing
- Add authentication contexts
- Scan multiple targets in parallel

### Vertical Scaling (More Tests)

**Add New k6 Tests**:
```
k6/
├── smoke.js
├── load.js
├── stress.js
├── spike.js       # NEW: Sudden traffic spike
├── soak.js        # NEW: Long-duration test
└── api-specific.js # NEW: Endpoint-specific test
```

**Add New Security Scans**:
```
zap/
├── zap-baseline.conf
├── zap-api.conf       # NEW: API-specific scan
└── zap-auth.context   # NEW: Authenticated scan
```

---

## Maintenance Strategy

### Regular Updates

**Weekly**:
- Review CI test results
- Investigate failures
- Update thresholds if needed

**Monthly**:
- Pull latest Docker images
- Review ZAP findings trends
- Update documentation

**Quarterly**:
- Comprehensive performance baseline review
- Security posture assessment
- Capacity planning based on stress tests

---

## Security Considerations

### Secrets Management

- No hardcoded credentials in tests
- Use GitHub Secrets for sensitive data
- ZAP baseline scan is passive (safe)

### Target Selection

- k6: Public API (reqres.in) - no PII
- ZAP: Intentionally vulnerable app (testphp.vulnweb.com)
- Never test production without permission

---

## Future Enhancements

1. **Grafana Dashboard**: Real-time k6 metrics visualization
2. **ZAP Active Scan**: Full penetration testing in staging
3. **API Contract Testing**: Validate OpenAPI specs
4. **Database Performance**: Query execution time monitoring
5. **Mobile Performance**: Lighthouse integration
6. **Distributed k6**: Multi-region load testing
7. **Security Regression**: Track vulnerability trends over time

---

**Last Updated**: November 16, 2025  
**Architecture Version**: 1.0
