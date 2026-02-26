# 前端代码规范修复计划

> 版本：v1.0.3  
> 更新时间：2026-02-26

## 概述

基于 `FRONTEND_CODE_ANALYSIS.md` 分析结果，制定本修复计划。

---

## 阶段一：清理废弃文件 ✅ 已完成

### 1.1 删除废弃 API 文件

| 文件 | 操作 | 状态 |
|------|------|------|
| `src/api/auth.js` | 删除 | ✅ |
| `src/api/user.js` | 删除 | ✅ |
| `src/config/index.js.template` | 删除 | ✅ |

### 1.2 引用迁移

| 文件 | 修改 |
|------|------|
| `api/modules/auth.js` | 添加 getUserList 兼容函数 |
| `views/workorder/Detail.vue` | 迁移到 authAPI（文件已删除） |
| `views/task/TaskList.vue` | 迁移到 authAPI |
| `views/task/components/BatchAssignDialog.vue` | 迁移到 authAPI |
| `router/index.js` | 迁移到 authAPI |
| `store/modules/user.js` | 迁移到 authAPI |

**提交记录**：
- `4fd1dac` - 阶段一清理废弃文件，迁移 API 引用
- `f8ef3de` - 修复 router 和 store 对废弃 API 的引用

**状态**：✅ 完成

---

## 阶段二：处理重复组件 ✅ 已完成

### 2.1 施工单详情页重构

**问题**：
- `Detail.vue` (3508行) - 已删除
- `WorkOrderDetail.vue` (3508行) - 当前使用中

**执行的操作**：
1. 复制 Detail.vue 内容到 WorkOrderDetail.vue
2. 更新路由指向 WorkOrderDetail.vue
3. 删除旧的 Detail.vue

**提交记录**：
- `d74af4f` - 用 Detail.vue 内容替换 WorkOrderDetail.vue
- `a3779cb` - 删除旧的 Detail.vue (3508行)，使用 WorkOrderDetail.vue

**结果**：
- 减少一个 3508 行的超大文件
- 使用统一的组件名称

**状态**：✅ 完成

---

## 阶段三：Console 语句清理 ⏳ 进行中

### 3.1 统一错误处理

**目标文件**：
- `utils/logger.js` - 保留作为调试工具
- 其他文件的 console 语句逐步移除

### 3.2 清理策略

| 文件 | 当前数量 | 建议 |
|------|---------|------|
| `views/workorder/WorkOrderDetail.vue` | 多处 | 优先清理 |
| `views/Dashboard.vue` | 多处 | 使用 ErrorHandler |
| `composables/useWebSocket.js` | 多处 | 保留连接日志，清理其他 |
| `components/NotificationCenter.vue` | 多处 | 使用 ErrorHandler |
| `store/index.js` | 多处 | 缩减 info/log，统一错误处理 |
| 其他 | 分散 | 按需清理 |

**建议**：
- 生产环境完全移除 console
- 开发环境保留必要的日志
- 使用统一的 `ErrorHandler` 进行错误处理

**状态**：⏳ 进行中

### 3.3 已完成清理

- `views/workorder/WorkOrderDetail.vue`：移除 `console.error`，改为 `ErrorHandler.handle`
- `views/Dashboard.vue`：移除 `console.error`，改为 `ErrorHandler.handle`
- `components/NotificationCenter.vue`：移除 `console.error`，改为 `ErrorHandler.handle`

### 3.4 下一步建议（优先级）

1. 先清理 `WorkOrderDetail.vue`、`Dashboard.vue`、`NotificationCenter.vue` 的 `console.error`，全部迁移到 `utils/errorHandler.js`
2. WebSocket 相关日志仅保留连接/重连关键路径，并通过环境变量开关控制
3. API / Service / Store 层统一通过 `errorHandler` + `logger`，减少直接 `console.*`

---

## 阶段四：完善文档 ⏳ 待执行

### 4.1 更新 DEVELOPER_GUIDE.md

添加以下内容：
- 废弃文件说明
- Console 语句规范
- 组件拆分指南

**状态**：⏳ 待执行

---

## 执行顺序

```
阶段一 ✅ 已完成
    ↓
阶段二 ✅ 已完成
    ↓
阶段三 ⏳ 进行中
    ↓
阶段四 ⏳ 待执行
```

---

## 风险评估

| 阶段 | 状态 |
|------|------|
| 阶段一 | ✅ 已完成 |
| 阶段二 | ✅ 已完成（简化方案：删除重复文件） |
| 阶段三 | ⏳ 进行中 |
| 阶段四 | ⏳ 待执行 |

---

## 预计工作量

| 阶段 | 预估时间 | 状态 |
|------|---------|------|
| 阶段一 | 10分钟 | ✅ 已完成 |
| 阶段二 | 30分钟 | ✅ 已完成 |
| 阶段三 | 1-2小时 | ⏳ 进行中 |
| 阶段四 | 30分钟 | ⏳ 待执行 |

---

## 验收标准

1. ✅ 无废弃 API 文件
2. ✅ 施工单详情页正常显示和使用（减少超大文件）
3. ⏳ Console 语句数量减少 80% 以上
4. ⏳ 文档更新完成
5. ⏳ 所有功能测试通过
