<template>
  <el-container class="wo-authed">
    <el-aside v-if="!isMobile" class="wo-sider" width="220px">
      <SideNav :groups="navGroups" />
    </el-aside>

    <el-container>
      <el-header class="wo-header" height="56px">
        <div class="wo-header__left">
          <el-button v-if="isMobile" size="small" @click="drawerOpen = true">菜单</el-button>
          <div class="wo-header__brand">印刷施工单</div>
        </div>

        <div class="wo-header__right">
          <el-button size="small" @click="goNotifications">
            通知<span v-if="unreadCount">（{{ unreadCount }}）</span>
          </el-button>
          <div class="wo-header__user" v-if="user.currentUser">
            {{ user.currentUser.username }}
          </div>
          <el-button size="small" @click="logout">退出</el-button>
        </div>
      </el-header>

      <el-main class="wo-main">
        <div v-if="!isMobile" class="wo-breadcrumb-wrap">
          <BreadcrumbNav />
        </div>
        <router-view />
      </el-main>
    </el-container>

    <el-drawer v-model="drawerOpen" direction="ltr" size="80%" title="导航">
      <SideNav :groups="navGroups" @navigate="drawerOpen = false" />
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SideNav from '../components/SideNav.vue'
import { authedNavGroups } from '../router'
import { useBreakpoints } from '../composables/useBreakpoints'
import { useNotificationsStore } from '../stores/notifications'
import { useUserStore } from '../stores/user'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'

const router = useRouter()
const user = useUserStore()
const notifications = useNotificationsStore()
const { isMobile } = useBreakpoints()

const drawerOpen = ref(false)
const navGroups = authedNavGroups
const unreadCount = computed(() => notifications.unreadCount)

onMounted(() => {
  user.fetchCurrentUser().catch(() => {
    // ignore
  })
  notifications.refreshUnreadCount().catch(() => {
    // ignore
  })
})

function goNotifications() {
  router.push({ name: 'notifications' })
}

function logout() {
  user.logout()
  router.push({ name: 'login' })
}
</script>
