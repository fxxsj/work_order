<template>
  <div class="app">
    <header class="hero">
      <span class="badge">V2</span>
      <h1>Work Order</h1>
      <p>登录/鉴权主链路（后端 API）。</p>
    </header>

    <section class="grid">
      <div class="card">
        <h2>登录</h2>
        <form class="form" @submit.prevent="onLogin">
          <label>
            用户名
            <input v-model.trim="username" autocomplete="username" />
          </label>
          <label>
            密码
            <input v-model.trim="password" type="password" autocomplete="current-password" />
          </label>
          <button type="submit" :disabled="loading">{{ loading ? "登录中..." : "登录" }}</button>
        </form>
        <p class="hint">示例账号：admin / admin123</p>
      </div>

      <div class="card">
        <h2>会话状态</h2>
        <div class="status">
          <p><strong>User:</strong> {{ store.state.user?.username ?? "-" }}</p>
          <p><strong>Role:</strong> {{ store.state.user?.groups?.join(", ") || "-" }}</p>
          <p><strong>Permissions:</strong> {{ permissionSummary }}</p>
          <p><strong>Token:</strong> {{ store.state.token ?? "-" }}</p>
        </div>
        <div class="actions">
          <button type="button" @click="onLogout" :disabled="!store.state.token">登出</button>
          <button type="button" @click="onCurrentUser" :disabled="!store.state.token || loading">
            {{ loading ? "验证中..." : "验证登录" }}
          </button>
        </div>
        <p v-if="message" class="message">{{ message }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { createAuthApi } from "@work-order/core-api";
import { createAuthStore } from "@work-order/core-store";
import { apiTransport } from "./apiTransport";
import { createSessionStorageAdapter } from "./authStorage";

const api = createAuthApi(apiTransport);
const storage = createSessionStorageAdapter();
const store = createAuthStore(undefined, storage);

const username = ref("");
const password = ref("");
const loading = ref(false);
const message = ref("");
const permissionSummary = computed(() => {
  const perms = store.state.user?.permissions ?? [];
  if (perms.length === 0) {
    return "-";
  }
  if (perms.length <= 5) {
    return perms.join(", ");
  }
  return `${perms.slice(0, 5).join(", ")} (+${perms.length - 5} 更多)`;
});

onMounted(async () => {
  const cached = await storage.load();
  if (cached?.token) {
    store.actions.hydrate(cached);
  }
});

const onLogin = async () => {
  loading.value = true;
  message.value = "";
  const result = await api.login({ username: username.value, password: password.value });
  if (result.ok) {
    store.actions.setSession(result.data);
    message.value = "登录成功";
  } else {
    message.value = `登录失败: ${result.error.message}`;
  }
  loading.value = false;
};

const onLogout = async () => {
  if (!store.state.token) {
    return;
  }
  const result = await api.logout({ token: store.state.token });
  if (result.ok) {
    store.actions.clearSession();
    message.value = "已登出";
  } else {
    message.value = `登出失败: ${result.error.message}`;
  }
};

const onCurrentUser = async () => {
  if (!store.state.token) {
    return;
  }
  loading.value = true;
  message.value = "";
  const result = await api.currentUser(store.state.token);
  if (result.ok) {
    store.actions.setSession({
      token: store.state.token,
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
:global(body) {
  margin: 0;
  font-family: "IBM Plex Sans", "Noto Sans SC", sans-serif;
  background: radial-gradient(circle at top left, #f2f6ff, #f7f7f2 60%, #fff 100%);
  color: #1f2a44;
}

.app {
  min-height: 100vh;
  padding: 64px 32px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.hero {
  max-width: 640px;
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
  font-size: 48px;
  font-weight: 600;
}

.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.card {
  padding: 20px;
  border-radius: 16px;
  background: #ffffffcc;
  border: 1px solid #e3e6ed;
  box-shadow: 0 10px 30px rgba(31, 42, 68, 0.08);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 6px;
}

input {
  border: 1px solid #d7dbe4;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
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

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  color: #5c6b8a;
  font-size: 12px;
}

.status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.message {
  margin-top: 12px;
  color: #0e6b3a;
  font-weight: 600;
}

@media (max-width: 640px) {
  .app {
    padding: 40px 20px;
  }

  h1 {
    font-size: 36px;
  }
}
</style>
