# WorkOrderFlowService 实现文档

## 概述

`WorkOrderFlowService` 是施工单业务流程的编排服务，负责协调各个业务服务完成完整的业务流程，确保事务一致性、状态机约束、事件驱动和可追溯性。

## 架构设计

### 服务分层

```
View Layer (Django REST)
    ↓
WorkOrderFlowService (编排层)
    ↓
WorkOrderService | TaskGenerationService | DispatchService (业务服务层)
    ↓
Model Layer (数据层)
```

### 核心原则

1. **事务一致性**：使用 `@transaction.atomic` 确保原子性
2. **状态机约束**：严格的状态转换验证
3. **事件驱动**：状态变更触发业务事件（通知、日志）
4. **可追溯性**：完整的操作日志记录

## 核心流程

### 流程 1: 从销售订单创建施工单

```python
work_order = WorkOrderFlowService.create_from_sales_order(
    sales_order_id=123,
    production_quantity=1000,
    delivery_date=datetime(2026, 3, 15),
    priority="normal",
    notes="备注",
    created_by=request.user,
    additional_data={
        "artwork_ids": [1, 2],
        "die_ids": [3],
    }
)
```

**自动完成**：
- ✅ 验证销售订单状态
- ✅ 生成施工单号
- ✅ 复制客户、产品信息
- ✅ 根据产品配置自动生成工序
- ✅ 根据产品配置自动生成物料清单
- ✅ 生成草稿任务
- ✅ 记录操作日志
- ✅ 发送通知

### 流程 2: 提交审核

```python
work_order = WorkOrderFlowService.submit_for_approval(
    work_order_id=456,
    submitted_by=request.user,
    comment="请审核",
)
```

**自动完成**：
- ✅ 验证施工单状态
- ✅ 验证数据完整性
- ✅ 状态转换：`draft` → `pending_approval`
- ✅ 记录提交日志
- ✅ 发送审核通知给业务员

### 流程 3: 审核通过（自动化）

```python
work_order = WorkOrderFlowService.handle_approval_passed(
    work_order=work_order,
    approved_by=request.user,
    comment="审核通过",
)
```

**自动完成**：
- ✅ 转换草稿任务为正式任务
- ✅ 自动分派任务到部门和操作员
- ✅ 状态转换：`pending_approval` → `approved` → `in_progress`
- ✅ 记录审核日志
- ✅ 发送通知给相关部门和操作员
- ✅ 触发库存预留

### 流程 4: 审核拒绝

```python
work_order = WorkOrderFlowService.handle_approval_rejected(
    work_order=work_order,
    rejected_by=request.user,
    reason="数据不完整",
)
```

**自动完成**：
- ✅ 删除所有草稿任务
- ✅ 状态转换：`pending_approval` → `rejected`
- ✅ 记录拒绝日志
- ✅ 发送通知给创建人

### 流程 5: 检查并完成施工单

```python
is_completed = WorkOrderFlowService.check_and_complete_workorder(
    work_order=work_order
)
```

**自动完成**：
- ✅ 检查所有任务是否完成
- ✅ 状态转换：`in_progress` → `completed`
- ✅ 记录完成时间
- ✅ 发送完成通知

## 状态机

### 状态转换规则

```
draft → pending_approval → approved → in_progress → completed
                    ↓              ↓
                 rejected      cancelled
```

### ALLOWED_STATUS_TRANSITIONS

```python
{
    "draft": ["pending_approval", "cancelled"],
    "pending_approval": ["approved", "rejected", "cancelled"],
    "approved": ["in_progress", "cancelled"],
    "rejected": ["pending_approval", "cancelled"],
    "in_progress": ["paused", "completed", "cancelled"],
    "paused": ["in_progress", "cancelled"],
    "completed": [],  # 终态
    "cancelled": [],  # 终态
}
```

## API 接口

### 创建施工单（从销售订单）

**POST** `/api/workorders/create_from_sales_order/`

