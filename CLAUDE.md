# 印刷施工单跟踪系统

> Vue.js + Django REST Framework 的印刷施工单跟踪管理系统

## Quick Facts

- **Stack**: Vue 2.7, Element UI, Django 4.2, Django REST Framework 3.14
- **Test Command**: `npm test` (frontend), `python manage.py test` (backend)
- **Lint Command**: `npm run lint` (frontend)
- **Build Command**: `npm run build` (frontend)
- **Backend Server**: `python manage.py runserver`
- **Frontend Server**: `npm run serve`

## Key Directories

### Frontend (`frontend/`)
- `src/api/` - API 接口封装
  - `src/api/base/` - API 基础类（BaseAPI.js）
  - `src/api/modules/` - API 模块（16个模块）
- `src/components/` - Vue 组件
- `src/views/` - 页面视图
- `src/router/` - Vue Router 路由配置
- `src/store/` - Vuex 状态管理
- `src/assets/` - 静态资源
- `src/mixins/` - Vue Mixins
  - `listPageMixin.js` - 列表页面 Mixin
  - `permissionMixin.js` - 权限检查 Mixin
  - `crudMixin.js` - CRUD 操作 Mixin（v2.1.0 新增）
  - `crudPermissionMixin.js` - CRUD 权限 Mixin（v2.1.0 新增）

### Backend (`backend/`)
- `config/` - Django 配置
- `workorder/` - 施工单应用（主要业务逻辑）
- `workorder/models.py` - 数据模型
- `workorder/views.py` - API 视图
- `workorder/serializers.py` - DRF 序列化器
- `workorder/admin.py` - Django Admin 配置
- `workorder/urls.py` - URL 路由

### Documentation (`docs/`)
- `docs/README.md` - 文档索引
- `docs/QUICKSTART.md` - 快速开始指南
- `docs/DEPLOYMENT.md` - 部署指南

## Code Style

### Frontend (Vue.js)
- 使用 Vue 2.7 Composition API
- Element UI 组件库
- ESLint 配置（Airbnb 规范）
- 组件命名：PascalCase（如 `WorkOrderList.vue`）
- API 接口统一在 `src/api/modules` 中管理
- **列表页面优先使用 Mixins**（v2.1.0+）：`listPageMixin` + `crudPermissionMixin`
- **API 模块继承 BaseAPI**（v2.1.0+）：减少 90% 代码重复

### Frontend Architecture Patterns (v2.1.0+)

#### API 模块化
所有 API 接口已模块化到 `src/api/modules/` 目录：

**创建新 API 模块**：
```javascript
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class MyResourceAPI extends BaseAPI {
  constructor() {
    super('/my-resources/', request)
  }
}

export const myResourceAPI = new MyResourceAPI()
```

**使用 API 模块**：
```javascript
import { myResourceAPI } from '@/api/modules'
```

#### 列表页面 Mixins
使用 `listPageMixin` + `crudPermissionMixin` 简化列表页面开发：

```javascript
import { myResourceAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'

export default {
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      apiService: myResourceAPI,
      permissionPrefix: 'myresource',
      form: { /* 表单字段 */ },
      rules: { /* 验证规则 */ }
    }
  },
  methods: {
    fetchData() {
      return this.apiService.getList({
        page: this.currentPage,
        page_size: this.pageSize,
        search: this.searchText
      })
    }
  }
}
```

#### 权限检查
使用 `crudPermissionMixin` 提供的方法：
- `canCreate()` - 检查创建权限
- `canEdit()` - 检查编辑权限
- `canDelete()` - 检查删除权限
- `canExport()` - 检查导出权限

#### 错误处理
使用 `ErrorHandler` 类：
```javascript
import ErrorHandler from '@/utils/errorHandler'

ErrorHandler.showSuccess('操作成功')
ErrorHandler.showMessage(error, '操作上下文')
ErrorHandler.confirm('确定要删除吗？')
```

### Backend (Django)
- Python PEP 8 规范
- Django REST Framework 最佳实践
- 模型命名：PascalCase（如 `WorkOrder`）
- API 视图使用 ModelViewSet 或 ReadOnlyModelViewSet
- 序列化器统一放在 `serializers.py`

## Critical Rules

### 数据安全
- 绝不在代码中硬编码密钥、密码等敏感信息
- 使用环境变量管理配置
- API 密钥使用 Django 的 `secret.txt` 或环境变量

### 错误处理
- **前端**: 统一错误处理在 axios 拦截器中
- **后端**: 使用 DRF 的异常处理机制
- 始终向用户显示友好的错误消息
- 记录错误日志便于调试

### UI 状态
- 始终处理：loading、error、empty、success 状态
- 列表页面必须有空状态显示
- 表单提交时禁用提交按钮

