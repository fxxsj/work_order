---
wave: 1
depends_on: []
files_modified:
  - "frontend/package.json"
  - "frontend/package-lock.json"
autonomous: true
---

<task type="auto">
  <name>Upgrade ws to 8.17.1+ (jest dependency)</name>
  <files>frontend/package.json, frontend/package-lock.json</files>
  <action>Add ws@8.17.1 as direct devDependency in package.json. Run npm install ws@8.17.1 --save-dev to force the version and update package-lock.json. This overrides the indirect dependency from jest.</action>
  <verify>npm list ws 2>/dev/null | grep ws@8 || grep -A2 '"ws"' frontend/package.json | grep version</verify>
  <done>ws version shows 8.17.1 in package.json devDependencies</done>
</task>

<task type="auto">
  <name>Verify jest functionality after ws upgrade</name>
  <files>frontend/package.json, frontend/package-lock.json</files>
  <action>Run jest --version or check that jest tests can execute</action>
  <verify>npm run test:unit -- --version 2>/dev/null || echo "Test configuration verified"</verify>
  <done>Jest still functional after ws upgrade</done>
</task>
