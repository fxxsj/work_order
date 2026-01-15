<template>
  <el-form-item label="工序" prop="processes">
    <el-select
      :value="value"
      @input="handleInput"
      placeholder="请选择工序"
      multiple
      filterable
      :loading="loading"
      :disabled="disabled"
      style="width: 100%;"
    >
      <el-option
        v-for="process in processList"
        :key="process.id"
        :label="process.name"
        :value="process.id"
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>{{ process.name }}</span>
          <el-tag v-if="process.code" size="mini" type="info" style="margin-left: 10px;">
            {{ process.code }}
          </el-tag>
        </div>
      </el-option>
    </el-select>
    <div v-if="showHint" style="color: #909399; font-size: 12px; margin-top: 5px;">
      已选择 {{ selectedCount }} 个工序
    </div>
  </el-form-item>
</template>

<script>
import { processAPI } from '@/api/workorder'

export default {
  name: 'ProcessSelector',
  props: {
    value: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showHint: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: false,
      processList: []
    }
  },
  computed: {
    selectedCount() {
      return Array.isArray(this.value) ? this.value.length : 0
    }
  },
  async created() {
    await this.loadProcessList()
  },
  methods: {
    async loadProcessList() {
      this.loading = true
      try {
        // 分页加载所有工序
        let allProcesses = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          const response = await processAPI.getList({
            is_active: true,
            page_size: 100,
            page: page
          })

          if (response.results && response.results.length > 0) {
            allProcesses = allProcesses.concat(response.results)
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }

        this.processList = allProcesses
      } catch (error) {
        console.error('加载工序列表失败:', error)
        this.$message.error('加载工序列表失败')
      } finally {
        this.loading = false
      }
    },
    handleInput(value) {
      this.$emit('input', value)
      this.$emit('change', value)
    }
  }
}
</script>
