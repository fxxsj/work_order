<template>
  <div class="lazy-image-wrapper">
    <img
      v-lazy="imageUrl"
      :alt="alt"
      :class="imageClass"
      :style="imageStyle"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-if="showPlaceholder" class="lazy-placeholder" :style="placeholderStyle">
      <slot name="placeholder">
        <el-icon class="is-loading">
          <i class="el-icon-loading"></i>
        </el-icon>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    imageClass: {
      type: [String, Array, Object],
      default: ''
    },
    imageStyle: {
      type: Object,
      default: () => ({})
    },
    width: {
      type: [String, Number],
      default: '100%'
    },
    height: {
      type: [String, Number],
      default: 'auto'
    },
    fit: {
      type: String,
      default: 'cover', // cover, contain, fill, none, scale-down
      validator: value => ['cover', 'contain', 'fill', 'none', 'scale-down'].includes(value)
    }
  },
  data() {
    return {
      isLoaded: false,
      isError: false
    }
  },
  computed: {
    imageUrl() {
      return this.src
    },
    showPlaceholder() {
      return !this.isLoaded && !this.isError
    },
    placeholderStyle() {
      return {
        width: typeof this.width === 'number' ? `${this.width}px` : this.width,
        height: typeof this.height === 'number' ? `${this.height}px` : this.height
      }
    }
  },
  methods: {
    handleLoad(e) {
      this.isLoaded = true
      this.$emit('load', e)
    },
    handleError(e) {
      this.isError = true
      this.$emit('error', e)
    }
  }
}
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.lazy-image-wrapper img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: var(--fit, cover);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image-wrapper img[data-loaded='true'] {
  opacity: 1;
}

.lazy-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
}

.lazy-placeholder .el-icon {
  font-size: 32px;
}
</style>
