# 部署指南

本文档详细说明如何将印刷施工单跟踪系统部署到生产环境。

## 部署架构

```
Internet
    |
    v
[Nginx] (反向代理 + 静态文件服务)
    |
    +---> [Frontend (Vue)] (静态文件)
    |
    +---> [Backend (Django + Gunicorn)]
              |
              v
          [Database (PostgreSQL/MySQL)]
```

## 服务器要求

### 硬件要求
- CPU: 2核以上
- 内存: 4GB 以上
- 磁盘: 20GB 以上

### 软件要求
- Ubuntu 20.04 LTS / CentOS 8+ / Debian 11+
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+ / MySQL 8+ (推荐) 或 SQLite
- Nginx 1.18+

## 第一步：准备服务器

### 1.1 更新系统

```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade -y

# CentOS
sudo yum update -y
```

### 1.2 安装依赖

```bash
# Ubuntu/Debian
sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib

# CentOS
sudo yum install -y python3 python3-pip nginx postgresql-server postgresql-contrib
```

### 1.3 配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# CentOS (Firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 第二步：数据库配置

### 2.1 配置 PostgreSQL

```bash
# 启动 PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE workorder_db;
CREATE USER workorder_user WITH PASSWORD 'your_strong_password';
ALTER ROLE workorder_user SET client_encoding TO 'utf8';
ALTER ROLE workorder_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE workorder_user SET timezone TO 'Asia/Shanghai';
GRANT ALL PRIVILEGES ON DATABASE workorder_db TO workorder_user;
\q
EOF
```

### 2.2 配置 MySQL（可选）

```bash
# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 创建数据库和用户
sudo mysql << EOF
CREATE DATABASE workorder_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'workorder_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON workorder_db.* TO 'workorder_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF

# 安装 MySQL Python 驱动
pip install mysqlclient
```

## 第三步：部署后端

### 3.1 创建项目目录

```bash
sudo mkdir -p /var/www/workorder
sudo chown $USER:$USER /var/www/workorder
cd /var/www/workorder
```

### 3.2 上传代码

```bash
# 使用 git
git clone https://your-repo-url.git .

# 或使用 scp 上传
# scp -r work_order/ user@server:/var/www/workorder/
```

### 3.3 配置后端

```bash
cd /var/www/workorder/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
pip install gunicorn psycopg2-binary  # PostgreSQL
# pip install gunicorn mysqlclient    # MySQL

# 创建环境变量文件
cat > .env << EOF
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=workorder_db
DB_USER=workorder_user
DB_PASSWORD=your_strong_password
DB_HOST=localhost
DB_PORT=5432
CORS_ORIGINS=https://your-domain.com
EOF
```

### 3.4 更新 settings.py

编辑 `backend/config/settings.py`，添加环境变量支持：

```python
import os
from pathlib import Path

# 加载环境变量
SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')

# 数据库配置
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.environ.get('DB_NAME', BASE_DIR / 'db.sqlite3'),
        'USER': os.environ.get('DB_USER', ''),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', ''),
        'PORT': os.environ.get('DB_PORT', ''),
    }
}

# CORS 配置
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
```

### 3.5 初始化数据库

```bash
# 加载环境变量
set -a
source .env
set +a

# 执行迁移
python manage.py makemigrations
python manage.py migrate

# 创建超级管理员
python manage.py createsuperuser

# 收集静态文件
python manage.py collectstatic --noinput
```

### 3.6 配置 Gunicorn

创建 Gunicorn 配置文件：

```bash
cat > /var/www/workorder/backend/gunicorn_config.py << EOF
import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
errorlog = "/var/log/workorder/gunicorn_error.log"
accesslog = "/var/log/workorder/gunicorn_access.log"
loglevel = "info"
EOF

# 创建日志目录
sudo mkdir -p /var/log/workorder
sudo chown $USER:$USER /var/log/workorder
```

### 3.7 创建 Systemd 服务

