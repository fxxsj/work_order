# 审计日志系统实施指南

## 概述

完整的审计日志系统，用于记录系统中所有重要操作，包括：
- 数据变更（创建、更新、删除）
- 操作者信息
- 变更前后数据
- 请求上下文（IP、User-Agent）

## 安装步骤

### 1. 更新模型导入

编辑 `workorder/models/__init__.py`：

```python
from .audit import (
    AuditLog,
    AuditLogExport,
    AuditLogSettings,
)

__all__ = [
    # ... 其他导入
    'AuditLog',
    'AuditLogExport',
    'AuditLogSettings',
]
```

### 2. 创建数据库迁移

```bash
cd backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
```

### 3. 注册中间件

编辑 `config/settings.py`：

```python
MIDDLEWARE = [
    # ...
    'workorder.middleware.audit_log.AuditLogMiddleware',
    # ...
]
```

### 4. 注册信号

编辑 `workorder/apps.py`：

```python
from django.apps import AppConfig

class WorkorderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'workorder'

    def ready(self):
        # 导入信号处理器
        from workorder.services.audit_log_service import register_audit_signals
        # 导入模型（确保信号被注册）
        import workorder.signals  # 创建此文件
```

创建 `workorder/signals.py`：

```python
from django.apps import apps
from workorder.services.audit_log_service import register_audit_signals

# 在所有应用就绪后注册信号
for app_config in apps.get_app_configs():
    if app_config.name == 'workorder':
        register_audit_signals(app_config)
        break
```

### 5. 注册路由

编辑 `workorder/urls.py`：

```python
from .views.audit_log import AuditLogViewSet

router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
```

### 6. 配置审计日志设置

在 Django Admin 中创建审计日志配置：

```python
# 默认配置
AuditLogSettings.objects.get_or_create(
    pk=1,
    defaults={
        'retention_days': 365,
        'enabled': True,
        'audited_models': [
            'workorder.WorkOrder',
            'workorder.WorkOrderTask',
            'workorder.Customer',
            'workorder.Product',
            'workorder.Material',
        ],
    }
)
```

## 使用方法

### 方法1：使用 AuditMixin（推荐）

在需要审计的模型中添加 `AuditMixin`：

```python
from workorder.models.audit import AuditMixin

class WorkOrder(AuditMixin, models.Model):
    # 模型字段
    pass

    def get_audit_log_repr(self):
        return f"施工单 {self.order_number}"
```

### 方法2：手动配置需要审计的模型

在 Django Admin 中配置 `AuditLogSettings.audited_models`：

```python
[
    "workorder.WorkOrder",
    "workorder.WorkOrderTask",
    "workorder.Customer",
    "workorder.Product",
]
```

## API 使用

### 1. 查询审计日志

```http
GET /api/v1/audit-logs/?action_type=create&user=1
```

### 2. 按对象查询

```http
GET /api/v1/audit-logs/by_object/?model=workorder&object_id=123
```

### 3. 按用户查询

```http
GET /api/v1/audit-logs/by_user/?user_id=1&start_date=2026-01-01
```

### 4. 统计信息

```http
GET /api/v1/audit-logs/statistics/
```

### 5. 查看变更详情

```http
GET /api/v1/audit-logs/{id}/diff/
```

### 6. 导出日志

```http
POST /api/v1/audit-logs/export/
Content-Type: application/json

{
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "filters": {
    "action_type": "create"
  }
}
```

### 7. 处理导出任务

```bash
# 处理待导出的任务（建议放到定时任务）
python manage.py audit_log --process-exports --limit 20
```

## 管理命令

### 清理过期日志

```bash
# 清理超过保留期的日志
python manage.py audit_log --cleanup
```

### 查看统计信息

```bash
# 显示日志统计
python manage.py audit_log --stats
```

### 启用/禁用审计

```bash
# 启用
python manage.py audit_log --enable

# 禁用
python manage.py audit_log --disable
```

### 设置保留天数

```bash
# 设置保留期为 180 天
python manage.py audit_log --days 180
```

## 性能优化

### 1. 异步写入（可选）

如果使用 Celery：

```python
# settings.py
CELERY_BEAT_SCHEDULE = {
    'process-audit-exports': {
        'task': 'workorder.services.audit_export_service.process_pending_exports',
        'schedule': crontab(minute='*/5'),  # 每5分钟执行一次
    },
}
```

如果未接入 Celery，可使用 crontab 定时处理导出任务：

```bash
*/5 * * * * cd /path/to/backend && python manage.py audit_log --process-exports --limit 20
```

### 2. 索引优化

数据库索引已自动创建：

```python
indexes = [
    models.Index(fields=['user', '-created_at']),
    models.Index(fields=['content_type', 'object_id']),
    models.Index(fields=['action_type', '-created_at']),
    models.Index(fields=['-created_at']),
]
```

### 3. 定期清理

设置 Cron 任务：

```bash
# 每周清理过期日志
0 2 * * 0 cd /path/to/backend && python manage.py audit_log --cleanup
```

## 数据示例

### 审计日志记录示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "action_type": "update",
  "user": 1,
  "username": "admin",
  "content_type": "workorder",
  "object_id": "123",
  "object_repr": "施工单 WO20260303001",
  "changes": {
    "old": {
      "status": "pending",
      "priority": "normal"
    },
    "new": {
      "status": "in_progress",
      "priority": "high"
    }
  },
  "changed_fields": ["status", "priority"],
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "request_method": "PUT",
  "request_path": "/api/v1/workorders/123/",
  "created_at": "2026-03-04T10:30:00Z"
}
```

## 安全建议

1. **限制访问权限**：只有管理员可以访问审计日志
2. **日志加密**：敏感字段加密存储
3. **防篡改**：审计日志本身不可修改（只读）
4. **定期备份**：定期备份审计日志到安全存储
5. **监控告警**：异常操作实时告警

## 故障排查

### 问题1：日志没有记录

检查：
1. 审计日志是否启用：`AuditLogSettings.enabled`
2. 模型是否继承了 `AuditMixin`
3. 中间件是否正确注册

### 问题2：性能影响

解决方案：
1. 启用异步写入
2. 定期清理过期日志
3. 使用数据库分表

### 问题3：存储空间不足

解决方案：
1. 减少保留天数
2. 压缩旧日志
3. 导出到外部存储

## 监控指标

建议监控：
- 日志增长率
- 存储空间使用
- 查询响应时间
- 导出任务状态

---

**实施完成时间**: 预计 2-3 小时
**维护成本**: 低
**性能影响**: <5%（异步写入时）

Author: 小可 AI Assistant
Date: 2026-03-04
