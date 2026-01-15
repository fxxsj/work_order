# 文档目录

本目录包含项目的所有技术文档和分析文档。

> **最后更新：** 2026-01-15
> **更新事项：** 整理过时文档，精简文档体系（共移除17个过时文档）

## 📊 文档分类导航

### 📚 快速入门（必读）

- **[QUICKSTART.md](QUICKSTART.md)** - 快速开始指南，详细的安装和配置步骤
- **[LOGIN_INFO.md](LOGIN_INFO.md)** - 测试账号信息和登录说明
- **[DATA_INITIALIZATION_ANALYSIS.md](DATA_INITIALIZATION_ANALYSIS.md)** - 数据初始化详细说明（所有预设数据）

### 🔧 开发参考

- **[SERVICE_LAYER_QUICK_REFERENCE.md](SERVICE_LAYER_QUICK_REFERENCE.md)** - Service 层快速参考
- **[FIXTURES.md](FIXTURES.md)** - Fixtures 文件使用指南
- **[DATA_SOURCE_CONSOLIDATION.md](DATA_SOURCE_CONSOLIDATION.md)** - 数据源统一说明

### 📋 核心业务流程（高优先级）

- **[SYSTEM_USAGE_ANALYSIS.md](SYSTEM_USAGE_ANALYSIS.md)** ⭐ - **系统使用流程分析与优化建议**（最新完整分析）
- **[PHASE1_IMPLEMENTATION_SUMMARY.md](PHASE1_IMPLEMENTATION_SUMMARY.md)** ⭐ - **第一阶段核心功能完善总结**（实施状态）
- **[P1_OPTIMIZATION_SUMMARY.md](P1_OPTIMIZATION_SUMMARY.md)** ⭐ - **P1优化任务总结**（性能优化完成）
- **[DASHBOARD_OPTIMIZATION_SUMMARY.md](DASHBOARD_OPTIMIZATION_SUMMARY.md)** ⭐ - 工作台页面优化完整文档
- **[CURRENT_WORKORDER_LOGIC_ANALYSIS.md](CURRENT_WORKORDER_LOGIC_ANALYSIS.md)** - 当前施工单逻辑分析

### 🏢 业务流程详解（中优先级）

- **[WORKORDER_BUSINESS_FLOW_ANALYSIS.md](WORKORDER_BUSINESS_FLOW_ANALYSIS.md)** - 施工单业务流程全面分析
- **[WORKORDER_FLOW_ANALYSIS.md](WORKORDER_FLOW_ANALYSIS.md)** - 施工单完整流程逻辑分析
- **[WORKORDER_APPROVAL_ANALYSIS.md](WORKORDER_APPROVAL_ANALYSIS.md)** - 施工单审核流程分析
- **[APPROVED_ORDER_EDIT_ANALYSIS.md](APPROVED_ORDER_EDIT_ANALYSIS.md)** - 已审核订单编辑权限分析

### 🎯 任务管理（中优先级）

- **[TASK_MANAGEMENT_CURRENT_STATUS.md](TASK_MANAGEMENT_CURRENT_STATUS.md)** - 任务管理系统状态与说明
- **[TASK_ASSIGNMENT_LOGIC.md](TASK_ASSIGNMENT_LOGIC.md)** - 任务自动分派逻辑
- **[URGENT_ITEMS_LOGIC_ANALYSIS.md](URGENT_ITEMS_LOGIC_ANALYSIS.md)** - 紧急事项提醒功能说明

### ⚙️ 工序管理（参考）

