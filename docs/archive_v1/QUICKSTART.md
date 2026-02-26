# 快速开始指南

> 版本：v1.0.0  
> 更新时间：2026-02-25

## 前提条件

- Python 3.8+
- Node.js 14+
- npm

## 一键启动

项目根目录提供了 `start.sh` 脚本，可一键启动前后端：

```bash
./start.sh
```

脚本会自动启动：
- 前端：http://localhost:8080
- 后端：http://localhost:8000
- WebSocket：ws://localhost:8000

## 手动启动

### 后端

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python manage.py migrate

# 创建管理员
python manage.py createsuperuser

# 启动服务器（支持 WebSocket）
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 前端

```bash
cd frontend
npm install
npm run serve
```

访问：http://localhost:8080

## 测试账号

| 用户名 | 密码 |
|--------|------|
| admin | admin123 |

## 常用命令

```bash
# 后端迁移
python manage.py migrate

# 加载测试数据
python manage.py load_initial_users
python manage.py loaddata workorder/fixtures/initial_products.json
```
