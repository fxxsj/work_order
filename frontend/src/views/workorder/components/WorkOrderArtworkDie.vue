<template>
  <el-descriptions
    title="图稿和刀模"
    :column="1"
    border
    style="margin-top: 20px;"
  >
    <el-descriptions-item label="图稿（CTP版）">
      <span v-if="artworkCodes && artworkCodes.length > 0">
        <span v-for="(code, index) in artworkCodes" :key="index">
          {{ code }}<span v-if="artworkNames && artworkNames[index]"> - {{ artworkNames[index] }}</span>
          <span v-if="index < artworkCodes.length - 1">、</span>
        </span>
      </span>
      <span v-else style="color: #909399;">-</span>
    </el-descriptions-item>
    <el-descriptions-item v-if="printingType && printingType !== 'none'" label="印刷要求">
      <span v-if="printingColorsDisplay || artworkColors">
        {{ printingColorsDisplay || artworkColors }} {{ getPrintingTypeDisplay(printingType) }}
      </span>
      <span v-else>
        {{ getPrintingTypeDisplay(printingType) }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="刀模">
      <span v-if="dieCodes && dieCodes.length > 0">
        <span v-for="(code, index) in dieCodes" :key="index">
          {{ code }}<span v-if="dieNames && dieNames[index]"> - {{ dieNames[index] }}</span>
          <span v-if="index < dieCodes.length - 1">、</span>
        </span>
      </span>
      <span v-else style="color: #909399;">-</span>
    </el-descriptions-item>
  </el-descriptions>
</template>

<script>
export default {
  name: 'WorkOrderArtworkDie',
  props: {
    artworkCodes: {
      type: Array,
      default: () => []
    },
    artworkNames: {
      type: Array,
      default: () => []
    },
    dieCodes: {
      type: Array,
      default: () => []
    },
    dieNames: {
      type: Array,
      default: () => []
    },
    printingType: {
      type: String,
      default: 'none'
    },
    printingColorsDisplay: {
      type: String,
      default: ''
    },
    artworkColors: {
      type: String,
      default: ''
    }
  },
  methods: {
    getPrintingTypeDisplay(type) {
      const typeMap = {
        none: '无',
        spot_color: '专色',
        cmyk: '四色',
        cmyk_spot: '四色+专色'
      }
      return typeMap[type] || type
    }
  }
}
</script>
