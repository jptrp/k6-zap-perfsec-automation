# ZAP Security Test Configuration

This directory contains configuration files and scripts for OWASP ZAP security testing.

## Configuration Files

You can add custom ZAP configuration files here:

- `zap-context.xml` - Custom context configuration
- `zap-policy.xml` - Custom scanning policy
- `zap-rules.conf` - Custom rule configurations

## Running ZAP with Custom Config

```bash
docker run -v $(pwd):/zap/wrk/:rw -t zaproxy/zap-stable \
  zap-baseline.py \
  -t https://example.com \
  -c zap-context.xml \
  -r zap-report.html
```

## Common ZAP Options

- `-t` - Target URL
- `-r` - Report filename
- `-c` - Context file
- `-n` - Context name
- `-j` - Use AJAX spider
- `-m` - Minutes to spider
