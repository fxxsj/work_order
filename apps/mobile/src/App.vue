<template>
  <div class="app">
    <header>
      <span class="badge">Mobile</span>
      <h1>Work Order</h1>
      <p>移动端骨架已就绪，等待接入业务模块。</p>
    </header>

    <section class="card">
      <h2>下一步</h2>
      <ul>
        <li>接入登录/鉴权与核心业务模块</li>
        <li>验证触屏交互与响应式布局</li>
        <li>接入 Tauri Mobile 设备能力</li>
      </ul>
      <div class="actions">
        <BaseButton>
          开始集成
        </BaseButton>
        <BaseButton variant="ghost">
          查看规划
        </BaseButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { BaseButton } from "@work-order/ui-base";
</script>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "IBM Plex Sans", "Noto Sans SC", sans-serif;
  background: radial-gradient(circle at top left, #fff6f2, #f2f7ff 60%, #ffffff 100%);
  color: #1f2a44;
}

.app {
  min-height: 100vh;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.card {
  padding: 20px;
  border-radius: 16px;
  background: #ffffffcc;
  border: 1px solid #e3e6ed;
  box-shadow: 0 10px 30px rgba(31, 42, 68, 0.08);
}

.actions {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

ul {
  margin: 12px 0 0;
  padding-left: 20px;
}

li {
  margin: 6px 0;
}
</style>
