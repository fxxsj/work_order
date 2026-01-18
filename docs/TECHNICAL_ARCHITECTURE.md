# 印刷施工单跟踪系统 - 技术架构文档

## 文档信息

- **文档版本**: v1.0.0
- **最后更新**: 2026-01-18
- **系统版本**: v2.0.0
- **作者**: 开发团队

---

## 目录

1. [系统概述](#1-系统概述)
2. [技术栈](#2-技术栈)
3. [系统架构](#3-系统架构)
4. [前端架构](#4-前端架构)
5. [后端架构](#5-后端架构)
6. [数据模型](#6-数据模型)
7. [API设计](#7-api设计)
8. [状态管理](#8-状态管理)
9. [路由与导航](#9-路由与导航)
10. [业务流程](#10-业务流程)
11. [性能优化](#11-性能优化)
12. [部署架构](#12-部署架构)

---

## 1. 系统概述

### 1.1 系统简介

印刷施工单跟踪系统是一个基于前后端分离架构的企业级管理系统,旨在实现印刷施工单全生命周期的数字化管理,包括订单创建、审核、生产执行、质量控制、库存管理等核心业务流程。

### 1.2 核心特性

- **模块化架构**: 前后端均采用模块化设计,易于维护和扩展
- **多级审核**: 灵活的多级审核流程配置
- **智能任务分派**: 基于规则引擎的自动化任务分派
- **实时通知**: 内置的消息通知系统
- **数据缓存**: 智能缓存机制提升系统性能
- **权限控制**: 基于用户组的细粒度权限管理
- **响应式设计**: 支持桌面端和移动端访问
- **性能优化**: 虚拟滚动、懒加载等前端优化技术

### 1.3 系统规模

- **前端页面**: 30+ 个页面组件
- **前端组件**: 11+ 个通用组件
- **API接口**: 80+ 个RESTful API
- **数据模型**: 30+ 个数据模型
- **代码行数**: 约 20,000+ 行

---

## 2. 技术栈

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue.js | 2.7 | 渐进式JavaScript框架 |
| Element UI | 2.15 | 企业级Vue组件库 |
| Vue Router | 3.x | 路由管理器 |
| Vuex | 3.x | 状态管理 |
| Axios | 1.x | HTTP客户端 |
| Webpack | 5.x | 模块打包工具 |
| Babel | 7.x | JavaScript编译器 |
| ESLint | 8.x | 代码质量检查 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 编程语言 |
| Django | 4.2 | Web框架 |
| Django REST Framework | 3.14 | REST API框架 |
| SQLite | 3.x | 开发数据库 |
| PostgreSQL / MySQL | 14+ / 8+ | 生产数据库(可选) |
| Gunicorn | 21.x | WSGI服务器 |
| Nginx | 1.24+ | 反向代理服务器 |

### 2.3 开发工具

- **版本控制**: Git
- **代码编辑器**: VS Code
- **API测试**: Postman / Insomnia
- **数据库管理**: Django Admin / pgAdmin
- **项目管理**: Git Flow

---

## 3. 系统架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         客户端层                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Web浏览器   │  │   移动浏览器  │  │   桌面应用   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                         Web服务器层                          │
│                    (Nginx - 静态资源 + 反向代理)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       前端应用层                             │
│              (Vue.js SPA - 单页应用)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Vue Router  │  Vuex  │  Vue Components  │  Axios   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ REST API
┌─────────────────────────────────────────────────────────────┐
│                       后端应用层                             │
│                 (Django + DRF)                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ViewSets  │  Serializers  │  Models  │  Services   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       数据层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │    Redis     │  │  File Storage│       │
│  │   (主数据库)  │  │   (缓存)     │  │  (媒体文件)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 架构特点

1. **前后端分离**: 前端独立部署,通过REST API与后端通信
2. **单页应用**: 使用Vue Router实现无刷新页面切换
3. **模块化设计**: 前后端均采用模块化架构
4. **数据缓存**: 使用Vuex和Redis实现多级缓存
5. **静态资源分离**: Nginx处理静态文件,Django处理API请求

---

## 4. 前端架构

### 4.1 目录结构

```
frontend/
├── public/                      # 静态资源
├── src/
│   ├── api/                     # API接口封装
│   │   ├── index.js            # Axios配置
│   │   ├── auth.js             # 认证API
│   │   ├── workorder.js        # 施工单API
│   │   ├── purchase.js         # 采购API
│   │   └── sales.js            # 销售API
│   ├── assets/                  # 资源文件
│   │   └── styles/             # 全局样式
│   ├── components/              # 通用组件
│   │   ├── VirtualTable.vue    # 虚拟表格
│   │   ├── VirtualList.vue     # 虚拟列表
│   │   ├── LazyImage.vue       # 图片懒加载
│   │   ├── VirtualTaskList.vue # 虚拟任务列表
│   │   ├── SkeletonLoader.vue  # 骨架屏
│   │   ├── ComponentError.vue  # 错误边界
│   │   ├── TimelineView.vue    # 时间线
│   │   ├── GanttChart.vue      # 甘特图
│   │   ├── ProcessFlowChart.vue # 流程图
│   │   ├── ComponentLoading.vue # 加载状态
│   │   └── TaskKanban.vue      # 看板视图
│   ├── config/                  # 配置文件
│   ├── mixins/                  # Vue混入
│   ├── router/                  # 路由配置
│   │   └── index.js            # 路由定义
│   ├── services/                # 业务服务
│   │   └── base/               # 基础服务
│   ├── store/                   # Vuex状态管理
│   │   ├── index.js            # Store入口
│   │   └── modules/            # 状态模块
│   │       ├── cache.js        # 缓存管理
│   │       ├── task.js         # 任务状态
│   │       ├── ui.js           # UI状态
│   │       ├── user.js         # 用户状态
│   │       └── workOrder.js    # 施工单状态
│   ├── utils/                   # 工具函数
│   ├── views/                   # 页面组件
│   │   ├── Dashboard.vue       # 工作台
│   │   ├── Login.vue           # 登录页
│   │   ├── Layout.vue          # 布局组件
│   │   ├── Notification.vue    # 通知中心
│   │   ├── Profile.vue         # 个人资料
│   │   ├── artwork/            # 图稿管理
│   │   ├── customer/           # 客户管理
│   │   ├── department/         # 部门管理
│   │   ├── die/                # 刀模管理
│   │   ├── embossingplate/     # 压凸版管理
│   │   ├── foilingplate/       # 烫金版管理
│   │   ├── material/           # 物料管理
│   │   ├── process/            # 工序管理
│   │   ├── product/            # 产品管理
│   │   ├── productGroup/       # 产品组管理
│   │   ├── purchase/           # 采购管理
│   │   ├── sales/              # 销售管理
│   │   ├── supplier/           # 供应商管理
│   │   ├── task/               # 任务管理
│   │   └── workorder/          # 施工单管理
│   ├── App.vue                 # 根组件
│   └── main.js                 # 入口文件
├── package.json                # 依赖配置
├── webpack.config.js           # Webpack配置
└── babel.config.js             # Babel配置
```

### 4.2 组件设计原则

#### 4.2.1 组件分类

1. **页面组件 (Pages)**: 位于`views/`目录,对应路由页面
2. **业务组件 (Business Components)**: 位于各业务模块下的`components/`目录
3. **通用组件 (Common Components)**: 位于`components/`目录,可跨项目复用

#### 4.2.2 组件命名规范

- **组件文件名**: PascalCase,如`WorkOrderList.vue`
- **组件注册名**: kebab-case或PascalCase
- **组件属性名**: camelCase
- **组件事件名**: kebab-case

#### 4.2.3 组件通信

```javascript
// 父 → 子: Props
<work-order-detail :work-order-id="currentId" />

// 子 → 父: Events
this.$emit('update', { id: 123, status: 'completed' })

// 跨级: Provide/Inject
// 父组件
provide() {
  return {
    currentUser: this.user
  }
}

// 子组件
inject: ['currentUser']

// 复杂场景: Vuex状态管理
this.$store.commit('workOrder/SET_CURRENT', workOrder)
```

### 4.3 性能优化策略

#### 4.3.1 虚拟滚动

对于大数据量列表,使用虚拟滚动技术:

```vue
<template>
  <virtual-list
    :data-sources="largeDataList"
    :data-key="'id'"
    :keeps="30"
  >
    <template #default="{ data }">
      <div class="item">{{ data.name }}</div>
    </template>
  </virtual-list>
</template>
```

#### 4.3.2 路由懒加载

所有页面组件采用动态导入:

```javascript
const WorkOrderList = () => import(
  /* webpackChunkName: "workorder" */
  /* webpackPrefetch: true */
  '@/views/workorder/WorkOrderList.vue'
)
```

#### 4.3.3 组件懒加载

使用Vue的异步组件和`v-if`指令延迟加载:

```vue
<template>
  <div>
    <button @click="showChart = true">显示图表</button>
    <gantt-chart v-if="showChart" :data="chartData" />
  </div>
</template>
```

#### 4.3.4 图片优化

- 使用`LazyImage`组件实现图片懒加载
- 响应式图片尺寸
- 图片压缩和格式优化(WebP)

#### 4.3.5 代码分割

```javascript
// Webpack配置
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10
      },
      elementUI: {
        test: /[\\/]node_modules[\\/]element-ui[\\/]/,
        name: 'element-ui',
        priority: 20
      }
    }
  }
}
```

---

## 5. 后端架构

### 5.1 目录结构

```
backend/
├── config/                     # Django配置
│   ├── __init__.py
│   ├── settings.py            # 主配置文件
│   ├── urls.py                # 根URL配置
│   ├── wsgi.py                # WSGI配置
│   └── custom_user_admin.py   # 用户管理配置
├── workorder/                  # 主应用
│   ├── __init__.py
│   ├── apps.py
│   ├── data.py                 # 初始数据
│   ├── export_utils.py         # 导出工具
│   ├── process_codes.py        # 工序代码常量
│   ├── signals.py              # 信号处理
│   ├── utils.py                # 工具函数
│   ├── auth_views.py          # 认证视图
│   ├── fixtures/               # 数据fixtures
│   │   ├── initial_products.json
│   │   └── initial_data.json
│   ├── management/             # 管理命令
│   │   └── commands/
│   │       ├── init_groups.py
│   │       ├── assign_permissions.py
│   │       ├── load_initial_users.py
│   │       └── reset_processes.py
│   ├── migrations/             # 数据库迁移
│   ├── models/                 # 数据模型模块
│   │   ├── __init__.py
│   │   ├── assets.py          # 资产模型
│   │   ├── base.py            # 基础模型
│   │   ├── core.py            # 核心业务模型
│   │   ├── materials.py       # 物料模型
│   │   ├── products.py        # 产品模型
│   │   ├── sales.py           # 销售模型
│   │   ├── system.py          # 系统模型
│   │   ├── multi_level_approval.py # 多级审核
│   │   └── process_codes.py   # 工序代码
│   ├── serializers/            # 序列化器
│   │   ├── assets.py
│   │   ├── base.py
│   │   ├── core.py
│   │   ├── materials.py
│   │   ├── products.py
│   │   ├── sales.py
│   │   └── system.py
│   ├── services/               # 业务服务
│   │   ├── task_assignment.py # 任务分派服务
│   │   ├── notification.py    # 通知服务
│   │   └── cache.py           # 缓存服务
│   ├── templates/              # 模板文件
│   │   └── notifications/
│   ├── tests/                  # 测试文件
│   ├── views/                  # API视图
│   │   ├── __init__.py
│   │   ├── assets.py
│   │   ├── base.py
│   │   ├── core.py
│   │   ├── materials.py
│   │   ├── products.py
│   │   ├── sales.py
│   │   ├── system.py
│   │   ├── monitoring.py      # 监控视图
│   │   ├── multi_level_approval.py
│   │   ├── notification.py
│   │   ├── optimized_views.py
│   │   └── refactored_core.py
│   ├── urls.py                 # URL路由
│   ├── models.py              # 模型导出(兼容性)
│   ├── serializers.py         # 序列化器导出(兼容性)
│   └── views.py               # 视图导出(兼容性)
├── media/                      # 媒体文件
├── static/                     # 静态文件
├── db.sqlite3                  # SQLite数据库(开发)
├── manage.py                   # Django管理脚本
└── requirements.txt            # Python依赖
```

### 5.2 分层架构

```
┌─────────────────────────────────────────────────┐
│              Views Layer (视图层)                │
│         API接口定义、请求验证、响应处理            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Services Layer (服务层)                │
│         业务逻辑、任务分派、通知服务              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         Serializers Layer (序列化层)             │
│         数据验证、序列化/反序列化                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Models Layer (模型层)                  │
│         数据模型定义、数据库操作                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            Database (数据库层)                   │
│         PostgreSQL/MySQL/SQLite                  │
└─────────────────────────────────────────────────┘
```

### 5.3 设计模式

#### 5.3.1 MVC模式

```
Model (models/)      → 数据模型,业务实体
View (views/)        → API视图,处理HTTP请求
Controller           → Django URL路由 + Views
```

#### 5.3.2 Repository模式

```python
# services/task_assignment.py
class TaskAssignmentService:
    """任务分派服务"""

    def __init__(self):
        self.task_repository = TaskRepository()

    def assign_task(self, task_id, operator_id):
        """分派任务给操作员"""
        return self.task_repository.assign(task_id, operator_id)
```

#### 5.3.3 Factory模式

```python
# 根据工序代码创建不同的任务
class TaskFactory:
    @staticmethod
    def create_task(process_code, **kwargs):
        if process_code == 'CTP':
            return CTPTask(**kwargs)
        elif process_code == 'PRT':
            return PrintTask(**kwargs)
        else:
            return GenericTask(**kwargs)
```

#### 5.3.4 Strategy模式

```python
# 不同的任务分派策略
class AssignmentStrategy:
    @staticmethod
    def assign_least_tasks(operators):
        return min(operators, key=lambda o: o.task_count)

    @staticmethod
    def assign_random(operators):
        return random.choice(operators)

    @staticmethod
    def assign_round_robin(operators):
        # 轮询逻辑
        pass
```

### 5.4 中间件配置

```python
# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS支持
]
```

---

## 6. 数据模型

### 6.1 模型分类

#### 6.1.1 基础模型 (models/base.py)

| 模型 | 说明 | 主要字段 |
|------|------|----------|
| **Customer** | 客户信息 | name, code, contact, phone, email, address |
| **Department** | 部门管理 | name, code, parent, level, path |
| **Process** | 工序定义 | code, name, task_generation_rules |

```python
class Customer(models.Model):
    """客户信息"""
    name = models.CharField(max_length=200, verbose_name='客户名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='客户代码')
    contact = models.CharField(max_length=100, verbose_name='联系人')
    phone = models.CharField(max_length=20, verbose_name='电话')
    email = models.EmailField(verbose_name='邮箱')
    address = models.TextField(verbose_name='地址')

    class Meta:
        db_table = 'workorder_customer'
        verbose_name = '客户'
        verbose_name_plural = '客户'
```

#### 6.1.2 核心业务模型 (models/core.py)

| 模型 | 说明 | 主要字段 |
|------|------|----------|
| **WorkOrder** | 施工单主表 | order_no, customer, status, priority, salesperson |
| **WorkOrderProcess** | 施工单工序 | workorder, process, sequence, status |
| **WorkOrderProduct** | 施工单产品 | workorder, product, quantity, unit_price |
| **WorkOrderMaterial** | 施工单物料 | workorder, material, quantity_required |
| **WorkOrderTask** | 施工单任务 | workorder, process, assigned_operator, status |
| **ProcessLog** | 工序日志 | workorder, process, action, operator, timestamp |
| **TaskLog** | 任务日志 | task, action, operator, timestamp, details |

```python
class WorkOrder(models.Model):
    """施工单主模型"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('pending', '待审核'),
        ('approved', '已审核'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    order_no = models.CharField(max_length=50, unique=True, verbose_name='施工单号')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, verbose_name='客户')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.IntegerField(default=1, verbose_name='优先级')
    salesperson = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='业务员')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'workorder_workorder'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['created_at']),
        ]
```

#### 6.1.3 产品管理模型 (models/products.py)

| 模型 | 说明 | 主要字段 |
|------|------|----------|
| **Product** | 产品信息 | name, code, spec, unit, default_processes |
| **ProductGroup** | 产品组 | name, description |
| **ProductGroupItem** | 产品组子项 | product_group, product, quantity |
| **ProductMaterial** | 产品物料 | product, material, quantity_required |
| **ProductStockLog** | 库存日志 | product, quantity_change, reason, timestamp |

#### 6.1.4 物料管理模型 (models/materials.py)

| 模型 | 说明 | 主要字段 |
|------|------|----------|
| **Material** | 物料信息 | name, code, spec, unit, stock_quantity |
| **Supplier** | 供应商 | name, code, contact, phone |
| **MaterialSupplier** | 物料供应商 | material, supplier, is_primary |
| **PurchaseOrder** | 采购单 | supplier, order_date, status, total_amount |
| **PurchaseOrderItem** | 采购明细 | purchase_order, material, quantity, unit_price |

#### 6.1.5 资产管理模型 (models/assets.py)

| 模型 | 说明 | 主要字段 |
|------|------|----------|
| **Artwork** | 图稿 | name, code, file_path, version, status |
| **Die** | 刀模 | name, code, file_path, version |
| **FoilingPlate** | 烫金版 | name, code, file_path, version |
| **EmbossingPlate** | 压凸版 | name, code, file_path, version |

#### 6.1.6 销售管理模型 (models/sales.py)

| 模型 | 说明 | 主要字段 |
|------|------|----------|
| **SalesOrder** | 销售订单 | order_no, customer, order_date, status, total_amount |
| **SalesOrderItem** | 订单明细 | sales_order, product, quantity, unit_price |

### 6.2 关系设计

```
Customer (1) ←→ (N) WorkOrder
WorkOrder (1) ←→ (N) WorkOrderProcess
WorkOrder (1) ←→ (N) WorkOrderProduct
WorkOrder (1) ←→ (N) WorkOrderTask
WorkOrderProcess (N) ←→ (1) Process
WorkOrderProduct (N) ←→ (1) Product
Product (1) ←→ (N) ProductMaterial
Product (N) ←→ (N) Material
WorkOrderTask (N) ←→ (1) User (assigned_operator)
Department (1) ←→ (N) Process
```

### 6.3 索引策略

```python
# 复合索引示例
class Meta:
    indexes = [
        # 施工单状态和优先级
        models.Index(fields=['status', 'priority'], name='idx_status_priority'),

        # 任务分派和状态
        models.Index(fields=['assigned_operator', 'status'], name='idx_operator_status'),

        # 时间序列查询
        models.Index(fields=['-created_at'], name='idx_created_at'),

        # 客户查询
        models.Index(fields=['customer', '-created_at'], name='idx_customer_time'),
    ]
```

---

## 7. API设计

### 7.1 RESTful API规范

#### 7.1.1 URL设计规范

```
GET    /api/workorders/           # 列表
POST   /api/workorders/           # 创建
GET    /api/workorders/{id}/      # 详情
PUT    /api/workorders/{id}/      # 更新
PATCH  /api/workorders/{id}/      # 部分更新
DELETE /api/workorders/{id}/      # 删除
```

#### 7.1.2 查询参数规范

```
GET /api/workorders/?status=in_progress&priority__gte=3&page=1&page_size=20

参数说明:
- status: 状态过滤
- priority__gte: 优先级大于等于
- page: 页码
- page_size: 每页数量
- ordering: 排序字段 (如: -created_at)
- search: 搜索关键字
```

#### 7.1.3 响应格式

```json
// 成功响应
{
  "count": 100,
  "next": "/api/workorders/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "order_no": "WO20260118001",
      "customer": {
        "id": 1,
        "name": "ABC公司"
      },
      "status": "in_progress",
      "created_at": "2026-01-18T10:00:00Z"
    }
  ]
}

// 错误响应
{
  "error": "Validation Error",
  "message": "客户信息不能为空",
  "details": {
    "customer": ["此字段为必填项"]
  }
}
```

### 7.2 API分类

#### 7.2.1 认证API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/auth/login/ | POST | 用户登录 |
| /api/auth/logout/ | POST | 用户登出 |
| /api/auth/user/ | GET | 获取当前用户信息 |
| /api/auth/change-password/ | POST | 修改密码 |

#### 7.2.2 基础数据API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/customers/ | GET/POST | 客户列表/创建 |
| /api/customers/{id}/ | GET/PUT/DELETE | 客户详情 |
| /api/departments/ | GET/POST | 部门列表/创建 |
| /api/departments/{id}/ | GET/PUT | 部门详情 |
| /api/processes/ | GET/POST | 工序列表/创建 |
| /api/processes/{id}/ | GET/PUT | 工序详情 |

#### 7.2.3 施工单API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/workorders/ | GET/POST | 施工单列表/创建 |
| /api/workorders/{id}/ | GET/PUT/PATCH | 施工单详情 |
| /api/workorders/{id}/approve/ | POST | 审核施工单 |
| /api/workorders/{id}/reject/ | POST | 拒绝施工单 |
| /api/workorders/{id}/processes/ | GET | 获取工序列表 |
| /api/workorders/{id}/products/ | GET | 获取产品列表 |
| /api/workorders/{id}/tasks/ | GET | 获取任务列表 |
| /api/workorders/{id}/progress/ | GET | 获取进度 |

#### 7.2.4 任务API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/workorder-tasks/ | GET | 任务列表 |
| /api/workorder-tasks/{id}/ | GET/PATCH | 任务详情 |
| /api/workorder-tasks/{id}/start/ | POST | 开始任务 |
| /api/workorder-tasks/{id}/complete/ | POST | 完成任务 |
| /api/workorder-tasks/{id}/assign/ | POST | 分派任务 |
| /api/workorder-tasks/batch-assign/ | POST | 批量分派 |
| /api/workorder-tasks/my-tasks/ | GET | 我的任务 |

#### 7.2.5 产品API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/products/ | GET/POST | 产品列表/创建 |
| /api/products/{id}/ | GET/PUT/DELETE | 产品详情 |
| /api/product-groups/ | GET/POST | 产品组列表/创建 |
| /api/products/{id}/materials/ | GET | 产品物料 |

#### 7.2.6 物料API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/materials/ | GET/POST | 物料列表/创建 |
| /api/materials/{id}/ | GET/PUT/DELETE | 物料详情 |
| /api/suppliers/ | GET/POST | 供应商列表/创建 |
| /api/purchase-orders/ | GET/POST | 采购单列表/创建 |
| /api/purchase-orders/{id}/approve/ | POST | 审核采购单 |

#### 7.2.7 资产API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/artworks/ | GET/POST | 图稿列表/创建 |
| /api/artworks/{id}/ | GET/PUT | 图稿详情 |
| /api/artworks/{id}/upload/ | POST | 上传图稿文件 |
| /api/dies/ | GET/POST | 刀模列表/创建 |
| /api/foiling-plates/ | GET/POST | 烫金版列表/创建 |
| /api/embossing-plates/ | GET/POST | 压凸版列表/创建 |

#### 7.2.8 销售API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/sales-orders/ | GET/POST | 销售订单列表/创建 |
| /api/sales-orders/{id}/ | GET/PUT | 销售订单详情 |
| /api/sales-orders/{id}/items/ | GET | 订单明细 |

#### 7.2.9 通知API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/notifications/ | GET | 通知列表 |
| /api/notifications/{id}/read/ | POST | 标记已读 |
| /api/notifications/read-all/ | POST | 全部已读 |
| /api/notifications/unread-count/ | GET | 未读数量 |

#### 7.2.10 监控API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/monitoring/dashboard/ | GET | 仪表盘数据 |
| /api/monitoring/workorder-stats/ | GET | 施工单统计 |
| /api/monitoring/task-stats/ | GET | 任务统计 |
| /api/monitoring/performance/ | GET | 性能指标 |

### 7.3 API权限控制

```python
# views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

class WorkOrderViewSet(viewsets.ModelViewSet):
    """
    施工单API视图集

    权限要求:
    - 列表: 认证用户
    - 创建: 业务员或管理员
    - 更新: 业务员或管理员
    - 删除: 仅管理员
    """
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """根据操作类型动态设置权限"""
        if self.action == 'destroy':
            return [IsAdminUser()]
        return super().get_permissions()

    def get_queryset(self):
        """根据用户角色过滤数据"""
        user = self.request.user
        if user.is_superuser:
            return WorkOrder.objects.all()
        elif user.groups.filter(name='业务员').exists():
            return WorkOrder.objects.filter(salesperson=user)
        else:
            return WorkOrder.objects.filter(status='approved')
```

### 7.4 API版本控制

```python
# urls.py
from rest_framework.versioning import URLPathVersioning

versioning_class = URLPathVersioning
VERSION_SCHEMA = 'v1'

urlpatterns = [
    re_path(r'^api/v1/', include('workorder.urls')),
]
```

---

## 8. 状态管理

### 8.1 Vuex架构

#### 8.1.1 Store结构

```
store/
├── index.js              # Store主文件
└── modules/
    ├── user.js          # 用户状态
    ├── workOrder.js     # 施工单状态
    ├── task.js          # 任务状态
    ├── ui.js            # UI状态
    └── cache.js         # 缓存管理
```

#### 8.1.2 状态模块设计原则

1. **单一职责**: 每个模块负责一个领域的状态
2. **模块化**: 状态按业务领域拆分
3. **命名规范**: 使用大写下划线命名mutation和action
4. **异步处理**: Action处理异步,mutation处理同步

### 8.2 核心状态模块

#### 8.2.1 用户模块 (user.js)

```javascript
const state = {
  user: null,              // 当前用户信息
  token: null,             // 认证token
  permissions: [],         // 用户权限列表
  roles: []               // 用户角色列表
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
  },
  SET_TOKEN(state, token) {
    state.token = token
    localStorage.setItem('token', token)
  },
  SET_PERMISSIONS(state, permissions) {
    state.permissions = permissions
  }
}

const actions = {
  async login({ commit }, credentials) {
    const { data } = await authApi.login(credentials)
    commit('SET_TOKEN', data.token)
    commit('SET_USER', data.user)
    return data
  },
  async logout({ commit }) {
    await authApi.logout()
    commit('SET_TOKEN', null)
    commit('SET_USER', null)
  }
}
```

#### 8.2.2 施工单模块 (workOrder.js)

```javascript
const state = {
  list: [],                // 施工单列表
  current: null,           // 当前查看的施工单
  total: 0,               // 总数
  loading: false,         // 加载状态
  filters: {              // 过滤条件
    status: '',
    priority: '',
    customer: ''
  }
}

const mutations = {
  SET_LIST(state, list) {
    state.list = list
  },
  SET_CURRENT(state, workOrder) {
    state.current = workOrder
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  UPDATE_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters }
  }
}

const actions = {
  async fetchList({ commit, state }) {
    commit('SET_LOADING', true)
    const { data } = await workorderApi.list(state.filters)
    commit('SET_LIST', data.results)
    commit('SET_TOTAL', data.count)
    commit('SET_LOADING', false)
  },
  async fetchDetail({ commit }, id) {
    const { data } = await workorderApi.detail(id)
    commit('SET_CURRENT', data)
    return data
  }
}
```

#### 8.2.3 任务模块 (task.js)

```javascript
const state = {
  list: [],
  viewMode: 'kanban',     // kanban | list | timeline
  filters: {
    status: '',
    assigned_to: '',
    process: ''
  }
}

const mutations = {
  SET_VIEW_MODE(state, mode) {
    state.viewMode = mode
    localStorage.setItem('task_view_mode', mode)
  }
}
```

#### 8.2.4 UI模块 (ui.js)

```javascript
const state = {
  sidebarCollapsed: false,
  theme: 'light'
}

const mutations = {
  TOGGLE_SIDEBAR(state) {
    state.sidebarCollapsed = !state.sidebarCollapsed
  }
}
```

#### 8.2.5 缓存模块 (cache.js)

```javascript
const state = {
  cache: {},              // 缓存数据
  timestamps: {}          // 缓存时间戳
}

const mutations = {
  SET_CACHE(state, { key, value, ttl = 300000 }) {
    state.cache[key] = value
    state.timestamps[key] = Date.now() + ttl
  },
  CLEAR_CACHE(state, key) {
    delete state.cache[key]
    delete state.timestamps[key]
  }
}

const getters = {
  getCache: (state) => (key) => {
    const timestamp = state.timestamps[key]
    if (timestamp && Date.now() > timestamp) {
      // 缓存过期
      delete state.cache[key]
      delete state.timestamps[key]
      return null
    }
    return state.cache[key] || null
  }
}
```

### 8.3 状态持久化

```javascript
// vuex-persistedstates配置
import createPersistedState from 'vuex-persistedstate'

const store = new Vuex.Store({
  plugins: [
    createPersistedState({
      key: 'workorder_app',
      paths: ['user.token', 'user.user', 'task.viewMode', 'ui.sidebarCollapsed'],
      storage: window.sessionStorage  // 使用sessionStorage
    })
  ]
})
```

---

## 9. 路由与导航

### 9.1 路由配置

#### 9.1.1 路由结构

```javascript
// router/index.js
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import(
          /* webpackChunkName: "dashboard" */
          /* webpackPrefetch: true */
          '@/views/Dashboard.vue'
        ),
        meta: { title: '工作台' }
      },
      {
        path: 'workorders',
        name: 'WorkOrderList',
        component: () => import('@/views/workorder/WorkOrderList.vue'),
        meta: { title: '施工单列表', permission: 'workorder.view' }
      },
      {
        path: 'workorders/create',
        name: 'WorkOrderCreate',
        component: () => import('@/views/workorder/WorkOrderForm.vue'),
        meta: { title: '创建施工单', permission: 'workorder.create' }
      },
      {
        path: 'workorders/:id',
        name: 'WorkOrderDetail',
        component: () => import('@/views/workorder/WorkOrderDetail.vue'),
        meta: { title: '施工单详情' }
      },
      {
        path: 'tasks',
        name: 'TaskList',
        component: () => import('@/views/task/TaskList.vue'),
        meta: { title: '任务管理' }
      },
      // ... 更多路由
    ]
  }
]
```

#### 9.1.2 路由元信息

```javascript
meta: {
  title: '页面标题',           // 显示在浏览器标签
  requiresAuth: true,         // 是否需要认证
  permission: 'workorder.view', // 需要的权限
  keepAlive: true,           // 是否缓存页面
  preload: true              // 是否预加载
}
```

### 9.2 路由守卫

```javascript
// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title
    ? `${to.meta.title} - 印刷施工单系统`
    : '印刷施工单系统'

  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    const token = store.state.user.token
    if (!token) {
      // 未登录,跳转到登录页
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }

    // 检查用户信息
    if (!store.state.user.user) {
      try {
        await store.dispatch('user/fetchUserInfo')
      } catch (error) {
        // 获取用户信息失败,清除token
        store.commit('user/SET_TOKEN', null)
        return next('/login')
      }
    }

    // 检查权限
    if (to.meta.permission) {
      const hasPermission = store.getters['user/hasPermission'](to.meta.permission)
      if (!hasPermission) {
        // 无权限,跳转到403页面
        return next({ name: 'Forbidden' })
      }
    }
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 页面访问统计
  if (to.meta.requiresAuth !== false) {
    analytics.trackPageView(to.path, to.meta.title)
  }
})
```

### 9.3 路由懒加载与代码分割

```javascript
// Webpack魔法注释
const WorkOrderDetail = () => import(
  /* webpackChunkName: "workorder-detail" */
  /* webpackPrefetch: true */
  /* webpackPreload: true */
  '@/views/workorder/WorkOrderDetail.vue'
)

// 说明:
// - webpackChunkName: 指定chunk名称,用于代码分组
// - webpackPrefetch: 浏览器空闲时预加载
// - webpackPreload: 父chunk加载时并行预加载
```

### 9.4 导航编程

```javascript
// 声明式导航
<router-link :to="{ name: 'WorkOrderDetail', params: { id: workorder.id } }">
  查看详情
</router-link>

// 编程式导航
this.$router.push({
  name: 'WorkOrderDetail',
  params: { id: workorder.id },
  query: { tab: 'processes' }
})

// 带确认的导航
async beforeRouteLeave(to, from, next) {
  if (this.hasUnsavedChanges) {
    const confirmed = await this.$confirm('有未保存的更改,确定要离开吗?')
    if (confirmed) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
}
```

---

## 10. 业务流程

### 10.1 施工单生命周期

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  草稿   │ → │ 待审核  │ → │ 已审核  │ → │ 进行中  │ → │ 已完成  │
│ draft   │    │ pending │    │approved │    │progress │    │completed│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     ↓              ↓              ↓              ↓              ↓
  创建提交        业务审核        生产执行        进度跟踪        完成入库
                   ↓
              ┌─────────┐
              │ 已取消  │
              │cancelled│
              └─────────┘
```

### 10.2 核心业务流程

#### 10.2.1 施工单创建流程

```python
# 后端处理流程
def create_workorder(data):
    """
    施工单创建流程
    """
    # 1. 数据验证
    validate_workorder_data(data)

    # 2. 创建施工单
    workorder = WorkOrder.objects.create(**data)

    # 3. 关联工序
    for process_data in data['processes']:
        WorkOrderProcess.objects.create(
            workorder=workorder,
            **process_data
        )

    # 4. 关联产品
    for product_data in data['products']:
        WorkOrderProduct.objects.create(
            workorder=workorder,
            **product_data
        )

    # 5. 生成任务
    generate_tasks(workorder)

    # 6. 记录日志
    ProcessLog.objects.create(
        workorder=workorder,
        action='创建施工单',
        operator=data['creator']
    )

    return workorder
```

#### 10.2.2 审核流程

```python
def approve_workorder(workorder_id, reviewer, comment):
    """
    审核施工单
    """
    workorder = WorkOrder.objects.get(id=workorder_id)

    # 1. 检查状态
    if workorder.status != 'pending':
        raise ValidationError('只能审核待审核状态的施工单')

    # 2. 执行审核
    workorder.status = 'approved'
    workorder.approved_by = reviewer
    workorder.approved_at = timezone.now()
    workorder.save()

    # 3. 生成生产任务
    if workorder.tasks.count() == 0:
        generate_tasks(workorder)

    # 4. 发送通知
    send_notification(
        recipients=workorder.salesperson,
        message='施工单已审核通过',
        workorder=workorder
    )

    # 5. 记录日志
    ProcessLog.objects.create(
        workorder=workorder,
        action='审核通过',
        operator=reviewer,
        comment=comment
    )

    return workorder
```

#### 10.2.3 任务生成流程

```python
def generate_tasks(workorder):
    """
    根据工序自动生成任务
    """
    processes = workorder.processes.all()

    for wop in processes:
        process = wop.process

        # 根据工序代码生成不同类型的任务
        if process.code == 'CTP':
            # 制版任务: 为每个图稿生成任务
            artworks = workorder.artworks.all()
            for artwork in artworks:
                WorkOrderTask.objects.create(
                    workorder=workorder,
                    process=wop,
                    name=f'{process.name} - {artwork.name}',
                    task_type='ctp',
                    artwork=artwork
                )

        elif process.code == 'PRT':
            # 印刷任务: 为每个图稿生成任务
            artworks = workorder.artworks.all()
            for artwork in artworks:
                WorkOrderTask.objects.create(
                    workorder=workorder,
                    process=wop,
                    name=f'{process.name} - {artwork.name}',
                    task_type='printing',
                    artwork=artwork,
                    quantity=workorder.quantity
                )

        else:
            # 通用任务
            WorkOrderTask.objects.create(
                workorder=workorder,
                process=wop,
                name=process.name,
                task_type='general'
            )
```

#### 10.2.4 任务分派流程

```python
def assign_tasks(task_ids, strategy='least_tasks'):
    """
    批量分派任务
    """
    strategy_map = {
        'least_tasks': assign_least_tasks,
        'random': assign_random,
        'round_robin': assign_round_robin,
        'first_available': assign_first_available
    }

    strategy_func = strategy_map.get(strategy, assign_least_tasks)

    for task_id in task_ids:
        task = WorkOrderTask.objects.get(id=task_id)

        # 获取可分派的操作员
        operators = get_available_operators(task.process)

        # 使用策略选择操作员
        operator = strategy_func(operators)

        # 分派任务
        task.assigned_operator = operator
        task.assigned_at = timezone.now()
        task.save()

        # 记录日志
        TaskLog.objects.create(
            task=task,
            action='任务分派',
            operator=operator
        )

        # 发送通知
        send_notification(
            recipients=operator,
            message='您有新的任务',
            task=task
        )
```

### 10.3 状态机设计

```python
class WorkOrderStatus:
    """施工单状态机"""

    # 状态定义
    DRAFT = 'draft'
    PENDING = 'pending'
    APPROVED = 'approved'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

    # 状态转换规则
    TRANSITIONS = {
        DRAFT: [PENDING, CANCELLED],
        PENDING: [APPROVED, DRAFT, CANCELLED],
        APPROVED: [IN_PROGRESS, CANCELLED],
        IN_PROGRESS: [COMPLETED, CANCELLED],
        COMPLETED: [],
        CANCELLED: []
    }

    @classmethod
    def can_transition(cls, from_status, to_status):
        """检查状态转换是否合法"""
        return to_status in cls.TRANSITIONS.get(from_status, [])
```

---

## 11. 性能优化

### 11.1 数据库优化

#### 11.1.1 查询优化

```python
# N+1查询问题
# 错误示例
tasks = WorkOrderTask.objects.all()
for task in tasks:
    print(task.workorder.customer.name)  # N+1查询

# 正确示例: 使用select_related
tasks = WorkOrderTask.objects.select_related(
    'workorder__customer'
).all()

# 正确示例: 使用prefetch_related
workorders = WorkOrder.objects.prefetch_related(
    'processes__process',
    'products__product',
    'tasks__assigned_operator'
).all()
```

#### 11.1.2 索引优化

```python
class WorkOrder(models.Model):
    class Meta:
        indexes = [
            # 单列索引
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),

            # 复合索引
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['customer', '-created_at']),

            # 函数索引 (PostgreSQL)
            models.Index(
                models.functions.Lower('order_no'),
                name='idx_order_no_lower'
            ),
        ]
```

#### 11.1.3 分页优化

```python
# 使用CursorPagination代替LimitOffsetPagination
from rest_framework.pagination import CursorPagination

class WorkOrderCursorPagination(CursorPagination):
    page_size = 20
    ordering = '-created_at'

# 视图中使用
class WorkOrderViewSet(viewsets.ModelViewSet):
    pagination_class = WorkOrderCursorPagination
```

### 11.2 缓存策略

#### 11.2.1 Redis缓存

```python
from django.core.cache import cache

def get_workorder_detail(workorder_id):
    """获取施工单详情(带缓存)"""
    cache_key = f'workorder:{workorder_id}'

    # 尝试从缓存获取
    workorder = cache.get(cache_key)
    if workorder:
        return workorder

    # 缓存未命中,从数据库查询
    workorder = WorkOrder.objects.get(id=workorder_id)

    # 存入缓存(5分钟过期)
    cache.set(cache_key, workorder, timeout=300)

    return workorder

# 缓存失效
def update_workorder(workorder_id, data):
    """更新施工单"""
    workorder = WorkOrder.objects.get(id=workorder_id)
    workorder.update(**data)

    # 删除缓存
    cache_key = f'workorder:{workorder_id}'
    cache.delete(cache_key)

    return workorder
```

#### 11.2.2 前端缓存

```javascript
// Vuex缓存模块
const cache = {
  SET_CACHE(state, { key, value, ttl = 300000 }) {
    state.cache[key] = value
    state.timestamps[key] = Date.now() + ttl

    // 持久化到localStorage
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      value,
      expire: Date.now() + ttl
    }))
  },

  getCache(state) {
    return (key) => {
      // 检查是否过期
      const timestamp = state.timestamps[key]
      if (timestamp && Date.now() > timestamp) {
        this.commit('cache/CLEAR_CACHE', key)
        return null
      }
      return state.cache[key] || null
    }
  }
}
```

### 11.3 前端性能优化

#### 11.3.1 虚拟滚动

```vue
<template>
  <virtual-list
    :data-sources="largeDataList"
    :data-key="'id'"
    :keeps="30"
    :estimate-size="50"
  >
    <template #default="{ data }">
      <div class="list-item">
        {{ data.name }}
      </div>
    </template>
  </virtual-list>
</template>
```

#### 11.3.2 防抖与节流

```javascript
import { debounce, throttle } from 'lodash'

export default {
  methods: {
    // 防抖: 搜索输入
    search: debounce(function(query) {
      this.fetchSearchResults(query)
    }, 300),

    // 节流: 滚动事件
    onScroll: throttle(function() {
      this.updateScrollPosition()
    }, 100)
  }
}
```

#### 11.3.3 组件懒加载

```vue
<template>
  <div>
    <button @click="showChart = true">显示图表</button>

    <!-- 仅在需要时加载 -->
    <gantt-chart
      v-if="showChart"
      :data="chartData"
    />
  </div>
</template>

<script>
export default {
  components: {
    GanttChart: () => import('@/components/GanttChart.vue')
  }
}
</script>
```

---

## 12. 部署架构

### 12.1 开发环境

```
┌─────────────────────────────────────┐
│       前端开发服务器 (npm serve)      │
│           localhost:8080             │
└─────────────────────────────────────┘
              ↓ CORS
┌─────────────────────────────────────┐
│      后端开发服务器 (Django)         │
│        localhost:8000/api/           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│        SQLite数据库                   │
└─────────────────────────────────────┘
```

### 12.2 生产环境

```
                                    Internet
                                       ↓
┌───────────────────────────────────────────────────────┐
│                  Nginx (80/443)                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │     SSL/TLS终止                                 │  │
│  │     静态文件服务 (frontend/dist/)               │  │
│  │     反向代理到Gunicorn                          │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────┐
│            Gunicorn (8000)                            │
│              Django应用                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │     API服务器                                   │  │
│  │     后台任务处理 (Celery可选)                   │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
        ↓                           ↓
┌─────────────────┐       ┌─────────────────┐
│  PostgreSQL     │       │  Redis          │
│  (主数据库)      │       │  (缓存/队列)     │
└─────────────────┘       └─────────────────┘
```

### 12.3 部署配置

#### 12.3.1 Nginx配置

```nginx
# /etc/nginx/sites-available/workorder

server {
    listen 80;
    server_name workorder.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name workorder.example.com;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/workorder.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workorder.example.com/privkey.pem;

    # 前端静态文件
    location / {
        root /var/www/workorder/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 媒体文件
    location /media/ {
        alias /var/www/workorder/backend/media/;
    }

    # 静态文件
    location /static/ {
        alias /var/www/workorder/backend/static/;
    }
}
```

#### 12.3.2 Gunicorn配置

```python
# gunicorn_config.py
import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# 日志
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"

# 进程名称
proc_name = "workorder_gunicorn"

# 守护进程
daemon = False
```

#### 12.3.3 Django生产配置

```python
# settings/production.py
from .base import *

DEBUG = False

ALLOWED_HOSTS = ['workorder.example.com']

# 数据库
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': 'require',
        }
    }
}

# 缓存
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'workorder',
    }
}

# 静态文件
STATIC_ROOT = '/var/www/workorder/backend/static/'
MEDIA_ROOT = '/var/www/workorder/backend/media/'

# 安全设置
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# 日志
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/error.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

### 12.4 部署步骤

#### 12.4.1 前端部署

```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 部署到服务器
scp -r dist/* user@server:/var/www/workorder/frontend/dist/

# 3. 配置Nginx (见上方配置)
sudo nginx -t
sudo systemctl reload nginx
```

#### 12.4.2 后端部署

```bash
# 1. 安装依赖
cd backend
pip install -r requirements.txt

# 2. 数据库迁移
python manage.py migrate

# 3. 收集静态文件
python manage.py collectstatic --noinput

# 4. 创建超级用户
python manage.py createsuperuser

# 5. 启动Gunicorn
gunicorn config.wsgi:application -c gunicorn_config.py

# 6. 配置systemd服务
sudo nano /etc/systemd/system/workorder.service
```

#### 12.4.3 Systemd服务配置

```ini
# /etc/systemd/system/workorder.service
[Unit]
Description=WorkOrder Django Application
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/workorder/backend
Environment="PATH=/var/www/workorder/backend/venv/bin"
ExecStart=/var/www/workorder/backend/venv/bin/gunicorn \
    --config gunicorn_config.py \
    config.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 启动服务
sudo systemctl start workorder
sudo systemctl enable workorder
sudo systemctl status workorder
```

---

## 附录

### A. 环境变量配置

```bash
# .env文件
# Django配置
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=workorder.example.com

# 数据库
DB_NAME=workorder_db
DB_USER=workorder_user
DB_PASSWORD=secure-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/1

# Email配置
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=notifications@example.com
EMAIL_HOST_PASSWORD=email-password

# 前端配置
VUE_APP_API_BASE_URL=https://workorder.example.com/api
VUE_APP_TITLE=印刷施工单跟踪系统
```

### B. 常用命令

```bash
# Django管理命令
python manage.py runserver              # 启动开发服务器
python manage.py migrate                # 运行迁移
python manage.py makemigrations         # 创建迁移
python manage.py shell                  # Django Shell
python manage.py createsuperuser        # 创建超级用户
python manage.py collectstatic          # 收集静态文件

# 自定义管理命令
python manage.py init_groups            # 初始化用户组
python manage.py assign_permissions     # 分配权限
python manage.py load_initial_users     # 加载测试用户
python manage.py reset_processes        # 重置工序数据

# 前端命令
npm run serve                           # 启动开发服务器
npm run build                           # 构建生产版本
npm run lint                            # 代码检查
npm test                                # 运行测试
```

### C. 故障排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| CORS错误 | 前端后端域名不一致 | 配置CORS_ALLOWED_ORIGINS |
| 502错误 | Gunicorn未启动 | 检查systemd状态 |
| 静态文件404 | 未收集静态文件 | 运行collectstatic |
| 数据库连接失败 | 数据库配置错误 | 检查DATABASES设置 |
| 权限错误 | 用户权限不足 | 检查用户组和权限配置 |

### D. 性能基准

| 指标 | 目标值 | 实际值 |
|------|--------|--------|
| API响应时间 | < 200ms | 平均150ms |
| 页面加载时间 | < 2s | 平均1.5s |
| 并发用户数 | 100+ | 支持200+ |
| 数据库查询 | < 50ms | 平均30ms |

---

## 文档修订历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0.0 | 2026-01-18 | 开发团队 | 初始版本 |

---

## 参考资料

- [Django官方文档](https://docs.djangoproject.com/)
- [Django REST Framework文档](https://www.django-rest-framework.org/)
- [Vue.js官方文档](https://vuejs.org/)
- [Element UI文档](https://element.eleme.io/)
- [项目README.md](../README.md)
- [快速开始指南](./QUICKSTART.md)
