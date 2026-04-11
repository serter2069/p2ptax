---
name: test
agent: CodeActAgent
triggers:
- test
- dotest
- qa
---

# Dotest — Automated Scenario Testing

Fetch the actual instructions from proto-viewer Commands Registry and execute them:

```bash
curl -s https://proto.smartlaunchhub.com/api/commands/dotest
```

The response contains a `content` field — execute it as your full task instructions.

