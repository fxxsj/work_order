# 印刷施工单跟踪系统

一个基于 Vue 2 + Element UI + Django 4.2 的印刷施工单跟踪管理系统，支持施工单管理、工序跟踪、任务管理、客户管理、物料管理等完整业务流程。

## 功能特性

### 核心功能

- **施工单管理**
  - 创建、编辑、查看、删除施工单
  - 施工单状态跟踪（待开始、进行中、已暂停、已完成、已取消）
  - 施工单审核流程（待审核、已审核、已拒绝）
  - 优先级管理（低、普通、高、紧急）
  - 进度可视化显示
  - 交货日期预警
  - 已审核订单的受限编辑功能

- **工序管理**
  - 21个预设内置工序（制版、开料、印刷、覆膜、烫金、模切等）
  - 工序模板定义和标准工时设置
  - 部门与工序关联管理
  - 工序排序和状态管理
  - 内置工序保护（不可删除、编码只读）

- **任务管理**
  - 基于工序自动生成任务
  - 任务生成规则配置（按图稿、按刀模、按产品、按物料、通用）
  - 任务状态跟踪（待开始、进行中、已完成、已跳过）
  - 任务操作日志记录
  - 任务完成数量和不良品记录

- **客户管理**
  - 客户信息维护
  - 联系人和联系方式管理
  - 业务员关联

- **产品管理**
  - 产品信息维护
  - 产品默认工序配置
  - 产品默认物料配置
  - 产品组管理（支持套装产品）

- **物料管理**
  - 物料信息维护
  - 库存管理
  - 施工单物料用量记录

- **图稿和版管理**
  - 图稿管理（支持版本控制）
  - 刀模管理
  - 烫金版管理
  - 压凸版管理
  - 图稿与版的关联关系

- **部门管理**
  - 11个预设部门（6个管理部门 + 1个生产部 + 5个生产车间）
  - 部门层级关系支持
  - 部门与工序关联

- **权限管理**
  - 基于Django用户组的权限系统
  - 预设"业务员"用户组
  - 细粒度权限控制

- **数据统计**
  - 施工单状态统计
  - 优先级分布
  - 即将到期订单提醒

## 技术栈

### 前端
- **Vue 2.7** - 渐进式 JavaScript 框架
- **Element UI 2.15** - 基于 Vue 2 的组件库
- **Vue Router 3** - 路由管理
- **Vuex 3** - 状态管理
- **Axios** - HTTP 客户端

### 后端
- **Django 4.2** - Python Web 框架
- **Django REST Framework 3.14** - REST API 框架
- **Django Admin** - 管理后台
- **SQLite** - 数据库（可更换为 PostgreSQL/MySQL）

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 14+
- npm/yarn

### 后端安装

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 执行数据库迁移（会自动加载预设数据）
python manage.py migrate

# 创建超级管理员
python manage.py createsuperuser

# （可选）加载测试数据
python manage.py loaddata workorder/fixtures/initial_products.json
python manage.py load_initial_users

# 启动开发服务器
python manage.py runserver
```

后端服务将运行在 `http://localhost:8000`

**数据初始化说明**：
- 迁移时会自动加载：21个预设工序、11个预设部门、部门-工序关联、用户组
- 使用 `python manage.py load_initial_users` 加载11个测试用户（默认密码：123456）
- 使用 `python manage.py loaddata workorder/fixtures/initial_products.json` 加载6个示例产品

### 前端安装

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run serve
```

前端服务将运行在 `http://localhost:8080`

### 访问系统

- **前端界面**: http://localhost:8081
- **Django Admin**: http://localhost:8000/admin
- **API 文档**: http://localhost:8000/api

### 测试账号

系统预设了以下测试账号（通过 `load_initial_users` 命令加载）：
- 所有测试用户默认密码：`123456`
- 包括：业务员、财务员、设计员、采购员、运输员、生产主管及各车间操作员

⚠️ 生产环境请务必修改默认密码！

## 项目结构

