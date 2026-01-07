# 文档目录

本目录包含项目的所有技术文档和分析文档。

> **最后更新：** 2026-01-07

## 文档分类

### 📚 快速入门文档（必读）

- **[QUICKSTART.md](QUICKSTART.md)** - 快速开始指南，包含详细的安装和配置步骤
- **[LOGIN_INFO.md](LOGIN_INFO.md)** - 登录信息说明，包含测试账号信息
- **[DATA_INITIALIZATION_ANALYSIS.md](DATA_INITIALIZATION_ANALYSIS.md)** ⭐ - 数据初始化详细说明，包含所有预设数据

### 🔧 开发文档

- **[FIXTURES_USAGE.md](FIXTURES_USAGE.md)** - Fixtures 文件使用指南
- **[FIXTURES_ANALYSIS.md](FIXTURES_ANALYSIS.md)** - Fixtures 文件分析报告
- **[DATA_SOURCE_CONSOLIDATION.md](DATA_SOURCE_CONSOLIDATION.md)** - 数据源统一说明

### 📋 系统分析文档

- **[CURRENT_WORKORDER_LOGIC_ANALYSIS.md](CURRENT_WORKORDER_LOGIC_ANALYSIS.md)** ⭐ - 当前施工单逻辑分析
- **[WORKORDER_LOGIC_ANALYSIS.md](WORKORDER_LOGIC_ANALYSIS.md)** - 施工单逻辑分析（历史）
- **[WORKORDER_APPROVAL_ANALYSIS.md](WORKORDER_APPROVAL_ANALYSIS.md)** - 施工单审核流程分析
- **[APPROVED_ORDER_EDIT_ANALYSIS.md](APPROVED_ORDER_EDIT_ANALYSIS.md)** - 已审核订单编辑权限分析

### 🎯 任务管理文档

- **[TASK_MANAGEMENT_CURRENT_STATUS.md](TASK_MANAGEMENT_CURRENT_STATUS.md)** ⭐ - 任务管理系统当前状态和详细说明

### ⚙️ 工序管理文档

- **[PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md](PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md)** ⭐ - 工序逻辑全面分析（整合文档）
- **[PROCESS_MODEL_FIELDS.md](PROCESS_MODEL_FIELDS.md)** - Process 模型字段详细说明
- **[PROCESS_BUILTIN_FEATURE.md](PROCESS_BUILTIN_FEATURE.md)** - 工序内置功能说明（is_builtin字段）
- **[PROCESS_OPTIMIZATION_SUMMARY.md](PROCESS_OPTIMIZATION_SUMMARY.md)** - 工序匹配逻辑优化历史记录
- **[PROCESS_ASSOCIATION_ANALYSIS.md](PROCESS_ASSOCIATION_ANALYSIS.md)** - 工序关联模块详细分析
- **[PLATE_SELECTION_DESIGN_TASK_ANALYSIS.md](PLATE_SELECTION_DESIGN_TASK_ANALYSIS.md)** - 版选择与设计任务分析

### 🏢 业务逻辑文档

- **[DEPARTMENT_ORGANIZATION_ANALYSIS.md](DEPARTMENT_ORGANIZATION_ANALYSIS.md)** - 部门组织结构分析
- **[PURCHASE_PROCESS_REMOVAL.md](PURCHASE_PROCESS_REMOVAL.md)** - 采购工序移除说明
- **[DESIGN_PROCESS_REMOVAL.md](DESIGN_PROCESS_REMOVAL.md)** - 设计工序移除说明

### 🔐 权限管理文档

- **[PERMISSIONS.md](PERMISSIONS.md)** - 权限系统说明
- **[PERMISSIONS_BEST_PRACTICES.md](PERMISSIONS_BEST_PRACTICES.md)** - 权限最佳实践
- **[USER_ROLE_GUIDE.md](USER_ROLE_GUIDE.md)** - 用户角色指南

### 🚀 部署文档

- **[DEPLOYMENT.md](DEPLOYMENT.md)** ⭐ - 生产环境部署指南
- **[DOCUMENTATION_UPDATE_LOG.md](DOCUMENTATION_UPDATE_LOG.md)** - 文档更新日志

### 📊 代码分析文档（参考）

- **[REDUNDANT_CODE_ANALYSIS.md](REDUNDANT_CODE_ANALYSIS.md)** - 冗余代码分析

---

## 文档重要性标识

- ⭐ **核心文档**：重要且常用的文档，建议优先阅读
- 📋 **参考文档**：包含详细技术分析，按需查阅
- 📚 **入门文档**：新手上手必读

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

### 新手入门
1. [QUICKSTART.md](QUICKSTART.md) - 快速开始
2. [LOGIN_INFO.md](LOGIN_INFO.md) - 登录信息
3. [DATA_INITIALIZATION_ANALYSIS.md](DATA_INITIALIZATION_ANALYSIS.md) - 数据初始化

### 开发参考
1. [CURRENT_WORKORDER_LOGIC_ANALYSIS.md](CURRENT_WORKORDER_LOGIC_ANALYSIS.md) - 施工单逻辑
2. [PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md](PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md) - 工序逻辑
3. [TASK_MANAGEMENT_CURRENT_STATUS.md](TASK_MANAGEMENT_CURRENT_STATUS.md) - 任务管理

### 部署指南
1. [DEPLOYMENT.md](DEPLOYMENT.md) - 生产部署
2. [PERMISSIONS.md](PERMISSIONS.md) - 权限配置

---

## 文档更新历史

详细更新历史请查看：[DOCUMENTATION_UPDATE_LOG.md](DOCUMENTATION_UPDATE_LOG.md)

### 最近更新（2026-01-07）

- ✅ 更新 `DATA_INITIALIZATION_ANALYSIS.md`：反映新的数据源统一架构
- ✅ 更新项目根目录 `README.md`：完善功能说明和文档链接
- ✅ 新增 `FIXTURES_USAGE.md` 和 `FIXTURES_ANALYSIS.md`：Fixtures 使用说明

---

## 注意事项

- **所有新生成的文档都应放在 `docs/` 目录下**
- 只有项目根目录的 `README.md` 保留在项目根目录
- 文档应保持更新，反映当前系统状态
- 重要变更应及时更新相关文档