- **[PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md](PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md)** - 工序逻辑全面分析（整合文档）
- **[PROCESS_MODEL_FIELDS.md](PROCESS_MODEL_FIELDS.md)** - Process 模型字段详细说明
- **[PROCESS_BUILTIN_FEATURE.md](PROCESS_BUILTIN_FEATURE.md)** - 工序内置功能说明
- **[PROCESS_OPTIMIZATION_SUMMARY.md](PROCESS_OPTIMIZATION_SUMMARY.md)** - 工序匹配逻辑优化
- **[PROCESS_ASSOCIATION_ANALYSIS.md](PROCESS_ASSOCIATION_ANALYSIS.md)** - 工序关联模块分析
- **[PLATE_SELECTION_DESIGN_TASK_ANALYSIS.md](PLATE_SELECTION_DESIGN_TASK_ANALYSIS.md)** - 版选择与设计任务生成逻辑

### 🏢 采购与组织（参考）

- **[PURCHASE_MANAGEMENT_MODULE.md](PURCHASE_MANAGEMENT_MODULE.md)** - 采购管理模块详细说明
- **[PURCHASE_MANAGEMENT_IMPLEMENTATION_SUMMARY.md](PURCHASE_MANAGEMENT_IMPLEMENTATION_SUMMARY.md)** - 采购管理实施总结
- **[DEPARTMENT_ORGANIZATION_ANALYSIS.md](DEPARTMENT_ORGANIZATION_ANALYSIS.md)** - 部门组织结构分析

### 🔐 权限与审核

- **[PERMISSIONS.md](PERMISSIONS.md)** - 权限系统说明
- **[PERMISSIONS_BEST_PRACTICES.md](PERMISSIONS_BEST_PRACTICES.md)** - 权限最佳实践
- **[USER_ROLE_GUIDE.md](USER_ROLE_GUIDE.md)** - 用户角色指南

### 🚀 部署运维

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 生产环境部署指南

### 📜 历史参考（归档）

- **[PURCHASE_PROCESS_REMOVAL.md](PURCHASE_PROCESS_REMOVAL.md)** ⚠️ - 采购工序移除说明（历史文档）
- **[DESIGN_PROCESS_REMOVAL.md](DESIGN_PROCESS_REMOVAL.md)** ⚠️ - 设计工序移除说明（历史文档）
- **[REDUNDANT_CODE_ANALYSIS.md](REDUNDANT_CODE_ANALYSIS.md)** ⚠️ - 冗余代码分析（需检查）

### 📝 维护日志

- **[DOCUMENTATION_UPDATE_LOG.md](DOCUMENTATION_UPDATE_LOG.md)** - 文档更新历史
- **[CLAUDE_CODE_SETUP.md](CLAUDE_CODE_SETUP.md)** - Claude Code 设置指南

---

## 文档标识说明

| 标识 | 说明 |
|------|------|
| ⭐ | **核心文档**：重要且常用，建议优先阅读 |
| 💚 | **完成** ：功能已完全实现 |
| 🟡 | **进行中** ：功能正在开发中 |
| ⚠️ | **历史/待检查** ：历史参考或需要验证的文档 |


## 文档规范

### 文档命名规范
- 使用大写字母和下划线：`DOCUMENT_NAME.md`
- 使用描述性名称，清晰表达文档内容
- 相关文档使用统一前缀，如 `TASK_*`、`PROCESS_*`、`WORKORDER_*`

### 文档结构规范
- 每个文档应包含清晰的标题和目录（如果内容较长）
- 使用标准的 Markdown 格式
- 代码示例应包含语言标识
- 重要信息使用适当的格式（加粗、列表等）
- 文档应包含最后更新时间

### 文档维护

- 新增文档应放在本目录下
- 文档更新后应及时更新本 README
- 过时的文档应标记为已废弃或删除
- 删除文档时应更新 `DOCUMENTATION_UPDATE_LOG.md`

---

## 快速导航

### 👤 不同角色快速入门

**新手开发人员**:
1. [QUICKSTART.md](QUICKSTART.md) - 环境配置
2. [LOGIN_INFO.md](LOGIN_INFO.md) - 测试账号
3. [DATA_INITIALIZATION_ANALYSIS.md](DATA_INITIALIZATION_ANALYSIS.md) - 数据说明
4. [SERVICE_LAYER_QUICK_REFERENCE.md](SERVICE_LAYER_QUICK_REFERENCE.md) - Service 层使用

