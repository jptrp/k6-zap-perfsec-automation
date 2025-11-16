# Interpreting Results - k6 + OWASP ZAP Test Outputs

## Overview

This guide explains how to read and interpret test outputs from both k6 performance tests and OWASP ZAP security scans.

---

## k6 Performance Test Results

### Console Output Structure

When you run a k6 test, you'll see output like this:

```
     ✓ GET /users status is 200
     ✓ GET /users has data
     ✓ GET /users response time < 500ms

     checks.........................: 100.00% ✓ 180      ✗ 0
     data_received..................: 450 kB  15 kB/s
     data_sent......................: 18 kB   600 B/s
     http_req_blocked...............: avg=1.2ms    min=0.5ms  med=1ms    max=5ms    p(90)=2ms    p(95)=3ms
     http_req_connecting............: avg=0.8ms    min=0.3ms  med=0.7ms  max=2ms    p(90)=1.2ms  p(95)=1.5ms
     http_req_duration..............: avg=245ms    min=123ms  med=234ms  max=456ms  p(90)=334ms  p(95)=389ms
       { expected_response:true }...: avg=245ms    min=123ms  med=234ms  max=456ms  p(90)=334ms  p(95)=389ms
     http_req_failed................: 0.00%   ✓ 0        ✗ 60
     http_req_receiving.............: avg=2ms      min=1ms    med=1.8ms  max=5ms    p(90)=3ms    p(95)=4ms
     http_req_sending...............: avg=0.5ms    min=0.2ms  med=0.4ms  max=1ms    p(90)=0.8ms  p(95)=0.9ms
     http_req_tls_handshaking.......: avg=0ms      min=0ms    med=0ms    max=0ms    p(90)=0ms    p(95)=0ms
     http_req_waiting...............: avg=242ms    min=120ms  med=231ms  max=450ms  p(90)=330ms  p(95)=385ms
     http_reqs......................: 60      2/s
     iterations.....................: 20      0.666667/s
     vus............................: 2       min=2      max=2
     vus_max........................: 2       min=2      max=2
```

### Key Metrics Explained

#### 1. Checks

```
checks.........................: 100.00% ✓ 180      ✗ 0
```

- **Meaning**: Validation assertions in your test
- **Format**: `✓ passed_count ✗ failed_count`
- **Target**: 100% or > 95%

**Interpretation**:
- `100%`: Perfect - all validations passed
- `> 95%`: Good - minor issues
- `< 95%`: **FAIL** - investigate failures

#### 2. HTTP Request Duration

```
http_req_duration..............: avg=245ms    min=123ms  med=234ms  max=456ms  p(90)=334ms  p(95)=389ms
```

- **avg**: Mean response time
- **min**: Fastest response
- **med**: Median (50th percentile)
- **max**: Slowest response
- **p(90)**: 90% of requests were faster than this
- **p(95)**: 95% of requests were faster than this ⭐ Most important
- **p(99)**: 99% of requests were faster than this

**Interpretation**:
- `p(95) < 500ms`: ✅ Excellent
- `p(95) 500-1000ms`: ⚠️ Acceptable
- `p(95) > 1000ms`: ❌ Poor - needs optimization

**Why p(95) matters**: It excludes outliers while capturing most user experience.

#### 3. HTTP Request Failed Rate

```
http_req_failed................: 0.00%   ✓ 0        ✗ 60
```

- **Meaning**: Percentage of requests that failed (4xx, 5xx status codes)
- **Format**: `rate% ✓ failed_count ✗ total_count`

**Interpretation**:
- `0%`: ✅ Perfect - no failures
- `< 1%`: ✅ Excellent
- `1-5%`: ⚠️ Acceptable (depends on context)
- `> 5%`: ❌ **FAIL** - system unstable

#### 4. HTTP Requests Count

```
http_reqs......................: 60      2/s
```

- **60**: Total requests made
- **2/s**: Requests per second (throughput)

**Interpretation**:
- Higher req/s = more load handled
- Compare across test runs to spot degradation

