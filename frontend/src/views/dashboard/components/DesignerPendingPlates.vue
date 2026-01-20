<template>
  <div class="designer-pending-plates">
    <!-- 待确认版型列表 -->
    <el-row :gutter="20">
      <!-- 待确认图稿 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card>
          <div slot="header" class="card-header">
            <span>待确认图稿</span>
            <el-button type="primary" size="mini" @click="$router.push('/artworks')">
              全部
            </el-button>
          </div>
          <PendingPlateList
            :items="pendingArtworks"
            :confirming-item="confirmingItem"
            type="artwork"
            @confirm="handleConfirm"
          />
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
          <PendingPlateList
            :items="pendingDies"
            :confirming-item="confirmingItem"
            type="die"
            @confirm="handleConfirm"
          />
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
          <PendingPlateList
            :items="pendingFoilingPlates"
            :confirming-item="confirmingItem"
            type="foiling_plate"
            @confirm="handleConfirm"
          />
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
          <PendingPlateList
            :items="pendingEmbossingPlates"
            :confirming-item="confirmingItem"
            type="embossing_plate"
            @confirm="handleConfirm"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 版型确认统计 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="24" :md="24">
        <el-card>
          <div slot="header">
            <span>版型确认统计</span>
          </div>
          <div class="plate-statistics">
            <el-row :gutter="20">
              <!-- 图稿统计 -->
              <el-col :xs="12" :sm="6" :md="6">
                <div class="stat-item">
                  <div class="stat-count">
                    {{ totalPendingPlatesCount.artwork }}
                  </div>
                  <div class="stat-label">
                    待确认图稿
                  </div>
                  <div class="stat-total">
                    总计: {{ totalPlatesCount.artwork }}
                  </div>
                </div>
              </el-col>
              <!-- 刀模统计 -->
              <el-col :xs="12" :sm="6" :md="6">
                <div class="stat-item">
                  <div class="stat-count">
                    {{ totalPendingPlatesCount.die }}
                  </div>
                  <div class="stat-label">
                    待确认刀模
                  </div>
                  <div class="stat-total">
                    总计: {{ totalPlatesCount.die }}
                  </div>
                </div>
              </el-col>
              <!-- 烫金版统计 -->
              <el-col :xs="12" :sm="6" :md="6">
                <div class="stat-item">
                  <div class="stat-count">
                    {{ totalPendingPlatesCount.foiling_plate }}
                  </div>
                  <div class="stat-label">
                    待确认烫金版
                  </div>
                  <div class="stat-total">
                    总计: {{ totalPlatesCount.foiling_plate }}
                  </div>
                </div>
              </el-col>
              <!-- 压凸版统计 -->
              <el-col :xs="12" :sm="6" :md="6">
                <div class="stat-item">
                  <div class="stat-count">
                    {{ totalPendingPlatesCount.embossing_plate }}
                  </div>
                  <div class="stat-label">
                    待确认压凸版
                  </div>
                  <div class="stat-total">
                    总计: {{ totalPlatesCount.embossing_plate }}
                  </div>
                </div>
              </el-col>
            </el-row>
            <el-divider />
            <!-- 总体确认率 -->
            <div class="overall-rate">
              <div class="rate-header">
                <span>总体确认率</span>
                <span class="rate-value">{{ overallConfirmationRate }}%</span>
              </div>
              <el-progress
                :percentage="overallConfirmationRate"
                :color="getProgressColor(overallConfirmationRate)"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import PendingPlateList from './PendingPlateList.vue'

export default {
  name: 'DesignerPendingPlates',
  components: {
    PendingPlateList
  },
  props: {
    pendingArtworks: {
      type: Array,
      default: () => []
    },
    pendingDies: {
      type: Array,
      default: () => []
    },
    pendingFoilingPlates: {
      type: Array,
      default: () => []
    },
    pendingEmbossingPlates: {
      type: Array,
      default: () => []
    },
    confirmingItem: {
      type: String,
      default: null
    }
  },
  computed: {
    totalPendingPlatesCount() {
      return {
        artwork: this.pendingArtworks.length,
        die: this.pendingDies.length,
        foiling_plate: this.pendingFoilingPlates.length,
        embossing_plate: this.pendingEmbossingPlates.length
      }
    },
    totalPlatesCount() {
      // 这里暂时只统计待确认的数量，后续可以从API获取总数
      return {
        artwork: this.pendingArtworks.length,
        die: this.pendingDies.length,
        foiling_plate: this.pendingFoilingPlates.length,
        embossing_plate: this.pendingEmbossingPlates.length
      }
    },
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
    }
  },
  methods: {
    handleConfirm(data) {
      this.$emit('confirm', data)
    },
    getProgressColor(percentage) {
      if (percentage >= 80) return '#67C23A'
      if (percentage >= 50) return '#E6A23C'
      return '#F56C6C'
    }
  }
}
</script>

<style scoped>
.designer-pending-plates {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plate-statistics {
  padding: 20px;
}

.stat-item {
  text-align: center;
}

.stat-count {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-total {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.overall-rate {
  margin-top: 20px;
}

.rate-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.rate-value {
  font-weight: bold;
  color: #409EFF;
}
</style>
