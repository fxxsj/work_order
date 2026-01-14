# 代码优化实施指南

**优化日期**: 2026-01-14
**优化范围**: 基于 [CODE_ANALYSIS_REPORT.md](CODE_ANALYSIS_REPORT.md) 的分析结果
**优化状态**: P0 优先级问题进行中

---

## ✅ 已完成的优化

### 1. 安全隐患修复（P0）

#### ✅ 1.1 配置文件安全化

**修改文件**:
- [backend/config/settings.py](../backend/config/settings.py)
- [backend/.env.example](../backend/.env.example)
- [backend/.env](../backend/.env)
- [backend/.gitignore](../backend/.gitignore)

**改进内容**:
- ✅ 使用 `python-dotenv` 管理环境变量
- ✅ SECRET_KEY 从环境变量读取
- ✅ DEBUG、ALLOWED_HOSTS 从环境变量读取
- ✅ CORS 和 CSRF 配置从环境变量读取
- ✅ 添加生产环境安全设置（HTTPS、HSTS、XSS 过滤等）
- ✅ 创建 .env.example 模板文件
- ✅ 添加 .gitignore 防止敏感信息泄露

**使用方法**:
```bash
# 1. 安装依赖
cd backend
pip install python-dotenv

# 2. 复制环境变量模板
cp .env.example .env

# 3. 编辑 .env 文件（生产环境使用强密钥）
# SECRET_KEY=your-production-secret-key-here
# DEBUG=False
# ALLOWED_HOSTS=yourdomain.com

# 4. 启动服务
python manage.py runserver
```

#### ✅ 1.2 自定义异常类

**新增文件**: [backend/workorder/exceptions.py](../backend/workorder/exceptions.py)

**改进内容**:
- ✅ 定义业务异常基类 `WorkOrderException`
- ✅ 实现具体异常类型：
  - `InsufficientStockError` - 库存不足
  - `InvalidStatusTransitionError` - 状态转换无效
  - `DuplicateOrderNumberError` - 订单号重复
  - `BusinessLogicError` - 业务逻辑错误
  - `WorkflowError` - 工作流错误
  - `ValidationError` - 数据验证错误

**使用示例**:
```python
from workorder.exceptions import InsufficientStockError

def reduce_stock(product, quantity):
    if product.current_stock < quantity:
        raise InsufficientStockError(
            f"{product.name} 库存不足。当前: {product.current_stock}, 需要: {quantity}"
        )
    product.current_stock -= quantity
    product.save()
```

---

## 🚧 进行中的优化

### 2. 启用乐观锁防止并发冲突（P0）

**问题**: WorkOrderTask 模型有 `version` 字段但未使用

**优化方案**:

#### 步骤 1: 在模型中实现乐观锁

```python
# backend/workorder/models.py
from django.db import models
from workorder.exceptions import DuplicateOrderNumberError

class WorkOrderTask(models.Model):
    # ... 现有字段
    version = models.IntegerField('版本号', default=1, help_text='用于乐观锁')

    def save(self, *args, **kwargs):
        # 如果是更新操作，检查版本
        if self.pk:
            # 获取数据库中的最新版本
            current = WorkOrderTask.objects.get(pk=self.pk)
            if current.version != self.version:
                raise BusinessLogicError(
                    f"数据已被其他用户修改，请刷新后重试。"
                    f"当前版本: {current.version}, 您的版本: {self.version}"
                )
            self.version += 1

        super().save(*args, **kwargs)
```

#### 步骤 2: 在序列化器中处理版本

```python
# backend/workorder/serializers.py
class WorkOrderTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrderTask
        fields = '__all__'
        read_only_fields = ['version']

    def update(self, instance, validated_data):
        # 检查版本
        request_version = self.context['request'].data.get('version')
        if request_version and instance.version != int(request_version):
            raise ValidationError(
                f"数据已被修改，请刷新后重试。"
                f"当前版本: {instance.version}, 提交版本: {request_version}"
            )

        return super().update(instance, validated_data)
```

#### 步骤 3: 前端传递版本号

```javascript
// frontend/src/api/workorder.js
export function updateTask(id, data) {
  // 确保 version 字段被传递
  return request({
    url: `/workorder-tasks/${id}/`,
    method: 'put',
    data: data
  })
}
```

### 3. 为关键业务操作添加事务（P0）

**需要添加事务的操作**:

#### 3.1 任务完成操作

