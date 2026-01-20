<template>
  <div class="artwork-die-info">
    <!-- 空状态 -->
    <el-empty v-if="!items || items.length === 0" :description="emptyText">
      <el-button v-if="!disabled" type="primary" size="small" @click="handleAdd">
        <i class="el-icon-plus"></i>
        {{ addButtonText }}
      </el-button>
    </el-empty>

    <!-- 列表展示 -->
    <div v-else>
      <div class="list-header">
        <span class="list-title">{{ title }}（{{ items.length }}）</span>
        <el-button v-if="!disabled" type="primary" size="small" @click="handleAdd">
          <i class="el-icon-plus"></i>
          添加
        </el-button>
      </div>

      <el-table :data="items" border size="small" style="width: 100%">
        <el-table-column prop="name" :label="nameLabel" min-width="150" />
        <el-table-column prop="version" label="版本" width="80" align="center" />
        <el-table-column label="确认状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.confirmed ? 'success' : 'warning'" size="small">
              {{ scope.row.confirmed ? '已确认' : '待确认' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column v-if="!disabled" label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.$index)">
              编辑
            </el-button>
            <el-button type="text" size="small" style="color: #F56C6C;" @click="handleDelete(scope.$index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ArtworkAndDieInfo',
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    value: {
      type: Array,
      default: () => []
    },
    type: {
      type: String,
      default: 'artwork',
      validator: val => ['artwork', 'die', 'foiling_plate', 'embossing_plate'].includes(val)
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    items() {
      return this.value || []
    },
    title() {
      const titles = {
        artwork: '图稿',
        die: '刀模',
        foiling_plate: '烫金版',
        embossing_plate: '压纹版'
      }
      return titles[this.type] || '资产'
    },
    nameLabel() {
      const labels = {
        artwork: '图稿编号',
        die: '刀模编号',
        foiling_plate: '烫金版编号',
        embossing_plate: '压纹版编号'
      }
      return labels[this.type] || '编号'
    },
    emptyText() {
      return `暂无${this.title}信息`
    },
    addButtonText() {
      return `添加${this.title}`
    }
  },
  methods: {
    handleAdd() {
      // 添加新项目
      const newItem = {
        name: '',
        version: '1',
        confirmed: false,
        notes: ''
      }
      const newItems = [...this.items, newItem]
      this.$emit('change', newItems)
    },
    handleEdit(index) {
      // 编辑项目 - 可以扩展为弹窗编辑
      this.$emit('edit', index, this.items[index])
    },
    handleDelete(index) {
      this.$confirm(`确定删除该${this.title}吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const newItems = this.items.filter((_, i) => i !== index)
        this.$emit('change', newItems)
        this.$message.success('删除成功')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.artwork-die-info {
  padding: 10px 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.list-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
</style>
