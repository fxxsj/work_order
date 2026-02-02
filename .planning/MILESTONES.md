# Milestones

## v1.1 代码质量与安全加固 🚧 In Progress

**Goal:** 修复安全漏洞，优化代码结构，提升代码质量和可维护性

**Started:** 2026-02-02

**Based on:** Code Quality Review (2026-02-02)

**Phases:**
1. Security Hardening - 修复依赖安全漏洞 (3 plans)
2. Frontend Refactor - 拆分大文件，提取常量 (4 plans)
3. Code Cleanup - 清理调试信息，修复内存泄漏 (3 plans)
4. Test Framework - 建立后端单元测试框架 (4 plans)

**Requirements:**
- SEC-01: 升级 axios 到 1.7.4+
- SEC-02: 升级 ws 到 8.17.1+
- CODE-01: 拆分 Detail.vue (3508行)
- CODE-02: 拆分 WorkOrderForm.vue (1472行)
- CODE-03: 创建 src/constants/ 目录
- CODE-04: 清理后端 print() 语句
- TEST-01: 创建后端测试框架
- TEST-02: 补充核心模型测试
- CLEAN-01: 清理前端 TODO 注释
- CLEAN-02: 修复事件监听器内存泄漏

---

## v1.0 MVP ✅ COMPLETED

**Goal:** 施工单创建时即时生成并分派任务

**Completed:** 2026-02-02

**Phases (10):**
1. Draft Task Foundation - 草稿任务基础
2. Task Data Consistency - 任务数据一致性
3. Dispatch Configuration - 分派配置
4. Task Assignment Core - 任务分配核心
5. Universal Task Visibility - 通用任务可见性
6. Work Order Task Integration - 施工单任务集成
7. Role-Based Task Centers - 角色专属界面
8. Real-time Notifications - 实时通知
9. Performance Optimization - 性能优化
10. Production Hardening - 生产环境加固

**Total:** 32 plans, all complete

---

## v0.x Legacy (Before GSD)

| Version | Date | Description |
|---------|------|-------------|
| v3.0.0 | 2026-01-20 | API 完全模块化 |
| v2.0.0 | 2026-01-07 | 任务管理系统上线 |
| v1.0.0 | 2024-12-29 | 初始版本发布 |

---

*Last updated: 2026-02-02*