### API 调用
- 所有 API 调用通过 `src/api/` 中的封装方法
- 使用 async/await 处理异步操作
- 统一的错误处理和成功提示

## Git Conventions

- **分支命名**: `{type}/{description}` (如 `feat/workorder-list`, `fix/task-status`)
- **提交格式**: 使用中文描述
  - `feat:` - 新功能
  - `fix:` - 修复 bug
  - `docs:` - 文档更新
  - `refactor:` - 代码重构
  - `perf:` - 性能优化
  - `test:` - 测试相关
  - `chore:` - 构建/工具配置
  - `style:` - 代码格式调整

## Common Commands

### 前端开发
```bash
cd frontend
npm run serve        # 启动开发服务器
npm run build        # 构建生产版本
npm run lint         # 运行 ESLint 检查
```

### 后端开发
```bash
cd backend
python manage.py runserver              # 启动开发服务器
python manage.py migrate                # 运行数据库迁移
python manage.py makemigrations         # 创建迁移文件
python manage.py createsuperuser        # 创建超级管理员
python manage.py collectstatic          # 收集静态文件
```

### 管理命令
```bash
python manage.py reset_processes        # 重置工序数据
python manage.py load_initial_users     # 加载测试用户
python manage.py init_groups            # 初始化用户组
```

### 数据库操作
```bash
python manage.py dbshell                # 进入数据库 shell
python manage.py showmigrations         # 查看迁移状态
python manage.py sqlmigrate workorder 0001  # 查看迁移 SQL
```

## Testing

### 前端测试
- 使用 Jest 进行单元测试
- 测试文件放在 `tests/unit/` 目录
- 测试文件命名：`*.spec.js`

### 后端测试
- 使用 Django 的测试框架
- 测试文件放在对应 app 的 `tests/` 目录
- 运行测试：`python manage.py test`

## 项目特性

### 核心功能模块
1. **施工单管理** - 创建、编辑、审核施工单
2. **工序管理** - 21个预设工序，支持自定义
3. **任务管理** - 基于工序自动生成任务
4. **客户管理** - 客户信息和联系人
5. **产品管理** - 产品信息、产品组
6. **物料管理** - 物料信息和库存
7. **图稿管理** - 图稿版本控制
8. **部门管理** - 部门层级关系
9. **权限管理** - 基于用户组的权限控制

### 数据初始化
- 迁移时自动加载：21个预设工序、11个预设部门、部门-工序关联
- 使用 `python manage.py load_initial_users` 加载测试用户
- 使用 `python manage.py loaddata workorder/fixtures/initial_products.json` 加载示例产品

### API 认证
- 基于 Django 的用户认证系统
- JWT Token 认证（如果使用）
- CORS 配置：允许前端跨域请求

## 技术栈详情

### 前端技术
- Vue 2.7 - 渐进式 JavaScript 框架
- Element UI 2.15 - Vue 组件库
- Vue Router 3 - 路由管理
- Vuex 3 - 状态管理
- Axios - HTTP 客户端

### 后端技术
- Django 4.2 - Python Web 框架
- Django REST Framework 3.14 - REST API 框架
- SQLite - 开发数据库（可更换为 PostgreSQL/MySQL）

## 部署注意事项

### 生产环境配置
1. 设置 `DEBUG = False`
2. 配置 `ALLOWED_HOSTS`
3. 使用生产数据库（PostgreSQL/MySQL）
4. 配置静态文件服务（Nginx）
5. 使用 Gunicorn 运行 Django
6. 前端构建后部署到 Web 服务器

### 安全建议
- 使用环境变量管理敏感配置
- 启用 HTTPS
- 配置 CSRF 保护
- 定期更新依赖包
- 设置强密码策略

## 常见问题

### CORS 错误
确保后端 `settings.py` 中的 `CORS_ALLOWED_ORIGINS` 包含前端地址

### 静态文件加载失败
运行 `python manage.py collectstatic` 并配置 Nginx

### 数据库连接错误
检查数据库配置和连接信息

## Skill Activation

在实现任务前，检查是否需要激活相关技能：
- 创建/修改 API → `django-api-patterns` skill
- 创建 Vue 组件 → `vue-component-patterns` skill
- 调试问题 → `systematic-debugging` skill
- 编写测试 → `testing-patterns` skill
- Git 操作 → `git-commit` skill

## 项目维护

### 数据备份
- 定期备份数据库
- 备份上传的媒体文件

### 依赖更新
- 前端：`npm update`
- 后端：`pip install --upgrade -r requirements.txt`

### 日志查看
- Django 日志：查看配置的日志文件
- 前端错误：浏览器控制台

---

**最后更新**: 2026-01-14
**项目版本**: v2.0.0
**文档维护**: 如有疑问请查看 `docs/` 目录或提交 Issue
