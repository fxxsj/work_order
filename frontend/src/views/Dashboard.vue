<template>
  <div class="dashboard">
    <!-- 通知提醒 -->
    <NotificationAlerts
      :unread-count="unreadNotificationCount"
      :pending-approval-count="statistics.pending_approval_count || 0"
      :urgent-priority-count="urgentPriorityCount"
      :upcoming-deadline-count="upcomingDeadlineCount"
      :is-salesperson="isSalesperson"
      :is-admin="isAdmin"
      @view-notifications="goToNotifications"
      @view-pending-approvals="goToPendingApprovals"
      @view-urgent-priority="goToUrgentPriority"
      @view-upcoming-deadline="goToUpcomingDeadline"
    />

    <!-- 施工单统计 -->
    <WorkOrderStatistics
      :statistics="statistics"
      @navigate="goToWorkOrderList"
      @navigate-upcoming-deadline="goToUpcomingDeadline"
    />

    <!-- 任务统计（操作员、生产主管和管理员可见） -->
    <TaskStatistics
      v-if="isOperator || isSupervisor || isAdmin"
      :task-statistics="taskStatistics"
      :efficiency-analysis="efficiencyAnalysis"
      :show-efficiency="isSupervisor || isAdmin"
      @navigate="goToTaskList"
    />

    <!-- 待确认图稿/版型（设计员可见） -->
    <DesignerPendingPlates
      v-if="isDesigner"
      :pending-artworks="pendingArtworks"
      :pending-dies="pendingDies"
      :pending-foiling-plates="pendingFoilingPlates"
      :pending-embossing-plates="pendingEmbossingPlates"
      :confirming-item="confirmingItem"
      @confirm="handlePlateConfirm"
    />

    <!-- 我的任务列表（操作员可见） -->
    <MyTasks
      v-if="isOperator && myTasks.length > 0"
      :tasks="myTasks"
      @view-all="goToMyTasks"
    />

    <!-- 业务分析（管理员可见） -->
    <BusinessAnalysis
      v-if="isAdmin"
      :business-analysis="businessAnalysis"
      :department-statistics="departmentStatistics"
      @navigate-tasks="goToTaskList"
    />

    <!-- 最近的施工单 -->
    <RecentWorkOrders :recent-orders="recentOrders" />
  </div>
</template>

<script>
import {
  workOrderAPI,
  workOrderTaskAPI,
  notificationAPI,
  artworkAPI,
  dieAPI,
  foilingPlateAPI,
  embossingPlateAPI
} from '@/api/modules'
import { hasRole, hasAnyRole } from '@/utils/userRole'
import NotificationAlerts from './dashboard/components/NotificationAlerts.vue'
import WorkOrderStatistics from './dashboard/components/WorkOrderStatistics.vue'
import TaskStatistics from './dashboard/components/TaskStatistics.vue'
import DesignerPendingPlates from './dashboard/components/DesignerPendingPlates.vue'
import MyTasks from './dashboard/components/MyTasks.vue'
import BusinessAnalysis from './dashboard/components/BusinessAnalysis.vue'
import RecentWorkOrders from './dashboard/components/RecentWorkOrders.vue'

