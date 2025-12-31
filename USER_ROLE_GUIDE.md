# 用户角色管理指南

## 概述

本系统使用 Django Groups 来管理用户角色。当前已实现"业务员"角色的判断功能。

## 实现方式

### 后端实现

1. **用户信息返回**：登录和获取当前用户信息时，会返回：
   - `groups`: 用户所属的组名称列表
   - `is_salesperson`: 布尔值，表示用户是否为业务员

2. **工具函数**：`workorder/utils.py` 提供了以下工具函数：
   - `is_salesperson(user)`: 判断用户是否为业务员
   - `get_user_role(user)`: 获取用户角色

### 前端实现

1. **Vuex Store**：在 `store/index.js` 中添加了以下 getters：
   - `isSalesperson`: 判断当前用户是否为业务员
   - `userGroups`: 获取当前用户的角色列表
   - `currentUser`: 获取当前用户信息

## 使用方法

### 1. 创建业务员组（已完成）

运行以下命令创建"业务员"组：

```bash
cd backend
source venv/bin/activate
python manage.py init_groups
```

### 2. 在 Django Admin 中分配用户角色

1. 访问 Django Admin：`http://localhost:8000/admin/`
2. 进入 "认证和授权" > "组"
3. 找到"业务员"组
4. 编辑组，将需要设置为业务员的用户添加到该组

### 3. 在前端组件中使用

#### 方法1：使用 Vuex Getter（推荐）

```vue
<template>
  <div>
    <el-button v-if="isSalesperson" type="primary">
      仅业务员可见的按钮
    </el-button>
    
    <div v-if="isSalesperson">
      业务员专属内容
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    // 使用 Vuex getter
    isSalesperson() {
      return this.$store.getters.isSalesperson
    },
    // 获取用户角色列表
    userGroups() {
      return this.$store.getters.userGroups
    }
  }
}
</script>
```

#### 方法2：直接从 store state 获取

```vue
<script>
export default {
  computed: {
    isSalesperson() {
      return this.$store.state.userInfo && this.$store.state.userInfo.is_salesperson
    }
  },
  methods: {
    checkPermission() {
      if (this.isSalesperson) {
        // 业务员可以执行的操作
        console.log('当前用户是业务员')
      } else {
        console.log('当前用户不是业务员')
      }
    }
  }
}
</script>
```

#### 方法3：在路由守卫中使用

```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  const isSalesperson = store.getters.isSalesperson
  
  // 某些路由仅业务员可访问
  if (to.meta.requiresSalesperson && !isSalesperson) {
    next('/unauthorized')
  } else {
    next()
  }
})
```

### 4. 在后端视图中使用

```python
from workorder.utils import is_salesperson

class MyViewSet(viewsets.ModelViewSet):
    def list(self, request):
        # 判断当前用户是否为业务员
        if is_salesperson(request.user):
            # 业务员可以看到的数据
            queryset = self.queryset.filter(...)
        else:
            # 其他用户看到的数据
            queryset = self.queryset.filter(...)
        
        return Response(...)
```

## 扩展其他角色

如果需要添加其他角色（如"生产管理员"、"财务"等），只需：

1. 修改 `init_groups.py` 命令，添加新组
2. 运行 `python manage.py init_groups`
3. 在 Django Admin 中分配用户
4. 在前端添加相应的 getter 和判断逻辑

示例：

```python
# backend/workorder/management/commands/init_groups.py
# 添加生产管理员组
production_manager_group, created = Group.objects.get_or_create(name='生产管理员')
```

```javascript
// frontend/src/store/index.js
getters: {
  isProductionManager: (state) => {
    return state.userInfo && state.userInfo.groups && 
           state.userInfo.groups.includes('生产管理员')
  }
}
```

## API 返回示例

登录或获取当前用户信息时，返回的数据格式：

```json
{
  "id": 1,
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "first_name": "三",
  "last_name": "张",
  "is_staff": false,
  "is_superuser": false,
  "groups": ["业务员"],
  "is_salesperson": true
}
```

## 注意事项

1. 用户必须登录后才能获取角色信息
2. 如果用户不属于任何组，`groups` 为空数组，`is_salesperson` 为 `false`
3. 一个用户可以属于多个组
4. 组名称区分大小写，建议使用中文名称以便管理