```
work_order/
├── backend/                 # 后端项目
│   ├── config/             # Django 配置
│   │   ├── settings.py     # 设置文件
│   │   ├── urls.py         # URL 路由
│   │   └── wsgi.py         # WSGI 配置
│   ├── workorder/          # 施工单应用
│   │   ├── models.py       # 数据模型
│   │   ├── admin.py        # Admin 配置
│   │   ├── views.py        # API 视图
│   │   ├── serializers.py  # 序列化器
│   │   ├── urls.py         # URL 路由
│   │   ├── data.py         # 预设数据定义（单一数据源）
│   │   ├── fixtures/       # 测试数据
│   │   │   ├── initial_products.json
│   │   │   └── initial_users.json
│   │   ├── management/     # 管理命令
│   │   │   └── commands/
│   │   │       ├── reset_processes.py
│   │   │       ├── load_initial_users.py
│   │   │       └── init_groups.py
│   │   └── migrations/     # 数据库迁移
│   ├── manage.py           # Django 管理脚本
│   └── requirements.txt    # Python 依赖
│
├── frontend/               # 前端项目
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── assets/        # 资源文件
│   │   ├── components/    # 组件
│   │   ├── router/        # 路由配置
│   │   ├── store/         # Vuex 状态管理
│   │   ├── views/         # 页面视图
│   │   │   ├── Layout.vue          # 布局页面
│   │   │   ├── Dashboard.vue       # 工作台
│   │   │   ├── workorder/          # 施工单相关页面
│   │   │   │   ├── List.vue        # 列表页
│   │   │   │   ├── Detail.vue      # 详情页
│   │   │   │   └── Form.vue        # 表单页
│   │   │   ├── customer/           # 客户管理
│   │   │   ├── process/            # 工序管理
│   │   │   └── material/           # 物料管理
│   │   ├── App.vue        # 根组件
│   │   └── main.js        # 入口文件
│   ├── package.json       # Node 依赖
│   └── vue.config.js      # Vue 配置
│
├── docs/                   # 项目文档
│   ├── README.md          # 文档索引
│   ├── QUICKSTART.md      # 快速开始指南
│   ├── DATA_INITIALIZATION_ANALYSIS.md  # 数据初始化说明
│   └── ...                # 其他技术文档
│
└── README.md              # 项目说明
```

## 数据模型

### 核心模型

- **Customer** - 客户信息
- **Department** - 部门（支持层级关系）
- **Process** - 工序定义
- **Product** - 产品信息
- **ProductGroup** - 产品组（套装产品）
- **Material** - 物料信息
- **Artwork** - 图稿信息（支持版本控制）
- **Die** - 刀模信息
- **FoilingPlate** - 烫金版信息
- **EmbossingPlate** - 压凸版信息

### 业务模型

- **WorkOrder** - 施工单
- **WorkOrderProcess** - 施工单工序
- **WorkOrderProduct** - 施工单产品
- **WorkOrderMaterial** - 施工单物料
- **WorkOrderTask** - 施工单任务
- **WorkOrderApprovalLog** - 施工单审核日志
- **ProcessLog** - 工序日志
- **TaskLog** - 任务日志

### 关联模型

- **UserProfile** - 用户扩展信息（关联部门）
- **ProductMaterial** - 产品默认物料配置
- **ArtworkProduct** - 图稿与产品关联
- **DieProduct** - 刀模与产品关联
- **FoilingPlateProduct** - 烫金版与产品关联
- **EmbossingPlateProduct** - 压凸版与产品关联

## API 接口

