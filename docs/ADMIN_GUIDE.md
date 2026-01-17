# 系统管理员操作指南

> 版本：v2.0.0  
> 更新时间：2026-01-17

## 📋 目录

- [管理员权限](#管理员权限)
- [系统配置](#系统配置)
- [用户管理](#用户管理)
- [权限管理](#权限管理)
- [数据备份与恢复](#数据备份与恢复)
- [性能监控](#性能监控)
- [安全管理](#安全管理)
- [故障排查](#故障排查)

## 🔐 管理员权限

### 超级管理员权限

系统管理员拥有最高权限，包括：

- ✅ **用户管理**：创建、修改、删除用户账号
- ✅ **权限配置**：设置用户角色和权限
- ✅ **系统设置**：修改系统参数和配置
- ✅ **数据管理**：数据导入导出、备份恢复
- ✅ **监控查看**：查看系统运行状态和日志
- ✅ **审核管理**：管理全局审核策略

### 登录管理后台

```
URL: http://localhost:8000/admin/
用户名: admin
密码: admin123
```

## ⚙️ 系统配置

### 基础设置

#### 公司信息配置
```python
# 在系统设置中配置
COMPANYY_NAME = "印刷公司名称"
COMPANYY_ADDRESS = "公司详细地址"
COMPANYY_PHONE = "联系电话"
COMPANYY_EMAIL = "公司邮箱"
```

#### 系统参数设置
```python
# 关键系统参数
WORKORDER_AUTO_NUMBERING = True  # 自动生成施工单号
WORKORDER_NUMBER_PREFIX = "WO"   # 施工单号前缀
WORKORDER_APPROVAL_REQUIRED = True  # 需要审核
MAX_FILE_UPLOAD_SIZE = 10485760  # 最大文件上传大小(10MB)
```

### 安全配置

#### 密码策略
```python
# 密码复杂度要求
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIRE_UPPERCASE = True
PASSWORD_REQUIRE_LOWERCASE = True
PASSWORD_REQUIRE_DIGITS = True
PASSWORD_REQUIRE_SPECIAL = False
```

#### 会话管理
```python
# 会话安全设置
SESSION_COOKIE_AGE = 86400  # 会话有效期(24小时)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True  # 生产环境启用
```

### 邮件配置

#### SMTP设置
```python
# 邮件服务器配置
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.company.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'system@company.com'
EMAIL_HOST_PASSWORD = 'your_email_password'
DEFAULT_FROM_EMAIL = 'system@company.com'
```

## 👥 用户管理

### 创建用户账号

#### 方法一：通过管理后台
```
1. 访问 /admin/
2. 进入"用户"管理界面
3. 点击"增加用户"
4. 填写用户信息：
   - 用户名：唯一标识符
   - 密码：初始密码
   - 确认密码：重复输入
   - 姓名：用户真实姓名
   - 邮箱：用户邮箱
   - 是否活跃：勾选
   - 是否为员工：勾选
   - 是否为超级用户：谨慎选择
5. 保存用户信息
```

#### 方法二：通过命令行
```bash
# 创建超级用户
python manage.py createsuperuser

# 创建普通用户
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.create_user('username', 'email@example.com', 'password')
>>> user.is_staff = True
>>> user.save()
```

### 用户信息管理

#### 批量创建用户
```python
# 使用自定义命令
python manage.py load_initial_users

# 或通过Excel导入
python manage.py import_users users.xlsx
```

#### 用户状态管理
```
用户状态类型：
- 活跃：可以正常登录使用系统
- 停用：无法登录，保留数据
- 锁定：安全原因临时锁定
```

### 重置用户密码

#### 方法一：管理后台重置
```
1. 进入用户管理界面
2. 选择要重置的用户
3. 点击"修改"
4. 设置新密码
5. 保存修改
```

#### 方法二：命令行重置
```bash
# 重置指定用户密码
python manage.py changepassword username

# 或使用shell模式
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(username='username')
>>> user.set_password('new_password')
>>> user.save()
```

## 🔑 权限管理

### 用户组管理

#### 创建用户组
```
1. 进入"用户组"管理界面
2. 点击"增加用户组"
3. 填写组信息：
   - 名称：业务员、生产经理、部门主管等
   - 权限：选择对应的功能权限
4. 保存用户组
```

#### 权限分配
```python
# 主要权限类别
权限类型：
- 施工单权限：add_workorder, change_workorder, delete_workorder
- 任务权限：add_task, change_task, delete_task
- 客户权限：add_customer, change_customer, delete_customer
- 产品权限：add_product, change_product, delete_product
- 物料权限：add_material, change_material, delete_material
- 用户权限：add_user, change_user, delete_user
```

### 权限检查工具

#### 查看用户权限
```python
# 检查用户权限
python manage.py shell
>>> from django.contrib.auth.models import User, Permission
>>> user = User.objects.get(username='username')
>>> user.get_all_permissions()
>>> user.has_perm('workorder.add_workorder')
```

#### 权限分配脚本
```python
# 批量权限分配
def assign_permissions():
    from django.contrib.auth.models import User, Permission, Group
    
    # 创建权限组
    group, created = Group.objects.get_or_create(name='业务员')
    
    # 添加权限
    permissions = [
        Permission.objects.get(codename='add_workorder'),
        Permission.objects.get(codename='change_workorder'),
        Permission.objects.get(codename='add_customer'),
        Permission.objects.get(codename='change_customer'),
    ]
    
    group.permissions.set(permissions)
    group.save()
```

## 💾 数据备份与恢复

### 自动备份配置

#### 数据库备份
```python
# 数据库备份设置
DATABASE_BACKUP_SCHEDULE = 'daily'  # 每日备份
DATABASE_BACKUP_RETENTION = 30  # 保留30天
DATABASE_BACKUP_PATH = '/var/backups/database/'
```

#### 文件备份
```python
# 文件系统备份
MEDIA_BACKUP_SCHEDULE = 'weekly'
MEDIA_BACKUP_RETENTION = 12  # 保留12周
MEDIA_BACKUP_PATH = '/var/backups/media/'
```

### 手动备份操作

#### 数据库备份
```bash
# PostgreSQL备份
pg_dump -h localhost -U username -d database_name > backup.sql

# SQLite备份
cp db.sqlite3 backup_$(date +%Y%m%d).sqlite3

# 使用Django管理命令
python manage.py dbbackup --name manual_backup
```

#### 媒体文件备份
```bash
# 备份媒体文件
tar -czf media_backup_$(date +%Y%m%d).tar.gz media/

# 或使用rsync同步
rsync -av --delete media/ /backup/media/
```

### 数据恢复

#### 数据库恢复
```bash
# PostgreSQL恢复
psql -h localhost -U username -d database_name < backup.sql

# SQLite恢复
cp backup_20231201.sqlite3 db.sqlite3

# 使用Django管理命令
python manage.py dbrestore --name manual_backup
```

#### 媒体文件恢复
```bash
# 解压媒体文件备份
tar -xzf media_backup_20231201.tar.gz

# 或使用rsync恢复
rsync -av --delete /backup/media/ media/
```

## 📊 性能监控

### 系统监控指标

#### 数据库性能
```python
# 数据库监控指标
指标类型：
- 连接数：当前活跃连接数
- 查询时间：平均查询响应时间
- 慢查询：执行时间超过1秒的查询
- 缓存命中率：查询缓存命中率
```

#### 应用性能
```python
# 应用监控指标
关键指标：
- 响应时间：API平均响应时间
- 错误率：系统错误发生率
- 并发用户：同时在线用户数
- 内存使用：系统内存占用情况
```

### 监控配置

#### 日志监控
```python
# 日志配置
LOGGING = {
    'handlers': {
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/errors.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 10,
        },
        'access_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/access.log',
            'maxBytes': 1024*1024*50,  # 50MB
            'backupCount': 20,
        }
    }
}
```

#### 性能监控
```python
# 性能监控设置
MIDDLEWARE = [
    'django.middleware.common.CommonMiddleware',
    'workorder.monitoring.PerformanceMonitoringMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
]
```

### 监控脚本

#### 系统健康检查
```bash
#!/bin/bash
# system_health_check.sh
echo "=== 系统健康检查 ==="

# 检查数据库连接
python manage.py check --database default

# 检查缓存连接
python -c "import redis; r = redis.Redis(); print('Redis连接正常' if r.ping() else 'Redis连接失败')"

# 检查磁盘空间
df -h | grep -E "/$|/var"

# 检查内存使用
free -h

# 检查服务状态
systemctl status nginx
systemctl status gunicorn
```

## 🔒 安全管理

### 安全策略配置

#### 访问控制
```python
# 安全头设置
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000  # 1年
SECURE_SSL_REDIRECT = True  # 强制HTTPS
```

#### API安全
```python
# API安全配置
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'admin': '500/hour'
    }
}
```

### 安全审计

#### 登录审计
```python
# 记录登录日志
class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    login_time = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    login_result = models.CharField(max_length=20)  # success/failed
```

#### 操作审计
```python
# 操作日志记录
def audit_operation(user, action, object_type, object_id, details):
    AuditLog.objects.create(
        user=user,
        action=action,
        object_type=object_type,
        object_id=object_id,
        details=details,
        timestamp=timezone.now()
    )
```

### 安全最佳实践

#### 密码管理
```
✅ 推荐做法：
- 定期更换密码（90天）
- 使用强密码策略
- 启用多因素认证
- 记录密码更改历史

❌ 禁止做法：
- 使用简单密码
- 共享账号密码
- 在不安全的地方记录密码
- 长期不更换密码
```

#### 数据保护
```
✅ 推荐做法：
- 敏感数据加密存储
- 定期数据备份
- 限制数据访问权限
- 监控数据访问日志

❌ 禁止做法：
- 明文存储敏感信息
- 忽略数据备份
- 过度授权访问权限
- 不记录数据访问日志
```

## 🔧 故障排查

### 常见问题诊断

#### 数据库问题
```
问题：数据库连接失败
排查步骤：
1. 检查数据库服务状态
2. 验证连接配置
3. 检查网络连通性
4. 查看数据库错误日志
5. 测试手动连接

解决方法：
- 重启数据库服务
- 修正连接配置
- 检查防火墙设置
- 联系数据库管理员
```

#### 应用问题
```
问题：应用无法启动
排查步骤：
1. 检查依赖包安装
2. 查看环境变量配置
3. 检查端口占用情况
4. 查看应用启动日志
5. 检查配置文件语法

解决方法：
- 安装缺失依赖
- 修正环境变量
- 更换端口
- 修复配置错误
- 清理日志文件
```

#### 性能问题
```
问题：系统响应缓慢
排查步骤：
1. 检查系统资源使用
2. 分析数据库查询性能
3. 检查网络延迟
4. 查看缓存命中率
5. 分析慢查询日志

解决方法：
- 优化数据库查询
- 增加缓存
- 升级硬件资源
- 优化网络配置
- 重启相关服务
```

### 日志分析

#### 错误日志分析
```bash
# 查看最近的错误日志
tail -f logs/errors.log | grep ERROR

# 统计错误类型
grep ERROR logs/errors.log | awk '{print $4}' | sort | uniq -c

# 查看特定时间的错误
grep "2024-01-17" logs/errors.log
```

#### 访问日志分析
```bash
# 统计API访问量
grep "POST\|GET" logs/access.log | wc -l

# 分析响应时间
awk '{print $NF}' logs/access.log | sort -n | tail -10

# 查看热门API端点
awk '{print $7}' logs/access.log | sort | uniq -c | sort -nr | head -10
```

### 应急处理

#### 系统宕机处理流程
```
1. 立即评估影响范围
2. 通知相关人员和用户
3. 启动应急服务流程
4. 开始故障排查
5. 记录处理过程和结果
6. 制定预防措施
```

#### 数据丢失应急处理
```
1. 立即停止相关服务
2. 保护现场数据
3. 启动数据恢复程序
4. 通知相关人员
5. 分析数据丢失原因
6. 加强数据保护措施
```

---

**文档版本**：v2.0.0  
**更新时间**：2026-01-17  
**维护团队**：技术支持团队  
**紧急联系**：tech-support@company.com