#### 5. Iterations

```
iterations.....................: 20      0.666667/s
```

- **20**: Number of complete test iterations
- **0.666667/s**: Iterations per second

**Interpretation**:
- Each iteration = 1 VU completing full test scenario
- More iterations = more virtual users could complete flows

#### 6. Virtual Users (VUs)

```
vus............................: 2       min=2      max=2
vus_max........................: 2       min=2      max=2
```

- **vus**: Current/average concurrent users
- **vus_max**: Peak concurrent users

**Interpretation**:
- Shows load level achieved
- Compare to target (e.g., "Did we reach 20 VUs?")

---

### Reading Custom Summaries

Our k6 tests generate custom summaries:

```
╔═══════════════════════════════════════════════════════════════╗
║           k6 LOAD TEST - PERFORMANCE SUMMARY                  ║
╚═══════════════════════════════════════════════════════════════╝

📊 REQUEST METRICS
─────────────────────────────────────────────────────────────────
  Total Requests........: 360
  Requests/sec..........: 10.25
  Failed Requests.......: 0.00%
  Success Rate..........: 100.00%

⏱️  RESPONSE TIME METRICS
─────────────────────────────────────────────────────────────────
  Min...................: 145.23ms
  Avg...................: 267.45ms
  Median (p50)..........: 251.12ms
  p(90).................: 389.67ms
  p(95).................: 423.89ms ✓ PASS (< 500ms)
  p(99).................: 567.23ms ✓ PASS (< 1000ms)
  Max...................: 789.45ms

✓ CHECK RESULTS
─────────────────────────────────────────────────────────────────
  Passed................: 1080
  Failed................: 0
  Success Rate..........: 100.00%

🎯 THRESHOLD STATUS
─────────────────────────────────────────────────────────────────
  p(95) < 500ms.........: ✓ PASS (423.89ms)
  Fail Rate < 5%........: ✓ PASS (0.00%)
  Checks > 95%..........: ✓ PASS (100.00%)
```

**How to Read**:

1. **REQUEST METRICS**: Overall request success
2. **RESPONSE TIME METRICS**: Latency breakdown
3. **CHECK RESULTS**: Test assertion results
4. **THRESHOLD STATUS**: Pass/fail determination

**Quick Assessment**:
- All ✓ PASS = Test successful
- Any ✗ FAIL = Investigate that metric

---

### Stress Test Interpretation

Stress test output includes insights:

```
💡 STRESS TEST INSIGHTS
─────────────────────────────────────────────────────────────────
  ✓ System handled 100 VUs with minimal failures (<5%)
  ✓ Consider increasing load further to find true breaking point

📈 RECOMMENDATIONS
─────────────────────────────────────────────────────────────────
  • System performs well under 100 VU load
  • Consider stress testing with higher VU counts
```

**How to Use**:
- **< 5% failures**: System stable, can handle load
- **5-15% failures**: Approaching capacity
- **> 15% failures**: Breaking point reached

**Action Items**:
- Document breaking point VU count
- Compare to expected peak load
- Plan infrastructure scaling if needed

---

## OWASP ZAP Security Report

### Report Structure

The ZAP HTML report contains:

1. **Summary**: Total alerts by severity
2. **Alert Details**: Each finding with description
3. **Recommendations**: How to fix
4. **References**: Links to vulnerability databases

### Severity Levels

#### HIGH (Red) 🔴

**Meaning**: Critical vulnerabilities requiring immediate attention

**Examples**:
- SQL Injection
- Remote Code Execution
- Authentication Bypass
- Sensitive Data Exposure

**Action**: Fix immediately, block deployment

**Typical Count**: 0-5 (depends on application maturity)

#### MEDIUM (Orange) 🟠

**Meaning**: Moderate risk issues that should be addressed soon

**Examples**:
- Missing X-Frame-Options header
- Cookie without HttpOnly flag
- Missing Content-Security-Policy
- Weak password policy

**Action**: Fix in current sprint

**Typical Count**: 5-15

#### LOW (Yellow) 🟡

