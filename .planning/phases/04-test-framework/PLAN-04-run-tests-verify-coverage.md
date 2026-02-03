---
wave: 3
phase: 04-test-framework
task: 04-04
depends_on:
  - "04-02"
  - "04-03"
files_modified:
  - "backend/.coverage"
  - "backend/coverage_report/"
autonomous: true
---

# PLAN-04: 运行测试并验证覆盖率

## 目标
运行所有单元测试，验证测试覆盖率是否达到 30% 目标，并生成覆盖率报告。

## 背景
测试覆盖率是衡量测试质量的重要指标。v1.1 里程碑要求：
- 核心模型测试覆盖率 > 30%
- 视图集测试覆盖率 > 30%

## 范围
- 运行 `pytest` 执行所有测试
- 生成 `coverage` 报告
- 分析覆盖率差距
- 验证所有测试通过

## 前置条件
- PLAN-02 完成（模型单元测试已编写）
- PLAN-03 完成（视图集单元测试已编写）
- pytest-cov 已安装

## must_haves
```yaml
must_haves:
  truths:
    - "All tests pass with pytest"
    - "Test coverage > 30% for workorder module"
    - "Coverage report generated and analyzed"
  artifacts:
    - path: "backend/.coverage"
      provides: "Coverage data file"
    - path: "backend/coverage_report/"
      provides: "HTML coverage report directory"
```

## 任务列表

<task type="auto">
  <name>运行 pytest 执行所有测试</name>
  <files>backend/</files>
  <action>Run pytest with coverage to execute all tests:
    pytest workorder/tests/ -v --tb=short --cov=workorder --cov-report=term-missing</action>
  <verify>pytest workorder/tests/ -v 2>&1 | tail -30</verify>
  <done>All tests executed with pytest</done>
</task>

<task type="auto">
  <name>生成覆盖率报告</name>
  <files>backend/</files>
  <action>Generate HTML coverage report:
    pytest workorder/tests/ --cov=workorder --cov-report=html -q</action>
  <verify>ls -la backend/htmlcov/ 2>/dev/null || echo "Report generated"</verify>
  <done>HTML coverage report generated</done>
</task>

<task type="auto">
  <name>分析覆盖率按模块</name>
  <files>backend/</files>
  <action>Run coverage analysis by module to identify coverage gaps:
    pytest workorder/tests/ --cov=workorder --cov-report=term-missing -v 2>&1 | grep -A5 "workorder"</action>
  <verify>pytest workorder/tests/ --cov=workorder --cov-report=term 2>&1 | tail -40</verify>
  <done>Coverage analysis by module completed</done>
</task>

<task type="auto">
  <name>验证覆盖率目标</name>
  <files>backend/</files>
  <action>Check if coverage meets the 30% target:
    - Overall coverage >= 30%
    - Core models coverage >= 30%
    - Views coverage >= 30%
    
    If coverage < 30%, identify gaps and add more tests.</action>
  <verify>echo "Coverage Summary:" && pytest workorder/tests/ --cov=workorder -q 2>&1 | grep -E "(TOTAL|covered|%)"</verify>
  <done>Coverage target verified (>= 30%)</done>
</task>

<task type="auto">
  <name>验证所有测试通过</name>
  <files>backend/</files>
  <action>Verify all tests pass (no failures, no errors):
    pytest workorder/tests/ -v --tb=short 2>&1 | grep -E "(passed|failed|error)" | tail -5</action>
  <verify>pytest workorder/tests/ -v 2>&1 | grep -E "passed|failed|error" | tail -3</verify>
  <done>All tests pass (0 failures, 0 errors)</done>
</task>

<task type="auto">
  <name>生成测试总结报告</name>
  <files>backend/</files>
  <action>Generate a summary of test results:
    - Total tests run
    - Tests passed/failed
    - Coverage by module
    - Top uncovered files/functions
    
    Save to TEST_SUMMARY.md for documentation.</action>
  <verify>cat backend/TEST_SUMMARY.md 2>/dev/null | head -30</verify>
  <done>Test summary report generated</done>
</task>

## 验证标准
1. 所有测试通过 (0 failures, 0 errors)
2. 总体覆盖率 >= 30%
3. 核心模型测试覆盖率 >= 30%
4. 视图集测试覆盖率 >= 30%
5. 覆盖率报告已生成 (HTML 格式)

## 覆盖率目标
| 模块 | 目标覆盖率 | 实际覆盖率 |
|------|-----------|-----------|
| workorder/models/core.py | 30% | - |
| workorder/models/base.py | 30% | - |
| workorder/views/work_orders.py | 30% | - |
| workorder/views/work_order_tasks.py | 30% | - |
| **Total** | **30%** | - |

## 覆盖率差距分析
如果覆盖率 < 30%，需要：
1. 识别覆盖率最低的模块
2. 添加更多边界条件测试
3. 测试更多异常路径

## 后续步骤
- Phase 4 完成
- 进入 Phase 5 或下一阶段

## 备注
- 使用 `--cov-report=term-missing` 显示未覆盖的行
- 使用 `--tb=short` 显示简短的错误 traceback
- 覆盖率是指标而非目标，重点是测试关键业务逻辑
- 持续集成中应自动运行测试并检查覆盖率
