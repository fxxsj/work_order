---
wave: 2
depends_on:
  - "PLAN-01-upgrade-axios.md"
  - "PLAN-02-upgrade-ws.md"
files_modified:
  - "frontend/package.json"
  - "frontend/package-lock.json"
autonomous: true
---

<task type="auto">
  <name>Run npm audit security check</name>
  <files>frontend/package.json, frontend/package-lock.json</files>
  <action>Run npm audit and check for any remaining high/critical vulnerabilities</action>
  <verify>npm audit --audit-level=high 2>&1 | grep -E "(found|0 vulnerabilities)"</verify>
  <done>npm audit shows no high or critical vulnerabilities</done>
</task>

<task type="auto">
  <name>Build frontend to verify no regressions</name>
  <files>frontend/package.json, frontend/package-lock.json</files>
  <action>Run npm run build to ensure all dependencies work together</action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>Frontend builds successfully without errors</done>
</task>

<task type="auto">
  <name>Verify frontend serves correctly</name>
  <files>frontend/package.json, frontend/package-lock.json</files>
  <action>Run npm run serve (briefly) or verify build output is valid</action>
  <verify>ls -la frontend/dist/ 2>/dev/null | head -5</verify>
  <done>Build output exists and is ready for deployment</done>
</task>
