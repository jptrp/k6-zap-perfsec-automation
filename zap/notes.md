# OWASP ZAP Security Testing Notes

## Overview

This directory contains configuration and documentation for OWASP ZAP (Zed Attack Proxy) security testing.

**Target Application**: https://testphp.vulnweb.com  
**Scan Type**: Baseline Scan  
**Purpose**: Identify common web vulnerabilities (OWASP Top 10)

---

## What is ZAP Baseline Scan?

The ZAP Baseline Scan is a quick, automated security test that:
- Performs passive scanning (non-intrusive)
- Identifies common vulnerabilities
- Does NOT perform active attacks
- Safe to run against production environments
- Typically completes in 2-5 minutes

### Vulnerabilities Detected

The baseline scan checks for:

1. **Missing Security Headers**
   - X-Frame-Options
   - X-Content-Type-Options
   - Content-Security-Policy
   - Strict-Transport-Security

2. **Information Disclosure**
   - Server version leakage
   - Debug error messages
   - Sensitive comments in HTML
   - Stack traces

3. **Cookie Security Issues**
   - Missing HttpOnly flag
   - Missing Secure flag
   - Missing SameSite attribute

4. **SSL/TLS Issues**
   - Weak cipher suites
   - Certificate problems
   - Mixed content (HTTP + HTTPS)

5. **Cross-Site Scripting (XSS) Potential**
   - User controllable JavaScript
   - Reflected parameters

6. **Injection Vulnerabilities**
   - SQL injection indicators
   - Command injection potential

---

## Running ZAP Baseline Scan

### Using Docker (Recommended)

```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://testphp.vulnweb.com \
  -r zap-report.html
```

### Using npm script

```bash
npm run zap:scan
```

### Command Breakdown

- `--rm`: Remove container after scan
- `-v $(pwd):/zap/wrk:rw`: Mount current directory
- `-t`: Target URL
- `-r`: Report filename
- `-c`: Configuration file (optional)

---

## Understanding ZAP Report

### Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| **High** | Critical vulnerabilities requiring immediate attention | Fix immediately |
| **Medium** | Moderate risk issues | Fix in current sprint |
| **Low** | Minor issues or informational | Fix when possible |
| **Informational** | Non-security observations | Review and document |

### Example Findings

#### 1. Missing X-Frame-Options Header
**Risk**: Medium  
**Description**: Page can be embedded in iframe, potential clickjacking  
**Solution**: Add header `X-Frame-Options: DENY` or `SAMEORIGIN`

#### 2. Cookie Without HttpOnly Flag
**Risk**: Medium  
**Description**: Cookies accessible via JavaScript, XSS risk  
**Solution**: Set `HttpOnly` flag on all session cookies

#### 3. Server Leaks Version Information
**Risk**: Low  
**Description**: Server header reveals software version  
**Solution**: Remove or obscure `Server` header

#### 4. Content Security Policy Not Set
**Risk**: Medium  
**Description**: No CSP header to prevent XSS attacks  
**Solution**: Implement Content-Security-Policy header

---

## Common Issues with testphp.vulnweb.com

This is an intentionally vulnerable application for testing. Expected findings:

### High Risk
- SQL Injection vulnerabilities
- Cross-Site Scripting (XSS)
- File inclusion vulnerabilities

### Medium Risk
- Missing security headers
- Insecure cookie flags
- Information disclosure

### Low Risk
- Server version disclosure
- Directory browsing enabled
- Autocomplete on sensitive fields

---

## Triaging ZAP Findings

### Step 1: Filter False Positives
- Review each finding context
- Verify if it's truly exploitable
- Check if compensating controls exist

### Step 2: Prioritize by Risk
1. **High**: Exploitable vulnerabilities (SQL injection, XSS)
2. **Medium**: Missing security controls (headers, flags)
3. **Low**: Information leaks, configuration issues

### Step 3: Create Remediation Plan
- Document each confirmed vulnerability
- Assign to development team
- Set fix timeline based on severity
- Plan for re-testing

---

## Integration with CI/CD

### GitHub Actions Integration

The ZAP scan runs automatically in CI pipeline:

```yaml
zap-scan:
  runs-on: ubuntu-latest
  steps:
    - name: Run ZAP Baseline Scan
      run: |
        docker run --rm -v $(pwd):/zap/wrk:rw \
          -t owasp/zap2docker-stable \
          zap-baseline.py \
          -t https://testphp.vulnweb.com \
          -r zap-report.html
    
    - name: Upload ZAP Report
      uses: actions/upload-artifact@v3
      with:
        name: zap-security-report
        path: zap-report.html
```

### Fail Conditions

Configure scan to fail CI based on findings:

```bash
# Fail on HIGH findings only
-z "-i HIGH"

# Fail on HIGH and MEDIUM
-z "-i HIGH,MEDIUM"

# Generate report but never fail
-I
```

---

## Advanced ZAP Usage

### Active Scan (Intrusive)

⚠️ **WARNING**: Only run against test environments

```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-full-scan.py \
  -t https://testphp.vulnweb.com \
  -r zap-full-report.html
```

### API Scan

For REST API security testing:

```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -r zap-api-report.html
```

### Authentication

For authenticated scans, create context file:

```bash
# Create context with authentication
docker run --rm -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://example.com \
  -n context.context \
  -U admin \
  -r zap-report.html
```

---

## Best Practices

### 1. Regular Scanning
- Run baseline scan on every deployment
- Weekly active scans on test environments
- Monthly full scans with manual verification

### 2. Trend Analysis
- Track findings over time
- Monitor remediation progress
- Identify recurring issues

### 3. Developer Training
- Share findings with development team
- Conduct secure coding workshops
- Integrate security early (shift-left)

### 4. Documentation
- Document all confirmed vulnerabilities
- Track remediation efforts
- Maintain security testing runbook

---

## Resources

- **OWASP ZAP**: https://www.zaproxy.org/
- **ZAP Docker**: https://github.com/zaproxy/zaproxy/wiki/Docker
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **ZAP Baseline Docs**: https://www.zaproxy.org/docs/docker/baseline-scan/

---

## Troubleshooting

### Issue: Docker permission denied
**Solution**: Ensure Docker has write access to current directory

### Issue: Scan times out
**Solution**: Increase MAX_DURATION in zap-baseline.conf

### Issue: Too many false positives
**Solution**: Add alert IDs to IGNORE_ALERTS in configuration

### Issue: Report not generated
**Solution**: Check Docker volume mount and file permissions

---

## Sample Findings Summary

For testphp.vulnweb.com, you should expect:

| Severity | Typical Count | Examples |
|----------|---------------|----------|
| High | 5-10 | SQL Injection, XSS |
| Medium | 10-15 | Missing headers, cookie flags |
| Low | 15-25 | Info disclosure, autocomplete |
| Info | 20-30 | Server headers, timestamps |

**Total Alerts**: ~50-80 findings expected

---

**Last Updated**: November 16, 2025  
**ZAP Version**: Latest stable Docker image
