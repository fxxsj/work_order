<template>
  <div v-if="hasArtworkOrDie">
    <!-- 图稿信息 -->
    <el-card v-if="hasArtworks" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>图稿信息</span>
      </div>
      <el-table :data="artworks" border style="width: 100%">
        <el-table-column prop="artwork_number" label="图稿编号" width="150" />
        <el-table-column
          prop="version"
          label="版本"
          width="80"
          align="center"
        />
        <el-table-column label="确认状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getArtworkStatusType(scope.row.confirmed)" size="small">
              {{ getArtworkStatusText(scope.row.confirmed) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="确认时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.confirmed_at) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="notes"
          label="备注"
          min-width="200"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>

    <!-- 刀模信息 -->
    <el-card v-if="hasDies" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>刀模信息</span>
      </div>
      <el-table :data="dies" border style="width: 100%">
        <el-table-column prop="die_number" label="刀模编号" width="150" />
        <el-table-column prop="die_size" label="刀模尺寸" width="150" />
        <el-table-column label="确认状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getDieStatusType(scope.row.confirmed)" size="small">
              {{ getDieStatusText(scope.row.confirmed) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="确认时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.confirmed_at) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="notes"
          label="备注"
          min-width="200"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>

    <!-- 烫金版信息 -->
    <el-card v-if="hasFoilingPlates" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>烫金版信息</span>
      </div>
      <el-table :data="foilingPlates" border style="width: 100%">
        <el-table-column prop="plate_number" label="烫金版编号" width="150" />
        <el-table-column prop="plate_size" label="尺寸" width="150" />
        <el-table-column label="确认状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getPlateStatusType(scope.row.confirmed)" size="small">
              {{ getPlateStatusText(scope.row.confirmed) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="确认时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.confirmed_at) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="notes"
          label="备注"
          min-width="200"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>

    <!-- 压纹版信息 -->
    <el-card v-if="hasEmbossingPlates" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>压纹版信息</span>
      </div>
      <el-table :data="embossingPlates" border style="width: 100%">
        <el-table-column prop="plate_number" label="压纹版编号" width="150" />
        <el-table-column prop="plate_size" label="尺寸" width="150" />
        <el-table-column label="确认状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getPlateStatusType(scope.row.confirmed)" size="small">
              {{ getPlateStatusText(scope.row.confirmed) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="确认时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.confirmed_at) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="notes"
          label="备注"
          min-width="200"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ArtworkAndDieInfo',
  props: {
    workOrder: {
      type: Object,
      required: true
    }
  },
  computed: {
    artworks() {
      return this.workOrder.artworks || []
    },
    dies() {
      return this.workOrder.dies || []
    },
    foilingPlates() {
      return this.workOrder.foiling_plates || []
    },
    embossingPlates() {
      return this.workOrder.embossing_plates || []
    },
    hasArtworks() {
      return this.artworks.length > 0
    },
    hasDies() {
      return this.dies.length > 0
    },
    hasFoilingPlates() {
      return this.foilingPlates.length > 0
    },
    hasEmbossingPlates() {
      return this.embossingPlates.length > 0
    },
    hasArtworkOrDie() {
      return this.hasArtworks || this.hasDies || this.hasFoilingPlates || this.hasEmbossingPlates
    }
  },
  methods: {
    getArtworkStatusText(confirmed) {
      return confirmed ? '已确认' : '待确认'
    },
    getArtworkStatusType(confirmed) {
      return confirmed ? 'success' : 'warning'
    },
    getDieStatusText(confirmed) {
      return confirmed ? '已确认' : '待确认'
    },
    getDieStatusType(confirmed) {
      return confirmed ? 'success' : 'warning'
    },
    getPlateStatusText(confirmed) {
      return confirmed ? '已确认' : '待确认'
    },
    getPlateStatusType(confirmed) {
      return confirmed ? 'success' : 'warning'
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
