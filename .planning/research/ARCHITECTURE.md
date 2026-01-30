# Architecture Research

**Domain:** 工单任务即时分派系统
**Researched:** 2026-01-30
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Frontend Layer (Vue.js 2.7)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ TaskList     │  │ TaskDetail   │  │ TaskAssign   │  │ TaskClaim    │   │
│  │ Component    │  │ Component    │  │ Component    │  │ Component    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │             │
│         └─────────────────┴─────────────────┴─────────────────┘-------------│
│                                    ↓                                          │
│                        ┌───────────────────────┐                              │
│                        │  API Module Layer     │                              │
│                        │  (workorder-task.js)  │                              │
│                        └───────────┬───────────┘                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                    ↓                                          │
│                        ┌───────────────────────┐                              │
│                        │  REST API Layer       │                              │
│                        │  (Django DRF)         │                              │
│                        └───────────┬───────────┘                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Business Logic Layer (Services)                     │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │   │
│  │  │TaskGeneration    │  │TaskDispatch      │  │TaskAssignment    │     │   │
│  │  │Service           │  │Service           │  │Service           │     │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘     │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │   │
│  │  │SmartAssignment   │  │Notification      │  │Permission        │     │   │
│  │  │Service           │  │Service           │  │Service           │     │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │WorkOrder │  │WorkOrder │  │WorkOrder │  │UserProfile│                   │
│  │Model     │  │Process   │  │Task      │  │Model      │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **TaskList Component** | 任务列表展示、筛选、状态统计 | Vue 2.7 + Element UI Table, 使用 listPageMixin |
| **TaskDetail Component** | 任务详情查看、编辑、数量更新 | Vue 2.7 Form, CRUD 操作 |
| **TaskAssign Component** | 任务分派界面、部门/人员选择 | Vue 2.7 + Element UI Select |
| **TaskClaim Component** | 任务认领功能（操作员视角） | Vue 2.7, 权限控制 |
| **workorder-task.js API** | 任务相关 API 封装 | 继承 BaseAPI, RESTful 调用 |
| **WorkOrderTask ViewSet** | 任务 CRUD、完成、分派 API | Django REST Framework ViewSet |
| **TaskGeneration Service** | 任务生成逻辑（施工单创建时） | Python Service Class, 事务处理 |
| **TaskDispatch Service** | 任务自动分派逻辑 | Python Service Class, 智能算法 |
| **SmartAssignment Service** | 基于技能画像的智能分派 | Python Service Class, 机器学习 |
| **Notification Service** | 任务分派通知 | Django Signals + 异步任务 |
| **WorkOrderTask Model** | 任务数据模型、状态管理 | Django ORM, 乐观锁 |
| **UserProfile Model** | 用户部门关联、权限信息 | Django ORM, ManyToMany |

## Recommended Project Structure

