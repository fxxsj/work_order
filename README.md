# 印刷施工单跟踪系统

一个基于 Vue + Element UI + Django 的印刷施工单跟踪管理系统，支持施工单管理、工序跟踪、客户管理、物料管理等功能。

## 功能特性

### 核心功能

- **施工单管理**
  - 创建、编辑、查看、删除施工单
  - 施工单状态跟踪（待开始、进行中、已暂停、已完成、已取消）
  - 优先级管理（低、普通、高、紧急）
  - 进度可视化显示
  - 交货日期预警

- **工序跟踪**
  - 为施工单添加工序
  - 工序状态管理（待开始、进行中、已完成、已跳过）
  - 工序开始/完成时间记录
  - 工时统计
  - 完成数量和不良品记录
  - 工序操作日志

- **客户管理**
  - 客户信息维护
  - 联系人和联系方式管理

- **工序管理**
  - 工序模板定义
  - 标准工时设置
  - 工序排序

- **物料管理**
  - 物料信息维护
  - 库存管理
  - 施工单物料用量记录

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

### 报表（可选）
- **Metabase** - 开源 BI 工具

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

# 执行数据库迁移
python manage.py makemigrations
python manage.py migrate

# 创建超级管理员
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

后端服务将运行在 `http://localhost:8000`

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

系统已自动创建测试管理员账号：
- **用户名**: admin
- **密码**: admin123

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
│   │   └── urls.py         # URL 路由
│   ├── manage.py           # Django 管理脚本
│   └── requirements.txt    # Python 依赖
│
├── frontend/               # 前端项目
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── assets/        # 资源文件
│   │   ├── components/    # 组件（如需要）
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
└── README.md              # 项目说明
```

## 数据模型

### Customer (客户)
- 客户名称、联系人、电话、邮箱、地址等

### Process (工序)
- 工序编码、名称、描述、标准工时、排序等

### Material (物料)
- 物料编码、名称、规格、单位、单价、库存等

### WorkOrder (施工单)
- 施工单号、客户、产品名称、数量、状态、优先级
- 下单日期、交货日期、总金额等

### WorkOrderProcess (施工单工序)
- 关联施工单和工序
- 工序顺序、状态、操作员
- 计划/实际开始结束时间、耗时
- 完成数量、不良品数量等

### WorkOrderMaterial (施工单物料)
- 关联施工单和物料
- 计划用量、实际用量

### ProcessLog (工序日志)
- 工序操作记录
- 日志类型（开始、暂停、恢复、完成、备注）

## API 接口

### 施工单接口
- `GET /api/workorders/` - 获取施工单列表
- `POST /api/workorders/` - 创建施工单
- `GET /api/workorders/{id}/` - 获取施工单详情
- `PUT /api/workorders/{id}/` - 更新施工单
- `DELETE /api/workorders/{id}/` - 删除施工单
- `POST /api/workorders/{id}/add_process/` - 添加工序
- `POST /api/workorders/{id}/add_material/` - 添加物料
- `POST /api/workorders/{id}/update_status/` - 更新状态
- `GET /api/workorders/statistics/` - 获取统计数据

### 工序操作接口
- `GET /api/workorder-processes/` - 获取工序列表
- `POST /api/workorder-processes/{id}/start/` - 开始工序
- `POST /api/workorder-processes/{id}/complete/` - 完成工序
- `POST /api/workorder-processes/{id}/add_log/` - 添加日志

### 其他接口
- `/api/customers/` - 客户管理
- `/api/processes/` - 工序管理
- `/api/materials/` - 物料管理
- `/api/process-logs/` - 工序日志查询

## 生产部署

### 后端部署

1. **更新配置**

编辑 `backend/config/settings.py`:

```python
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']
SECRET_KEY = 'your-secret-key'

# 使用生产数据库
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'workorder_db',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

2. **收集静态文件**

```bash
python manage.py collectstatic
```

3. **使用 Gunicorn 运行**

```bash
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

4. **配置 Nginx 反向代理**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### 前端部署

```bash
cd frontend
npm run build
```

将 `dist` 目录部署到 Web 服务器。

### Metabase 配置（可选）

1. **安装 Metabase**

```bash
docker run -d -p 3000:3000 \
  -v ~/metabase-data:/metabase-data \
  -e "MB_DB_FILE=/metabase-data/metabase.db" \
  --name metabase metabase/metabase
```

2. **连接数据库**

访问 `http://localhost:3000`，按照向导连接到 Django 数据库。

3. **创建报表**

可以创建以下报表：
- 每日/每周/每月施工单完成统计
- 工序耗时分析
- 客户订单统计
- 物料使用情况
- 延期订单分析

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

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

## 更新日志

### v1.0.0 (2024-12-29)
- 初始版本发布
- 实现施工单管理功能
- 实现工序跟踪功能
- 实现客户、工序、物料管理
- 实现数据统计和可视化

