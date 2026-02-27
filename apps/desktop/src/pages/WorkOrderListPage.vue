<template>
  <div class="page">
    <header class="hero">
      <div>
        <span class="badge">Desktop</span>
        <h1>施工单列表</h1>
        <p>桌面端复用核心 API。</p>
      </div>
      <div class="actions">
        <BaseButton
          :disabled="loading"
          @click="fetchList"
        >
          刷新
        </BaseButton>
      </div>
    </header>

    <section class="card">
      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>
      <div v-else-if="loading">
        加载中...
      </div>
      <div
        v-else
        class="table"
      >
        <div class="row header">
          <span>订单号</span>
          <span>客户</span>
          <span>产品</span>
          <span>数量</span>
          <span>状态</span>
          <span>交付</span>
        </div>
        <div
          v-for="(item, index) in items"
          :key="index"
          class="row"
        >
          <span>{{ item.order_number }}</span>
          <span>{{ item.customer_name ?? "-" }}</span>
          <span>{{ item.product_name ?? "-" }}</span>
          <span>{{ item.quantity }} {{ item.unit }}</span>
          <span>{{ item.status_display }}</span>
          <span>{{ item.delivery_date ?? "-" }}</span>
        </div>
        <div
          v-if="items.length === 0"
          class="empty"
        >
          暂无数据
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { createWorkOrderApi, type WorkOrderListItem } from "@work-order/core-api";
import { BaseButton } from "@work-order/ui-base";
import { apiTransport } from "../apiTransport";
import { authState } from "../authStore";

const api = createWorkOrderApi(apiTransport);
const items = ref<WorkOrderListItem[]>([]);
const loading = ref(false);
const error = ref("");

const fetchList = async () => {
  if (!authState.token) {
    error.value = "缺少登录信息";
    return;
  }
  loading.value = true;
  error.value = "";
  const result = await api.list(authState.token, { page: 1 });
  if (result.ok) {
    items.value = result.data.results;
  } else {
    error.value = result.error.message;
  }
  loading.value = false;
};

onMounted(fetchList);
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 64px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: #1f2a44;
  color: #fff;
  font-size: 12px;
  letter-spacing: 0.08em;
}

h1 {
  margin: 16px 0 8px;
  font-size: 36px;
  font-weight: 600;
}

.card {
  padding: 20px;
  border-radius: 16px;
  background: #ffffffcc;
  border: 1px solid #e3e6ed;
  box-shadow: 0 10px 30px rgba(31, 42, 68, 0.08);
}

.table {
  display: grid;
  gap: 8px;
}

.row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 0.8fr 0.8fr 0.9fr;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #eef1f5;
  font-size: 14px;
}

.row.header {
  font-weight: 600;
  color: #5c6b8a;
  border-bottom: 1px solid #d9dee8;
}

.empty {
  padding: 16px 0;
  color: #5c6b8a;
}

.error {
  color: #b42318;
  font-weight: 600;
}

@media (max-width: 900px) {
  .row {
    grid-template-columns: 1.2fr 1fr 1fr;
  }
  .row span:nth-child(n + 4) {
    display: none;
  }
}
</style>