```
backend/
├── workorder/
│   ├── models/
│   │   ├── core.py              # WorkOrderTask 模型（已有）
│   │   │   ├── is_draft         # 草稿状态字段（待添加）
│   │   │   ├── draft_reason     # 草稿原因字段（待添加）
│   │   │   └── claimable        # 可认领标识（待添加）
│   │   └── system.py            # UserProfile, TaskAssignmentRule
│   │
│   ├── views/
│   │   ├── work_order_tasks.py  # WorkOrderTask ViewSet（已有）
│   │   │   ├── claim()          # 任务认领 API（待添加）
│   │   │   ├── convert_draft()  # 草稿转正式 API（待添加）
│   │   │   └── batch_dispatch() # 批量分派 API（待添加）
│   │   └── work_orders.py       # WorkOrder ViewSet（已有）
│   │       └── create           # 重写：创建时生成任务
│   │
│   ├── services/
│   │   ├── task_generation.py   # 任务生成服务（新建）
│   │   │   ├── generate_tasks_for_workorder()  # 施工单创建时生成任务
│   │   │   ├── generate_draft_tasks()          # 生成草稿任务
│   │   │   └── convert_draft_to_formal()       # 草稿转正式
│   │   ├── task_dispatch.py     # 任务分派服务（新建）
│   │   │   ├── auto_dispatch_tasks()           # 自动分派任务
│   │   │   ├── manual_dispatch_tasks()         # 手动分派任务
│   │   │   └── claim_task()                    # 认领任务
│   │   ├── smart_assignment.py # 智能分派服务（已有）
│   │   └── notification_triggers.py # 通知服务（已有）
│   │
│   ├── serializers/
│   │   └── core.py              # WorkOrderTaskSerializer（已有）
│   │       ├── is_draft         # 草稿字段序列化（待添加）
│   │       └── claimable        # 可认领标识（待添加）
│   │
│   ├── permissions.py           # 权限类（已有）
│   │   ├── WorkOrderTaskPermission  # 任务权限（已有）
│   │   └── CanClaimTaskPermission  # 认领权限（待添加）
│   │
│   └── signals.py               # Django Signals（新建）
│       ├── workorder_post_create   # 施工单创建后生成任务
│       ├── workorder_approved      # 施工单审核后任务生效
│       └── task_dispatched         # 任务分派后发送通知
│
frontend/
├── src/
│   ├── views/
│   │   ├── task/
│   │   │   ├── TaskList.vue        # 任务列表（新建）
│   │   │   ├── TaskDetail.vue      # 任务详情（新建）
│   │   │   ├── TaskAssignment.vue  # 任务分派（新建）
│   │   │   └── TaskClaim.vue       # 任务认领（新建）
│   │   └── workorder/
│   │       └── WorkOrderForm.vue   # 施工单表单（修改）
│   │           └── 任务预览功能（待添加）
│   │
│   ├── api/
│   │   └── modules/
│   │       └── workorder-task.js   # 任务 API（已有）
│   │           ├── claim()         # 认领 API（待添加）
│   │           ├── convertDraft()  # 草稿转正式 API（待添加）
│   │           └── batchDispatch() # 批量分派 API（待添加）
│   │
│   ├── mixins/
│   │   ├── listPageMixin.js        # 列表页面 Mixin（已有）
│   │   └── taskPermissionMixin.js  # 任务权限 Mixin（新建）
│   │
│   └── store/
│       └── modules/
│           └── task.js             # 任务状态管理（新建）
│               ├── draftTasks      # 草稿任务列表
│               ├── myTasks         # 我的任务列表
│               └── departmentTasks # 部门任务列表
```

### Structure Rationale

- **backend/workorder/services/task_generation.py:** 任务生成逻辑独立成服务，便于测试和复用，遵循单一职责原则
- **backend/workorder/services/task_dispatch.py:** 分派逻辑与生成逻辑分离，便于后续优化分派算法
- **backend/workorder/signals.py:** 使用 Django Signals 实现事件驱动架构，解耦业务逻辑
- **frontend/src/views/task/:** 任务相关视图独立目录，便于后续扩展任务管理功能
- **frontend/src/api/modules/workorder-task.js:** 已有的 API 模块，只需扩展新功能
- **frontend/src/store/modules/task.js:** 任务状态集中管理，便于跨组件共享任务数据

## Architectural Patterns

### Pattern 1: Service Layer Pattern

**What:** 业务逻辑封装在独立的服务层，与 ViewSet 和 Model 分离
**When to use:** 复杂业务逻辑、跨模型操作、需要复用的逻辑
**Trade-offs:**
- Pros: 代码可测试性强、业务逻辑集中、便于复用
- Cons: 增加了一层抽象、需要更多的文件

