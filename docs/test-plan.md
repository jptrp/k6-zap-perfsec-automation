# Test Plan - k6 + OWASP ZAP Performance & Security Testing

## Document Information

- **Project**: k6 + OWASP ZAP Performance & Security Testing Framework
- **Test Types**: Performance (k6), Security (OWASP ZAP)
- **Targets**: 
  - Performance: https://reqres.in
  - Security: https://testphp.vulnweb.com
- **Last Updated**: November 16, 2025

---

## Test Objectives

### Primary Objectives

1. **Validate System Performance**
   - Ensure APIs respond within acceptable timeframes
   - Verify system handles expected load
   - Identify performance bottlenecks

2. **Discover Security Vulnerabilities**
   - Identify OWASP Top 10 vulnerabilities
   - Detect missing security controls
   - Find information disclosure issues

3. **Enable Continuous Testing**
   - Automate performance + security testing in CI/CD
   - Provide fast feedback on every deployment
   - Track metrics over time

### Success Criteria

- ✅ All k6 tests pass thresholds
- ✅ Zero HIGH severity ZAP findings
- ✅ Tests complete in under 20 minutes total
- ✅ CI pipeline runs successfully on every push
- ✅ Reports generated and accessible

---

## Scope

### In Scope

**Performance Testing**:
- API response time validation
- Load handling (1-20 concurrent users)
- Stress testing (up to 100 concurrent users)
- Request success/failure rates
- Percentile analysis (p50, p95, p99)

**Security Testing**:
- Passive vulnerability scanning
- OWASP Top 10 detection
- Security header validation
- Cookie security analysis
- SSL/TLS configuration review
- Information disclosure detection

### Out of Scope

**Performance**:
- Database performance testing
- Frontend performance (page load times)
- Mobile app performance
- Network latency testing
- CDN performance

**Security**:
- Active penetration testing (ZAP active scan)
- Social engineering
- Physical security
- Code review/SAST
- Dependency vulnerability scanning

---

## Test Environment

### Performance Target

