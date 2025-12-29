<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>施工单系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <i class="el-icon-s-home"></i>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/workorders">
          <i class="el-icon-document"></i>
          <span>施工单</span>
        </el-menu-item>
        <el-menu-item index="/customers">
          <i class="el-icon-user"></i>
          <span>客户管理</span>
        </el-menu-item>
        <el-menu-item index="/process-categories">
          <i class="el-icon-menu"></i>
          <span>工序分类管理</span>
        </el-menu-item>
        <el-menu-item index="/processes">
          <i class="el-icon-setting"></i>
          <span>工序管理</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <i class="el-icon-shopping-bag-2"></i>
          <span>产品管理</span>
        </el-menu-item>
        <el-menu-item index="/materials">
          <i class="el-icon-goods"></i>
          <span>物料管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <i class="el-icon-user-solid"></i>
              <span>{{ currentUsername }}</span>
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="admin">管理后台</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { logout } from '@/api/auth'

export default {
  name: 'Layout',
  computed: {
    activeMenu() {
      const route = this.$route
      const { path } = route
      // 处理详情页等子路由
      if (path.startsWith('/workorders')) {
        return '/workorders'
      }
      if (path.startsWith('/process-categories')) {
        return '/process-categories'
      }
      if (path.startsWith('/processes')) {
        return '/processes'
      }
      return path
    },
    currentUsername() {
      return this.$store.state.userInfo?.username || '用户'
    }
  },
  methods: {
    handleCommand(command) {
      if (command === 'admin') {
        window.open('/admin/', '_blank')
      } else if (command === 'logout') {
        this.$confirm('确定要退出登录吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async () => {
          try {
            await logout()
            this.$store.dispatch('setUserInfo', null)
            this.$message.success('已退出登录')
            this.$router.push('/login')
          } catch (error) {
            console.error('退出登录失败:', error)
            // 即使API调用失败，也清除本地状态并跳转
            this.$store.dispatch('setUserInfo', null)
            this.$router.push('/login')
          }
        }).catch(() => {})
      }
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow-x: hidden;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2c3e50;
}

.logo h2 {
  color: white;
  margin: 0;
  font-size: 18px;
}

.sidebar-menu {
  border-right: none;
}

.header {
  background-color: white;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.main-content {
  background-color: #f0f2f5;
  overflow-y: auto;
}
</style>

