# 开发者指南

> 版本：v1.0.0  
> 更新时间：2026-02-25

## 项目结构

```
work_order/
├── backend/           # Django 后端
│   ├── config/       # Django 配置
│   ├── workorder/    # 主应用
│   │   ├── models/  # 数据模型
│   │   ├── views/   # API 视图
│   │   ├── serializers/  # 序列化器
│   │   └── admin/   # Admin 配置
│   └── requirements.txt
├── frontend/         # Vue.js 前端
│   ├── src/
│   │   ├── api/    # API 接口
│   │   ├── views/  # 页面组件
│   │   ├── components/
│   │   └── store/  # Vuex 状态
│   └── package.json
├── docs/           # 项目文档
├── start.sh        # 启动脚本
├── Dockerfile
└── docker-compose.yml
```

## 技术栈

- **前端**：Vue 2.7, Element UI, Vuex, Vue Router, Axios
- **后端**：Django 4.2, Django REST Framework, Channels (WebSocket)
- **数据库**：SQLite（开发）/ PostgreSQL（生产）

## 开发规范

### 前端

- 使用 Vue 2.7 Composition API
- 组件命名：PascalCase
- API 模块化：按功能模块划分

### 后端

- Python PEP 8 规范
- Django REST Framework 最佳实践
- 使用 Django Admin 进行数据管理

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
```
