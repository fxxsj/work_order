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
          <PermissionGate :permissions="['*']" mode="any">
            <button type="button">管理入口</button>
            <template #fallback>
              <button type="button" disabled>无权限</button>
            </template>
          </PermissionGate>
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
import { hasPermission } from "../permissions";
import PermissionGate from "../components/PermissionGate.vue";

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