**前端开发人员**:
1. [SYSTEM_USAGE_ANALYSIS.md](SYSTEM_USAGE_ANALYSIS.md) - 系统流程
2. [DASHBOARD_OPTIMIZATION_SUMMARY.md](DASHBOARD_OPTIMIZATION_SUMMARY.md) - 工作台优化
3. [PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md](PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md) - 工序逻辑

**后端开发人员**:
1. [SYSTEM_USAGE_ANALYSIS.md](SYSTEM_USAGE_ANALYSIS.md) - 系统流程
2. [WORKORDER_BUSINESS_FLOW_ANALYSIS.md](WORKORDER_BUSINESS_FLOW_ANALYSIS.md) - 业务流程
3. [PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md](PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md) - 工序实现
4. [PERMISSIONS.md](PERMISSIONS.md) - 权限控制

**系统维护人员**:
1. [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
2. [SYSTEM_USAGE_ANALYSIS.md](SYSTEM_USAGE_ANALYSIS.md) - 系统功能
3. [PERMISSIONS_BEST_PRACTICES.md](PERMISSIONS_BEST_PRACTICES.md) - 权限最佳实践

---

## 文档更新历史

### 2026-01-15 文档整理

✅ **执行的优化**：

1. **移除17个过时文档**：
   - 优化相关（5个）：OPTIMIZATION_GUIDE、OPTIMIZATION_OVERVIEW、OPTIMIZATION_PROGRESS_REPORT、OPTIMIZATION_SUMMARY、OPTIMIZATION_PHASE0_SUMMARY
   - 修复总结（4个）：MODULE_IMPORT_FIX_SUMMARY、ESLINT_FIX_SUMMARY、RUNTIME_ERROR_FIX_SUMMARY、CODE_ANALYSIS_REPORT
   - 已完成的重构（3个）：FRONTEND_REFACTORING、FILE_SPLITTING_GUIDE、STORE_API_MIGRATION_SUMMARY
   - 其他过时文件（5个）：NEXT_STEPS_OPTIMIZATION、APPROVAL_VALIDATION_ENHANCEMENT、IMPLEMENTATION_SUMMARY_APPROVAL_VALIDATION、WORKORDER_DETAIL_REFACTORING_PLAN、WORKORDER_FLOW_ANALYSIS_UPDATE_SUMMARY

2. **更新 README.md**：
   - 重新组织文档分类（按优先级和用途）
   - 移除已删除文档的链接
   - 添加快速导航（按角色分类）
   - 精简文档结构，保留必要信息

3. **文档现状**：
   - 总计 45 个文档（从 62 个精简）
   - 精简率：27%（减少 17 个重复/过时文件）
   - 保留了所有有效的核心和参考文档

### 2026-01-08 文档维护

#### 文档整理与更新
- ✅ 合并工作台优化文档
- ✅ 更新紧急事项逻辑文档
- ✅ 删除已合并的文档

#### 功能实施
- ✅ 前端性能优化（代码分割、防抖节流、骨架屏）
- ✅ 数据导出功能（Excel 导出）
- ✅ 权限控制细化
- ✅ 批量操作功能
- ✅ 通知提醒机制
- ✅ 工作台优化

---

## 注意事项

- **文档目标**：保持简洁实用，移除冗余内容
- **更新周期**：核心功能完成后及时更新相关文档
- **验证机制**：新增文档需要确认与现有代码一致性
- **历史保留**：业务决策相关的历史文档保留作为参考

---

## 需要后续关注的项目

⚠️ **REDUNDANT_CODE_ANALYSIS.md** - 需要验证冗余代码是否已全部修复

详细更新历史请查看：[DOCUMENTATION_UPDATE_LOG.md](DOCUMENTATION_UPDATE_LOG.md)
