---
wave: 1
depends_on: []
files_modified:
  - backend/test_performance.py
  - backend/test_monitoring.py
  - backend/simple_monitoring_test.py
  - backend/workorder/tests/test_api.py
  - backend/workorder/tests/test_permissions.py
autonomous: true
---

<plan>
  <goal>Clean all print() statements from backend test files and replace with proper logging or remove entirely</goal>

  <task type="auto">
    <name>Clean print() statements from test_performance.py</name>
    <files>backend/test_performance.py</files>
    <action>Remove or comment out all print() statements in test_performance.py. These are test output statements that should not be in production code. Keep the test logic intact but remove all debugging output.</action>
    <verify>grep -c "print(" backend/test_performance.py</verify>
    <done>0 print() statements in test_performance.py</done>
  </task>

  <task type="auto">
    <name>Clean print() statements from test_monitoring.py</name>
    <files>backend/test_monitoring.py</files>
    <action>Remove or comment out all print() statements in test_monitoring.py. These are test output statements that should not be in production code.</action>
    <verify>grep -c "print(" backend/test_monitoring.py</verify>
    <done>0 print() statements in test_monitoring.py</done>
  </task>

  <task type="auto">
    <name>Clean print() statements from simple_monitoring_test.py</name>
    <files>backend/simple_monitoring_test.py</files>
    <action>Remove or comment out all print() statements in simple_monitoring_test.py. These are test output statements that should not be in production code.</action>
    <verify>grep -c "print(" backend/simple_monitoring_test.py</verify>
    <done>0 print() statements in simple_monitoring_test.py</done>
  </task>

  <task type="auto">
    <name>Clean print() statements from workorder/tests/test_api.py</name>
    <files>backend/workorder/tests/test_api.py</files>
    <action>Remove or comment out all print() statements in test_api.py (lines 143-151). These are debugging statements that should be removed.</action>
    <verify>grep -c "print(" backend/workorder/tests/test_api.py</verify>
    <done>0 print() statements in test_api.py</done>
  </task>

  <task type="auto">
    <name>Clean print() statements from workorder/tests/test_permissions.py</name>
    <files>backend/workorder/tests/test_permissions.py</files>
    <action>Remove or comment out all print() statements in test_permissions.py (lines 287-288). These are debugging statements that should be removed.</action>
    <verify>grep -c "print(" backend/workorder/tests/test_permissions.py</verify>
    <done>0 print() statements in test_permissions.py</done>
  </task>

  <task type="auto">
    <name>Verify no print() statements remain in test files</name>
    <files>backend/test_*.py, backend/workorder/tests/*.py</files>
    <action>Run final verification to ensure no print() statements remain in any test files. Count should be 0.</action>
    <verify>grep -r "print(" backend/test_*.py backend/workorder/tests/ 2>/dev/null | wc -l</verify>
    <done>0 print() statements across all test files</done>
  </task>
</plan>

<verification>
  <criteria>
    - All print() statements removed from backend/test_*.py files
    - All print() statements removed from backend/workorder/tests/*.py files
    - Test logic remains intact and functional
    - Backend tests still pass after cleanup
  </criteria>
</verification>

<must_haves>
  truths:
    - "No print() statements in backend test files"
    - "Test functionality remains unchanged"
    - "Backend tests pass after cleanup"
  artifacts:
    - path: "backend/test_performance.py"
      provides: "Clean performance test file"
    - path: "backend/workorder/tests/test_api.py"
      provides: "Clean API test file without debugging output"
    - path: "backend/workorder/tests/test_permissions.py"
      provides: "Clean permissions test file without debugging output"
</must_haves>
