# 开发者指南

> 版本：v1.0.1  
> 更新时间：2026-02-26

## 项目结构

```
work_order/
├── backend/                    # Django 后端
│   ├── config/               # Django 配置
│   │   ├── settings.py       # 主配置
│   │   ├── asgi.py          # ASGI 配置 (WebSocket)
│   │   ├── urls.py           # URL 路由
│   │   └── wsgi.py          # WSGI 配置
│   ├── workorder/           # 主应用
│   │   ├── models/           # 数据模型（模块化）
│   │   │   ├── core.py      # 核心模型（施工单、任务）
│   │   │   ├── materials.py  # 物料模型
│   │   │   ├── products.py   # 产品模型
│   │   │   ├── sales.py      # 销售模型
│   │   │   ├── finance.py    # 财务模型
│   │   │   ├── inventory.py   # 库存模型
│   │   │   └── ...
│   │   ├── views/            # API 视图（模块化）
│   │   ├── serializers/       # 序列化器（模块化）
│   │   ├── admin/            # Admin 配置（模块化）
│   │   ├── services/         # 业务逻辑服务
│   │   ├── migrations/       # 数据库迁移
│   │   └── urls.py          # 应用路由
│   └── requirements.txt
├── frontend/                  # Vue.js 前端
│   ├── src/
│   │   ├── api/            # API 接口
│   │   │   ├── base/       # BaseAPI 基类
│   │   │   └── modules/    # API 模块（32个）
│   │   ├── views/          # 页面组件
│   │   ├── components/     # 通用组件
│   │   ├── mixins/         # Vue Mixins
│   │   ├── store/          # Vuex 状态管理
│   │   │   └── modules/    # Store 模块
│   │   ├── router/         # 路由配置
│   │   ├── utils/           # 工具函数
│   │   └── constants/       # 常量定义
│   └── package.json
├── docs/                      # 项目文档
├── start.sh                   # 一键启动脚本
├── Dockerfile
└── docker-compose.yml
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 2.7 |
| UI 组件 | Element UI 2.15 |
| 状态管理 | Vuex 3 |
| 路由 | Vue Router 3 |
| HTTP 客户端 | Axios |
| 后端框架 | Django 4.2 |
| REST API | Django REST Framework 3.14 |
| WebSocket | Django Channels |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） |

## 快速启动

```bash
# 一键启动前后端
./start.sh

# 或手动启动
# 后端
cd backend
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# 前端
cd frontend
npm run serve
```

访问：http://localhost:8080

## 数据库初始化

```bash
cd backend

# 创建迁移
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 加载测试用户
python manage.py load_initial_users

# 加载示例产品（可选）
python manage.py loaddata workorder/fixtures/initial_products.json
```

## 前端 API 模块

项目采用模块化 API 设计，位于 `frontend/src/api/modules/`：

| 模块 | 说明 |
|------|------|
| auth.js | 认证 |
| workorder.js | 施工单 |
| workorder-task.js | 任务 |
| workorder-process.js | 工序 |
| workorder-material.js | 施工单物料 |
| workorder-product.js | 施工单产品 |
| customer.js | 客户 |
| product.js | 产品 |
| product-group.js | 产品组 |
| material.js | 物料 |
| process.js | 工序 |
| department.js | 部门 |
| artwork.js | 图稿 |
| die.js | 刀模 |
| foiling-plate.js | 烫金版 |
| embossing-plate.js | 压凸版 |
| supplier.js | 供应商 |
| invoice.js | 发票 |
| payment.js | 付款 |
| statement.js | 对账单 |
| production-cost.js | 生产成本 |
| product-stock.js | 产品库存 |
| delivery-order.js | 送货单 |
| quality-inspection.js | 质检 |
| stock-in.js | 入库 |
| stock-out.js | 出库 |
| sales-order.js | 销售订单 |
| purchase.js | 采购 |
| notification.js | 通知 |
| task-assignment-rule.js | 任务分配规则 |

**使用方式**：
```javascript
import { workorderAPI, customerAPI } from '@/api/modules'

