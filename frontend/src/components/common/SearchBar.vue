<template>
  <div class="search-bar">
    <el-input
      v-model="searchText"
      :placeholder="placeholder"
      :clearable="clearable"
      @clear="handleClear"
      @input="handleInput"
    >
      <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
    </el-input>
  </div>
</template>

<script>
export default {
  name: 'SearchBar',
  props: {
    // 占位符文本
    placeholder: {
      type: String,
      default: '请输入搜索内容'
    },
    // 是否可清空
    clearable: {
      type: Boolean,
      default: true
    },
    // 防抖延迟（毫秒）
    debounceDelay: {
      type: Number,
      default: 300
    }
  },
  data() {
    return {
      searchText: '',
      debounceTimer: null
    }
  },
  methods: {
    // 处理输入（带防抖）
    handleInput() {
      if (this.debounceDelay > 0) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = setTimeout(() => {
          this.$emit('search', this.searchText)
        }, this.debounceDelay)
      } else {
        this.$emit('search', this.searchText)
      }
    },
    // 处理搜索按钮点击
    handleSearch() {
      this.$emit('search', this.searchText)
    },
    // 处理清空
    handleClear() {
      this.$emit('clear')
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: inline-block;
  width: 100%;
  max-width: 400px;
}
</style>