**Example:**
```python
# backend/workorder/services/task_generation.py
class TaskGenerationService:
    """任务生成服务"""

    @staticmethod
    def generate_tasks_for_workorder(work_order):
        """为施工单生成所有工序的任务

        新规则：施工单创建时立即生成任务（草稿状态）
        审核通过后，草稿任务自动转为正式任务
        """
        from django.db import transaction
        from ..models.core import WorkOrderTask, WorkOrderProcess

        with transaction.atomic():
            # 遍历施工单的所有工序
            for work_order_process in work_order.order_processes.all():
                # 检查是否已生成任务
                if work_order_process.tasks.exists():
                    continue

                # 调用工序的任务生成方法（已有逻辑）
                work_order_process.generate_tasks()

                # 将生成的任务标记为草稿状态
                work_order_process.tasks.update(is_draft=True, draft_reason='等待施工单审核')

            return True

    @staticmethod
    def convert_draft_to_formal(work_order):
        """将草稿任务转为正式任务

        触发时机：施工单审核通过
        """
        from django.db import transaction
        from ..models.core import WorkOrderTask
        from ..services.task_dispatch import TaskDispatchService

        with transaction.atomic():
            # 获取所有草稿任务
            draft_tasks = WorkOrderTask.objects.filter(
                work_order_process__work_order=work_order,
                is_draft=True
            )

            # 批量更新为正式任务
            draft_tasks.update(is_draft=False, draft_reason='')

            # 触发自动分派
            for task in draft_tasks:
                TaskDispatchService.auto_dispatch_task(task)

            return draft_tasks.count()
```

### Pattern 2: Event-Driven Architecture (Django Signals)

**What:** 使用 Django Signals 实现事件驱动，业务流程解耦
**When to use:** 跨模块通知、异步处理、业务流程联动
**Trade-offs:**
- Pros: 业务解耦、扩展性强、异步处理
- Cons: 调试困难、需要注意事务一致性

**Example:**
```python
# backend/workorder/signals.py
from django.db.models.signals import post_save, post_init
from django.dispatch import receiver
from django.db.models import Q
from ..models.core import WorkOrder, WorkOrderTask
from .services.task_generation import TaskGenerationService
from .services.task_dispatch import TaskDispatchService
from .services.notification_triggers import NotificationTriggerService

@receiver(post_save, sender=WorkOrder)
def workorder_post_create(sender, instance, created, **kwargs):
    """施工单创建后，立即生成草稿任务

    新规则：任务生成时机从"工序开始"改为"施工单创建"
    """
    if created:
        # 立即生成草稿任务
        TaskGenerationService.generate_tasks_for_workorder(instance)

@receiver(post_save, sender=WorkOrder)
def workorder_approved(sender, instance, **kwargs):
    """施工单审核通过后，草稿任务转为正式任务并自动分派"""
    # 检查是否是审核通过状态变更
    if instance.approval_status == 'approved':
        # 检查是否是刚刚审核通过（通过 tracking 字段判断）
        if hasattr(instance, '_original_approval_status') and \
           instance._original_approval_status != 'approved':
            # 将草稿任务转为正式任务
            task_count = TaskGenerationService.convert_draft_to_formal(instance)

            # 创建通知
            if instance.created_by:
                NotificationTriggerService.workorder_approved_with_tasks(
                    instance, instance.created_by, task_count
                )

@receiver(post_init, sender=WorkOrder)
def track_workorder_approval_status(sender, instance, **kwargs):
    """跟踪施工单审核状态变更"""
    instance._original_approval_status = instance.approval_status

@receiver(post_save, sender=WorkOrderTask)
def task_dispatched(sender, instance, created, **kwargs):
    """任务分派后，发送通知给操作员"""
    if created or instance.assigned_operator:
        # 检查是否是刚刚分派（通过 tracking 字段判断）
        if hasattr(instance, '_original_assigned_operator') and \
           instance._original_assigned_operator != instance.assigned_operator:
            NotificationTriggerService.task_assigned(instance, instance.assigned_operator)

@receiver(post_init, sender=WorkOrderTask)
def track_task_assignment(sender, instance, **kwargs):
    """跟踪任务分派变更"""
    instance._original_assigned_operator = instance.assigned_operator
```

### Pattern 3: Strategy Pattern for Task Dispatch