**Application**: ReqRes API (https://reqres.in)
- **Type**: REST API
- **Technology**: Public test API
- **Purpose**: Demonstrates typical API patterns
- **Characteristics**: Stable, predictable responses

**Endpoints Tested**:
```
GET  /api/users?page={page}     - List users
GET  /api/users/{id}            - Get user by ID
POST /api/users                 - Create user
GET  /api/unknown               - List resources
```

### Security Target

**Application**: TestPHP Vulnerable Web (https://testphp.vulnweb.com)
- **Type**: Web Application
- **Technology**: PHP
- **Purpose**: Intentionally vulnerable for testing
- **Characteristics**: Contains known vulnerabilities

**Expected Vulnerabilities**:
- SQL Injection
- Cross-Site Scripting (XSS)
- Missing security headers
- Insecure cookies
- Information disclosure

---

## Test Strategy

### Performance Testing Strategy

#### 1. Progressive Load Testing

```
Smoke Test (30s) → Load Test (6m) → Stress Test (10m)
     ↓                  ↓                  ↓
  Health Check     Normal Load      Breaking Point
```

**Rationale**: Start light, increase gradually, find limits

#### 2. Threshold-Driven Approach

Tests fail if:
- Response time p(95) exceeds targets
- Error rate exceeds 5%
- Check success rate below 95%

**Rationale**: Enforce performance SLAs automatically

#### 3. Scenario-Based Testing

Simulate real user behavior:
- Browse lists
- View details
- Create records
- Navigate between pages

**Rationale**: Realistic load patterns

### Security Testing Strategy

#### 1. Baseline Scanning First

- Use passive ZAP baseline scan
- Safe for production-like environments
- Quick feedback (2-5 minutes)

**Rationale**: Fast, non-intrusive validation

#### 2. Severity-Based Prioritization

Focus order:
1. HIGH → Fix immediately
2. MEDIUM → Fix in sprint
3. LOW → Fix when possible
4. INFO → Document and review

**Rationale**: Risk-based approach

#### 3. Continuous Monitoring

- Run on every deployment
- Track findings over time
- Fail CI on HIGH severity

**Rationale**: Shift-left security

---

## Test Cases

### Performance Tests

#### TC-PERF-001: Smoke Test

**Objective**: Validate API is functional and responsive

**Preconditions**: 
- Docker installed
- Internet connectivity
- reqres.in API available

**Test Steps**:
1. Run: `docker run --rm -i grafana/k6 run - < k6/smoke.js`
2. Observe test execution
3. Review results

**Expected Results**:
- All checks pass (100%)
- p(95) response time < 1000ms
- Error rate < 1%
- Duration: ~30 seconds
- Status: ✅ PASS

**Priority**: Critical  
**Frequency**: Every deployment

---

#### TC-PERF-002: Load Test

**Objective**: Measure performance under realistic load

**Preconditions**:
- Smoke test passed
- Docker installed
- Target API available

**Test Steps**:
1. Run: `docker run --rm -i grafana/k6 run - < k6/load.js`
2. Monitor VU ramp-up (1→20)
3. Review metrics at each stage
4. Analyze summary report

**Expected Results**:
- p(95) response time < 500ms
- p(99) response time < 1000ms
- Request failure rate < 5%
- Check success rate > 95%
- Duration: ~6 minutes
- Status: ✅ PASS

**Metrics Captured**:
- http_req_duration (all percentiles)
- http_req_failed (rate)
- http_reqs (total and rate)
- checks (pass/fail count)
- iterations (completed)

**Priority**: High  
**Frequency**: Daily, on PR

---

#### TC-PERF-003: Stress Test

**Objective**: Find system breaking points

**Preconditions**:
- Load test passed
- Docker installed
- Target API available

**Test Steps**:
1. Run: `docker run --rm -i grafana/k6 run - < k6/stress.js`
2. Monitor VU ramp-up (1→100)
3. Observe failure point
4. Analyze degradation patterns
5. Review recommendations

**Expected Results**:
- p(95) response time < 2000ms (relaxed)
- Request failure rate < 20% (relaxed)
- System doesn't crash completely
- Duration: ~10 minutes
- Status: ✅ PASS (even with some failures)

**Failure Analysis**:
- At what VU count do failures start?
- What's the response time degradation curve?
- Are failures timeout-based or server errors?

**Priority**: Medium  
**Frequency**: Weekly, before releases

---

### Security Tests

#### TC-SEC-001: ZAP Baseline Scan

**Objective**: Identify common web vulnerabilities

**Preconditions**:
- Docker installed
- Target site accessible
- Internet connectivity

**Test Steps**:
1. Run: `docker run --rm -v $(pwd):/zap/wrk:rw -t owasp/zap2docker-stable zap-baseline.py -t https://testphp.vulnweb.com -r zap-report.html`
2. Wait for scan completion
3. Open zap-report.html
4. Review findings by severity

**Expected Results**:
- Scan completes in < 5 minutes
- HTML report generated
- Findings categorized (HIGH/MEDIUM/LOW/INFO)
- Zero false positives in known findings
- Status: ✅ PASS (report generated)

**Expected Findings** (for testphp.vulnweb.com):
- HIGH: 5-10 (SQL injection, XSS)
- MEDIUM: 10-15 (missing headers, cookies)
- LOW: 15-25 (info disclosure)
- INFO: 20-30 (observations)

**Priority**: Critical  
**Frequency**: Every deployment

---

#### TC-SEC-002: Security Header Validation

**Objective**: Verify security headers are present

**Preconditions**: ZAP baseline scan completed

**Test Steps**:
1. Open zap-report.html
2. Filter for header-related findings
3. Check for:
   - X-Frame-Options
   - X-Content-Type-Options
   - Content-Security-Policy
   - Strict-Transport-Security

**Expected Results**:
- All required headers flagged if missing
- Severity: MEDIUM
- Remediation guidance provided

**Priority**: High  
**Frequency**: Every deployment

---

#### TC-SEC-003: Cookie Security Analysis

**Objective**: Validate cookie security attributes

**Preconditions**: ZAP baseline scan completed

**Test Steps**:
1. Review cookie-related findings
2. Check for:
   - HttpOnly flag missing
   - Secure flag missing
   - SameSite attribute missing

**Expected Results**:
- Insecure cookies identified
- Severity: MEDIUM
- Each cookie listed with missing attributes

**Priority**: High  
**Frequency**: Every deployment

---

#### TC-SEC-004: Information Disclosure Check

**Objective**: Identify information leakage

**Preconditions**: ZAP baseline scan completed

**Test Steps**:
1. Review information disclosure findings
2. Check for:
   - Server version in headers
   - Debug error messages
   - Sensitive comments in HTML
   - Stack traces

**Expected Results**:
- Information leaks identified
- Severity: LOW to MEDIUM
- Specific locations provided

**Priority**: Medium  
**Frequency**: Weekly

---

## Test Execution

### Execution Schedule

| Test Type | Frequency | Trigger | Duration |
|-----------|-----------|---------|----------|
| Smoke Test | Every push | Git push to main | 30s |
| Load Test | Daily | Scheduled + PR | 6m |
| Stress Test | Weekly | Scheduled | 10m |
| ZAP Baseline | Every push | Git push to main | 2-5m |

### Execution Order

1. **Smoke Test** (Must pass before proceeding)
2. **Load Test** (If smoke passes)
3. **Stress Test** (If load passes)
4. **ZAP Scan** (Parallel or after performance tests)

### CI/CD Execution

```
Git Push → GitHub Actions Triggered
    │
    ├─→ Job 1: k6-tests
    │   ├── Pull k6 Docker image
    │   ├── Run smoke.js ✓
    │   ├── Run load.js ✓
    │   ├── Run stress.js ✓
    │   └── Upload results
    │
    └─→ Job 2: zap-scan (depends on k6-tests)
        ├── Pull ZAP Docker image
        ├── Run baseline scan
        └── Upload report
```

---

## Pass/Fail Criteria

### Performance Tests

**PASS Conditions**:
- All thresholds met
- Check success rate > 95%
- No unexpected errors

**FAIL Conditions**:
- Any threshold breached
- Check success rate < 95%
- Connection failures
- Unexpected crashes

### Security Tests

**PASS Conditions**:
- Scan completes successfully
- Report generated
- Findings documented

**FAIL Conditions** (configurable):
- HIGH severity findings present
- Scan timeout or error
- Report generation failure

---

## Metrics & KPIs

### Performance KPIs

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| p(50) Response Time | < 200ms | < 300ms |
| p(95) Response Time | < 500ms | < 800ms |
| p(99) Response Time | < 1000ms | < 1500ms |
| Error Rate | < 1% | < 5% |
| Check Pass Rate | > 99% | > 95% |
| Requests/sec | 10+ | 5+ |

### Security KPIs

| Severity | Acceptable Count | Action Required |
|----------|-----------------|----------------|
| HIGH | 0 | Fix immediately |
| MEDIUM | < 5 | Fix in sprint |
| LOW | < 15 | Fix in backlog |
| INFO | Any | Document |

---

## Risk Assessment

### Performance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API unavailable | Low | High | Retry logic, health checks |
| Network latency | Medium | Medium | Run from consistent location |
| Rate limiting | Medium | High | Respect API limits |
| False failures | Low | Medium | Use retries in k6 config |

### Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| False positives | High | Medium | Manual review required |
| Scan incomplete | Low | High | Set timeout properly |
| Report not uploaded | Low | Medium | Verify artifact upload |
| Unpatched vulns | Medium | High | Regular scans + patching |

---

## Test Data

### Performance Test Data

**Synthetic Data** (Generated in tests):
```javascript
{
  "name": "k6 Test User",
  "job": "Performance Tester"
}
```

**No PII**: All data is synthetic

### Security Test Data

None required (passive scanning)

---

## Deliverables

1. **k6 Console Output**: Real-time test results
2. **k6 JSON Results**: `k6-load-results.json`, `k6-stress-results.json`
3. **ZAP HTML Report**: `zap-report.html`
4. **CI Artifacts**: Uploaded to GitHub Actions
5. **This Test Plan**: Documentation

---

## Maintenance Plan

### Weekly
- Review test results
- Investigate failures
- Update thresholds if needed

### Monthly
- Review ZAP findings trends
- Update Docker images
- Review test coverage

### Quarterly
- Performance baseline review
- Security posture assessment
- Update test plan

---

## References

- k6 Documentation: https://k6.io/docs/
- OWASP ZAP: https://www.zaproxy.org/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- GitHub Actions: https://docs.github.com/en/actions

---

**Approved By**: QA Team  
**Version**: 1.0  
**Last Updated**: November 16, 2025