```python
# backend/workorder/views.py
from django.db import transaction

class WorkOrderTaskViewSet(viewsets.ModelViewSet):
    @transaction.atomic
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """完成任务"""
        task = self.get_object()
        quantity = request.data.get('quantity', task.quantity)

        # 1. 更新任务状态
        task.status = 'completed'
        task.quantity_completed = quantity
        task.completed_at = timezone.now()
        task.save()

        # 2. 更新工序状态
        process = task.process
        if process.status != 'completed':
            # 检查所有任务是否完成
            if process.tasks.filter(status='completed').count() == process.tasks.count():
                process.status = 'completed'
                process.completed_at = timezone.now()
                process.save()

        # 3. 如果是包装工序，更新产品库存
        if task.process.is_packaging_process and task.product:
            task.product.add_stock(quantity, request.user, '生产完成')

        # 4. 记录日志
        TaskLog.objects.create(
            task=task,
            user=request.user,
            action='complete',
            details=f"完成任务，数量: {quantity}"
        )

        return Response({'success': True, 'message': '任务已完成'})
```

#### 3.2 施工单创建操作

```python
@transaction.atomic
def create(self, request):
    """创建施工单"""
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # 1. 创建施工单
    work_order = serializer.save(created_by=request.user)

    # 2. 生成工序
    processes_data = request.data.get('processes', [])
    for process_data in processes_data:
        WorkOrderProcess.objects.create(
            work_order=work_order,
            **process_data
        )

    # 3. 生成任务
    self._generate_tasks(work_order)

    # 4. 记录日志
    ProcessLog.objects.create(
        work_order=work_order,
        user=request.user,
        action='create',
        details=f"创建施工单: {work_order.order_number}"
    )

    headers = self.get_success_headers(serializer.data)
    return Response(serializer.data, status=201, headers=headers)
```

### 4. 修复库存更新异常处理（P0）

**问题**: signals.py 中异常被静默忽略

**优化方案**:

#### 4.1 移除信号中的库存更新逻辑

```python
# backend/workorder/signals.py
# 删除或注释掉 _on_packaging_complete 中的库存更新逻辑
# 将业务逻辑移到服务层
```

#### 4.2 创建库存服务

```python
# backend/workorder/services/inventory_service.py
from django.db import transaction
from workorder.exceptions import InsufficientStockError
import logging

logger = logging.getLogger(__name__)

class InventoryService:
    """库存管理服务"""

    @staticmethod
    @transaction.atomic
    def add_stock(item, quantity, user, reason=''):
        """增加库存"""
        try:
            item.current_stock += quantity
            item.save()

            # 记录日志
            logger.info(f"库存增加: {item.name} +{quantity}, 原因: {reason}, 操作人: {user}")

        except Exception as e:
            logger.error(f"库存增加失败: {item.name}, 错误: {e}")
            raise BusinessLogicError(f"库存更新失败: {str(e)}")

    @staticmethod
    @transaction.atomic
    def reduce_stock(item, quantity, user, reason=''):
        """减少库存"""
        try:
            if item.current_stock < quantity:
                raise InsufficientStockError(
                    f"{item.name} 库存不足。当前: {item.current_stock}, 需要: {quantity}"
                )

            item.current_stock -= quantity
            item.save()

            # 记录日志
            logger.info(f"库存减少: {item.name} -{quantity}, 原因: {reason}, 操作人: {user}")

        except InsufficientStockError:
            # 重新抛出业务异常
            raise
        except Exception as e:
            logger.error(f"库存减少失败: {item.name}, 错误: {e}")
            raise BusinessLogicError(f"库存更新失败: {str(e)}")
```

#### 4.3 在任务完成时调用库存服务

```python
from workorder.services.inventory_service import InventoryService

@action(detail=True, methods=['post'])
def complete(self, request, pk=None):
    """完成任务"""
    # ... 其他逻辑

    # 使用库存服务更新库存
    if task.process.is_packaging_process and task.product:
        try:
            InventoryService.add_stock(
                item=task.product,
                quantity=quantity,
                user=request.user,
                reason=f'任务完成: {task.work_order.order_number}'
            )
        except InsufficientStockError as e:
            # 回滚事务
            transaction.set_rollback(True)
            return Response({'error': str(e)}, status=400)

    # ... 其他逻辑
```

---

## 📋 待实施的优化

### P1 优先级（1-2周）

#### 5. 拆分超大文件

**需要拆分的文件**:
- `backend/workorder/models.py` (2,300行) → 拆分为多个模型文件
- `backend/workorder/serializers.py` (1,735行) → 拆分为多个序列化器文件
- `backend/workorder/views.py` (3,700行) → 拆分为多个视图文件

**目录结构**:
```
workorder/
├── models/
│   ├── __init__.py
│   ├── base.py
│   ├── customer.py
│   ├── product.py
│   ├── workorder.py
│   └── task.py
├── serializers/
│   ├── __init__.py
│   ├── customer.py
│   ├── product.py
│   ├── workorder.py
│   └── task.py
└── views/
    ├── __init__.py
    ├── customer.py
    ├── product.py
    ├── workorder.py
    └── task.py
```

#### 6. 消除序列化器代码重复