**What:** 分派策略模式，支持多种分派算法
**When to use:** 需要支持多种分派策略、算法可替换
**Trade-offs:**
- Pros: 扩展性强、算法可插拔、便于单元测试
- Cons: 增加代码复杂度、需要定义抽象接口

**Example:**
```python
# backend/workorder/services/task_dispatch.py
from abc import ABC, abstractmethod
from typing import Optional, List
from ..models.core import WorkOrderTask
from ..models.base import User, Department

class TaskDispatchStrategy(ABC):
    """任务分派策略抽象基类"""

    @abstractmethod
    def dispatch(self, task: WorkOrderTask, department: Department) -> Optional[User]:
        """分派任务，返回分派的操作员"""
        pass

class LeastTasksDispatchStrategy(TaskDispatchStrategy):
    """最少任务策略：选择当前任务数最少的操作员"""

    def dispatch(self, task: WorkOrderTask, department: Department) -> Optional[User]:
        from django.db.models import Count

        # 获取部门内所有操作员
        operators = User.objects.filter(
            profile__departments=department,
            is_active=True
        ).exclude(
            is_superuser=True
        ).annotate(
            task_count=Count('assigned_tasks', filter=Q(assigned_tasks__status__in=['pending', 'in_progress']))
        ).order_by('task_count')

        return operators.first()

class RandomDispatchStrategy(TaskDispatchStrategy):
    """随机策略：随机选择一个操作员"""

    def dispatch(self, task: WorkOrderTask, department: Department) -> Optional[User]:
        import random
        from ..models.base import User

        operators = User.objects.filter(
            profile__departments=department,
            is_active=True
        ).exclude(
            is_superuser=True
        )

        if operators.exists():
            return random.choice(list(operators))
        return None

class SkillBasedDispatchStrategy(TaskDispatchStrategy):
    """基于技能的分派策略：选择技能匹配度最高的操作员"""

    def dispatch(self, task: WorkOrderTask, department: Department) -> Optional[User]:
        from ..services.smart_assignment import SmartAssignmentService

        # 获取部门内所有操作员
        operators = User.objects.filter(
            profile__departments=department,
            is_active=True
        ).exclude(
            is_superuser=True
        )

        # 计算每个操作员的匹配度分数
        best_operator = None
        best_score = 0

        for operator in operators:
            # 根据任务类型确定技能要求
            task_requirements = self._get_task_requirements(task)
            score = SmartAssignmentService.calculate_skill_match_score(
                self._get_user_skills(operator),
                task_requirements
            )

            if score > best_score:
                best_score = score
                best_operator = operator

        return best_operator

    def _get_task_requirements(self, task: WorkOrderTask) -> List[str]:
        """根据任务类型获取技能要求"""
        requirements_map = {
            'plate_making': ['制版', 'CTP', '图稿审核'],
            'cutting': ['开料', '材料加工'],
            'printing': ['印刷', '色彩管理'],
            'foiling': ['烫金', '热压'],
            'embossing': ['压凸', '模具加工'],
            'die_cutting': ['模切', '刀模操作'],
            'packaging': ['包装', '成品检验'],
        }
        return requirements_map.get(task.task_type, [])

    def _get_user_skills(self, user: User) -> List[str]:
        """获取用户技能列表"""
        if hasattr(user, 'skill_profile') and user.skill_profile:
            return user.skill_profile.technical_skills or []
        return []

class TaskDispatchService:
    """任务分派服务"""

    # 策略映射表
    STRATEGIES = {
        'least_tasks': LeastTasksDispatchStrategy,
        'random': RandomDispatchStrategy,
        'skill_based': SkillBasedDispatchStrategy,
    }

    @staticmethod
    def auto_dispatch_task(task: WorkOrderTask) -> bool:
        """自动分派任务

        规则：
        1. 优先使用工序级别的分派（task.work_order_process.department）
        2. 如果工序未指定部门，根据任务分派规则自动选择
        3. 使用配置的分派策略（默认：least_tasks）
        """
        from ..models.system import TaskAssignmentRule

        # 获取分派部门
        department = task.work_order_process.department
        if not department:
            # 使用任务分派规则
            rule = TaskAssignmentRule.objects.filter(
                process=task.work_order_process.process,
                is_active=True
            ).order_by('-priority').first()

            if rule:
                department = rule.department
            else:
                # 无分派规则，任务保持未分派状态
                return False

        # 获取分派策略
        strategy_name = 'least_tasks'  # 默认策略
        if hasattr(task, 'assignment_strategy') and task.assignment_strategy:
            strategy_name = task.assignment_strategy

        strategy_class = TaskDispatchService.STRATEGIES.get(strategy_name)
        if not strategy_class:
            strategy_class = LeastTasksDispatchStrategy

        # 执行分派
        strategy = strategy_class()
        operator = strategy.dispatch(task, department)

        if operator:
            task.assigned_department = department
            task.assigned_operator = operator
            task.save()

            # 创建分派通知
            from ..services.notification_triggers import NotificationTriggerService
            NotificationTriggerService.task_assigned(task, operator)

            return True

        return False

    @staticmethod
    def manual_dispatch_task(task_id: int, operator_id: int, user: User) -> bool:
        """手动分派任务"""
        from ..models.base import User

        try:
            task = WorkOrderTask.objects.get(id=task_id)
            operator = User.objects.get(id=operator_id)

            task.assigned_operator = operator
            task.assigned_department = operator.profile.departments.first()
            task.save()

            # 创建分派通知
            from ..services.notification_triggers import NotificationTriggerService
            NotificationTriggerService.task_assigned(task, operator)

            return True
        except (WorkOrderTask.DoesNotExist, User.DoesNotExist):
            return False

    @staticmethod
    def claim_task(task_id: int, user: User) -> bool:
        """认领任务

        规则：
        1. 任务必须是未分派状态（assigned_operator is None）
        2. 用户必须属于任务的 assigned_department
        3. 认领后，任务的 assigned_operator 设置为当前用户
        """
        try:
            task = WorkOrderTask.objects.get(id=task_id)

            # 检查任务是否可认领
            if task.assigned_operator is not None:
                raise ValueError('任务已被分派，无法认领')

            # 检查用户是否属于分派部门
            if task.assigned_department:
                user_departments = user.profile.departments.all() if hasattr(user, 'profile') else []
                if task.assigned_department not in user_departments:
                    raise ValueError('您不属于该任务的分派部门')

            # 认领任务
            task.assigned_operator = user
            task.status = 'in_progress'
            task.save()

            # 创建认领通知
            from ..services.notification_triggers import NotificationTriggerService
            NotificationTriggerService.task_claimed(task, user)

            return True
        except WorkOrderTask.DoesNotExist:
            raise ValueError('任务不存在')
```