### 认证接口
- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/logout/` - 用户登出
- `GET /api/auth/user/` - 获取当前用户信息
- `POST /api/auth/register/` - 用户注册
- `GET /api/auth/salespersons/` - 获取业务员列表

### 施工单接口
- `GET /api/workorders/` - 获取施工单列表
- `POST /api/workorders/` - 创建施工单
- `GET /api/workorders/{id}/` - 获取施工单详情
- `PUT /api/workorders/{id}/` - 更新施工单
- `DELETE /api/workorders/{id}/` - 删除施工单
- `POST /api/workorders/{id}/submit_approval/` - 提交审核
- `POST /api/workorders/{id}/approve/` - 审核通过
- `POST /api/workorders/{id}/reject/` - 审核拒绝

### 任务接口
- `GET /api/workorder-tasks/` - 获取任务列表
- `POST /api/workorder-tasks/{id}/start/` - 开始任务
- `POST /api/workorder-tasks/{id}/complete/` - 完成任务

### 其他接口
- `/api/customers/` - 客户管理
- `/api/departments/` - 部门管理
- `/api/processes/` - 工序管理
- `/api/products/` - 产品管理
- `/api/materials/` - 物料管理
- `/api/artworks/` - 图稿管理
- `/api/dies/` - 刀模管理
- `/api/foiling-plates/` - 烫金版管理
- `/api/embossing-plates/` - 压凸版管理
- `/api/process-logs/` - 工序日志查询

## 预设数据

系统预设了以下数据，会在迁移时自动加载：

### 部门（11个）
- **管理部门**（5个）：业务部、财务部、设计部、采购部、运输部
- **生产部**（1个）：生产部
- **生产车间**（5个）：裁切车间、印刷车间、外协车间、模切车间、包装车间

### 工序（21个）
- 制版(CTP)、开料(CUT)、印刷(PRT)、过油(VAN)、覆光膜(LAM_G)、覆哑膜(LAM_M)、UV、烫金(FOIL_G)、烫银(FOIL_S)、压凸(EMB)、压纹(TEX)、压线(SCORE)、模切(DIE)、切成品(TRIM)、对裱(LAM_B)、裱坑(MOUNT)、粘胶(GLUE)、粘盒(BOX)、粘窗口(WINDOW)、打钉(STAPLE)、包装(PACK)

### 用户组（1个）
- **业务员**：具有施工单、客户、产品、物料等核心业务数据的查看、创建、编辑权限

详细说明请参考：[数据初始化文档](docs/DATA_INITIALIZATION_ANALYSIS.md)

## 管理命令

### 数据管理
- `python manage.py reset_processes` - 重置并加载预设工序数据
- `python manage.py load_initial_users` - 加载预设用户数据
- `python manage.py loaddata workorder/fixtures/initial_products.json` - 加载示例产品数据

### 权限管理
- `python manage.py init_groups` - 初始化用户组和权限
- `python manage.py assign_permissions <username> <group_name>` - 为用户分配权限

## 生产部署

详细部署指南请参考：[部署文档](docs/DEPLOYMENT.md)

### 后端部署要点

1. **更新配置**
   - 设置 `DEBUG = False`
   - 配置 `ALLOWED_HOSTS`
   - 使用生产数据库（PostgreSQL/MySQL）

2. **收集静态文件**
   ```bash
   python manage.py collectstatic
   ```

3. **使用 Gunicorn 运行**
   ```bash
   pip install gunicorn
   gunicorn config.wsgi:application --bind 0.0.0.0:8000
   ```

### 前端部署

```bash
cd frontend
npm run build
```

将 `dist` 目录部署到 Web 服务器（如 Nginx）。

## 开发说明

### 添加新功能

1. **后端添加模型**
   - 在 `backend/workorder/models.py` 中定义模型
   - 运行 `python manage.py makemigrations` 和 `python manage.py migrate`

2. **后端添加 API**
   - 在 `serializers.py` 中创建序列化器
   - 在 `views.py` 中创建视图集
   - 在 `urls.py` 中注册路由

3. **前端添加页面**
   - 在 `src/views/` 中创建页面组件
   - 在 `src/router/index.js` 中添加路由
   - 在 `src/api/` 中添加 API 调用方法

### 常见问题

**Q: CORS 错误？**  
A: 确保后端 `settings.py` 中的 `CORS_ALLOWED_ORIGINS` 包含前端地址。

**Q: 静态文件加载失败？**  
A: 运行 `python manage.py collectstatic` 并配置 Nginx。

**Q: 数据库连接错误？**  
A: 检查数据库配置和连接信息。

**Q: 如何重置预设数据？**  
A: 使用 `python manage.py reset_processes` 重置工序数据。部门数据通过迁移自动管理。

## 文档

项目详细文档位于 `docs/` 目录：

- [文档索引](docs/README.md) - 所有文档的索引
- [快速开始](docs/QUICKSTART.md) - 详细的上手指南
- [数据初始化](docs/DATA_INITIALIZATION_ANALYSIS.md) - 预设数据说明
- [权限管理](docs/PERMISSIONS.md) - 权限系统说明
- [部署指南](docs/DEPLOYMENT.md) - 生产环境部署
- [Fixtures 使用指南](docs/FIXTURES_USAGE.md) - 测试数据加载

更多技术文档请查看 `docs/` 目录。

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

## 更新日志

### v2.0.0 (2026-01-07)
- 统一预设数据管理：所有预设数据统一到 `data.py` 单一数据源
- 完善数据初始化流程：通过迁移文件自动加载预设数据
- 添加任务管理系统：支持基于工序自动生成任务
- 完善审核流程：支持施工单审核和受限编辑
- 优化部门管理：支持层级关系和部门-工序关联
- 完善权限系统：基于用户组的细粒度权限控制

### v1.0.0 (2024-12-29)
- 初始版本发布
- 实现施工单管理功能
- 实现工序跟踪功能
- 实现客户、工序、物料管理
- 实现数据统计和可视化