**Meaning**: Minor issues or hardening opportunities

**Examples**:
- Server version disclosure
- X-Content-Type-Options missing
- Directory browsing enabled
- Incomplete input validation

**Action**: Fix when time permits

**Typical Count**: 10-25

#### INFORMATIONAL (Blue) 🔵

**Meaning**: Observations, not vulnerabilities

**Examples**:
- Timestamp disclosure
- HTML comments
- Base64 encoded data
- Cookie behavior

**Action**: Review and document

**Typical Count**: 20-40

---

### Reading Alert Details

Each alert in the report shows:

```
Alert Name: Cross Site Scripting (Reflected)

Risk: HIGH
Confidence: MEDIUM
URL: https://example.com/page?id=<script>alert(1)</script>
Parameter: id

Description:
Cross-site Scripting (XSS) is an attack technique that forces a web site to echo
attacker-supplied executable code, which loads in a user's browser...

Solution:
Phase: Architecture and Design
- Use a vetted library or framework that does not allow this weakness...
- Validate all input and escape all output...

Reference:
- https://owasp.org/www-community/attacks/xss/
- https://cwe.mitre.org/data/definitions/79.html

CWE ID: 79
WASC ID: 8
Plugin ID: 40012
```

**How to Read**:

1. **Alert Name**: Type of vulnerability
2. **Risk**: Severity (HIGH/MEDIUM/LOW/INFO)
3. **Confidence**: How certain ZAP is (HIGH/MEDIUM/LOW)
4. **URL**: Where the vulnerability was found
5. **Parameter**: Affected input field
6. **Description**: What the vulnerability is
7. **Solution**: How to fix it
8. **Reference**: Additional reading

---

### Common Findings Explained

#### 1. Missing X-Frame-Options Header

**Risk**: MEDIUM  
**What it means**: Page can be embedded in iframe (clickjacking risk)

**Example**:
```
URL: https://example.com/
Risk: MEDIUM
CWE: 1021

Solution: Add HTTP response header:
X-Frame-Options: DENY
```

**Action**: Add header to all responses

#### 2. Cookie Without HttpOnly Flag

**Risk**: MEDIUM  
**What it means**: JavaScript can access cookie (XSS risk)

**Example**:
```
Cookie: sessionid=abc123
Risk: MEDIUM
CWE: 1004

Solution: Set HttpOnly flag:
Set-Cookie: sessionid=abc123; HttpOnly; Secure
```

**Action**: Update cookie configuration

#### 3. SQL Injection

**Risk**: HIGH  
**What it means**: Database queries can be manipulated

**Example**:
```
URL: https://example.com/user?id=1' OR '1'='1
Parameter: id
Risk: HIGH
CWE: 89

Solution: Use parameterized queries
```

**Action**: Fix immediately with prepared statements

#### 4. Cross-Site Scripting (XSS)

**Risk**: HIGH  
**What it means**: Malicious scripts can be injected

**Example**:
```
URL: https://example.com/search?q=<script>alert(1)</script>
Parameter: q
Risk: HIGH
CWE: 79

Solution: Escape output, validate input
```

**Action**: Implement output encoding

---

### Confidence Levels

#### HIGH Confidence
- ZAP is very certain this is a real vulnerability
- Likely exploitable
- Prioritize fixing

#### MEDIUM Confidence
- Probably a vulnerability
- Requires manual verification
- Could be false positive

#### LOW Confidence
- Potential vulnerability
- High chance of false positive
- Manual review strongly recommended

**Triage Strategy**:
1. Fix: HIGH Risk + HIGH Confidence
2. Verify: HIGH Risk + MEDIUM/LOW Confidence
3. Review: MEDIUM/LOW Risk + Any Confidence

---

### Expected Results for testphp.vulnweb.com

This is an intentionally vulnerable application:

```
Summary:
  HIGH: 8-12 alerts
  MEDIUM: 12-18 alerts
  LOW: 20-30 alerts
  INFO: 25-35 alerts
  
  Total: ~65-95 alerts
```