## Data Flow

### Request Flow

```
[用户创建施工单]
    ↓
[WorkOrderViewSet.create()]
    ↓
[WorkOrder Model.save()]
    ↓
[Django Signal: workorder_post_create]
    ↓
[TaskGenerationService.generate_tasks_for_workorder()]
    ↓
[遍历工序，调用 WorkOrderProcess.generate_tasks()]
    ↓
[创建 WorkOrderTask，设置 is_draft=True]
    ↓
[返回施工单详情]
```

```
[业务员审核施工单]
    ↓
[WorkOrderViewSet.approve()]
    ↓
[WorkOrder Model.save(), approval_status='approved']
    ↓
[Django Signal: workorder_approved]
    ↓
[TaskGenerationService.convert_draft_to_formal()]
    ↓
[批量更新 WorkOrderTask.is_draft=False]
    ↓
[TaskDispatchService.auto_dispatch_task()]
    ↓
[根据策略选择操作员]
    ↓
[更新 WorkOrderTask.assigned_operator]
    ↓
[Django Signal: task_dispatched]
    ↓
[NotificationTriggerService.task_assigned()]
    ↓
[创建通知，发送给操作员]
    ↓
[返回审核结果]
```

```
[操作员认领任务]
    ↓
[WorkOrderTaskViewSet.claim()]
    ↓
[TaskDispatchService.claim_task()]
    ↓
[检查任务是否可认领]
    ↓
[更新 WorkOrderTask.assigned_operator=user, status='in_progress']
    ↓
[NotificationTriggerService.task_claimed()]
    ↓
[返回认领结果]
```

