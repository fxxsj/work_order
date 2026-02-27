<template>
  <div class="page">
    <section class="card">
      <h1>访问受限</h1>
      <p>当前账号没有访问该页面的权限。</p>
      <button
        type="button"
        @click="goBack"
      >
        返回
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const goBack = () => {
  router.back();
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
  text-align: center;
}

h1 {
  margin: 0 0 12px;
  font-size: 28px;
}

button {
  margin-top: 16px;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  background: #1f2a44;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
</style>
