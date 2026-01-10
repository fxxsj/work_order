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
        <el-submenu index="/tasks">
          <template slot="title">
            <i class="el-icon-s-order"></i>
            <span>任务管理</span>
          </template>
          <el-menu-item index="/tasks">
            <i class="el-icon-tickets"></i>
            <span>任务列表</span>
          </el-menu-item>
          <el-menu-item index="/tasks/board">
            <i class="el-icon-s-grid"></i>
            <span>部门任务看板</span>
          </el-menu-item>
          <el-menu-item index="/tasks/stats">
            <i class="el-icon-s-data"></i>
            <span>协作统计</span>
          </el-menu-item>
          <el-menu-item index="/tasks/assignment-history">
            <i class="el-icon-time"></i>
            <span>分派历史</span>
          </el-menu-item>
          <el-menu-item index="/tasks/assignment-rules">
            <i class="el-icon-setting"></i>
            <span>分派规则配置</span>
          </el-menu-item>
        </el-submenu>
        <el-menu-item v-if="canViewCustomer" index="/customers">
          <i class="el-icon-user"></i>
          <span>客户管理</span>
        </el-menu-item>
        <el-menu-item v-if="canViewDepartment" index="/departments">
          <i class="el-icon-menu"></i>
          <span>部门管理</span>
        </el-menu-item>
        <el-menu-item v-if="canViewProcess" index="/processes">
          <i class="el-icon-setting"></i>
          <span>工序管理</span>
        </el-menu-item>
        <el-menu-item v-if="canViewProduct" index="/products">
          <i class="el-icon-shopping-bag-2"></i>
          <span>产品管理</span>
        </el-menu-item>
        <el-menu-item v-if="canViewMaterial" index="/materials">
          <i class="el-icon-goods"></i>
          <span>物料管理</span>
        </el-menu-item>
        <el-submenu v-if="canViewSupplier || canViewPurchaseOrder || canViewSalesOrder" index="/purchase">
          <template slot="title">
            <i class="el-icon-shopping-cart-2"></i>
            <span>采购销售管理</span>
          </template>
          <el-menu-item v-if="canViewSupplier" index="/suppliers">
            <i class="el-icon-s-custom"></i>
            <span>供应商管理</span>
          </el-menu-item>
          <el-menu-item v-if="canViewPurchaseOrder" index="/purchase-orders">
            <i class="el-icon-document"></i>
            <span>采购单管理</span>
          </el-menu-item>
          <el-menu-item v-if="canViewSalesOrder" index="/sales-orders">
            <i class="el-icon-sold-out"></i>
            <span>销售订单管理</span>
          </el-menu-item>
        </el-submenu>
        <el-submenu v-if="canViewArtwork || canViewDie || canViewFoilingPlate || canViewEmbossingPlate" index="/plate-making">
          <template slot="title">
            <i class="el-icon-printer"></i>
            <span>制版管理</span>
          </template>
          <el-menu-item v-if="canViewArtwork" index="/artworks">
            <i class="el-icon-picture"></i>
            <span>图稿管理</span>
          </el-menu-item>
          <el-menu-item v-if="canViewDie" index="/dies">
            <i class="el-icon-scissors"></i>
            <span>刀模管理</span>
          </el-menu-item>
          <el-menu-item v-if="canViewFoilingPlate" index="/foiling-plates">
            <i class="el-icon-edit-outline"></i>
            <span>烫金版管理</span>
          </el-menu-item>
          <el-menu-item v-if="canViewEmbossingPlate" index="/embossing-plates">
            <i class="el-icon-s-grid"></i>
            <span>压凸版管理</span>
          </el-menu-item>
        </el-submenu>
        <el-menu-item v-if="canViewProductGroup" index="/product-groups">
          <i class="el-icon-collection"></i>
          <span>产品组管理</span>
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
      if (path.startsWith('/processes')) {
        return '/processes'
      }
      if (path.startsWith('/artworks') || path.startsWith('/dies') ||
          path.startsWith('/foiling-plates') || path.startsWith('/embossing-plates')) {
        return '/plate-making'
      }
      if (path.startsWith('/tasks')) {
        return '/tasks'
      }
      if (path.startsWith('/suppliers') || path.startsWith('/purchase-orders') || path.startsWith('/sales-orders')) {
        return '/purchase'
      }
      return path
    },
    currentUsername() {
      return this.$store.state.userInfo?.username || '用户'
    },
    // 检查是否有查看客户的权限
    canViewCustomer() {
      return this.hasPermission('workorder.view_customer')
    },
    // 检查是否有查看部门的权限
    canViewDepartment() {
      return this.hasPermission('workorder.view_department')
    },
    // 检查是否有查看工序的权限
    canViewProcess() {
      return this.hasPermission('workorder.view_process')
    },
    // 检查是否有查看产品的权限
    canViewProduct() {
      return this.hasPermission('workorder.view_product')
    },
    // 检查是否有查看物料的权限
    canViewMaterial() {
      return this.hasPermission('workorder.view_material')
    },
    // 检查是否有查看图稿的权限
    canViewArtwork() {
      return this.hasPermission('workorder.view_artwork')
    },
    // 检查是否有查看刀模的权限
    canViewDie() {
      return this.hasPermission('workorder.view_die')
    },
    // 检查是否有查看烫金版的权限
    canViewFoilingPlate() {
      return this.hasPermission('workorder.view_foilingplate')
    },
    // 检查是否有查看压凸版的权限
    canViewEmbossingPlate() {
      return this.hasPermission('workorder.view_embossingplate')
    },
    // 检查是否有查看产品组的权限
    canViewProductGroup() {
      return this.hasPermission('workorder.view_productgroup')
    },
    // 检查是否有查看供应商的权限
    canViewSupplier() {
      return this.hasPermission('workorder.view_supplier')
    },
    // 检查是否有查看采购单的权限
    canViewPurchaseOrder() {
      return this.hasPermission('workorder.view_purchaseorder')
    },
    // 检查是否有查看销售订单的权限
    canViewSalesOrder() {
      return this.hasPermission('workorder.view_salesorder')
    }
  },
  methods: {
    // 检查用户是否有指定权限
    hasPermission(permission) {
      const userInfo = this.$store.getters.currentUser
      if (!userInfo) return false
      
      // 超级用户拥有所有权限
      if (userInfo.is_superuser) return true
      
      // 检查权限列表
      const permissions = userInfo.permissions || []
      if (permissions.includes('*')) return true
      
      return permissions.includes(permission)
    },
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