请求体：
```json
{
    "sales_order_id": 123,
    "production_quantity": 1000,
    "delivery_date": "2026-03-15",
    "priority": "normal",
    "notes": "备注信息",
    "artwork_ids": [1, 2],
    "die_ids": [3]
}
```

### 提交审核

**POST** `/api/workorders/{id}/submit_approval/`

请求体：
```json
{
    "comment": "提交备注"
}
```

### 审核通过

**POST** `/api/workorders/{id}/approve/`

请求体：
```json
{
    "comment": "审核意见"
}
```

### 审核拒绝

**POST** `/api/workorders/{id}/reject/`

请求体：
```json
{
    "reason": "拒绝原因"
}
```

### 检查完成

**POST** `/api/workorders/{id}/check_completion/`

## 测试

运行测试：
```bash
cd backend
python manage.py test workorder.tests.test_work_order_flow_service
```

测试覆盖：
- ✅ 从销售订单创建施工单（成功/失败场景）
- ✅ 提交审核（有效/无效状态转换）
- ✅ 审核通过（自动任务分派）
- ✅ 审核拒绝（草稿任务删除）
- ✅ 检查并完成施工单
- ✅ 完整流程集成测试

## 集成说明

### 1. 更新 URL 配置

在 `workorder/urls.py` 中添加：

```python
from workorder.views.work_order_flow_views import WorkOrderFlowViewSet

router.register(r'workorders-flow', WorkOrderFlowViewSet, basename='workorder-flow')
```

### 2. 更新依赖

确保 `services/__init__.py` 中导出：

```python
from .work_order_flow_service import WorkOrderFlowService
from .notification_triggers_flow import NotificationTriggers
```

### 3. 前端集成

前端调用示例：

```javascript
// 从销售订单创建施工单
await workOrderFlowAPI.createFromSalesOrder({
    sales_order_id: 123,
    production_quantity: 1000,
    delivery_date: '2026-03-15',
    priority: 'normal',
    notes: '备注',
    artwork_ids: [1, 2],
});

// 提交审核
await workOrderFlowAPI.submitApproval(workOrderId, {
    comment: '请审核'
});

// 审核通过
await workOrderFlowAPI.approve(workOrderId, {
    comment: '审核通过'
});
```

## 优势

### 对比原有方案

| 特性 | 原有方案 | WorkOrderFlowService |
|------|---------|----------------------|
| API 调用次数 | 多次（创建 → 添加工序 → 添加物料 → 生成任务 → 提交） | 1 次（一键完成） |
| 事务一致性 | 无保证（可能部分成功） | `@transaction.atomic` 保证 |
| 状态转换验证 | 无 | 严格的状态机约束 |
| 通知发送 | 前端轮询 | 事件驱动 + 实时推送 |
| 可追溯性 | 部分日志 | 完整的操作日志 |

### 业务价值

1. **提升开发效率**：前端只需调用一个接口，无需组合多个操作
2. **降低错误率**：自动验证和流程编排，减少人为错误
3. **改善用户体验**：更快的响应速度，实时的状态反馈
4. **增强可维护性**：业务逻辑集中在服务层，易于测试和重构

## 下一步优化

### 短期（1-2周）
- [ ] 添加异步任务支持（Celery）
- [ ] 实现多级审核流程
- [ ] 添加流程回滚功能

### 中期（1个月）
- [ ] 集成工作流引擎（Tempo/Airflow）
- [ ] 实现流程可视化
- [ ] 添加流程性能监控

### 长期（3个月）
- [ ] 支持自定义流程配置
- [ ] 实现 BPMN 2.0 标准
- [ ] 添加流程分析和优化建议

## 参考资料

- [Django Transactions](https://docs.djangoproject.com/en/4.2/topics/db/transactions/)
- [Django Signals](https://docs.djangoproject.com/en/4.2/topics/signals/)
- [DRF ViewSets](https://www.django-rest-framework.org/api-guide/viewsets/)
- [State Machine Pattern](https://refactoring.guru/design-patterns/state)

---

**作者**: 小可 AI Assistant
**日期**: 2026-03-03
**版本**: v1.0.0
