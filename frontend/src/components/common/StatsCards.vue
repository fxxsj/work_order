<template>
  <div class="stats-cards">
    <el-row :gutter="gutter">
      <el-col
        v-for="(item, index) in items"
        :key="index"
        :span="span"
      >
        <el-card :class="['stat-card', item.type]">
          <div class="stat-item">
            <div class="stat-label">
              <i v-if="item.icon" :class="item.icon" />
              {{ item.label }}
            </div>
            <div class="stat-value">
              <template v-if="item.prefix">{{ item.prefix }}</template>
              {{ formatValue(item.value, item.format) }}
              <template v-if="item.suffix">{{ item.suffix }}</template>
            </div>
            <div v-if="item.subtext" class="stat-subtext">
              {{ item.subtext }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'StatsCards',
  props: {
    // 统计数据项
    items: {
      type: Array,
      required: true,
      validator: (items) => {
        return items.every(item =>
          item.hasOwnProperty('label') &&
          item.hasOwnProperty('value')
        )
      }
    },
    // 每个卡片占据的列数（24栅格系统）
    span: {
      type: Number,
      default: 6
    },
    // 卡片间距
    gutter: {
      type: Number,
      default: 20
    }
  },
  methods: {
    formatValue(value, format) {
      if (value === null || value === undefined) {
        return 0
      }

      switch (format) {
        case 'currency':
          return value.toLocaleString()
        case 'percent':
          return `${(value * 100).toFixed(2)}%`
        case 'number':
          return value.toLocaleString()
        default:
          return value
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.stats-cards {
  margin-bottom: 20px;

  .stat-card {
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.primary {
      border-left: 4px solid #409eff;
    }

    &.success {
      border-left: 4px solid #67c23a;
    }

    &.warning {
      border-left: 4px solid #e6a23c;
    }

    &.danger {
      border-left: 4px solid #f56c6c;
    }

    &.info {
      border-left: 4px solid #909399;
    }

    ::v-deep .el-card__body {
      padding: 20px;
    }
  }

  .stat-item {
    text-align: center;

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      i {
        font-size: 16px;
      }
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 5px;
    }

    .stat-subtext {
      font-size: 12px;
      color: #c0c4cc;
    }
  }
}
</style>
