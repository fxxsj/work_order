# P0 安全修复部署指南

> 本文档用于指导完成P0级别的安全修复部署

## 🔧 修复内容

### 1. XSS安全漏洞修复 ✅
- **问题描述**: 前端打印功能存在XSS风险，直接使用`innerHTML`
- **修复方案**: 
  - 安装DOMPurify安全库进行HTML净化
  - 修改`frontend/src/views/workorder/Detail.vue`文件
  - 将`innerHTML`替换为`DOMPurify.sanitize()`

### 2. 生产环境配置修复 ✅
- **问题描述**: Django使用默认SECRET_KEY存在安全风险
- **修复方案**:
  - 生成新的安全密钥
  - 创建生产环境环境变量配置文件
  - 提供完整的生产环境配置模板

## 🚀 部署步骤

### 前端部署

1. **更新依赖包**
   ```bash
   cd frontend
   npm install
   # DOMPurify已自动安装
   ```

2. **重新构建前端**
   ```bash
   npm run build
   ```

3. **验证前端功能**
   - 访问施工单详情页面
   - 测试打印功能是否正常
   - 检查浏览器控制台无错误信息

### 后端部署

1. **配置生产环境变量**
   ```bash
   cd backend
   
   # 复制生产环境配置模板
   cp .env.production .env
   
   # 编辑配置文件，填入实际值
   nano .env
   ```

2. **关键配置项**
   ```bash
   # 必须修改的配置
   SECRET_KEY=your-generated-secure-key-here
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   DEBUG=False
   
   # 安全配置
   SECURE_SSL_REDIRECT=True
   SECURE_HSTS_SECONDS=31536000
   ```

3. **重启Django服务**
   ```bash
   # 使用Gunicorn
   gunicorn config.wsgi:application --bind 0.0.0.0:8000
   
   # 或使用systemctl重启服务
   sudo systemctl restart gunicorn
   sudo systemctl restart nginx
   ```

## 🔍 验证清单

### 安全验证

- [ ] 前端打印功能正常工作
- [ ] 浏览器控制台无XSS相关错误
- [ ] Django后台无SECRET_KEY警告
- [ ] 生产环境DEBUG=False
- [ ] HTTPS重定向正常工作
- [ ] 安全头设置正确

### 功能验证

- [ ] 施工单详情页面正常加载
- [ ] 打印功能正常输出
- [ ] 用户登录功能正常
- [ ] API接口响应正常

## 🛠️ 故障排除

### 常见问题

**Q: 前端构建失败？**
```bash
# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Q: Django启动失败？**
```bash
# 检查环境变量
python manage.py shell
>>> import os
>>> os.environ.get('SECRET_KEY')
```

**Q: HTTPS重定向问题？**
```bash
# 检查Nginx配置
nginx -t
# 检查Django设置
python manage.py check --deploy
```

### 日志检查

```bash
# Django日志
tail -f /var/log/workorder/django.log

# Nginx日志
tail -f /var/log/nginx/error.log

# 系统日志
journalctl -u gunicorn -f
```

## 📞 技术支持

如果遇到部署问题，请联系：
- **技术团队**: dev-team@company.com
- **紧急联系**: security-team@company.com

---

**部署完成后请及时更新此文档**  
**下次安全检查时间**: 3个月后