<template>
  <div class="shell">
    <router-view />
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "IBM Plex Sans", "Noto Sans SC", sans-serif;
  background: radial-gradient(circle at top left, #f6f2ff, #f3f7ff 60%, #ffffff 100%);
  color: #1f2a44;
}

.shell {
  min-height: 100vh;
}
</style>