**Common Findings**:
- ✗ SQL Injection (multiple locations)
- ✗ Cross-Site Scripting (XSS)
- ✗ Missing security headers (X-Frame-Options, CSP)
- ✗ Insecure cookies (no HttpOnly, no Secure)
- ✗ Server version disclosure
- ✗ Directory browsing enabled

**Don't Panic**: This is expected for a vulnerable test application!

---

## Comparing Results Over Time

### Performance Trending

Track these metrics across test runs:

```
Run Date    | p(95) | Fail Rate | VUs | Status
------------|-------|-----------|-----|--------
2025-11-01  | 423ms | 0.0%      | 20  | ✓ PASS
2025-11-08  | 456ms | 0.5%      | 20  | ✓ PASS
2025-11-15  | 512ms | 1.2%      | 20  | ✗ FAIL  ← Investigate!
```

**Red Flags**:
- p(95) increasing over time
- Fail rate creeping up
- Same VUs, worse performance

**Actions**:
- Review code changes
- Check infrastructure
- Profile application

### Security Trending

Track vulnerabilities over time:

```
Run Date    | HIGH | MEDIUM | LOW | Trend
------------|------|--------|-----|-------
2025-11-01  | 5    | 12     | 20  | 
2025-11-08  | 3    | 10     | 18  | ↓ Improving
2025-11-15  | 3    | 9      | 15  | ↓ Improving
```

**Good Signs**:
- HIGH findings decreasing
- Remediation efforts working
- No new HIGH findings

**Bad Signs**:
- HIGH findings increasing
- Same issues not being fixed
- New vulnerabilities appearing

---

## Troubleshooting Failed Tests

### k6 Test Failures

#### Threshold Breach: p(95) Too High

**Symptom**:
```
✗ http_req_duration: p(95) < 500ms (actual: 789ms)
```

**Possible Causes**:
- API performance degraded
- Network latency increased
- Database slow queries
- Insufficient resources

**How to Investigate**:
1. Check API logs for errors
2. Review recent deployments
3. Monitor server CPU/memory
4. Analyze database query times

#### High Failure Rate

**Symptom**:
```
✗ http_req_failed: rate < 0.05 (actual: 0.15)
```

**Possible Causes**:
- API rate limiting
- Server errors (500s)
- Connection timeouts
- Authentication failures

**How to Investigate**:
1. Check k6 output for error messages
2. Review API rate limits
3. Check server logs
4. Verify test configuration

### ZAP Scan Failures

#### Scan Timeout

**Symptom**: Scan runs indefinitely

**Solution**:
```bash
# Add timeout
-m 5  # Max 5 minutes
```

#### Permission Denied

**Symptom**: Cannot write report

**Solution**:
```bash
# Fix Docker volume permissions
chmod 755 $(pwd)
```

---

## Best Practices

### Performance Results

1. **Focus on p(95)**: Better indicator than average
2. **Compare apples to apples**: Same VUs, same test
3. **Run multiple times**: Validate consistency
4. **Document baselines**: Know your "normal"
5. **Investigate trends**: Don't ignore gradual degradation

### Security Results

1. **Triage by risk**: Fix HIGH first
2. **Verify findings**: Not all alerts are real
3. **Track progress**: Monitor remediation
4. **Document exceptions**: Known false positives
5. **Regular scans**: Continuous monitoring

---

## Quick Reference

### k6 - Is This Good?

| Metric | Good | Acceptable | Bad |
|--------|------|------------|-----|
| p(95) duration | < 300ms | < 500ms | > 500ms |
| Fail rate | < 1% | < 5% | > 5% |
| Check pass rate | > 99% | > 95% | < 95% |

### ZAP - How Many is Too Many?

| Severity | Target | Maximum Acceptable |
|----------|--------|-------------------|
| HIGH | 0 | 0 (block deployment) |
| MEDIUM | < 3 | < 10 |
| LOW | < 10 | < 25 |
| INFO | Any | Any |

---

**Last Updated**: November 16, 2025