```bash
sudo cat > /etc/systemd/system/workorder.service << EOF
[Unit]
Description=Work Order Tracking System
After=network.target

[Service]
Type=notify
User=$USER
Group=$USER
WorkingDirectory=/var/www/workorder/backend
Environment="PATH=/var/www/workorder/backend/venv/bin"
EnvironmentFile=/var/www/workorder/backend/.env
ExecStart=/var/www/workorder/backend/venv/bin/gunicorn \\
    --config /var/www/workorder/backend/gunicorn_config.py \\
    config.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl start workorder
sudo systemctl enable workorder
sudo systemctl status workorder
```

## 第四步：部署前端

### 4.1 构建前端

```bash
cd /var/www/workorder/frontend

# 安装依赖
npm install

# 修改 API 地址（如果需要）
# 编辑 vue.config.js 或 .env.production

# 构建生产版本
npm run build
```

### 4.2 配置 Nginx

```bash
sudo cat > /etc/nginx/sites-available/workorder << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 强制 HTTPS（如果配置了 SSL）
    # return 301 https://$server_name$request_uri;

    client_max_body_size 50M;

    # 前端静态文件
    location / {
        root /var/www/workorder/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API 接口
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Django Admin
    location /admin {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django 静态文件
    location /static/ {
        alias /var/www/workorder/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Django 媒体文件
    location /media/ {
        alias /var/www/workorder/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/workorder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 第五步：配置 SSL（推荐）

### 5.1 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu
# sudo yum install -y certbot python3-certbot-nginx  # CentOS

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 第六步：配置 Metabase（可选）

### 6.1 使用 Docker 安装

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker
sudo systemctl enable docker

# 运行 Metabase
sudo docker run -d -p 3000:3000 \
  -v ~/metabase-data:/metabase-data \
  -e "MB_DB_FILE=/metabase-data/metabase.db" \
  --name metabase \
  --restart unless-stopped \
  metabase/metabase
```

### 6.2 配置 Nginx 反向代理

在 Nginx 配置中添加：

```nginx
location /metabase {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 第七步：监控和维护

### 7.1 日志查看

```bash
# 查看应用日志
sudo journalctl -u workorder -f

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看 Gunicorn 日志
tail -f /var/log/workorder/gunicorn_access.log
tail -f /var/log/workorder/gunicorn_error.log
```

### 7.2 数据库备份

```bash
# PostgreSQL 备份脚本
cat > /var/www/workorder/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/workorder"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump workorder_db > $BACKUP_DIR/workorder_db_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x /var/www/workorder/backup.sh

# 添加定时任务
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/workorder/backup.sh") | crontab -
```

### 7.3 更新应用

```bash
cd /var/www/workorder

# 拉取最新代码
git pull

# 更新后端
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart workorder

# 更新前端
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 故障排查

### 问题：502 Bad Gateway

**解决方案：**
```bash
# 检查 Gunicorn 是否运行
sudo systemctl status workorder

# 查看日志
sudo journalctl -u workorder -n 50

# 重启服务
sudo systemctl restart workorder
```

### 问题：静态文件加载失败

**解决方案：**
```bash
# 重新收集静态文件
cd /var/www/workorder/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# 检查文件权限
sudo chown -R $USER:$USER /var/www/workorder
```

### 问题：数据库连接错误

**解决方案：**
```bash
# 检查数据库服务
sudo systemctl status postgresql

# 检查环境变量
cat /var/www/workorder/backend/.env

# 测试数据库连接
psql -U workorder_user -d workorder_db -h localhost
```

## 性能优化

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 配置 Redis 缓存

```bash
# 安装 Redis
sudo apt install -y redis-server

# 安装 Python Redis 客户端
pip install redis django-redis

# 在 settings.py 中配置
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}
```

### 3. 数据库优化

```python
# settings.py
DATABASES = {
    'default': {
        # ...
        'CONN_MAX_AGE': 600,  # 连接池
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}
```

## 安全建议

1. 定期更新系统和依赖包
2. 使用强密码和 SSH 密钥认证
3. 配置防火墙和 fail2ban
4. 定期备份数据库和重要文件
5. 启用 HTTPS
6. 限制 Django Admin 访问（IP 白名单）
7. 配置日志监控和告警

## 联系支持

如遇到部署问题，请查看项目 Issues 或联系技术支持。

