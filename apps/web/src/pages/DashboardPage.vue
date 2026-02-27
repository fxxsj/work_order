<template>
  <div class="page">
    <header class="hero">
      <div>
        <span class="badge">V2</span>
        <h1>Work Order</h1>
        <p>已登录，权限与角色已加载。</p>
      </div>
      <div class="actions">
        <button type="button" @click="onCurrentUser" :disabled="loading">
          {{ loading ? "验证中..." : "验证登录" }}
        </button>
        <button type="button" class="ghost" @click="onLogout">登出</button>
      </div>
    </header>

    <section class="grid">
      <div class="card">
        <h2>用户信息</h2>
        <div class="status">
          <p><strong>用户名:</strong> {{ authState.user?.username ?? "-" }}</p>
          <p><strong>邮箱:</strong> {{ authState.user?.email ?? "-" }}</p>
          <p><strong>角色:</strong> {{ authState.user?.groups?.join(", ") || "-" }}</p>
        </div>
      </div>

      <div class="card">
        <h2>权限概览</h2>
        <p class="muted">{{ permissionSummary }}</p>
        <div class="guard">
          <span>示例按钮（需超级权限）</span>
          <button type="button" v-permission="{ anyOf: ['*'] }">管理入口</button>
        </div>
      </div>

      <div class="card">
        <h2>模块入口</h2>
        <div class="links">
          <router-link
            v-for="item in moduleLinks"
            :key="item.path"
            class="link"
            :to="item.path"
            v-permission="{ anyOf: item.permissions }"
          >
            {{ item.label }}
          </router-link>
        </div>
      </div>
    </section>

    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { createAuthApi } from "@work-order/core-api";
import { apiTransport } from "../apiTransport";
import { authState, authStore } from "../authStore";

const api = createAuthApi(apiTransport);
const loading = ref(false);
const message = ref("");

const permissionSummary = computed(() => {
  const perms = authState.user?.permissions ?? [];
  if (perms.length === 0) {
    return "无";
  }
  if (perms.length <= 5) {
    return perms.join(", ");
  }
  return `${perms.slice(0, 5).join(", ")} (+${perms.length - 5} 更多)`;
});

const moduleLinks = computed(() => [
  { label: "施工单", path: "/workorders", permissions: ["workorder.view_workorder"] },
  { label: "任务", path: "/tasks", permissions: ["workorder.view_workorder"] },
  { label: "客户", path: "/customers", permissions: ["workorder.view_customer"] },
  { label: "产品", path: "/products", permissions: ["workorder.view_product"] },
  { label: "物料", path: "/materials", permissions: ["workorder.view_material"] },
  { label: "采购单", path: "/purchase-orders", permissions: ["workorder.view_purchaseorder"] },
  { label: "销售订单", path: "/sales-orders", permissions: ["workorder.view_salesorder"] },
  { label: "库存", path: "/inventory/stocks", permissions: ["workorder.view_productstock"] },
  { label: "财务", path: "/finance/invoices", permissions: ["workorder.view_invoice"] }
]);

const onLogout = async () => {
  if (!authState.token) {
    return;
  }
  const result = await api.logout({ token: authState.token });
  if (result.ok) {
    authStore.actions.clearSession();
    message.value = "已登出";
  } else {
    message.value = `登出失败: ${result.error.message}`;
  }
};

const onCurrentUser = async () => {
  if (!authState.token) {
    return;
  }
  loading.value = true;
  message.value = "";
  const result = await api.currentUser(authState.token);
  if (result.ok) {
    authStore.actions.setSession({
      token: authState.token,
      ...result.data
    });
    message.value = "Token 有效";
  } else {
    message.value = `验证失败: ${result.error.message}`;
  }
  loading.value = false;
};
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
  font-size: 40px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 12px;
}

.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.card {
  padding: 20px;
  border-radius: 16px;
  background: #ffffffcc;
  border: 1px solid #e3e6ed;
  box-shadow: 0 10px 30px rgba(31, 42, 68, 0.08);
}

.status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.muted {
  color: #5c6b8a;
  font-size: 14px;
}

.guard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.link {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #1f2a44;
  color: #1f2a44;
  text-decoration: none;
  font-weight: 600;
}

button {
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  background: #1f2a44;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button.ghost {
  background: transparent;
  color: #1f2a44;
  border: 1px solid #1f2a44;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  color: #0e6b3a;
  font-weight: 600;
}

@media (max-width: 640px) {
  .page {
    padding: 40px 20px;
  }

  h1 {
    font-size: 32px;
  }
}
</style>