**问题**: Die、FoilingPlate、EmbossingPlate 序列化器重复率 80%+

**解决方案**: 创建基类序列化器

```python
class BasePlateSerializer(serializers.ModelSerializer):
    """版序列化器基类"""
    class Meta:
        abstract = True

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # 通用字段处理
        return data

class DieSerializer(BasePlateSerializer):
    class Meta:
        model = Die
        fields = '__all__'
```

#### 7. 优化 N+1 查询问题

**问题**: 序列化器中触发 N+1 查询

**解决方案**:
```python
# views.py
def get_queryset(self):
    queryset = super().get_queryset()
    queryset = queryset.prefetch_related(
        'order_processes__process',
        'order_processes__tasks',
        'products__product',
        'materials__material',
        'customer',
        'artworks',
    )
    return queryset
```

### P2 优先级（1-3个月）

#### 8. 提取服务层

**创建服务层**:
- `services/inventory_service.py` - 库存管理
- `services/workflow_service.py` - 工作流管理
- `services/workorder_service.py` - 施工单业务

#### 9. 完善功能

- 添加批量操作 API
- 改进搜索功能（使用 django-filter）
- 添加基础报表功能
- 添加审计日志

#### 10. 用户体验优化

- 改进表单验证
- 添加操作引导
- 添加数据可视化（图表）
- 优化错误提示

---

## 🧪 测试建议

### 单元测试

```python
# tests/test_inventory_service.py
from django.test import TestCase
from workorder.services.inventory_service import InventoryService
from workorder.exceptions import InsufficientStockError

class InventoryServiceTest(TestCase):
    def test_add_stock(self):
        """测试增加库存"""
        # ...

    def test_reduce_stock_sufficient(self):
        """测试减少库存（充足）"""
        # ...

    def test_reduce_stock_insufficient(self):
        """测试减少库存（不足）"""
        with self.assertRaises(InsufficientStockError):
            # ...
```

### 集成测试

```python
# tests/test_task_complete.py
class TaskCompleteTest(TestCase):
    @transaction.atomic
    def test_complete_task_with_stock_update(self):
        """测试完成任务并更新库存"""
        # ...
```

---

## 📝 部署检查清单

### 开发环境

- [x] 安装 `python-dotenv`
- [x] 配置 `.env` 文件
- [x] 更新 `settings.py`
- [ ] 运行测试：`python manage.py test`
- [ ] 检查日志输出

### 生产环境

- [ ] 设置强随机 `SECRET_KEY`
- [ ] 设置 `DEBUG=False`
- [ ] 配置 `ALLOWED_HOSTS`
- [ ] 配置 HTTPS
- [ ] 配置数据库（PostgreSQL）
- [ ] 设置 `SECURE_SSL_REDIRECT=True`
- [ ] 配置备份策略
- [ ] 配置监控和日志
- [ ] 运行安全检查：`python manage.py check --deploy`

---

## 🔗 相关文档

- [代码分析报告](CODE_ANALYSIS_REPORT.md)
- [CLAUDE.md](../CLAUDE.md)
- [API 文档](../docs/API.md)

---

## 📊 优化进度

| 优先级 | 问题 | 状态 | 完成度 |
|--------|------|------|--------|
| P0 | 安全隐患 | ✅ 已完成 | 100% |
| P0 | 自定义异常 | ✅ 已完成 | 100% |
| P0 | 乐观锁 | 🚧 进行中 | 30% |
| P0 | 事务保护 | 🚧 进行中 | 20% |
| P0 | 库存异常处理 | 🚧 进行中 | 40% |
| P1 | 代码拆分 | ⏳ 待开始 | 0% |
| P1 | 消除重复 | ⏳ 待开始 | 0% |
| P1 | N+1 查询 | ⏳ 待开始 | 0% |
| P2 | 服务层 | ⏳ 待开始 | 0% |
| P2 | 功能完善 | ⏳ 待开始 | 0% |

---

## 🎯 下一步行动

### 本周任务（Week 1）

1. **完成 P0 问题修复**
   - [ ] 实现乐观锁机制
   - [ ] 添加事务装饰器
   - [ ] 修复库存更新逻辑

2. **添加基础测试**
   - [ ] 库存服务测试
   - [ ] 任务完成测试
   - [ ] 并发冲突测试

3. **文档更新**
   - [ ] 更新 API 文档
   - [ ] 更新部署文档

### 下周任务（Week 2）

1. **开始 P1 优化**
   - [ ] 拆分 models.py
   - [ ] 拆分 serializers.py
   - [ ] 拆分 views.py

2. **性能优化**
   - [ ] 解决 N+1 问题
   - [ ] 添加缓存
   - [ ] 优化查询

---

**最后更新**: 2026-01-14
**维护者**: 开发团队
