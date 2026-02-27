<template>
  <div class="page">
    <header class="hero">
      <div>
        <span class="badge">V2</span>
        <h1>{{ title }}</h1>
        <p>此页面为业务模块占位，后续将接入真实功能。</p>
      </div>
      <router-link class="back" to="/dashboard">返回工作台</router-link>
    </header>

    <section class="card">
      <h2>权限要求</h2>
      <p v-if="requiredPermissions.length === 0" class="muted">无</p>
      <ul v-else class="perm-list">
        <li v-for="perm in requiredPermissions" :key="perm">{{ perm }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { getRoutePermissions } from "../routePermissions";

const route = useRoute();

const title = computed(() => (route.meta.title as string) ?? "模块页面");
const requiredPermissions = computed(() => getRoutePermissions(route.path));
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
  font-size: 38px;
  font-weight: 600;
}

.back {
  align-self: flex-start;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #1f2a44;
  color: #1f2a44;
  text-decoration: none;
  font-weight: 600;
}

.card {
  padding: 20px;
  border-radius: 16px;
  background: #ffffffcc;
  border: 1px solid #e3e6ed;
  box-shadow: 0 10px 30px rgba(31, 42, 68, 0.08);
}

.perm-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: grid;
  gap: 6px;
}

.perm-list li {
  padding: 6px 10px;
  border-radius: 8px;
  background: #f2f4f8;
  font-family: "IBM Plex Mono", "Noto Sans SC", monospace;
  font-size: 13px;
}

.muted {
  color: #5c6b8a;
}

@media (max-width: 640px) {
  .page {
    padding: 40px 20px;
  }

  h1 {
    font-size: 30px;
  }
}
</style>
