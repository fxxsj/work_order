# 开发者指南与最佳实践 - 印刷施工单跟踪系统

> 版本：v2.0.0  
> 更新时间：2026-01-17

## 📋 目录

- [快速开始](#快速开始)
- [开发环境搭建](#开发环境搭建)
- [前端开发指南](#前端开发指南)
- [后端开发指南](#后端开发指南)
- [代码规范](#代码规范)
- [测试指南](#测试指南)
- [调试技巧](#调试技巧)
- [性能优化](#性能优化)
- [安全最佳实践](#安全最佳实践)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

## 🚀 快速开始

### 前置要求

- Node.js 16.x+
- Python 3.11+
- Git
- VS Code (推荐)

### 一键启动

```bash
# 克隆项目
git clone <repository-url>
cd work_order

# 启动前端
cd frontend
npm install
npm run serve

# 启动后端
cd ../backend
pip install -r requirements.txt
python manage.py runserver
```

访问：http://localhost:8080

## 🛠️ 开发环境搭建

### 环境配置

#### 后端环境

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 环境变量配置
cp .env.example .env
# 编辑 .env 文件配置必要的环境变量
```

#### 前端环境

```bash
# 安装依赖
npm install

# 开发环境配置
cp .env.development.example .env.development
# 编辑开发环境配置
```

### IDE配置

#### VS Code扩展推荐

```json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.django",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

#### VS Code设置

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.pylintEnabled": true,
  "python.linting.flake8Enabled": true
}
```

## 🎨 前端开发指南

### Vue组件开发

#### 组件模板

```vue
<template>
  <div class="component-name">
    <!-- 组件模板 -->
    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else>
      <!-- 主要内容 -->
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ComponentName',
  props: {
    // 组件属性定义
    title: {
      type: String,
      required: true
    },
    data: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const store = useStore()
    const loading = ref(false)
    
    // 计算属性
    const processedData = computed(() => {
      return props.data.map(item => ({
        ...item,
        processed: true
      }))
    })
    
    // 方法
    const handleClick = (item) => {
      emit('item-click', item)
    }
    
    // 生命周期
    onMounted(async () => {
      loading.value = true
      try {
        // 异步操作
      } finally {
        loading.value = false
      }
    })
    
    return {
      loading,
      processedData,
      handleClick
    }
  }
}
</script>

<style scoped>
.component-name {
  /* 组件样式 */
}

.loading {
  padding: 20px;
}
</style>
```

#### 组件最佳实践

1. **命名规范**
   - 组件名使用PascalCase
   - 文件名与组件名保持一致
   - 使用语义化的组件名

2. **Props验证**
   ```javascript
   props: {
     // 必须属性
     requiredProp: {
       type: String,
       required: true
     },
     // 可选属性
     optionalProp: {
       type: Number,
       default: 0,
       validator: (value) => value >= 0
     }
   }
   ```

3. **事件命名**
   ```javascript
   // 使用kebab-case
   emit('item-click', item)
   emit('status-change', { id, status })
   ```

4. **插槽使用**
   ```vue
   <!-- 父组件 -->
   <template #header="{ title }">
     <h1>{{ title }}</h1>
   </template>
   
   <!-- 子组件 -->
   <slot name="header" :title="computedTitle"></slot>
   ```

### 状态管理

#### Vuex Store模块

```javascript
// store/modules/example.js
const state = {
  items: [],
  loading: false,
  error: null
}

const getters = {
  items: state => state.items,
  loading: state => state.loading,
  error: state => state.error,
  itemsById: state => id => state.items.find(item => item.id === id)
}

const mutations = {
  SET_ITEMS(state, items) {
    state.items = items
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  ADD_ITEM(state, item) {
    state.items.push(item)
  },
  UPDATE_ITEM(state, { id, updates }) {
    const index = state.items.findIndex(item => item.id === id)
    if (index !== -1) {
      state.items.splice(index, 1, { ...state.items[index], ...updates })
    }
  }
}

const actions = {
  async fetchItems({ commit, state }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const response = await api.getItems()
      commit('SET_ITEMS', response.data)
      return response.data
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async createItem({ commit }, itemData) {
    try {
      const response = await api.createItem(itemData)
      commit('ADD_ITEM', response.data)
      return response.data
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
```

### API调用

#### Service层封装

```javascript
// src/services/ExampleService.js
import { request } from '@/utils/request'

class ExampleService {
  // 获取列表
  async getItems(params = {}) {
    return request({
      url: '/api/v1/examples/',
      method: 'GET',
      params
    })
  }
  
  // 获取详情
  async getItem(id) {
    return request({
      url: `/api/v1/examples/${id}/`,
      method: 'GET'
    })
  }
  
  // 创建
  async createItem(data) {
    return request({
      url: '/api/v1/examples/',
      method: 'POST',
      data
    })
  }
  
  // 更新
  async updateItem(id, data) {
    return request({
      url: `/api/v1/examples/${id}/`,
      method: 'PUT',
      data
    })
  }
  
  // 删除
  async deleteItem(id) {
    return request({
      url: `/api/v1/examples/${id}/`,
      method: 'DELETE'
    })
  }
}

export default new ExampleService()
```

### 路由管理

#### 路由配置

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: '仪表板',
      requiresAuth: true
    }
  },
  {
    path: '/workorders',
    name: 'WorkOrderList',
    component: () => import('@/views/workorder/List.vue'),
    meta: {
      title: '施工单列表',
      requiresAuth: true,
      permission: 'workorder.view_workorder'
    }
  },
  {
    path: '/workorders/:id',
    name: 'WorkOrderDetail',
    component: () => import('@/views/workorder/Detail.vue'),
    props: true,
    meta: {
      title: '施工单详情',
      requiresAuth: true,
      permission: 'workorder.view_workorder'
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 印刷施工单系统`
  }
  
  // 认证检查
  if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
    next('/login')
    return
  }
  
  // 权限检查
  if (to.meta.permission && !store.getters.hasPermission(to.meta.permission)) {
    next('/403')
    return
  }
  
  next()
})

export default router
```

## 🐍 后端开发指南

### Django模型设计

#### 模型定义

```python
# workorder/models/example.py
from django.db import models
from django.contrib.auth.models import User
from workorder.models.base import TimeStampedModel

class Example(TimeStampedModel):
    """示例模型"""
    
    class Status(models.TextChoices):
        DRAFT = 'draft', '草稿'
        ACTIVE = 'active', '激活'
        INACTIVE = 'inactive', '停用'
    
    name = models.CharField('名称', max_length=100)
    code = models.CharField('编码', max_length=50, unique=True)
    description = models.TextField('描述', blank=True)
    status = models.CharField(
        '状态', 
        max_length=20, 
        choices=Status.choices,
        default=Status.DRAFT
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        verbose_name='创建人'
    )
    is_active = models.BooleanField('是否激活', default=True)
    
    class Meta:
        verbose_name = '示例'
        verbose_name_plural = '示例'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    @property
    def full_name(self):
        """完整名称"""
        return f"{self.name} - {self.description}"
    
    def clean(self):
        """数据验证"""
        super().clean()
        if self.code and not self.code.isupper():
            raise ValidationError('编码必须为大写字母')
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
```

#### 模型关系

```python
# 一对一关系
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

# 一对多关系
class Category(models.Model):
    name = models.CharField(max_length=100)

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

# 多对多关系
class Tag(models.Model):
    name = models.CharField(max_length=50)

class Article(models.Model):
    tags = models.ManyToManyField(Tag)
    title = models.CharField(max_length=200)
```

### API视图开发

#### ViewSet使用

```python
# workorder/views/example.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from workorder.models.example import Example
from workorder.serializers.example import ExampleSerializer
from workorder.permissions import IsOwnerOrReadOnly

class ExampleViewSet(viewsets.ModelViewSet):
    """示例管理ViewSet"""
    queryset = Example.objects.all()
    serializer_class = ExampleSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """自定义查询集"""
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(created_by=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        """创建时设置创建人"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """激活示例"""
        instance = self.get_object()
        instance.status = Example.Status.ACTIVE
        instance.save()
        return Response({'message': '激活成功'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """停用示例"""
        instance = self.get_object()
        instance.status = Example.Status.INACTIVE
        instance.save()
        return Response({'message': '停用成功'})
```

#### 自定义视图

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class ExampleStatsView(APIView):
    """示例统计视图"""
    
    def get(self, request):
        """获取统计信息"""
        stats = {
            'total': Example.objects.count(),
            'active': Example.objects.filter(status='active').count(),
            'draft': Example.objects.filter(status='draft').count(),
        }
        return Response(stats)
```

### 序列化器

#### 基础序列化器

```python
# workorder/serializers/example.py
from rest_framework import serializers
from workorder.models.example import Example

class ExampleSerializer(serializers.ModelSerializer):
    """示例序列化器"""
    
    # 计算字段
    full_name = serializers.ReadOnlyField()
    
    # 自定义字段
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    
    # 嵌套序列化
    # related_data = RelatedSerializer(many=True, read_only=True)
    
    class Meta:
        model = Example
        fields = [
            'id', 'name', 'code', 'description', 'status',
            'created_by', 'created_by_name', 'created_at',
            'full_name', 'is_active'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        """验证编码"""
        if not value.isupper():
            raise serializers.ValidationError('编码必须为大写字母')
        return value
    
    def validate(self, attrs):
        """整体验证"""
        if attrs.get('status') == 'active' and not attrs.get('name'):
            raise serializers.ValidationError(
                '激活状态必须填写名称'
            )
        return attrs
```

### 权限控制

#### 自定义权限

```python
# workorder/permissions.py
from rest_framework.permissions import BasePermission

class IsOwnerOrReadOnly(BasePermission):
    """只有所有者可以编辑"""
    
    def has_object_permission(self, request, view, obj):
        # 读取权限对所有用户开放
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # 写入权限只对所有者开放
        return obj.created_by == request.user

class IsDepartmentMember(BasePermission):
    """部门成员权限"""
    
    def has_permission(self, request, view):
        user = request.user
        return user.departments.exists()
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        return obj.department in user.departments.all()
```

### 业务服务层

#### Service模式

```python
# workorder/services/example_service.py
from django.db import transaction
from rest_framework.exceptions import ValidationError
from workorder.models.example import Example

class ExampleService:
    """示例业务服务"""
    
    @staticmethod
    @transaction.atomic
    def create_example(user, data):
        """创建示例"""
        # 业务逻辑验证
        if Example.objects.filter(code=data['code']).exists():
            raise ValidationError('编码已存在')
        
        # 创建实例
        example = Example.objects.create(
            created_by=user,
            **data
        )
        
        # 后续业务操作
        # send_notification(user, example)
        
        return example
    
    @staticmethod
    @transaction.atomic
    def update_example(example, data):
        """更新示例"""
        # 验证状态转换
        if 'status' in data:
            if not ExampleService.can_change_status(example.status, data['status']):
                raise ValidationError('状态转换不允许')
        
        # 更新字段
        for field, value in data.items():
            setattr(example, field, value)
        
        example.save()
        
        return example
    
    @staticmethod
    def can_change_status(from_status, to_status):
        """检查状态转换是否允许"""
        # 定义状态转换规则
        allowed_transitions = {
            'draft': ['active', 'inactive'],
            'active': ['inactive'],
            'inactive': ['active']
        }
        
        return to_status in allowed_transitions.get(from_status, [])
```

## 📝 代码规范

### 前端代码规范

#### ESLint配置

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/airbnb'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/multi-word-component-names': 'off',
    'max-len': ['error', { code: 120 }],
    'no-unused-vars': 'error'
  }
}
```

#### 命名规范

```javascript
// 组件名：PascalCase
WorkOrderList.vue
TaskDetail.vue

// 文件名：kebab-case
work-order-service.js
task-management.vue

// 变量名：camelCase
const workOrderList = []
const currentUser = null

// 常量名：UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8000'
const MAX_FILE_SIZE = 10 * 1024 * 1024

// CSS类名：BEM
.work-order-list {}
.work-order-list__item {}
.work-order-list__item--active {}
```

### 后端代码规范

#### PEP8配置

```ini
# setup.cfg
[flake8]
max-line-length = 88
exclude = venv,__pycache__,migrations
extend-ignore = E203,W503

[pylint]
max-line-length = 88
```

#### 命名规范

```python
# 类名：PascalCase
class WorkOrder:
    pass

class ExampleService:
    pass

# 函数名和变量名：snake_case
def get_work_order_list():
    pass

current_user = None
work_order_count = 0

# 常量名：UPPER_SNAKE_CASE
MAX_FILE_SIZE = 10 * 1024 * 1024
DEFAULT_PAGE_SIZE = 20

# 私有方法：前缀下划线
def _validate_data():
    pass

class Example:
    def __init__(self):
        self._internal_field = None
```

## 🧪 测试指南

### 前端测试

#### 组件测试

```javascript
// tests/unit/components/ExampleComponent.spec.js
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import ExampleComponent from '@/components/ExampleComponent.vue'

describe('ExampleComponent', () => {
  let wrapper
  let store
  let router
  
  beforeEach(() => {
    // 创建store
    store = createStore({
      modules: {
        example: {
          namespaced: true,
          state: {
            items: []
          },
          actions: {
            fetchItems: jest.fn()
          }
        }
      }
    })
    
    // 创建router
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: ExampleComponent }]
    })
    
    // 挂载组件
    wrapper = mount(ExampleComponent, {
      global: {
        plugins: [store, router]
      },
      props: {
        title: 'Test Title'
      }
    })
  })
  
  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Test Title')
  })
  
  it('calls fetchItems on mount', async () => {
    await wrapper.vm.$nextTick()
    expect(store.dispatch).toHaveBeenCalledWith('example/fetchItems')
  })
  
  it('emits event when button clicked', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('button-click')).toBeTruthy()
  })
})
```

#### Service测试

```javascript
// tests/unit/services/ExampleService.spec.js
import ExampleService from '@/services/ExampleService'
import { request } from '@/utils/request'

jest.mock('@/utils/request')

describe('ExampleService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('fetches items successfully', async () => {
    const mockData = [{ id: 1, name: 'Test' }]
    request.mockResolvedValue({ data: mockData })
    
    const result = await ExampleService.getItems()
    
    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/examples/',
      method: 'GET',
      params: {}
    })
    expect(result).toEqual(mockData)
  })
  
  it('handles error gracefully', async () => {
    const error = new Error('Network error')
    request.mockRejectedValue(error)
    
    await expect(ExampleService.getItems()).rejects.toThrow('Network error')
  })
})
```

### 后端测试

#### 模型测试

```python
# workorder/tests/test_models.py
from django.test import TestCase
from django.contrib.auth.models import User
from workorder.models.example import Example

class ExampleModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass'
        )
    
    def test_example_creation(self):
        example = Example.objects.create(
            name='Test Example',
            code='TEST001',
            description='Test description',
            created_by=self.user
        )
        
        self.assertEqual(example.name, 'Test Example')
        self.assertEqual(example.code, 'TEST001')
        self.assertEqual(example.created_by, self.user)
        self.assertEqual(str(example), 'Test Example (TEST001)')
    
    def test_example_full_name_property(self):
        example = Example.objects.create(
            name='Test',
            code='TEST001',
            description='Description',
            created_by=self.user
        )
        
        self.assertEqual(example.full_name, 'Test - Description')
    
    def test_example_validation(self):
        with self.assertRaises(ValidationError):
            example = Example(
                name='Test',
                code='test001',  # 小写，应该验证失败
                created_by=self.user
            )
            example.full_clean()
```

#### API测试

```python
# workorder/tests/test_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from workorder.models.example import Example

class ExampleAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_example(self):
        data = {
            'name': 'Test Example',
            'code': 'TEST001',
            'description': 'Test description'
        }
        
        response = self.client.post('/api/v1/examples/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Example.objects.count(), 1)
        example = Example.objects.first()
        self.assertEqual(example.name, 'Test Example')
        self.assertEqual(example.created_by, self.user)
    
    def test_list_examples(self):
        Example.objects.create(
            name='Test 1',
            code='TEST001',
            created_by=self.user
        )
        Example.objects.create(
            name='Test 2',
            code='TEST002',
            created_by=self.user
        )
        
        response = self.client.get('/api/v1/examples/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_update_example(self):
        example = Example.objects.create(
            name='Test',
            code='TEST001',
            created_by=self.user
        )
        
        data = {'name': 'Updated Test'}
        response = self.client.patch(f'/api/v1/examples/{example.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        example.refresh_from_db()
        self.assertEqual(example.name, 'Updated Test')
```

## 🐛 调试技巧

### 前端调试

#### Vue DevTools

1. 安装Vue DevTools浏览器扩展
2. 在组件中添加debugger语句
3. 使用console.log进行调试

```javascript
// 调试技巧
export default {
  setup() {
    const state = ref(null)
    
    // 调试响应式数据
    watch(state, (newVal) => {
      console.log('State changed:', newVal)
      debugger // 断点调试
    })
    
    return { state }
  }
}
```

#### 网络请求调试

```javascript
// 添加请求拦截器调试
axios.interceptors.request.use(config => {
  console.log('Request:', config)
  return config
})

axios.interceptors.response.use(response => {
  console.log('Response:', response)
  return response
}, error => {
  console.error('Error:', error)
  return Promise.reject(error)
})
```

### 后端调试

#### Django调试

```python
# 使用pdb调试
import pdb; pdb.set_trace()

# 使用Django调试工具
from django.core.cache import cache
from django.db import connection

# 查看SQL查询
print(connection.queries)

# 缓存调试
print(cache.get('key'))
```

#### 日志配置

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
        },
        'workorder': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
        },
    },
}
```

## ⚡ 性能优化

### 前端性能优化

#### 组件懒加载

```javascript
// 路由懒加载
const routes = [
  {
    path: '/heavy-component',
    component: () => import('@/components/HeavyComponent.vue')
  }
]

// 组件懒加载
const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)
```

#### 虚拟滚动

```vue
<template>
  <VirtualList
    :items="largeDataList"
    :item-height="50"
    :container-height="400"
    :buffer="10"
  >
    <template #default="{ item, index }">
      <div :style="{ height: '50px' }">
        {{ item.name }} - {{ index }}
      </div>
    </template>
  </VirtualList>
</template>
```

#### 防抖节流

```javascript
// utils/debounce.js
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
```

### 后端性能优化

#### 数据库查询优化

```python
# 使用select_related减少查询次数
workorders = WorkOrder.objects.select_related(
    'customer', 'created_by'
).all()

# 使用prefetch_related预加载关联对象
workorders = WorkOrder.objects.prefetch_related(
    'products', 'processes'
).all()

# 使用索引
class Example(models.Model):
    code = models.CharField(max_length=50, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['code', 'status']),
        ]
```

#### 缓存策略

```python
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

# 视图缓存
@cache_page(60 * 15)  # 15分钟
def dashboard_stats(request):
    # 统计数据缓存
    pass

# 手动缓存
def get_expensive_data():
    data = cache.get('expensive_data')
    if data is None:
        data = calculate_expensive_data()
        cache.set('expensive_data', data, 60 * 60)  # 1小时
    return data
```

## 🔒 安全最佳实践

### 前端安全

#### XSS防护

```javascript
// 使用DOMPurify清理HTML
import DOMPurify from 'dompurify'

// 不安全的用法
element.innerHTML = userInput

// 安全的做法
element.innerHTML = DOMPurify.sanitize(userInput)
```

#### CSRF防护

```javascript
// axios CSRF配置
import axios from 'axios'

function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

axios.defaults.headers.common['X-CSRFToken'] = getCookie('csrftoken')
```

### 后端安全

#### 输入验证

```python
from django.core.validators import RegexValidator
from rest_framework import serializers

class ExampleSerializer(serializers.ModelSerializer):
    code = serializers.CharField(
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9_]+$',
                message='只允许大写字母、数字和下划线'
            )
        ]
    )
    
    def validate(self, attrs):
        # 自定义验证逻辑
        return attrs
```

#### 权限控制

```python
# 视图级权限
class ExampleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    
    # 对象级权限
    def get_queryset(self):
        queryset = Example.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(created_by=self.request.user)
        return queryset
```

## 🚀 部署指南

### 生产环境配置

#### 环境变量

```bash
# .env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@localhost/dbname
REDIS_URL=redis://localhost:6379/0
```

#### Nginx配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # 前端静态文件
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Gunicorn配置

```bash
# gunicorn.conf.py
bind = "127.0.0.1:8000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
```

### Docker部署

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["gunicorn", "--config", "gunicorn.conf.py", "config.wsgi:application"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/workorder
    depends_on:
      - db
      - redis
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - web
  
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: workorder
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

## ❓ 常见问题

### 开发环境问题

#### Q: 前端开发服务器启动失败？
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

#### Q: 后端迁移失败？
```bash
# 检查迁移状态
python manage.py showmigrations

# 回滚迁移
python manage.py migrate app_name migration_name

# 重新创建迁移
python manage.py makemigrations
python manage.py migrate
```

### 生产环境问题

#### Q: 静态文件加载失败？
```bash
# 收集静态文件
python manage.py collectstatic --noinput

# 检查Nginx配置
nginx -t
systemctl reload nginx
```

#### Q: 数据库连接错误？
```bash
# 检查数据库连接
python manage.py dbshell

# 检查环境变量
python manage.py shell
>>> import os
>>> os.environ.get('DATABASE_URL')
```

### 性能问题

#### Q: 页面加载慢？
1. 检查网络请求
2. 启用代码分割
3. 优化图片资源
4. 使用CDN加速

#### Q: API响应慢？
1. 检查数据库查询
2. 添加缓存机制
3. 优化N+1查询问题
4. 使用数据库索引

---

**文档版本：** v2.0.0  
**更新时间：** 2026-01-17  
**维护团队：** 开发团队  
**联系方式：** dev-team@company.com