export default {
  name: 'Dashboard',
  components: {
    NotificationAlerts,
    WorkOrderStatistics,
    TaskStatistics,
    DesignerPendingPlates,
    MyTasks,
    BusinessAnalysis,
    RecentWorkOrders
  },
  data() {
    return {
      statistics: {},
      recentOrders: [],
      myTasks: [],
      unreadNotificationCount: 0,
      pendingArtworks: [],
      pendingDies: [],
      pendingFoilingPlates: [],
      pendingEmbossingPlates: [],
      confirmingItem: null,
      loading: false
    }
  },
  computed: {
    isSalesperson() {
      return hasRole(this.$store, '业务员')
    },
    isSupervisor() {
      return hasAnyRole(this.$store, ['生产主管', '管理员'])
    },
    isOperator() {
      return hasAnyRole(this.$store, ['操作员', '生产主管'])
    },
    isDesigner() {
      return hasRole(this.$store, '设计员')
    },
    isAdmin() {
      const userInfo = this.$store.getters['user/currentUser']
      return userInfo && userInfo.is_superuser === true
    },
    businessAnalysis() {
      return this.statistics.business_analysis || {}
    },
    departmentStatistics() {
      return this.taskStatistics.department_statistics || []
    },
    urgentPriorityCount() {
      const urgentWorkOrders = this.statistics.priority_statistics?.find(p => p.priority === 'urgent')
      return urgentWorkOrders?.count || 0
    },
    upcomingDeadlineCount() {
      return this.statistics.upcoming_deadline_count || 0
    },
    taskStatistics() {
      return this.statistics.task_statistics || {}
    },
    efficiencyAnalysis() {
      return this.statistics.efficiency_analysis || {}
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // 加载统计数据
        const stats = await workOrderAPI.getStatistics()
        this.statistics = stats

        // 加载最近的施工单
        const response = await workOrderAPI.getList({
          page_size: 10,
          ordering: '-created_at'
        })
        this.recentOrders = response.results || []

        // 如果是操作员，加载我的任务
        if (this.isOperator) {
          const userInfo = this.$store.getters['user/currentUser']
          if (userInfo && userInfo.id) {
            try {
              const taskResponse = await workOrderTaskAPI.getList({
                assigned_operator: userInfo.id,
                page_size: 10,
                ordering: '-created_at'
              })
              this.myTasks = taskResponse.results || []
            } catch (error) {
              console.error('加载我的任务失败:', error)
            }
          }
        }

        // 加载通知数据
        try {
          const unreadResponse = await notificationAPI.getUnreadCount()
          this.unreadNotificationCount = unreadResponse.unread_count || 0
        } catch (error) {
          console.error('加载通知失败:', error)
        }

        // 如果是设计员，加载待确认图稿和版型
        if (this.isDesigner) {
          await this.loadPendingPlates()
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        this.$message.error('加载数据失败，请刷新重试')
      } finally {
        this.loading = false
      }
    },
    goToPendingApprovals() {
      const userInfo = this.$store.getters['user/currentUser']
      if (!userInfo || !userInfo.id) return

      this.$router.push({
        path: '/workorders',
        query: {
          approval_status: 'pending',
          customer__salesperson: userInfo.id
        }
      })
    },
    goToWorkOrderList(filters = {}) {
      const query = { ...filters }
      this.$router.push({
        path: '/workorders',
        query
      })
    },
    goToUpcomingDeadline() {
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      this.$router.push({
        path: '/workorders',
        query: {
          delivery_date__gte: today.toISOString().split('T')[0],
          delivery_date__lte: nextWeek.toISOString().split('T')[0]
        }
      })
    },
    goToTaskList(filters = {}) {
      this.$router.push({
        path: '/tasks',
        query: filters
      })
    },
    goToMyTasks() {
      const userInfo = this.$store.getters['user/currentUser']
      if (userInfo && userInfo.id) {
        this.goToTaskList({ assigned_operator: userInfo.id })
      }
    },
    goToNotifications() {
      this.$router.push('/notifications')
    },
    goToUrgentPriority() {
      this.$router.push({
        path: '/workorders',
        query: {
          priority: 'urgent'
        }
      })
    },
    async loadPendingPlates() {
      try {
        // 加载待确认图稿
        const artworkResponse = await artworkAPI.getList({
          page_size: 50,
          ordering: '-created_at'
        })
        this.pendingArtworks = (artworkResponse.results || [])
          .filter(item => !item.confirmed)
          .slice(0, 10)
          .map(item => ({
            ...item,
            code: item.code || (item.base_code ? (item.base_code + (item.version > 1 ? '-v' + item.version : '')) : '-')
          }))
      } catch (error) {
        console.error('加载待确认图稿失败:', error)
      }

      try {
        const dieResponse = await dieAPI.getList({
          page_size: 50,
          ordering: '-created_at'
        })
        this.pendingDies = (dieResponse.results || [])
          .filter(item => !item.confirmed)
          .slice(0, 10)
      } catch (error) {
        console.error('加载待确认刀模失败:', error)
      }

      try {
        const foilingPlateResponse = await foilingPlateAPI.getList({
          page_size: 50,
          ordering: '-created_at'
        })
        this.pendingFoilingPlates = (foilingPlateResponse.results || [])
          .filter(item => !item.confirmed)
          .slice(0, 10)
      } catch (error) {
        console.error('加载待确认烫金版失败:', error)
      }

      try {
        const embossingPlateResponse = await embossingPlateAPI.getList({
          page_size: 50,
          ordering: '-created_at'
        })
        this.pendingEmbossingPlates = (embossingPlateResponse.results || [])
          .filter(item => !item.confirmed)
          .slice(0, 10)
      } catch (error) {
        console.error('加载待确认压凸版失败:', error)
      }
    },
    async handlePlateConfirm({ type, item }) {
      const itemKey = `${type}-${item.id}`
      this.confirmingItem = itemKey

      const apiMap = {
        artwork: artworkAPI,
        die: dieAPI,
        foiling_plate: foilingPlateAPI,
        embossing_plate: embossingPlateAPI
      }

      const labelMap = {
        artwork: '图稿',
        die: '刀模',
        foiling_plate: '烫金版',
        embossing_plate: '压凸版'
      }

      try {
        await apiMap[type].confirm(item.id)
        this.$message.success(`${labelMap[type]}确认成功`)

        // 从待确认列表中移除
        const listMap = {
          artwork: 'pendingArtworks',
          die: 'pendingDies',
          foiling_plate: 'pendingFoilingPlates',
          embossing_plate: 'pendingEmbossingPlates'
        }
        this[listMap[type]] = this[listMap[type]].filter(i => i.id !== item.id)

        // 重新加载待确认版型数据
        await this.loadPendingPlates()
      } catch (error) {
        console.error(`确认${labelMap[type]}失败:`, error)
        this.$message.error(error.response?.data?.error || `确认${labelMap[type]}失败`)
      } finally {
        this.confirmingItem = null
      }
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
</style>
