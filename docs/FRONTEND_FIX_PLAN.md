# 前端代码规范修复计划

> 版本：v1.0.0  
> 生成时间：2026-02-25

## 概述

基于 `FRONTEND_CODE_ANALYSIS.md` 分析结果，制定本修复计划。

---

## 阶段一：清理废弃文件（低风险）

### 1.1 删除废弃 API 文件

| 文件 | 操作 |
|------|------|
| `src/api/auth.js` | 删除 |
| `src/api/user.js` | 删除 |
| `src/config/index.js.template` | 删除或加入 .gitignore |

**涉及引用更新**：
- `views/workorder/Detail.vue` - 移除 `import { getUsersByDepartment } from '@/api/auth'`
- `views/task/TaskList.vue` - 移除 `import { getUserList } from '@/api/user'`
- `views/task/components/BatchAssignDialog.vue` - 移除 `import { getUserList } from '@/api/user'`

**状态**：⏳ 待执行

---

## 阶段二：处理重复组件（中风险）

### 2.1 施工单详情页重构

**问题**：
- `Detail.vue` (3508行) - 当前使用中
- `WorkOrderDetail.vue` (735行) - 重构版本，未接入路由

**方案选择**：

| 方案 | 描述 | 工作量 |
|------|------|--------|
| A | 用 WorkOrderDetail.vue 替换 Detail.vue | 中等 |
| B | 拆分 Detail.vue 为多个组件 | 较大 |

**推荐方案 A**：启用 WorkOrderDetail.vue

**步骤**：
1. 更新路由：`src/router/index.js` - 将 `Detail.vue` 改为 `WorkOrderDetail.vue`
2. 检查并补全缺失功能
3. 测试各功能正常
4. 删除 Detail.vue

**状态**：⏳ 待执行

---

## 阶段三：Console 语句清理（中风险）

### 3.1 统一错误处理

**目标文件**：
- `utils/logger.js` - 保留作为调试工具
- 其他文件的 console 语句逐步移除

### 3.2 清理策略

| 文件 | 当前数量 | 建议 |
|------|---------|------|
| `views/workorder/Detail.vue` | ~35处 | 优先清理 |
| `views/Dashboard.vue` | ~10处 | 使用 ErrorHandler |
| `composables/useWebSocket.js` | ~8处 | 保留连接日志，清理其他 |
| 其他 | ~60处 | 按需清理 |

**建议**：
- 生产环境完全移除 console
- 开发环境保留必要的日志
- 使用统一的 `ErrorHandler` 进行错误处理

**状态**：⏳ 待执行

---

## 阶段四：完善文档

### 4.1 更新 DEVELOPER_GUIDE.md

添加以下内容：
- 废弃文件说明
- Console 语句规范
- 组件拆分指南

**状态**：⏳ 待执行

---

## 执行顺序

```
阶段一（清理废弃文件）
    ↓
阶段二（处理重复组件）← 需验证
    ↓
阶段三（Console 清理）
    ↓
阶段四（完善文档）
```

---

## 风险评估

| 阶段 | 风险 | 缓解措施 |
|------|------|---------|
| 阶段一 | 低 | 仅删除废弃文件 |
| 阶段二 | 中 | 先在测试环境验证 |
| 阶段三 | 低 | 逐步清理，每次提交最小化 |
| 阶段四 | 无 | 文档更新 |

---

## 预计工作量

| 阶段 | 预估时间 |
|------|---------|
| 阶段一 | 10分钟 |
| 阶段二 | 2-4小时 |
| 阶段三 | 1-2小时 |
| 阶段四 | 30分钟 |
| **总计** | **4-7小时** |

---

## 验收标准

1. ✅ 无废弃 API 文件
2. ✅ 施工单详情页正常显示和使用
3. ✅ Console 语句数量减少 80% 以上
4. ✅ 文档更新完成
5. ✅ 所有功能测试通过
