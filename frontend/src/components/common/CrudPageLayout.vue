<template>
  <div class="crud-page-layout">
    <!-- 页面头部 -->
    <div v-if="title || $slots.header" class="crud-header">
      <div class="crud-header-left">
        <h2 v-if="title" class="crud-title">{{ title }}</h2>
        <slot name="header"></slot>
      </div>
      <div v-if="$slots.actions" class="crud-header-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- 筛选/搜索区域 -->
    <div v-if="$slots.filter || $slots.search" class="crud-filter-section">
      <slot name="filter"></slot>
      <slot name="search"></slot>
    </div>

    <!-- 工具栏区域 -->
    <div v-if="showToolbar || $slots.toolbar" class="crud-toolbar">
      <slot name="toolbar">
        <el-button v-if="showCreate" type="primary" icon="el-icon-plus" @click="$emit('create')">
          {{ createText }}
        </el-button>
        <el-button v-if="showExport" type="success" icon="el-icon-download" @click="$emit('export')">
          导出
        </el-button>
        <el-button v-if="showRefresh" icon="el-icon-refresh" @click="$emit('refresh')">
          刷新
        </el-button>
      </slot>
    </div>

    <!-- 内容区域 -->
    <div v-loading="loading" class="crud-content">
      <slot></slot>
    </div>

    <!-- 空状态 -->
    <div v-if="showEmpty && isEmpty && !loading" class="crud-empty">
      <slot name="empty">
        <el-empty :description="emptyText"></el-empty>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CrudPageLayout',
  props: {
    // 页面标题
    title: {
      type: String,
      default: ''
    },
    // 是否显示加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 是否显示新建按钮
    showCreate: {
      type: Boolean,
      default: false
    },
    // 新建按钮文本
    createText: {
      type: String,
      default: '新建'
    },
    // 是否显示导出按钮
    showExport: {
      type: Boolean,
      default: false
    },
    // 是否显示刷新按钮
    showRefresh: {
      type: Boolean,
      default: false
    },
    // 是否显示工具栏
    showToolbar: {
      type: Boolean,
      default: false
    },
    // 是否显示空状态
    showEmpty: {
      type: Boolean,
      default: false
    },
    // 是否为空
    isEmpty: {
      type: Boolean,
      default: false
    },
    // 空状态文本
    emptyText: {
      type: String,
      default: '暂无数据'
    }
  }
}
</script>

<style scoped>
.crud-page-layout {
  padding: 20px;
}

.crud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.crud-header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.crud-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}

.crud-header-actions {
  display: flex;
  gap: 10px;
}

.crud-filter-section {
  margin-bottom: 20px;
}

.crud-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.crud-content {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.crud-empty {
  padding: 40px 0;
}
</style>
