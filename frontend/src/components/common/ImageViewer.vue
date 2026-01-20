<template>
  <el-dialog
    :visible.sync="dialogVisible"
    title="图片预览"
    width="800px"
    :close-on-click-modal="true"
    class="image-viewer-dialog"
  >
    <div class="image-viewer-container">
      <!-- 工具栏 -->
      <div class="image-viewer-toolbar">
        <el-button-group>
          <el-button icon="el-icon-zoom-in" title="放大" @click="zoomIn" />
          <el-button icon="el-icon-zoom-out" title="缩小" @click="zoomOut" />
          <el-button icon="el-icon-refresh-left" title="左旋转" @click="rotateLeft" />
          <el-button icon="el-icon-refresh-right" title="右旋转" @click="rotateRight" />
          <el-button icon="el-icon-full-screen" title="全屏" @click="toggleFullscreen" />
        </el-button-group>
        <span class="scale-info">{{ Math.round(scale * 100) }}%</span>
      </div>

      <!-- 图片容器 -->
      <div class="image-wrapper" @wheel.prevent="handleWheel">
        <img
          ref="imageRef"
          :src="imageSrc"
          :style="imageStyle"
          class="preview-image"
          alt="preview"
          @load="handleLoad"
          @error="handleError"
        />
      </div>

      <!-- 缩略图列表 -->
      <div v-if="images && images.length > 1" class="thumbnail-list">
        <div
          v-for="(img, index) in images"
          :key="index"
          class="thumbnail-item"
          :class="{ active: currentIndex === index }"
          @click="handleSelectImage(index)"
        >
          <img :src="img.src || img" :alt="`图片 ${index + 1}`" />
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'ImageViewer',
  props: {
    // 图片URL或图片列表
    images: {
      type: [String, Array],
      default: ''
    },
    // 初始索引（当images是数组时）
    initialIndex: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      dialogVisible: false,
      currentIndex: 0,
      scale: 1,
      rotation: 0,
      isFullscreen: false,
      loading: true
    }
  },
  computed: {
    // 当前图片URL
    imageSrc() {
      if (Array.isArray(this.images)) {
        const img = this.images[this.currentIndex]
        return typeof img === 'string' ? img : img.src || img
      }
      return this.images
    },
    // 图片样式
    imageStyle() {
      return {
        transform: `scale(${this.scale}) rotate(${this.rotation}deg)`,
        transition: 'transform 0.3s ease'
      }
    }
  },
  methods: {
    // 打开预览
    open(index = 0) {
      this.dialogVisible = true
      this.currentIndex = index
      this.resetTransform()
    },
    // 关闭预览
    close() {
      this.dialogVisible = false
    },
    // 重置变换
    resetTransform() {
      this.scale = 1
      this.rotation = 0
    },
    // 放大
    zoomIn() {
      this.scale = Math.min(this.scale + 0.2, 3)
    },
    // 缩小
    zoomOut() {
      this.scale = Math.max(this.scale - 0.2, 0.3)
    },
    // 左旋转
    rotateLeft() {
      this.rotation -= 90
    },
    // 右旋转
    rotateRight() {
      this.rotation += 90
    },
    // 切换全屏
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
    },
    // 鼠标滚轮缩放
    handleWheel(e) {
      if (e.deltaY < 0) {
        this.zoomIn()
      } else {
        this.zoomOut()
      }
    },
    // 选择图片
    handleSelectImage(index) {
      this.currentIndex = index
      this.resetTransform()
    },
    // 图片加载完成
    handleLoad() {
      this.loading = false
    },
    // 图片加载失败
    handleError() {
      this.loading = false
      this.$message.error('图片加载失败')
    }
  }
}
</script>

<style scoped>
.image-viewer-dialog >>> .el-dialog__body {
  padding: 0;
}

.image-viewer-container {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.image-viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.scale-info {
  font-size: 14px;
  color: #606266;
  margin-left: 15px;
}

.image-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: #000;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: grab;
}

.preview-image:active {
  cursor: grabbing;
}

.thumbnail-list {
  display: flex;
  gap: 10px;
  padding: 10px;
  overflow-x: auto;
  border-top: 1px solid #eee;
}

.thumbnail-item {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border: 2px solid transparent;
  cursor: pointer;
  overflow: hidden;
}

.thumbnail-item.active {
  border-color: #409EFF;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