### State Management

```
[Vuex Store: task.js]
    ↓ (subscribe)
[Components] ←→ [Actions] → [Mutations] → [State Store]

State Structure:
{
    draftTasks: [],           # 草稿任务列表
    myTasks: [],              # 我的任务列表
    departmentTasks: [],      # 部门任务列表
    taskStatistics: {},       # 任务统计数据
    loading: false,
    error: null
}
```

### Key Data Flows

1. **施工单创建流程：** 施工单创建 → 生成草稿任务 → 任务列表预览 → 等待审核
2. **施工单审核流程：** 审核通过 → 草稿转正式 → 自动分派任务 → 发送通知
3. **任务分派流程：** 选择任务 → 选择操作员 → 手动分派 → 发送通知
4. **任务认领流程：** 查看部门任务 → 认领任务 → 开始执行 → 更新进度

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | 当前架构足够，使用 Django ORM 缓存，无需特殊优化 |
| 1k-100k users | - 添加 Redis 缓存任务统计数据<br>- 使用数据库连接池<br>- 优化查询（select_related, prefetch_related）<br>- 异步任务处理（Celery） |
| 100k+ users | - 任务查询分片（按部门）<br>- 使用消息队列（RabbitMQ/Kafka）<br>- 读写分离（主从数据库）<br>- 任务统计预计算 |

### Scaling Priorities

1. **First bottleneck:** 任务列表查询性能
   - 优化：添加数据库索引（assigned_department, status, assigned_operator）
   - 优化：使用 select_related 和 prefetch_related 减少查询次数
   - 优化：使用 Redis 缓存任务统计数据

2. **Second bottleneck:** 任务分派通知性能
   - 优化：使用 Celery 异步发送通知
   - 优化：批量发送通知（减少数据库查询）
   - 优化：使用消息队列削峰

## Anti-Patterns

### Anti-Pattern 1: 任务生成逻辑散落在多处

**What people do:** 在 ViewSet、Model、Signal 中都有任务生成逻辑
**Why it's wrong:** 代码重复、难以维护、逻辑不一致
**Do this instead:** 统一使用 TaskGenerationService，所有地方调用服务方法

### Anti-Pattern 2: 同步发送通知导致响应缓慢

**What people do:** 在 API 请求中同步发送通知（邮件、短信）
**Why it's wrong:** API 响应时间长、第三方服务故障影响主流程
**Do this instead:** 使用 Celery 异步发送通知，或使用 Django Signals 解耦

### Anti-Pattern 3: N+1 查询问题

**What people do:** 查询任务列表时，循环查询每个任务的操作员信息
**Why it's wrong:** 数据库查询次数爆炸、性能差
**Do this instead:** 使用 select_related('assigned_operator') 预加载关联数据

### Anti-Pattern 4: 前端状态管理混乱

**What people do:** 任务数据散落在各个组件的 data 中，没有统一管理
**Why it's wrong:** 数据不一致、难以维护、无法跨组件共享
**Do this instead:** 使用 Vuex 统一管理任务状态，通过 getters 和 actions 访问

### Anti-Pattern 5: 忽略乐观锁

