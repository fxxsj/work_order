# 快速开始指南

这是一个简化版的启动指南，让您快速运行印刷施工单跟踪系统。

## 前提条件

确保您的系统已安装：
- Python 3.8 或更高版本
- Node.js 14 或更高版本
- npm 或 yarn

## 一、启动后端（5分钟）

### 1. 进入后端目录并创建虚拟环境

```bash
cd backend
python3 -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 初始化数据库

```bash
# 创建数据库表
python manage.py migrate

# 创建管理员账号（按提示输入用户名、邮箱和密码）
python manage.py createsuperuser

# 加载初始数据（可选，包含基础工序数据）
python manage.py loaddata workorder/fixtures/initial_data.json
```

### 4. 启动开发服务器

```bash
python manage.py runserver
```

✅ 后端已启动在 http://localhost:8000

可以访问：
- Django Admin: http://localhost:8000/admin
- API 接口: http://localhost:8000/api

## 二、启动前端（5分钟）

### 1. 打开新的终端，进入前端目录

```bash
cd frontend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run serve
```

✅ 前端已启动在 http://localhost:8080

## 三、开始使用

### 1. 登录系统

打开浏览器访问：http://localhost:8081

**测试账号**（已自动创建）：
- 用户名：`admin`
- 密码：`admin123`

### 2. 访问前端系统

登录后即可使用前端界面，包含：
- **工作台**：查看统计数据和最近订单
- **施工单**：创建、编辑、查看施工单，跟踪工序
- **客户管理**：管理客户信息
- **工序管理**：管理工序模板
- **物料管理**：管理物料和库存

### 3. 使用 Django Admin（可选）

点击右上角用户菜单 → "管理后台"，或直接访问：

http://localhost:8000/admin

使用相同账号登录，可以进行更高级的数据管理。

## 快速体验流程

### 1. 创建客户

在"客户管理"中添加一个客户，例如：
- 客户名称：测试印刷公司
- 联系人：张三
- 电话：13800138000

### 2. 添加工序（如果需要）

在"工序管理"中确认已有工序，或添加新工序，例如：
- 工序编码：P001
- 工序名称：印前制作
- 标准工时：2小时

### 3. 创建施工单

在"施工单"中点击"新建施工单"：
- 施工单号：WO20240001
- 选择客户
- 产品名称：宣传册
- 数量：1000
- 单位：本
- 交货日期：选择一个日期

### 4. 添加工序

进入施工单详情页：
- 点击"添加工序"
- 选择工序（如：印前制作 → 印刷 → 质检 → 包装）
- 设置顺序

### 5. 执行工序

在工序跟踪部分：
- 点击"开始"按钮开始工序
- 点击"完成"按钮完成工序，填写完成数量

### 6. 查看统计

返回"工作台"查看：
- 施工单总数
- 各状态统计
- 进度可视化

## 常见问题

### Q1: 后端启动失败？

**检查是否激活了虚拟环境：**
```bash
# 应该看到 (venv) 前缀
which python  # 应该指向 venv 目录
```

**重新安装依赖：**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Q2: 前端启动失败？

**清除缓存重新安装：**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q3: 前端无法访问后端 API？

**确保后端正在运行：**
- 访问 http://localhost:8000/api 应该能看到 API 列表

**检查 CORS 配置：**
- 确保 `backend/config/settings.py` 中 `CORS_ALLOWED_ORIGINS` 包含前端地址

### Q4: 数据库迁移失败？

**删除数据库重新初始化：**
```bash
rm backend/db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Q5: 端口被占用？

**修改端口：**
```bash
# 后端使用其他端口
python manage.py runserver 8001

# 前端修改 vue.config.js 中的 port
```

## 下一步

- 查看 [README.md](README.md) 了解详细功能
- 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解生产部署
- 配置 Metabase 进行数据分析

## 停止服务

在各自的终端中按 `Ctrl + C` 停止服务。

## 需要帮助？

- 查看项目文档
- 提交 Issue
- 联系技术支持

祝您使用愉快！🎉

