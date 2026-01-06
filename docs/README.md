# 文档目录

本目录包含项目的所有技术文档和分析文档。

## 文档分类

### 系统分析文档
- `CURRENT_WORKORDER_LOGIC_ANALYSIS.md` - 当前施工单逻辑分析
- `WORKORDER_LOGIC_REDESIGN_ANALYSIS.md` - 施工单逻辑重构分析
- `WORKORDER_PROCESS_LOGIC_ANALYSIS.md` - 施工单工序逻辑分析
- `WORKORDER_FORM_LOGIC_ANALYSIS.md` - 施工单表单逻辑分析

### 任务管理文档
- `TASK_MANAGEMENT_ANALYSIS.md` - 任务管理分析
- `TASK_GENERATION_RULES_ANALYSIS.md` - 任务生成规则分析
- `TASK_COMPLETION_LOGIC_ANALYSIS.md` - 任务完成逻辑分析
- `TASK_COMPLETION_LOGIC_REVIEW.md` - 任务完成逻辑重新分析
- `TASK_COMPLETION_FIXES.md` - 任务完成逻辑修复说明

### 工序管理文档
- `PROCESS_TASK_MODULE_ANALYSIS.md` - 工序和任务模块分析
- `PROCESS_MODEL_FIELDS.md` - 工序模型字段说明
- `PROCESS_BUILTIN_FEATURE.md` - 工序内置功能说明
- `PROCESS_RESET_GUIDE.md` - 工序重置指南
- `PROCESS_DATA_COMPARISON.md` - 工序数据对比
- `PLATE_MAKING_PROCESS_LOGIC_ANALYSIS.md` - 制版工序逻辑分析

### 业务逻辑文档
- `PURCHASE_PROCESS_REMOVAL.md` - 采购工序移除说明

### 代码分析文档
- `REDUNDANT_CODE_ANALYSIS.md` - 冗余代码分析

### 数据初始化文档
- `DATA_INITIALIZATION_ANALYSIS.md` - 数据初始化分析

### 权限管理文档
- `PERMISSIONS.md` - 权限说明
- `PERMISSIONS_BEST_PRACTICES.md` - 权限最佳实践
- `USER_ROLE_GUIDE.md` - 用户角色指南

### 部署和配置文档
- `DEPLOYMENT.md` - 部署指南
- `QUICKSTART.md` - 快速开始指南
- `LOGIN_INFO.md` - 登录信息说明

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

### 文档维护
- 新增文档应放在本目录下
- 文档更新后应及时更新本 README
- 过时的文档应标记为已废弃或删除

## 注意事项

- **所有新生成的文档都应放在 `docs/` 目录下**
- 只有 `README.md` 保留在项目根目录
- 文档应保持更新，反映当前系统状态