**What people do:** 多人同时更新任务数量时，使用悲观锁或直接更新
**Why it's wrong:** 并发性能差、数据冲突
**Do this instead:** 使用乐观锁（WorkOrderTask.version），前端传递版本号校验

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Celery (异步任务) | Task Queue | 用于异步发送通知、预计算统计数据 |
| Redis (缓存) | Cache Backend | 缓存任务统计数据、用户权限信息 |
| RabbitMQ/Kafka (消息队列) | Message Queue | 高并发场景下的任务分派削峰 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| TaskGeneration → TaskDispatch | Direct Method Call | 服务层直接调用，确保事务一致性 |
| TaskDispatch → Notification | Django Signals | 解耦通知逻辑，异步处理 |
| Frontend → Backend API | REST API | 使用 BaseAPI 封装，统一错误处理 |
| Vuex Store → Components | Reactive Data | 使用 mapState, mapActions 访问状态 |

## Recommended Build Order

### Phase 1: 数据模型扩展（1-2天）
**Dependencies:** 无
**Tasks:**
1. 为 WorkOrderTask 添加草稿相关字段（is_draft, draft_reason, claimable）
2. 创建数据库迁移文件
3. 编写模型单元测试

**Build Order Reason:** 模型是基础，必须先完成

### Phase 2: 后端服务层（2-3天）
**Dependencies:** Phase 1
**Tasks:**
1. 创建 TaskGenerationService（任务生成服务）
2. 创建 TaskDispatchService（任务分派服务）
3. 实现分派策略（LeastTasks, Random, SkillBased）
4. 编写服务单元测试

**Build Order Reason:** 服务层依赖模型，为 ViewSet 提供业务逻辑

### Phase 3: 后端 API 层（2-3天）
**Dependencies:** Phase 2
**Tasks:**
1. 创建 Django Signals（workorder_post_create, workorder_approved, task_dispatched）
2. 扩展 WorkOrderTaskViewSet（添加 claim, convert_draft, batch_dispatch 接口）
3. 扩展序列化器（添加草稿字段）
4. 编写 API 集成测试

**Build Order Reason:** API 层依赖服务层，为前端提供接口

### Phase 4: 前端 API 模块（1天）
**Dependencies:** Phase 3
**Tasks:**
1. 扩展 workorder-task.js API 模块（添加 claim, convertDraft, batchDispatch 方法）
2. 编写 API 测试

**Build Order Reason:** API 模块依赖后端接口，为组件提供调用方法

### Phase 5: 前端组件开发（3-4天）
**Dependencies:** Phase 4
**Tasks:**
1. 创建 TaskList.vue（任务列表组件）
2. 创建 TaskDetail.vue（任务详情组件）
3. 创建 TaskAssignment.vue（任务分派组件）
4. 创建 TaskClaim.vue（任务认领组件）
5. 修改 WorkOrderForm.vue（添加任务预览功能）

**Build Order Reason:** 组件依赖 API 模块，提供用户界面

### Phase 6: 前端状态管理（1-2天）
**Dependencies:** Phase 5
**Tasks:**
1. 创建 Vuex store module（task.js）
2. 实现状态 getters、actions、mutations
3. 集成到各组件

**Build Order Reason:** 状态管理依赖组件，统一数据流

### Phase 7: 通知和优化（1-2天）
**Dependencies:** Phase 6
**Tasks:**
1. 实现通知服务（NotificationTriggerService）
2. 配置 Celery 异步任务
3. 性能优化（查询优化、缓存）
4. 编写端到端测试

**Build Order Reason:** 通知和优化依赖所有功能完成

### Phase 8: 文档和部署（1天）
**Dependencies:** Phase 7
**Tasks:**
1. 编写 API 文档
2. 编写用户使用手册
3. 部署到生产环境

**Build Order Reason:** 文档和部署在所有功能完成后

## Sources

- Django REST Framework 官方文档: https://www.django-rest-framework.org/
- Django Signals 文档: https://docs.djangoproject.com/en/stable/topics/signals/
- Vue.js 官方文档: https://v2.vuejs.org/
- Element UI 文档: https://element.eleme.io/
- 项目现有代码分析: `/home/chenjiaxing/文档/work_order/backend/workorder/`
- 项目文档: `/home/chenjiaxing/文档/work_order/CLAUDE.md`

---

*Architecture research for: 工单任务即时分派系统*
*Researched: 2026-01-30*
