<template>
  <div class="dashboard">
    <!-- 通知提醒（所有用户可见） -->
    <el-alert
      v-if="unreadNotificationCount > 0"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template slot="title">
        <span>您有 <strong style="color: #409EFF; font-size: 16px;">{{ unreadNotificationCount }}</strong> 条未读通知</span>
        <el-link type="primary" :underline="false" style="margin-left: 10px;" @click="goToNotifications">查看通知</el-link>
      </template>
    </el-alert>

    <!-- 待审核施工单提醒（仅业务员可见） -->
    <el-alert
      v-if="isSalesperson && statistics.pending_approval_count > 0"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template slot="title">
        <span>您有 <strong style="color: #E6A23C; font-size: 16px;">{{ statistics.pending_approval_count }}</strong> 个待审核的施工单，请及时处理。</span>
        <el-link type="primary" :underline="false" style="margin-left: 10px;" @click="goToPendingApprovals">点击查看</el-link>
      </template>
    </el-alert>

    <!-- 紧急优先级提醒（管理员可见） -->
    <el-alert
      v-if="isAdmin && urgentPriorityCount > 0"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template slot="title">
        <span>有 <strong style="color: #F56C6C; font-size: 16px;">{{ urgentPriorityCount }}</strong> 个紧急优先级的施工单需要处理</span>
        <el-link type="primary" :underline="false" style="margin-left: 10px;" @click="goToUrgentPriority">查看详情</el-link>
      </template>
    </el-alert>

    <!-- 即将到期提醒（管理员可见） -->
    <el-alert
      v-if="isAdmin && upcomingDeadlineCount > 0"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template slot="title">
        <span>有 <strong style="color: #E6A23C; font-size: 16px;">{{ upcomingDeadlineCount }}</strong> 个即将到期的施工单（7天内）需要关注</span>
        <el-link type="primary" :underline="false" style="margin-left: 10px;" @click="goToUpcomingDeadline">查看详情</el-link>
      </template>
    </el-alert>

    <!-- 统计卡片 - 施工单统计 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToWorkOrderList()">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409EFF;">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total_count || 0 }}</div>
              <div class="stat-label">施工单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToWorkOrderList({ status: 'completed' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <i class="el-icon-circle-check"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ getStatusCount('completed') }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToWorkOrderList({ status: 'in_progress' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <i class="el-icon-loading"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ getStatusCount('in_progress') }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToUpcomingDeadline()">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <i class="el-icon-warning"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.upcoming_deadline_count || 0 }}</div>
              <div class="stat-label">即将到期</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计卡片 - 任务统计（操作员、生产主管和管理员可见） -->
    <el-row v-if="isOperator || isSupervisor || isAdmin" :gutter="20" class="stat-cards" style="margin-top: 20px;">
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToTaskList()">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #909399;">
              <i class="el-icon-tickets"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStatistics.total_count || 0 }}</div>
              <div class="stat-label">任务总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToTaskList({ status: 'pending' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #C0C4CC;">
              <i class="el-icon-time"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStatusCount.pending || 0 }}</div>
              <div class="stat-label">待开始任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToTaskList({ status: 'in_progress' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <i class="el-icon-loading"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStatusCount.in_progress || 0 }}</div>
              <div class="stat-label">进行中任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card" @click.native="goToTaskList({ status: 'completed' })">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <i class="el-icon-circle-check"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStatusCount.completed || 0 }}</div>
              <div class="stat-label">已完成任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表和列表 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 状态分布 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>施工单状态分布</span>
          </div>
          <el-table 
            :data="statusTableData" 
            style="width: 100%"
            @row-click="handleStatusRowClick"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="status_display" label="状态" width="120">
              <template slot-scope="scope">
                <span :class="'status-badge status-' + scope.row.status">
                  {{ scope.row.status_display }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" align="right"></el-table-column>
            <el-table-column label="占比" align="right">
              <template slot-scope="scope">
                {{ getPercentage(scope.row.count) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 优先级分布 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>优先级分布</span>
          </div>
          <el-table 
            :data="priorityTableData" 
            style="width: 100%"
            @row-click="handlePriorityRowClick"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="priority_display" label="优先级" width="120">
              <template slot-scope="scope">
                <span :class="'status-badge priority-' + scope.row.priority">
                  {{ scope.row.priority_display }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" align="right"></el-table-column>
            <el-table-column label="占比" align="right">
              <template slot-scope="scope">
                {{ getPercentage(scope.row.count) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务状态分布（操作员、生产主管和管理员可见） -->
    <el-row v-if="isOperator || isSupervisor || isAdmin" :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>任务状态分布</span>
          </div>
          <el-table 
            :data="taskStatusStatistics" 
            style="width: 100%"
            @row-click="(row) => goToTaskList({ status: row.status })"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="status_display" label="状态" width="120">
              <template slot-scope="scope">
                <span :class="'status-badge status-' + scope.row.status">
                  {{ scope.row.status_display }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" align="right"></el-table-column>
            <el-table-column label="占比" align="right">
              <template slot-scope="scope">
                {{ getTaskPercentage(scope.row.count) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 生产效率分析（生产主管和管理员可见） -->
      <el-col v-if="isSupervisor || isAdmin" :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header">
            <span>生产效率分析</span>
          </div>
          <div style="padding: 10px 0;">
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>工序完成率</span>
                <span style="font-weight: bold; color: #409EFF;">
                  {{ efficiencyAnalysis.process_completion_rate || 0 }}%
                </span>
              </div>
              <el-progress 
                :percentage="efficiencyAnalysis.process_completion_rate || 0"
                :color="getProgressColor(efficiencyAnalysis.process_completion_rate)"
              ></el-progress>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>任务完成率</span>
                <span style="font-weight: bold; color: #409EFF;">
                  {{ taskStatistics.completion_rate || 0 }}%
                </span>
              </div>
              <el-progress 
                :percentage="taskStatistics.completion_rate || 0"
                :color="getProgressColor(taskStatistics.completion_rate)"
              ></el-progress>
            </div>
            <div style="margin-bottom: 15px;" v-if="efficiencyAnalysis.avg_completion_time_hours">
              <div style="display: flex; justify-content: space-between;">
                <span>平均完成时间</span>
                <span style="font-weight: bold; color: #67C23A;">
                  {{ efficiencyAnalysis.avg_completion_time_hours }} 小时
                </span>
              </div>
            </div>
            <div v-if="efficiencyAnalysis.defective_rate !== undefined">
              <div style="display: flex; justify-content: space-between;">
                <span>不良品率</span>
                <span style="font-weight: bold; color: #F56C6C;">
                  {{ efficiencyAnalysis.defective_rate }}%
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待确认图稿/版型（设计员可见） -->
    <el-row v-if="isDesigner" :gutter="20" style="margin-top: 20px;">
      <!-- 待确认图稿 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div slot="header" class="card-header">
            <span>待确认图稿</span>
            <el-button type="primary" size="mini" @click="$router.push('/artworks')">
              全部
            </el-button>
          </div>
          <div v-if="pendingArtworks.length > 0">
            <el-table :data="pendingArtworks.slice(0, 5)" style="width: 100%" max-height="200" size="mini">
              <el-table-column prop="code" label="编码" width="120" show-overflow-tooltip></el-table-column>
              <el-table-column prop="name" label="名称" min-width="100" show-overflow-tooltip></el-table-column>
              <el-table-column label="操作" width="80" fixed="right">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="mini"
                    @click="confirmArtwork(scope.row)"
                    :loading="confirmingItem === `artwork-${scope.row.id}`"
                  >
                    确认
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="pendingArtworks.length > 5" style="text-align: center; padding: 10px; color: #909399; font-size: 12px;">
              还有 {{ pendingArtworks.length - 5 }} 项...
            </div>
          </div>
          <div v-else style="text-align: center; padding: 20px; color: #909399;">
            暂无待确认图稿
          </div>
        </el-card>
      </el-col>

      <!-- 待确认刀模 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div slot="header" class="card-header">
            <span>待确认刀模</span>
            <el-button type="primary" size="mini" @click="$router.push('/dies')">
              全部
            </el-button>
          </div>
          <div v-if="pendingDies.length > 0">
            <el-table :data="pendingDies.slice(0, 5)" style="width: 100%" max-height="200" size="mini">
              <el-table-column prop="code" label="编码" width="120" show-overflow-tooltip></el-table-column>
              <el-table-column prop="name" label="名称" min-width="100" show-overflow-tooltip></el-table-column>
              <el-table-column label="操作" width="80" fixed="right">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="mini"
                    @click="confirmDie(scope.row)"
                    :loading="confirmingItem === `die-${scope.row.id}`"
                  >
                    确认
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="pendingDies.length > 5" style="text-align: center; padding: 10px; color: #909399; font-size: 12px;">
              还有 {{ pendingDies.length - 5 }} 项...
            </div>
          </div>
          <div v-else style="text-align: center; padding: 20px; color: #909399;">
            暂无待确认刀模
          </div>
        </el-card>
      </el-col>

      <!-- 待确认烫金版 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div slot="header" class="card-header">
            <span>待确认烫金版</span>
            <el-button type="primary" size="mini" @click="$router.push('/foiling-plates')">
              全部
            </el-button>
          </div>
          <div v-if="pendingFoilingPlates.length > 0">
            <el-table :data="pendingFoilingPlates.slice(0, 5)" style="width: 100%" max-height="200" size="mini">
              <el-table-column prop="code" label="编码" width="120" show-overflow-tooltip></el-table-column>
              <el-table-column prop="name" label="名称" min-width="100" show-overflow-tooltip></el-table-column>
              <el-table-column label="操作" width="80" fixed="right">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="mini"
                    @click="confirmFoilingPlate(scope.row)"
                    :loading="confirmingItem === `foiling_plate-${scope.row.id}`"
                  >
                    确认
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="pendingFoilingPlates.length > 5" style="text-align: center; padding: 10px; color: #909399; font-size: 12px;">
              还有 {{ pendingFoilingPlates.length - 5 }} 项...
            </div>
          </div>
          <div v-else style="text-align: center; padding: 20px; color: #909399;">
            暂无待确认烫金版
          </div>
        </el-card>
      </el-col>

      <!-- 待确认压凸版 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div slot="header" class="card-header">
            <span>待确认压凸版</span>
            <el-button type="primary" size="mini" @click="$router.push('/embossing-plates')">
              全部
            </el-button>
          </div>
          <div v-if="pendingEmbossingPlates.length > 0">
            <el-table :data="pendingEmbossingPlates.slice(0, 5)" style="width: 100%" max-height="200" size="mini">
              <el-table-column prop="code" label="编码" width="120" show-overflow-tooltip></el-table-column>
              <el-table-column prop="name" label="名称" min-width="100" show-overflow-tooltip></el-table-column>
              <el-table-column label="操作" width="80" fixed="right">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="mini"
                    @click="confirmEmbossingPlate(scope.row)"
                    :loading="confirmingItem === `embossing_plate-${scope.row.id}`"
                  >
                    确认
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="pendingEmbossingPlates.length > 5" style="text-align: center; padding: 10px; color: #909399; font-size: 12px;">
              还有 {{ pendingEmbossingPlates.length - 5 }} 项...
            </div>
          </div>
          <div v-else style="text-align: center; padding: 20px; color: #909399;">
            暂无待确认压凸版
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统一版型确认统计（设计员可见） -->
    <el-row v-if="isDesigner" :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="24" :md="24">
        <el-card>
          <div slot="header">
            <span>版型确认统计</span>
          </div>
          <div style="padding: 20px;">
            <el-row :gutter="20">
              <!-- 图稿统计 -->
              <el-col :xs="12" :sm="6" :md="6">
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #409EFF; margin-bottom: 5px;">
                    {{ totalPendingPlatesCount.artwork }}
                  </div>
                  <div style="font-size: 12px; color: #909399;">待确认图稿</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 5px;">
                    总计: {{ totalPlatesCount.artwork }}
                  </div>
                </div>
              </el-col>
              <!-- 刀模统计 -->
              <el-col :xs="12" :sm="6" :md="6">
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #409EFF; margin-bottom: 5px;">
                    {{ totalPendingPlatesCount.die }}
                  </div>
                  <div style="font-size: 12px; color: #909399;">待确认刀模</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 5px;">
                    总计: {{ totalPlatesCount.die }}
                  </div>
                </div>
              </el-col>
              <!-- 烫金版统计 -->
              <el-col :xs="12" :sm="6" :md="6">
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #409EFF; margin-bottom: 5px;">
                    {{ totalPendingPlatesCount.foiling_plate }}
                  </div>
                  <div style="font-size: 12px; color: #909399;">待确认烫金版</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 5px;">
                    总计: {{ totalPlatesCount.foiling_plate }}
                  </div>
                </div>
              </el-col>
              <!-- 压凸版统计 -->
              <el-col :xs="12" :sm="6" :md="6">
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #409EFF; margin-bottom: 5px;">
                    {{ totalPendingPlatesCount.embossing_plate }}
                  </div>
                  <div style="font-size: 12px; color: #909399;">待确认压凸版</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 5px;">
                    总计: {{ totalPlatesCount.embossing_plate }}
                  </div>
                </div>
              </el-col>
            </el-row>
            <el-divider></el-divider>
            <!-- 总体确认率 -->
            <div style="margin-top: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>总体确认率</span>
                <span style="font-weight: bold; color: #409EFF;">
                  {{ overallConfirmationRate }}%
                </span>
              </div>
              <el-progress
                :percentage="overallConfirmationRate"
                :color="getProgressColor(overallConfirmationRate)"
              ></el-progress>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 我的任务列表（操作员可见） -->
    <el-card v-if="isOperator && myTasks.length > 0" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>我的待处理任务</span>
        <el-button type="primary" size="small" @click="goToMyTasks">
          查看全部
        </el-button>
      </div>
      <el-table :data="myTasks" style="width: 100%">
        <el-table-column label="施工单号" width="150">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.work_order_process_info?.work_order?.id"
              type="primary"
              @click="$router.push(`/workorders/${scope.row.work_order_process_info.work_order.id}`)"
            >
              {{ scope.row.work_order_process_info.work_order.order_number || '-' }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="work_content" label="任务内容" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <span :class="'status-badge status-' + scope.row.status">
              {{ getTaskStatusDisplay(scope.row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template slot-scope="scope">
            <el-progress
              :percentage="getTaskProgress(scope.row)"
              :color="getTaskProgress(scope.row) === 100 ? '#67C23A' : '#409EFF'"
            ></el-progress>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template>
            <el-button
              type="text"
              size="small"
              @click="$router.push(`/tasks`)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 业务分析（管理员可见） -->
    <el-row v-if="isAdmin" :gutter="20" style="margin-top: 20px;">
      <!-- 客户统计 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>客户统计（Top 10）</span>
          </div>
          <el-table 
            :data="businessAnalysis.customer_statistics || []" 
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="customer" label="客户" min-width="150"></el-table-column>
            <el-table-column prop="total" label="施工单数" width="100" align="right"></el-table-column>
            <el-table-column prop="completed" label="已完成" width="100" align="right"></el-table-column>
            <el-table-column label="完成率" width="120" align="right">
              <template slot-scope="scope">
                <el-progress 
                  :percentage="scope.row.completion_rate || 0"
                  :color="getProgressColor(scope.row.completion_rate)"
                  :stroke-width="8"
                ></el-progress>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 产品统计 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>产品统计（Top 10）</span>
          </div>
          <el-table 
            :data="businessAnalysis.product_statistics || []" 
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="product_name" label="产品名称" min-width="150"></el-table-column>
            <el-table-column prop="product_code" label="产品编码" width="120"></el-table-column>
            <el-table-column prop="order_count" label="施工单数" width="100" align="right"></el-table-column>
            <el-table-column prop="total_quantity" label="总数量" width="100" align="right"></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 部门任务统计（管理员和生产主管可见） -->
    <el-row v-if="isAdmin || isSupervisor" :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="24" :md="24">
        <el-card>
          <div slot="header" class="card-header">
            <span>部门任务统计</span>
          </div>
          <el-table 
            :data="departmentStatistics" 
            style="width: 100%"
            @row-click="(row) => goToTaskList({ assigned_department__name: row.department })"
            :row-style="{ cursor: 'pointer' }"
          >
            <el-table-column prop="department" label="部门" min-width="150"></el-table-column>
            <el-table-column prop="total" label="任务总数" width="120" align="right"></el-table-column>
            <el-table-column prop="completed" label="已完成" width="120" align="right"></el-table-column>
            <el-table-column label="完成率" width="200" align="right">
              <template slot-scope="scope">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <el-progress 
                    :percentage="scope.row.completion_rate || 0"
                    :color="getProgressColor(scope.row.completion_rate)"
                    :stroke-width="10"
                    style="flex: 1;"
                  ></el-progress>
                  <span style="min-width: 50px; text-align: right; font-weight: bold;">
                    {{ scope.row.completion_rate || 0 }}%
                  </span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近的施工单 -->
    <el-card style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>最近的施工单</span>
        <el-button type="primary" size="small" @click="$router.push('/workorders')">
          查看全部
        </el-button>
      </div>
      <el-table :data="recentOrders" style="width: 100%">
        <el-table-column prop="order_number" label="施工单号" width="150"></el-table-column>
        <el-table-column prop="customer_name" label="客户"></el-table-column>
        <el-table-column prop="product_name" label="产品名称"></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <span :class="'status-badge status-' + scope.row.status">
              {{ scope.row.status_display }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template slot-scope="scope">
            <el-progress
              :percentage="scope.row.progress_percentage"
              :color="scope.row.progress_percentage === 100 ? '#67C23A' : '#409EFF'"
            ></el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="交货日期" width="120">
          <template slot-scope="scope">
            {{ scope.row.delivery_date | formatDate }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="$router.push(`/workorders/${scope.row.id}`)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { workOrderAPI, workOrderTaskAPI, notificationAPI, artworkAPI, dieAPI, foilingPlateAPI, embossingPlateAPI } from '@/api/workorder'
import { hasRole, hasAnyRole } from '@/utils/userRole'

const STATUS_MAP = {
  pending: '待开始',
  in_progress: '进行中',
  paused: '已暂停',
  completed: '已完成',
  cancelled: '已取消'
}

const PRIORITY_MAP = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急'
}

const TASK_STATUS_MAP = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

export default {
  name: 'Dashboard',
  data() {
    return {
      statistics: {},
      recentOrders: [],
      myTasks: [], // 我的任务列表（操作员）
      recentNotifications: [], // 最近的通知
      unreadNotificationCount: 0, // 未读通知数量
      pendingArtworks: [], // 待确认图稿（设计员）
      pendingDies: [], // 待确认刀模（设计员）
      pendingFoilingPlates: [], // 待确认烫金版（设计员）
      pendingEmbossingPlates: [], // 待确认压凸版（设计员）
      confirmingItem: null, // 正在确认的项目（用于显示loading状态）
      loading: false
    }
  },
  computed: {
    // 检查用户是否为业务员
    isSalesperson() {
      return hasRole(this.$store, '业务员')
    },
    // 检查用户是否为生产主管
    isSupervisor() {
      return hasAnyRole(this.$store, ['生产主管', '管理员'])
    },
    // 检查用户是否为操作员
    isOperator() {
      return hasAnyRole(this.$store, ['操作员', '生产主管'])
    },
    // 检查用户是否为设计员
    isDesigner() {
      return hasRole(this.$store, '设计员')
    },
    // 检查用户是否为管理员
    isAdmin() {
      const userInfo = this.$store.getters['user/currentUser']
      return userInfo && userInfo.is_superuser === true
    },
    // 获取业务分析数据
    businessAnalysis() {
      return this.statistics.business_analysis || {}
    },
    // 获取部门任务统计
    departmentStatistics() {
      return this.taskStatistics.department_statistics || []
    },
    // 计算紧急优先级施工单数量
    urgentPriorityCount() {
      const urgentWorkOrders = this.statistics.priority_statistics?.find(p => p.priority === 'urgent')
      return urgentWorkOrders?.count || 0
    },
    // 计算即将到期施工单数量
    upcomingDeadlineCount() {
      return this.statistics.upcoming_deadline_count || 0
    },
    // 计算紧急事项总数（用于其他统计，保留兼容性）
    urgentItemsCount() {
      return this.urgentPriorityCount + this.upcomingDeadlineCount
    },
    // 待确认图稿数量
    pendingArtworksCount() {
      return this.pendingArtworks.length
    },
    // 已确认图稿数量（从统计数据中获取，或从API获取）
    confirmedArtworksCount() {
      // 这里可以从API获取，暂时返回0
      return 0
    },
    // 总图稿数量
    totalArtworksCount() {
      return this.pendingArtworksCount + this.confirmedArtworksCount
    },
    // 图稿确认率
    artworkConfirmationRate() {
      if (this.totalArtworksCount === 0) return 0
      return Math.round((this.confirmedArtworksCount / this.totalArtworksCount) * 100)
    },
    // 待确认版型总数统计
    totalPendingPlatesCount() {
      return {
        artwork: this.pendingArtworks.length,
        die: this.pendingDies.length,
        foiling_plate: this.pendingFoilingPlates.length,
        embossing_plate: this.pendingEmbossingPlates.length
      }
    },
    // 版型总数统计（暂时只统计待确认的数量，后续可以从API获取总数）
    totalPlatesCount() {
      return {
        artwork: this.pendingArtworks.length + (this.totalArtworksCount - this.pendingArtworks.length),
        die: this.pendingDies.length,
        foiling_plate: this.pendingFoilingPlates.length,
        embossing_plate: this.pendingEmbossingPlates.length
      }
    },
    // 总体确认率
    overallConfirmationRate() {
      const totalPending = this.totalPendingPlatesCount.artwork + 
                          this.totalPendingPlatesCount.die + 
                          this.totalPendingPlatesCount.foiling_plate + 
                          this.totalPendingPlatesCount.embossing_plate
      const total = this.totalPlatesCount.artwork + 
                   this.totalPlatesCount.die + 
                   this.totalPlatesCount.foiling_plate + 
                   this.totalPlatesCount.embossing_plate
      if (total === 0) return 0
      const confirmed = total - totalPending
      return Math.round((confirmed / total) * 100)
    },
    // 获取任务统计数据
    taskStatistics() {
      return this.statistics.task_statistics || {}
    },
    // 获取生产效率分析数据
    efficiencyAnalysis() {
      return this.statistics.efficiency_analysis || {}
    },
    // 获取任务状态统计
    taskStatusStatistics() {
      if (!this.taskStatistics.status_statistics) return []
      return this.taskStatistics.status_statistics.map(item => ({
        ...item,
        status_display: TASK_STATUS_MAP[item.status] || item.status
      }))
    },
    // 获取任务状态数量
    taskStatusCount() {
      const stats = this.taskStatistics.status_statistics || []
      const result = {}
      stats.forEach(item => {
        result[item.status] = item.count
      })
      return result
    },
    statusTableData() {
      if (!this.statistics.status_statistics) return []
      return this.statistics.status_statistics.map(item => ({
        ...item,
        status_display: STATUS_MAP[item.status] || item.status
      }))
    },
    priorityTableData() {
      if (!this.statistics.priority_statistics) return []
      return this.statistics.priority_statistics.map(item => ({
        ...item,
        priority_display: PRIORITY_MAP[item.priority] || item.priority
      }))
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

          // 加载最近3条重要通知
          const notificationResponse = await notificationAPI.getList({
            page_size: 3,
            ordering: '-created_at',
            is_read: false
          })
          this.recentNotifications = notificationResponse.results || []
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
    getStatusCount(status) {
      if (!this.statistics.status_statistics) return 0
      const item = this.statistics.status_statistics.find(s => s.status === status)
      return item ? item.count : 0
    },
    getPercentage(count) {
      const total = this.statistics.total_count || 0
      if (total === 0) return 0
      return ((count / total) * 100).toFixed(1)
    },
    getTaskPercentage(count) {
      const total = this.taskStatistics.total_count || 0
      if (total === 0) return 0
      return ((count / total) * 100).toFixed(1)
    },
    getTaskProgress(task) {
      if (!task.production_quantity || task.production_quantity === 0) return 0
      const progress = (task.quantity_completed / task.production_quantity) * 100
      return Math.min(Math.round(progress), 100)
    },
    getProgressColor(percentage) {
      if (percentage >= 80) return '#67C23A'
      if (percentage >= 50) return '#E6A23C'
      return '#F56C6C'
    },
    getTaskStatusDisplay(status) {
      return TASK_STATUS_MAP[status] || status
    },
    goToPendingApprovals() {
      // 跳转到施工单列表，并筛选出当前业务员负责的待审核施工单
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
      // 跳转到施工单列表，并应用筛选条件
      const query = { ...filters }
      this.$router.push({
        path: '/workorders',
        query
      })
    },
    handleStatusRowClick(row) {
      // 点击状态行，跳转到对应状态的施工单列表
      this.goToWorkOrderList({ status: row.status })
    },
    handlePriorityRowClick(row) {
      // 点击优先级行，跳转到对应优先级的施工单列表
      this.goToWorkOrderList({ priority: row.priority })
    },
    goToUpcomingDeadline() {
      // 跳转到即将到期的施工单列表
      // 即将到期：交货日期在未来7天内
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
    // 跳转到任务列表
    goToTaskList(filters = {}) {
      this.$router.push({
        path: '/tasks',
        query: filters
      })
    },
    // 跳转到我的任务
    goToMyTasks() {
      const userInfo = this.$store.getters['user/currentUser']
      if (userInfo && userInfo.id) {
        this.goToTaskList({ assigned_operator: userInfo.id })
      }
    },
    // 跳转到通知列表
    goToNotifications() {
      this.$router.push('/notifications')
    },
    // 跳转到紧急优先级施工单
    goToUrgentPriority() {
      this.$router.push({
        path: '/workorders',
        query: {
          priority: 'urgent'
        }
      })
    },
    // 加载待确认版型（设计员）
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
        // 加载待确认刀模
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
        // 加载待确认烫金版
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
        // 加载待确认压凸版
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
    // 确认图稿
    async confirmArtwork(artwork) {
      const itemKey = `artwork-${artwork.id}`
      this.confirmingItem = itemKey
      try {
        await artworkAPI.confirm(artwork.id)
        this.$message.success('图稿确认成功')
        // 从待确认列表中移除
        this.pendingArtworks = this.pendingArtworks.filter(item => item.id !== artwork.id)
        // 重新加载待确认版型数据（可能会有新的待确认项）
        await this.loadPendingPlates()
      } catch (error) {
        console.error('确认图稿失败:', error)
        this.$message.error(error.response?.data?.error || '确认图稿失败')
      } finally {
        this.confirmingItem = null
      }
    },
    // 确认刀模
    async confirmDie(die) {
      const itemKey = `die-${die.id}`
      this.confirmingItem = itemKey
      try {
        await dieAPI.confirm(die.id)
        this.$message.success('刀模确认成功')
        // 从待确认列表中移除
        this.pendingDies = this.pendingDies.filter(item => item.id !== die.id)
        // 重新加载待确认版型数据
        await this.loadPendingPlates()
      } catch (error) {
        console.error('确认刀模失败:', error)
        this.$message.error(error.response?.data?.error || '确认刀模失败')
      } finally {
        this.confirmingItem = null
      }
    },
    // 确认烫金版
    async confirmFoilingPlate(foilingPlate) {
      const itemKey = `foiling_plate-${foilingPlate.id}`
      this.confirmingItem = itemKey
      try {
        await foilingPlateAPI.confirm(foilingPlate.id)
        this.$message.success('烫金版确认成功')
        // 从待确认列表中移除
        this.pendingFoilingPlates = this.pendingFoilingPlates.filter(item => item.id !== foilingPlate.id)
        // 重新加载待确认版型数据
        await this.loadPendingPlates()
      } catch (error) {
        console.error('确认烫金版失败:', error)
        this.$message.error(error.response?.data?.error || '确认烫金版失败')
      } finally {
        this.confirmingItem = null
      }
    },
    // 确认压凸版
    async confirmEmbossingPlate(embossingPlate) {
      const itemKey = `embossing_plate-${embossingPlate.id}`
      this.confirmingItem = itemKey
      try {
        await embossingPlateAPI.confirm(embossingPlate.id)
        this.$message.success('压凸版确认成功')
        // 从待确认列表中移除
        this.pendingEmbossingPlates = this.pendingEmbossingPlates.filter(item => item.id !== embossingPlate.id)
        // 重新加载待确认版型数据
        await this.loadPendingPlates()
      } catch (error) {
        console.error('确认压凸版失败:', error)
        this.$message.error(error.response?.data?.error || '确认压凸版失败')
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

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

