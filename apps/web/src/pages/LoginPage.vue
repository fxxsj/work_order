<template>
  <div class="page">
    <section class="card">
      <header>
        <span class="badge">V2</span>
        <h1>登录</h1>
        <p>使用后端账号登录系统。</p>
      </header>
      <form class="form" @submit.prevent="onLogin">
        <label>
          用户名
          <input v-model.trim="username" autocomplete="username" />
        </label>
        <label>
          密码
          <input v-model.trim="password" type="password" autocomplete="current-password" />
        </label>
        <button type="submit" :disabled="loading">
          {{ loading ? "登录中..." : "登录" }}
        </button>
      </form>
      <p v-if="message" class="message">{{ message }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createAuthApi } from "@work-order/core-api";
import { apiTransport } from "../apiTransport";
import { authStore } from "../authStore";

const router = useRouter();
const route = useRoute();
const api = createAuthApi(apiTransport);

const username = ref("");
const password = ref("");
const loading = ref(false);
const message = ref("");

const onLogin = async () => {
  loading.value = true;
  message.value = "";
  const result = await api.login({ username: username.value, password: password.value });
  if (result.ok) {
    authStore.actions.setSession(result.data);
    const redirect = (route.query.redirect as string | undefined) ?? "/";
    await router.replace(redirect);
  } else {
    message.value = `登录失败: ${result.error.message}`;
  }
  loading.value = false;
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.card {
  width: min(420px, 100%);
  padding: 32px;
  border-radius: 18px;
  background: #ffffffcc;
  border: 1px solid #e3e6ed;
  box-shadow: 0 16px 40px rgba(31, 42, 68, 0.12);
}

header {
  margin-bottom: 16px;
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
  font-size: 32px;
  font-weight: 600;
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

.message {
  margin-top: 12px;
  color: #b42318;
  font-weight: 600;
}
</style>