// 获取列表
const list = await workorderAPI.getList({ page: 1 })

// 获取详情
const detail = await workorderAPI.getDetail(id)

// 创建
await workorderAPI.create(data)
```

## Vuex Store 模块

位于 `frontend/src/store/modules/`：

| 模块 | 说明 |
|------|------|
| user.js | 用户信息、认证状态 |
| workOrder.js | 施工单数据 |
| task.js | 任务数据 |
| notification.js | 通知数据 |
| ui.js | UI 状态（侧边栏、主题等） |
| cache.js | 缓存管理 |

**使用方式**：
```javascript
// 获取用户
const user = this.$store.getters['user/currentUser']
const isLogin = this.$store.getters['user/isAuthenticated']

// 提交 action
await this.$store.dispatch('user/login', credentials)
```

## 前端 Mixins

位于 `frontend/src/mixins/`：

| Mixin | 说明 |
|-------|------|
| listPageMixin.js | 列表页面通用逻辑 |
| crudMixin.js | CRUD 操作 |
| crudPermissionMixin.js | CRUD 权限检查 |
| permissionMixin.js | 权限检查 |
| formDialogMixin.js | 表单弹窗 |
| exportMixin.js | 导出功能 |
| statisticsMixin.js | 统计功能 |

## 废弃文件说明

以下文件已删除或废弃，请勿继续引用：

- `frontend/src/api/auth.js`（废弃，已由 `frontend/src/api/modules/auth.js` 替代）
- `frontend/src/api/user.js`（废弃，已由 `frontend/src/api/modules/auth.js` 替代）
- `frontend/src/config/index.js.template`（废弃）
- `frontend/src/views/workorder/Detail.vue`（废弃，已由 `WorkOrderDetail.vue` 统一承载）

## Console 语句规范

目标：生产环境不直接使用 `console.*`，统一走工具封装。

建议做法：
- 记录错误：`ErrorHandler.handle(error, 'Context')` 或 `ErrorHandler.showMessage(error, '描述')`
- 记录日志：`logger.info/warn/error/debug`
- WebSocket 日志：通过 `VUE_APP_WS_LOG=true` 启用
- 保留范围：仅允许 `utils/logger.js` 内部使用 `console.*`（开发环境）

## 组件拆分指南

当组件超过 500 行或包含多个业务域时，建议拆分：

1. 抽离 UI 子组件（表格/表单/对话框）
2. 抽离业务逻辑到 `services/` 或 `api/modules/`
3. 复用逻辑优先用 `mixins/` 或 `composables/`
4. 组件通信通过 `props` + `events`，避免跨层级访问
5. 拆分后优先保证功能回归测试通过

## 后端管理命令

```bash
# 重置工序数据
python manage.py reset_processes

# 初始化用户组和权限
python manage.py init_groups

# 分配权限
python manage.py assign_permissions <username> <group_name>
```

## 测试

```bash
# 后端测试
cd backend
python manage.py test

# 前端测试
cd frontend
npm test
```

## 代码检查

```bash
# 前端 lint
cd frontend
npm run lint

# 构建生产版本
cd frontend
npm run build
```

## 开发规范

### 前端

- 组件命名：PascalCase（如 `WorkOrderList.vue`）
- API 模块继承 BaseAPI
- 列表页面使用 `listPageMixin` + `crudPermissionMixin`

### 后端

- Python PEP 8 规范
- 模型/视图/序列化器模块化
- 使用 Django Admin 进行数据管理

## 项目特性

- 施工单管理（创建、编辑、审核、跟踪）
- 21个预设工序
- 任务自动生成
- 11个预设部门
- 客户/产品/物料管理
- 图稿/刀模/烫金版管理
- WebSocket 实时通知
